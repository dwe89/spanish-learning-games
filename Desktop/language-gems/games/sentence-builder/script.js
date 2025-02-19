class SentenceRace {
    constructor() {
        this.sentences = [];
        this.currentSentence = null;
        this.attempts = 0;
        this.completedSentences = 0;
        this.time = 0;
        this.timer = null;
        this.leaderboard = [];
        this.loadSentencesFromURL();
        this.setupEventListeners();
        this.setupAudio();
    }

    setupEventListeners() {
        document.getElementById('addSentences').addEventListener('click', () => this.addSentences());
        document.getElementById('startGame').addEventListener('click', () => this.startGame());
        document.getElementById('resetGame').addEventListener('click', () => this.resetGame());
        document.getElementById('shareLink').addEventListener('click', () => this.generateShareLink());
    }

    setupAudio() {
        this.sounds = {
            click: new Audio('./assets/sounds/click.mp3'),
            drop: new Audio('./assets/sounds/drop.mp3'),
            win: new Audio('./assets/sounds/win.mp3')
        };

        // Preload sounds
        Object.values(this.sounds).forEach(sound => {
            sound.load();
        });
    }

    playSound(soundName) {
        const sound = this.sounds[soundName];
        if (sound) {
            sound.currentTime = 0;
            sound.play().catch(error => {
                console.error('Error playing sound:', error);
            });
        }
    }

    addSentences() {
        const sentenceInput = document.getElementById('sentenceInput').value.trim();
        if (sentenceInput) {
            const sentences = sentenceInput.split('\n').map(sentence => sentence.trim());
            this.sentences.push(...sentences);
            this.updateSentenceList();
            document.getElementById('sentenceInput').value = '';
            document.getElementById('startGame').disabled = this.sentences.length < 1;
        }
    }

    updateSentenceList() {
        const list = document.getElementById('sentenceList');
        list.innerHTML = this.sentences.map((sentence, index) => `
            <div class="sentence-item">
                <span>${sentence}</span>
                <button onclick="game.removeSentence(${index})">×</button>
            </div>
        `).join('');
    }

    removeSentence(index) {
        this.sentences.splice(index, 1);
        this.updateSentenceList();
        document.getElementById('startGame').disabled = this.sentences.length < 1;
    }

    startGame() {
        const sentenceInputSection = document.getElementById('sentenceInputSection');
        const gameBoard = document.getElementById('gameBoard');
        const leaderboard = document.getElementById('leaderboard');
        const timeElement = document.getElementById('time');

        if (!sentenceInputSection || !gameBoard || !leaderboard || !timeElement) {
            console.error('Required elements not found');
            return;
        }

        sentenceInputSection.style.display = 'none';
        gameBoard.style.display = 'block';
        leaderboard.style.display = 'none';

        this.time = 0;
        this.timer = setInterval(() => {
            this.time++;
            timeElement.textContent = this.time;
        }, 1000);

        this.createSentenceCards();
        this.updateStats();
    }

    createSentenceCards() {
        if (this.sentences.length === 0) {
            this.gameComplete();
            return;
        }

        const sentence = this.sentences.shift();
        this.currentSentence = sentence;
        
        // Split sentence into words and ensure they're jumbled
        let words = sentence.split(' ');
        
        // Keep shuffling until the order is different from the original
        let shuffledWords;
        do {
            shuffledWords = [...words].sort(() => Math.random() - 0.5);
            // Check if any word is in its original position
        } while (shuffledWords.some((word, index) => word === words[index]) || 
                 shuffledWords.join(' ') === sentence);
        
        const grid = document.getElementById('sentenceGrid');
        grid.innerHTML = shuffledWords.map((word, index) => `
            <div class="sentence-card" data-index="${index}" draggable="true">
                ${word}
            </div>
        `).join('');

        // Add drag and drop listeners
        document.querySelectorAll('.sentence-card').forEach(card => {
            card.addEventListener('dragstart', (e) => this.dragStart(e));
            card.addEventListener('dragover', (e) => this.dragOver(e));
            card.addEventListener('drop', (e) => this.drop(e));
            card.addEventListener('dragend', (e) => this.dragEnd(e));
        });
    }

    dragStart(e) {
        e.dataTransfer.setData('text/plain', e.target.dataset.index);
        e.target.classList.add('dragging');
        this.playSound('click');
    }

    dragOver(e) {
        e.preventDefault();
        const draggingCard = document.querySelector('.dragging');
        const card = e.target;
        if (card !== draggingCard && card.classList.contains('sentence-card')) {
            const cards = Array.from(document.querySelectorAll('.sentence-card'));
            const draggingIndex = cards.indexOf(draggingCard);
            const targetIndex = cards.indexOf(card);
            if (draggingIndex < targetIndex) {
                card.parentNode.insertBefore(draggingCard, card.nextSibling);
            } else {
                card.parentNode.insertBefore(draggingCard, card);
            }
        }
    }

    drop(e) {
        e.preventDefault();
        this.playSound('drop');
    }

    dragEnd(e) {
        e.target.classList.remove('dragging');
        this.checkSentence();
    }

    checkSentence() {
        const cards = Array.from(document.querySelectorAll('.sentence-card'));
        const sentence = cards.map(card => card.textContent.trim()).join(' ');
        if (sentence === this.currentSentence) {
            this.handleCorrect();
        } else {
            this.handleIncorrect();
        }
    }

    handleCorrect() {
        this.completedSentences++;
        document.querySelectorAll('.sentence-card').forEach(card => {
            card.classList.add('correct');
        });
        this.playSound('win');
        setTimeout(() => {
            this.createSentenceCards();
        }, 1000);
        this.updateStats();
    }

    handleIncorrect() {
        this.attempts++;
        document.querySelectorAll('.sentence-card').forEach(card => {
            card.classList.add('incorrect');
        });
        setTimeout(() => {
            document.querySelectorAll('.sentence-card').forEach(card => {
                card.classList.remove('incorrect');
            });
        }, 1000);
        this.updateStats();
    }

    updateStats() {
        document.getElementById('sentenceCount').textContent = this.completedSentences;
        document.getElementById('attempts').textContent = this.attempts;
    }

    gameComplete() {
        clearInterval(this.timer);
        const celebration = document.getElementById('celebration');
        celebration.style.display = 'flex';
    }

    resetGame() {
        clearInterval(this.timer);
        this.leaderboard.push({ sentences: this.completedSentences, time: this.time });
        this.leaderboard.sort((a, b) => b.sentences - a.sentences || a.time - b.time);
        this.updateLeaderboard();

        this.completedSentences = 0;
        this.attempts = 0;
        this.currentSentence = null;
        document.getElementById('sentenceInputSection').style.display = 'block';
        document.getElementById('gameBoard').style.display = 'none';
        document.getElementById('leaderboard').style.display = 'block';
        this.updateStats();
    }

    updateLeaderboard() {
        const list = document.getElementById('leaderboardList');
        list.innerHTML = this.leaderboard.map((entry, index) => `
            <div class="leaderboard-item">
                <span>${index + 1}. Sentences: ${entry.sentences}, Time: ${entry.time}s</span>
            </div>
        `).join('');
    }

    loadSentencesFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        const encodedSentences = urlParams.get('sentences');
        if (encodedSentences) {
            try {
                this.sentences = JSON.parse(atob(encodedSentences));
                this.updateSentenceList();
                document.getElementById('startGame').disabled = this.sentences.length < 1;
            } catch (error) {
                console.error('Error loading sentences from URL:', error);
            }
        }
    }

    generateShareLink() {
        try {
            const encodedSentences = btoa(JSON.stringify(this.sentences));
            const shareUrl = `${window.location.origin}${window.location.pathname}?sentences=${encodedSentences}`;
            
            // Copy to clipboard
            navigator.clipboard.writeText(shareUrl).then(() => {
                this.showNotification('Link copied to clipboard!');
            }).catch(err => {
                console.error('Failed to copy link:', err);
                this.showNotification('Failed to copy link');
            });
        } catch (error) {
            console.error('Error generating share link:', error);
            this.showNotification('Error generating share link');
        }
    }

    showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
}

// Initialize game
let game;
document.addEventListener('DOMContentLoaded', () => {
    game = new SentenceRace();
});
