class VideoPlayer {
    constructor(videoId, options = {}) {
        this.videoId = videoId;
        this.player = null;
        this.currentWord = null;
        this.wordTimings = options.wordTimings || [];
        this.quizMode = options.quizMode || false;
        this.container = null;
        this.overlay = null;
        this.score = 0;
        this.totalQuestions = 0;
        this.setupPlayer();
    }

    setupPlayer() {
        // Create container for video and overlay
        this.container = document.createElement('div');
        this.container.className = 'video-player-container';

        // Create overlay for interactive elements
        this.overlay = document.createElement('div');
        this.overlay.className = 'video-overlay';
        
        // Initialize YouTube Player
        this.player = new YT.Player(this.container, {
            height: '360',
            width: '640',
            videoId: this.videoId,
            playerVars: {
                'playsinline': 1,
                'modestbranding': 1,
                'rel': 0
            },
            events: {
                'onReady': this.onPlayerReady.bind(this),
                'onStateChange': this.onPlayerStateChange.bind(this)
            }
        });

        // Add overlay to container
        this.container.appendChild(this.overlay);
    }

    onPlayerReady(event) {
        if (this.quizMode) {
            this.setupQuizMode();
        }
    }

    onPlayerStateChange(event) {
        if (event.data === YT.PlayerState.PLAYING) {
            this.startWordTracking();
        } else if (event.data === YT.PlayerState.PAUSED) {
            this.stopWordTracking();
        }
    }

    setupQuizMode() {
        // Create quiz interface
        const quizInterface = document.createElement('div');
        quizInterface.className = 'quiz-interface';
        
        const questionDisplay = document.createElement('div');
        questionDisplay.className = 'question-display';
        questionDisplay.innerHTML = '<h3>What\'s the next word?</h3>';
        
        const answerInput = document.createElement('input');
        answerInput.type = 'text';
        answerInput.className = 'answer-input';
        answerInput.placeholder = 'Type your answer...';
        
        const submitButton = document.createElement('button');
        submitButton.className = 'submit-answer';
        submitButton.textContent = 'Check';
        
        const scoreDisplay = document.createElement('div');
        scoreDisplay.className = 'score-display';
        scoreDisplay.textContent = `Score: ${this.score}/${this.totalQuestions}`;
        
        quizInterface.appendChild(questionDisplay);
        quizInterface.appendChild(answerInput);
        quizInterface.appendChild(submitButton);
        quizInterface.appendChild(scoreDisplay);
        
        this.overlay.appendChild(quizInterface);
        
        // Setup event listeners
        submitButton.addEventListener('click', () => this.checkAnswer(answerInput.value));
        answerInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.checkAnswer(answerInput.value);
            }
        });
    }

    startWordTracking() {
        this.wordTrackingInterval = setInterval(() => {
            const currentTime = this.player.getCurrentTime();
            const currentWord = this.findCurrentWord(currentTime);
            
            if (currentWord && currentWord !== this.currentWord) {
                this.currentWord = currentWord;
                this.showWord(currentWord);
            }
        }, 100);
    }

    stopWordTracking() {
        clearInterval(this.wordTrackingInterval);
    }

    findCurrentWord(currentTime) {
        return this.wordTimings.find(timing => 
            currentTime >= timing.start && currentTime <= timing.end
        );
    }

    showWord(word) {
        if (this.quizMode) {
            this.player.pauseVideo();
            this.showQuizQuestion(word);
        } else {
            this.showWordOverlay(word);
        }
    }

    showWordOverlay(word) {
        const overlay = document.createElement('div');
        overlay.className = 'word-overlay';
        overlay.textContent = word.text;
        
        this.overlay.innerHTML = '';
        this.overlay.appendChild(overlay);
        
        setTimeout(() => {
            overlay.remove();
        }, 2000);
    }

    showQuizQuestion(word) {
        const questionDisplay = this.overlay.querySelector('.question-display');
        const answerInput = this.overlay.querySelector('.answer-input');
        
        questionDisplay.innerHTML = `<h3>What's the Spanish word for "${word.translation}"?</h3>`;
        answerInput.value = '';
        this.currentWord = word;
        this.totalQuestions++;
        this.updateScore();
    }

    checkAnswer(answer) {
        if (!this.currentWord) return;
        
        const isCorrect = answer.toLowerCase().trim() === this.currentWord.text.toLowerCase().trim();
        
        if (isCorrect) {
            this.score++;
            this.showFeedback('Correct! 🎉', 'success');
        } else {
            this.showFeedback(`The correct answer was: ${this.currentWord.text}`, 'error');
        }
        
        this.updateScore();
        setTimeout(() => {
            this.player.playVideo();
        }, 2000);
    }

    showFeedback(message, type) {
        const feedback = document.createElement('div');
        feedback.className = `feedback ${type}`;
        feedback.textContent = message;
        
        this.overlay.appendChild(feedback);
        
        setTimeout(() => {
            feedback.remove();
        }, 2000);
    }

    updateScore() {
        const scoreDisplay = this.overlay.querySelector('.score-display');
        if (scoreDisplay) {
            scoreDisplay.textContent = `Score: ${this.score}/${this.totalQuestions}`;
        }
    }
}

// Export the VideoPlayer class
export default VideoPlayer; 