// Pronunciation Practice Tool functionality
class PronunciationPractice {
    constructor() {
        this.currentLanguage = 'spanish';
        this.currentWordIndex = 0;
        this.isRecording = false;
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.words = [];
        this.progress = this.loadProgress();
        
        this.initializeElements();
        this.loadWords();
        this.initializeEventListeners();
        this.setupSpeechRecognition();
    }

    initializeElements() {
        this.wordDisplay = document.querySelector('.word-card .word');
        this.phoneticDisplay = document.querySelector('.word-card .phonetic');
        this.translationDisplay = document.querySelector('.word-card .translation');
        this.recordButton = document.getElementById('start-recording');
        this.playButton = document.getElementById('play-word');
        this.nextButton = document.getElementById('next-word');
        this.previousButton = document.getElementById('previous-word');
        this.accuracyMeter = document.querySelector('.meter-fill');
        this.accuracyScore = document.querySelector('.accuracy-score');
        this.feedbackMessage = document.querySelector('.feedback-message');
        this.recordingIndicator = document.querySelector('.recording-indicator');
    }

    initializeEventListeners() {
        this.recordButton.addEventListener('click', () => this.toggleRecording());
        this.playButton.addEventListener('click', () => this.playCurrentWord());
        this.nextButton.addEventListener('click', () => this.nextWord());
        this.previousButton.addEventListener('click', () => this.previousWord());
        
        document.querySelectorAll('.language-btn').forEach(button => {
            button.addEventListener('click', () => {
                this.changeLanguage(button.dataset.language);
            });
        });
    }

    async loadWords() {
        try {
            // This would be replaced with actual API call
            this.words = await this.fetchWords(this.currentLanguage);
            this.displayCurrentWord();
            this.updateWordList();
        } catch (error) {
            console.error('Error loading words:', error);
            this.showError('Failed to load words. Please try again.');
        }
    }

    async fetchWords(language) {
        // Simulated API response
        return [
            {
                word: 'hola',
                phonetic: '/ola/',
                translation: 'hello',
                audioUrl: '/assets/audio/spanish/hola.mp3',
                tips: [
                    "The 'h' is silent in Spanish",
                    "The 'o' is pronounced like in 'or'",
                    "The 'a' is pronounced like in 'father'"
                ]
            },
            {
                word: 'gracias',
                phonetic: '/ˈɡra.sjas/',
                translation: 'thank you',
                audioUrl: '/assets/audio/spanish/gracias.mp3',
                tips: [
                    "Roll the 'r' slightly",
                    "The 'a' is pronounced like in 'father'",
                    "The 'cias' sounds like 'see-as'"
                ]
            },
            // Add more words...
        ];
    }

    displayCurrentWord() {
        const currentWord = this.words[this.currentWordIndex];
        this.wordDisplay.textContent = currentWord.word;
        this.phoneticDisplay.textContent = currentWord.phonetic;
        this.translationDisplay.textContent = currentWord.translation;
        
        // Update tips
        const tipsList = document.querySelector('.pronunciation-tips ul');
        tipsList.innerHTML = currentWord.tips.map(tip => `<li>${tip}</li>`).join('');
        
        this.updateNavigationButtons();
    }

    updateNavigationButtons() {
        this.previousButton.disabled = this.currentWordIndex === 0;
        this.nextButton.disabled = this.currentWordIndex === this.words.length - 1;
    }

    updateWordList() {
        const wordGrid = document.querySelector('.word-grid');
        wordGrid.innerHTML = this.words.map((word, index) => `
            <div class="word-item ${this.getWordItemClass(index)}">
                <span class="word-text">${word.word}</span>
                ${this.getCompletionIndicator(index)}
            </div>
        `).join('');
    }

    getWordItemClass(index) {
        if (index === this.currentWordIndex) return 'active';
        if (this.progress.completedWords.includes(this.words[index].word)) return 'completed';
        return '';
    }

    getCompletionIndicator(index) {
        if (index === this.currentWordIndex) return '<span class="completion-indicator">●</span>';
        if (this.progress.completedWords.includes(this.words[index].word)) return '<span class="completion-indicator">✓</span>';
        return '';
    }

    async setupSpeechRecognition() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.mediaRecorder = new MediaRecorder(stream);
            
            this.mediaRecorder.ondataavailable = (event) => {
                this.audioChunks.push(event.data);
            };
            
            this.mediaRecorder.onstop = () => {
                this.processPronunciation();
            };
        } catch (error) {
            console.error('Error accessing microphone:', error);
            this.showError('Unable to access microphone. Please check your permissions.');
        }
    }

    toggleRecording() {
        if (!this.mediaRecorder) {
            this.showError('Microphone access is required for pronunciation practice.');
            return;
        }

        if (this.isRecording) {
            this.stopRecording();
        } else {
            this.startRecording();
        }
    }

    startRecording() {
        this.isRecording = true;
        this.audioChunks = [];
        this.mediaRecorder.start();
        this.recordButton.innerHTML = '<i class="fas fa-stop"></i><span>Stop Recording</span>';
        this.recordButton.classList.add('recording');
        this.recordingIndicator.classList.add('active');
    }

    stopRecording() {
        this.isRecording = false;
        this.mediaRecorder.stop();
        this.recordButton.innerHTML = '<i class="fas fa-microphone"></i><span>Start Recording</span>';
        this.recordButton.classList.remove('recording');
        this.recordingIndicator.classList.remove('active');
    }

    async processPronunciation() {
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
        const accuracy = await this.analyzePronunciation(audioBlob);
        this.displayFeedback(accuracy);
    }

    async analyzePronunciation(audioBlob) {
        // This would be replaced with actual API call to speech recognition service
        // Simulating analysis with random accuracy
        return new Promise(resolve => {
            setTimeout(() => {
                const accuracy = Math.random() * 100;
                resolve(accuracy);
            }, 1000);
        });
    }

    displayFeedback(accuracy) {
        const roundedAccuracy = Math.round(accuracy);
        this.accuracyMeter.style.width = `${roundedAccuracy}%`;
        this.accuracyScore.textContent = `${roundedAccuracy}%`;

        if (accuracy >= 80) {
            this.feedbackMessage.textContent = 'Excellent pronunciation!';
            this.markWordAsCompleted();
        } else if (accuracy >= 60) {
            this.feedbackMessage.textContent = 'Good effort! Try again for better accuracy.';
        } else {
            this.feedbackMessage.textContent = 'Keep practicing! Listen to the audio for guidance.';
        }
    }

    markWordAsCompleted() {
        const currentWord = this.words[this.currentWordIndex].word;
        if (!this.progress.completedWords.includes(currentWord)) {
            this.progress.completedWords.push(currentWord);
            this.saveProgress();
            this.updateWordList();
        }
    }

    async playCurrentWord() {
        const currentWord = this.words[this.currentWordIndex];
        try {
            const audio = new Audio(currentWord.audioUrl);
            await audio.play();
        } catch (error) {
            console.error('Error playing audio:', error);
            this.showError('Failed to play audio. Please try again.');
        }
    }

    nextWord() {
        if (this.currentWordIndex < this.words.length - 1) {
            this.currentWordIndex++;
            this.displayCurrentWord();
            this.updateWordList();
            this.resetFeedback();
        }
    }

    previousWord() {
        if (this.currentWordIndex > 0) {
            this.currentWordIndex--;
            this.displayCurrentWord();
            this.updateWordList();
            this.resetFeedback();
        }
    }

    resetFeedback() {
        this.accuracyMeter.style.width = '0%';
        this.accuracyScore.textContent = '0%';
        this.feedbackMessage.textContent = 'Click the microphone to start practicing';
    }

    changeLanguage(language) {
        this.currentLanguage = language;
        this.currentWordIndex = 0;
        this.loadWords();
        this.resetFeedback();
    }

    loadProgress() {
        const savedProgress = localStorage.getItem('pronunciation_progress');
        return savedProgress ? JSON.parse(savedProgress) : {
            completedWords: [],
            streak: 0,
            lastPractice: null
        };
    }

    saveProgress() {
        localStorage.setItem('pronunciation_progress', JSON.stringify(this.progress));
    }

    showError(message) {
        this.feedbackMessage.textContent = message;
        this.feedbackMessage.classList.add('error');
        
        setTimeout(() => {
            this.feedbackMessage.classList.remove('error');
        }, 3000);
    }
}

// Initialize pronunciation practice when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new PronunciationPractice();
}); 