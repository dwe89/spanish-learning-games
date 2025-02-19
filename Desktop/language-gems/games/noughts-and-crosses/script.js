class NoughtsAndCrosses {
    constructor() {
        this.wordPairs = [];
        this.currentPlayer = 'X';
        this.board = Array(9).fill(null);
        this.gameTime = 0;
        this.timer = null;
        this.score = 0;
        this.hintsRemaining = 3;
        this.isMusicMuted = false;
        this.isSoundMuted = false;
        this.isFullscreen = false;
        this.currentTheme = 'default';
        
        // Preset word lists for different difficulty levels
        this.presetWordLists = {
            beginner: [
                { english: "hello", spanish: "hola" },
                { english: "goodbye", spanish: "adiós" },
                { english: "please", spanish: "por favor" },
                { english: "thank you", spanish: "gracias" },
                { english: "yes", spanish: "sí" },
                { english: "no", spanish: "no" },
                { english: "good", spanish: "bueno" },
                { english: "bad", spanish: "malo" },
                { english: "friend", spanish: "amigo" }
            ],
            intermediate: [
                { english: "to run", spanish: "correr" },
                { english: "to eat", spanish: "comer" },
                { english: "to sleep", spanish: "dormir" },
                { english: "to speak", spanish: "hablar" },
                { english: "to work", spanish: "trabajar" },
                { english: "to play", spanish: "jugar" },
                { english: "to write", spanish: "escribir" },
                { english: "to read", spanish: "leer" },
                { english: "to listen", spanish: "escuchar" }
            ],
            advanced: [
                { english: "to achieve", spanish: "lograr" },
                { english: "to develop", spanish: "desarrollar" },
                { english: "to consider", spanish: "considerar" },
                { english: "to establish", spanish: "establecer" },
                { english: "to maintain", spanish: "mantener" },
                { english: "to improve", spanish: "mejorar" },
                { english: "to investigate", spanish: "investigar" },
                { english: "to understand", spanish: "entender" },
                { english: "to recommend", spanish: "recomendar" }
            ]
        };

        this.setupEventListeners();
        this.setupSounds();
        this.setupTouchSupport();
        this.setupFullscreen();
        this.loadWordsFromURL();
        this.initializeThemes();
        this.hideLoadingScreen();
    }

    setupEventListeners() {
        // Word input controls
        document.getElementById('addWordPair').addEventListener('click', () => this.addWordPair());
        document.getElementById('pasteFromClipboard').addEventListener('click', () => this.pasteFromClipboard());
        document.getElementById('clearInput').addEventListener('click', () => this.clearInputs());
        
        // Game controls
        document.getElementById('startGame').addEventListener('click', () => this.startGame());
        document.getElementById('resetGame').addEventListener('click', () => this.resetGame());
        document.getElementById('playAgain').addEventListener('click', () => this.replayGame());
        document.getElementById('shareGame').addEventListener('click', () => this.shareGame());
        document.getElementById('shareScore').addEventListener('click', () => this.shareScore());
        document.getElementById('showHint').addEventListener('click', () => this.showHint());

        // Audio controls
        document.getElementById('toggleMusic').addEventListener('click', () => this.toggleMusic());
        document.getElementById('toggleSound').addEventListener('click', () => this.toggleSound());

        // Theme controls
        document.getElementById('themeBtn').addEventListener('click', () => this.showModal('themeModal'));
        document.querySelectorAll('.theme-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.changeTheme(e.target.closest('.theme-btn').dataset.theme);
                this.hideModal('themeModal');
            });
        });

        // Category controls
        document.getElementById('categoriesBtn').addEventListener('click', () => this.showModal('categoriesModal'));
        document.querySelectorAll('.category-item').forEach(item => {
            item.addEventListener('click', (e) => {
                this.loadCategoryWords(e.target.closest('.category-item').dataset.category);
                this.hideModal('categoriesModal');
            });
        });

        // Custom words controls
        document.getElementById('customWordsBtn').addEventListener('click', () => this.showModal('customWordsModal'));

        // Close modal buttons
        document.querySelectorAll('.close-modal').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal');
                this.hideModal(modal.id);
            });
        });

        // Close modals when clicking outside
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.hideModal(modal.id);
                }
            });
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                document.querySelectorAll('.modal').forEach(modal => {
                    if (modal.classList.contains('show')) {
                        this.hideModal(modal.id);
                    }
                });
            }
            if (e.key === 'h' && e.ctrlKey) this.showHint();
            if (e.key === 'r' && e.ctrlKey) this.resetGame();
            if (e.key === 'f' && e.ctrlKey) this.toggleFullscreen();
            if (e.key === 'm' && e.ctrlKey) this.toggleMusic();
        });
    }

    initializeThemes() {
        const savedTheme = localStorage.getItem('theme') || 'default';
        this.changeTheme(savedTheme);
    }

    changeTheme(theme) {
        document.body.className = `theme-${theme}`;
        this.currentTheme = theme;
        localStorage.setItem('theme', theme);
        
        // Update theme button states
        document.querySelectorAll('.theme-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.theme === theme);
        });
        
        this.playSound('click');
    }

    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loadingScreen');
        loadingScreen.style.opacity = '0';
        setTimeout(() => {
            loadingScreen.style.display = 'none';
        }, 500);
    }

    async pasteFromClipboard() {
        try {
            const text = await navigator.clipboard.readText();
            document.getElementById('vocabInput').value = text;
            this.playSound('click');
        } catch (err) {
            this.showNotification('Unable to paste from clipboard', 'error');
        }
    }

    addWordPair() {
        const vocabInput = document.getElementById('vocabInput').value.trim();

        if (!vocabInput) {
            this.showNotification('Please enter word pairs', 'error');
            return;
        }

            const pairs = vocabInput.split('\n').map(line => {
            const [eng, spa] = line.split(/[,\t]/).map(word => word.trim());
                return { english: eng, spanish: spa };
        }).filter(pair => pair.english && pair.spanish);

        if (pairs.length === 0) {
            this.showNotification('Invalid format. Please use: english, spanish', 'error');
            return;
        }

        if (this.wordPairs.length + pairs.length > 9) {
            this.showNotification('Maximum 9 word pairs allowed', 'error');
            return;
        }

            this.wordPairs.push(...pairs);
            this.updateWordPairsList();
            this.clearInputs();
        this.playSound('click');

        if (this.wordPairs.length === 9) {
            this.showNotification('Great! You can start the game now!', 'success');
            this.startGame();
        }
    }

    updateWordPairsList() {
        const list = document.getElementById('wordPairsList');
        list.innerHTML = this.wordPairs.map((pair, index) => `
            <div class="word-pair" data-aos="fade-up" data-aos-delay="${index * 100}">
                <span>${pair.english} → ${pair.spanish}</span>
                <button class="btn btn-icon" onclick="game.removeWordPair(${index})">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `).join('');

        document.getElementById('startGame').disabled = this.wordPairs.length !== 9;
    }

    clearInputs() {
        document.getElementById('vocabInput').value = '';
        this.playSound('click');
    }

    removeWordPair(index) {
        this.wordPairs.splice(index, 1);
        this.updateWordPairsList();
        this.playSound('click');
    }

    startGame() {
        if (this.wordPairs.length !== 9) {
            this.showNotification('Please add exactly 9 word pairs', 'error');
            return;
        }

        // Reset game state
        this.currentPlayer = 'X';
        this.board = Array(9).fill(null);
        this.score = 0;
        this.hintsRemaining = 3;
        this.updateScore(0);

        // Update UI
        document.getElementById('hints').textContent = this.hintsRemaining;
        document.getElementById('currentPlayer').textContent = this.currentPlayer;

        this.createGrid();
        this.createAnswers();
        this.startTimer();
        this.playBackgroundMusic();
        this.playSound('click');
    }

    createGrid() {
        const grid = document.getElementById('grid');
        grid.innerHTML = this.wordPairs.map((pair, index) => `
            <div class="cell" data-index="${index}" data-spanish="${pair.spanish}"
                 data-aos="flip-left" data-aos-delay="${index * 100}">
                <div class="cell-content">${pair.spanish}</div>
            </div>
        `).join('');

        // Add drop listeners
        document.querySelectorAll('.cell').forEach(cell => {
            cell.addEventListener('dragover', (e) => this.handleDragOver(e));
            cell.addEventListener('dragleave', (e) => this.handleDragLeave(e));
            cell.addEventListener('drop', (e) => this.drop(e));
            cell.addEventListener('touchstart', (e) => this.handleTouchStart(e));
            cell.addEventListener('touchmove', (e) => this.handleTouchMove(e));
            cell.addEventListener('touchend', (e) => this.handleTouchEnd(e));
        });
    }

    createAnswers() {
        const answers = document.getElementById('answers');
        let shuffledPairs = [...this.wordPairs].sort(() => Math.random() - 0.5);

        answers.innerHTML = shuffledPairs.map((pair, index) => `
            <div class="draggable" draggable="true" 
                 data-index="${this.wordPairs.findIndex(p => p.english === pair.english)}"
                 data-aos="fade-right" data-aos-delay="${index * 100}">
                ${pair.english}
            </div>
        `).join('');

        document.querySelectorAll('.draggable').forEach(draggable => {
            draggable.addEventListener('dragstart', (e) => this.dragStart(e));
            draggable.addEventListener('dragend', (e) => this.dragEnd(e));
            draggable.addEventListener('touchstart', (e) => this.handleTouchStart(e));
            draggable.addEventListener('touchmove', (e) => this.handleTouchMove(e));
            draggable.addEventListener('touchend', (e) => this.handleTouchEnd(e));
        });
    }

    dragStart(e) {
        e.dataTransfer.setData('text/plain', e.target.dataset.index);
        e.target.classList.add('dragging');
        this.playSound('click');
    }

    handleDragOver(e) {
        e.preventDefault();
        const cell = e.target.closest('.cell');
        if (cell && !cell.classList.contains('correct')) {
            cell.classList.add('drag-over');
        }
    }

    handleDragLeave(e) {
        e.preventDefault();
        const cell = e.target.closest('.cell');
        if (cell) {
            cell.classList.remove('drag-over');
        }
    }

    drop(e) {
        e.preventDefault();
        const cell = e.target.closest('.cell');
        if (!cell) return;

        cell.classList.remove('drag-over');

        const index = e.dataTransfer.getData('text/plain');
        const draggable = document.querySelector(`.draggable[data-index="${index}"]`);
        
        if (!draggable) return;

        if (cell.dataset.spanish === this.wordPairs[index].spanish) {
            this.handleCorrectMatch(cell, draggable);
        } else {
            this.handleIncorrectMatch(cell);
        }
    }

    handleCorrectMatch(cell, draggable) {
        cell.classList.add('correct');
        cell.innerHTML = `
            <div class="match-animation">
                <div class="symbol">${this.currentPlayer}</div>
                <div class="word">${draggable.textContent}</div>
            </div>
        `;
        
        this.board[cell.dataset.index] = this.currentPlayer;
        this.playSound('correct');
        this.updateScore(10);
        
        // Animate the draggable element away
        draggable.style.animation = 'fadeOut 0.3s ease-out';
        setTimeout(() => draggable.remove(), 300);

        if (this.checkWin()) {
            this.showWinningMessage();
        } else {
            this.switchPlayer();
        }
    }

    handleIncorrectMatch(cell) {
        cell.classList.add('incorrect');
        this.playSound('wrong');
        this.updateScore(-5);
        
        // Shake animation
        cell.addEventListener('animationend', () => {
            cell.classList.remove('incorrect');
        });

        this.switchPlayer();
    }

    dragEnd(e) {
        e.target.classList.remove('dragging');
    }

    switchPlayer() {
        this.currentPlayer = this.currentPlayer === 'X' ? 'O' : 'X';
        document.getElementById('currentPlayer').textContent = this.currentPlayer;
        
        // Animate the player change
        const playerSymbol = document.getElementById('currentPlayer');
        playerSymbol.style.animation = 'none';
        playerSymbol.offsetHeight; // Trigger reflow
        playerSymbol.style.animation = 'popIn 0.3s ease-out';
    }

    checkWin() {
        const winningCombinations = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
            [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
            [0, 4, 8], [2, 4, 6] // Diagonals
        ];

        return winningCombinations.some(combination => {
            return combination.every(index => {
                return this.board[index] === this.currentPlayer;
            });
        });
    }

    showWinningMessage() {
        const finalTime = document.getElementById('timer').textContent;
        const finalScore = this.score;

        document.getElementById('finalTime').textContent = finalTime;
        document.getElementById('finalScore').textContent = finalScore;
        document.getElementById('winningMessageText').textContent = `¡Felicitaciones! Player ${this.currentPlayer} Wins!`;
        document.getElementById('winningMessage').style.display = 'flex';

        this.playSound('win');
        this.stopTimer();
        this.createConfetti();
        this.saveHighScore();
    }

    createConfetti() {
        confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 }
        });
    }

    resetGame() {
        this.wordPairs = [];
        this.currentPlayer = 'X';
        this.board = Array(9).fill(null);
        this.score = 0;
        this.hintsRemaining = 3;
        this.stopTimer();
        
        document.getElementById('wordInputSection').style.display = 'block';
        document.getElementById('gameBoard').style.display = 'none';
        document.getElementById('winningMessage').style.display = 'none';
        document.getElementById('categoriesShowcase').style.display = 'block';
        
        this.updateWordPairsList();
        this.updateScore(0);
        this.playSound('click');
    }

    replayGame() {
        this.currentPlayer = 'X';
        this.board = Array(9).fill(null);
        this.score = 0;
        this.hintsRemaining = 3;
        this.stopTimer();
        
        document.getElementById('gameBoard').style.display = 'block';
        document.getElementById('winningMessage').style.display = 'none';
        
        this.createGrid();
        this.createAnswers();
        this.startTimer();
        this.updateScore(0);
        this.playSound('click');
    }

    startTimer() {
        this.gameTime = 0;
        this.stopTimer();
        
        this.timer = setInterval(() => {
            this.gameTime++;
            const minutes = Math.floor(this.gameTime / 60);
            const seconds = this.gameTime % 60;
            document.getElementById('timer').textContent = 
                `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }, 1000);
    }

    stopTimer() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }

    updateScore(points) {
        this.score += points;
        document.getElementById('score').textContent = this.score;
        
        // Animate score change
        const scoreElement = document.getElementById('score');
        scoreElement.style.animation = 'none';
        scoreElement.offsetHeight; // Trigger reflow
        scoreElement.style.animation = points > 0 ? 'scoreIncrease 0.5s ease' : 'scoreDecrease 0.5s ease';
    }

    showHint() {
        if (this.hintsRemaining <= 0) {
            this.showNotification('No hints remaining!', 'error');
            return;
        }

        const unmatched = this.wordPairs.filter((pair, index) => !this.board[index]);
        if (unmatched.length === 0) return;

        const randomPair = unmatched[Math.floor(Math.random() * unmatched.length)];
        this.showNotification(`Hint: "${randomPair.english}" matches with "${randomPair.spanish}"`, 'info');
        
                this.hintsRemaining--;
        document.getElementById('hints').textContent = this.hintsRemaining;
        this.playSound('click');
    }

    loadPresetWords(difficulty) {
        this.wordPairs = [...this.presetWordLists[difficulty]];
        this.updateWordPairsList();
        this.playSound('click');
        this.showNotification(`Loaded ${difficulty} word list!`, 'success');
    }

    loadCategoryWords(category) {
        // Add loading state
        const categoryItem = document.querySelector(`[data-category="${category}"]`);
        categoryItem.classList.add('loading');

        // Simulate loading delay (remove this in production)
        setTimeout(() => {
            this.wordPairs = [...this.categoryWords[category]];
            this.updateWordPairsList();
            this.playSound('click');
            this.showNotification(`Loaded ${category} category!`, 'success');
            categoryItem.classList.remove('loading');
        }, 500);
    }

    shareGame() {
        const encodedWords = btoa(JSON.stringify(this.wordPairs));
        const shareUrl = `${window.location.origin}${window.location.pathname}?words=${encodedWords}`;
        
        if (navigator.share) {
            navigator.share({
                title: 'Tic-Tac-Learn: Spanish Edition',
                text: 'Check out this Spanish learning game!',
                url: shareUrl
            }).catch(() => {
                this.copyToClipboard(shareUrl);
            });
        } else {
            this.copyToClipboard(shareUrl);
        }
    }

    shareScore() {
        const text = `¡Increíble! I scored ${this.score} points in ${document.getElementById('timer').textContent} playing Tic-Tac-Learn! Can you beat my score?`;
        
        if (navigator.share) {
            navigator.share({
                title: 'My Tic-Tac-Learn Score',
                text: text,
                url: window.location.href
            }).catch(() => {
                this.copyToClipboard(text);
            });
        } else {
            this.copyToClipboard(text);
        }
    }

    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            this.showNotification('Copied to clipboard!', 'success');
        } catch (err) {
            this.showNotification('Failed to copy to clipboard', 'error');
        }
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : 
                            type === 'error' ? 'exclamation-circle' : 
                            'info-circle'}"></i>
            <span>${message}</span>
        `;
        
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => notification.classList.add('show'), 100);
        
        // Animate out and remove
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    setupSounds() {
        this.sounds = {
            background: document.getElementById('bgMusic'),
            correct: document.getElementById('correctSound'),
            wrong: document.getElementById('wrongSound'),
            win: document.getElementById('winSound'),
            click: document.getElementById('clickSound')
        };

        // Set initial volumes
        this.sounds.background.volume = 0.3;
        this.sounds.correct.volume = 0.6;
        this.sounds.wrong.volume = 0.6;
        this.sounds.win.volume = 0.6;
        this.sounds.click.volume = 0.4;
    }

    playSound(soundName) {
        if (this.isSoundMuted || !this.sounds[soundName]) return;
        
        const sound = this.sounds[soundName];
        sound.currentTime = 0;
        sound.play().catch(() => {}); // Ignore autoplay restrictions
    }

    playBackgroundMusic() {
        if (this.isMusicMuted) return;
        this.sounds.background.play().catch(() => {});
    }

    toggleMusic() {
        this.isMusicMuted = !this.isMusicMuted;
        const btn = document.getElementById('toggleMusic');
        
        if (this.isMusicMuted) {
            this.sounds.background.pause();
            btn.querySelector('i').className = 'fas fa-volume-mute';
        } else {
            this.sounds.background.play().catch(() => {});
            btn.querySelector('i').className = 'fas fa-music';
        }
        
        this.playSound('click');
    }

    toggleSound() {
        this.isSoundMuted = !this.isSoundMuted;
        const btn = document.getElementById('toggleSound');
        btn.querySelector('i').className = this.isSoundMuted ? 
            'fas fa-volume-mute' : 'fas fa-volume-up';
        this.playSound('click');
    }

    setupFullscreen() {
        document.getElementById('fullscreenBtn').addEventListener('click', () => this.toggleFullscreen());
    }

    async toggleFullscreen() {
            if (!document.fullscreenElement) {
            try {
                await document.documentElement.requestFullscreen();
                this.isFullscreen = true;
                document.getElementById('fullscreenBtn').querySelector('i').className = 'fas fa-compress';
            } catch (e) {
                this.showNotification('Fullscreen not supported', 'error');
            }
            } else {
                document.exitFullscreen();
            this.isFullscreen = false;
            document.getElementById('fullscreenBtn').querySelector('i').className = 'fas fa-expand';
        }
        this.playSound('click');
    }

    setupTouchSupport() {
        this.touchData = {
            startX: 0,
            startY: 0,
            draggedElement: null,
            dropTarget: null
        };
    }

    handleTouchStart(e) {
        const touch = e.touches[0];
        this.touchData.startX = touch.clientX;
        this.touchData.startY = touch.clientY;
        
        const draggable = e.target.closest('.draggable');
        if (draggable) {
            this.touchData.draggedElement = draggable;
        draggable.classList.add('dragging');
            this.playSound('click');
        }
    }

    handleTouchMove(e) {
        if (!this.touchData.draggedElement) return;
        
        e.preventDefault();
        const touch = e.touches[0];
        
        const draggedElement = this.touchData.draggedElement;
        draggedElement.style.position = 'fixed';
        draggedElement.style.left = `${touch.clientX - draggedElement.offsetWidth / 2}px`;
        draggedElement.style.top = `${touch.clientY - draggedElement.offsetHeight / 2}px`;
        
        // Find potential drop target
        const elements = document.elementsFromPoint(touch.clientX, touch.clientY);
        const cell = elements.find(el => el.classList.contains('cell'));
        
        if (cell) {
            if (this.touchData.dropTarget && this.touchData.dropTarget !== cell) {
                this.touchData.dropTarget.classList.remove('drag-over');
            }
            cell.classList.add('drag-over');
            this.touchData.dropTarget = cell;
        } else if (this.touchData.dropTarget) {
            this.touchData.dropTarget.classList.remove('drag-over');
            this.touchData.dropTarget = null;
        }
    }

    handleTouchEnd(e) {
        if (!this.touchData.draggedElement) return;
        
        const draggedElement = this.touchData.draggedElement;
        draggedElement.classList.remove('dragging');
        draggedElement.style.position = '';
        draggedElement.style.left = '';
        draggedElement.style.top = '';
        
        if (this.touchData.dropTarget) {
            const cell = this.touchData.dropTarget;
            const index = draggedElement.dataset.index;
            
            if (cell.dataset.spanish === this.wordPairs[index].spanish) {
                this.handleCorrectMatch(cell, draggedElement);
            } else {
                this.handleIncorrectMatch(cell);
            }
            
            cell.classList.remove('drag-over');
        }
        
        this.touchData.draggedElement = null;
        this.touchData.dropTarget = null;
    }

    saveHighScore() {
        const highScores = JSON.parse(localStorage.getItem('highScores') || '[]');
        highScores.push({
            score: this.score,
            time: document.getElementById('timer').textContent,
            date: new Date().toISOString()
        });
        
        // Keep only top 10 scores
        highScores.sort((a, b) => b.score - a.score);
        highScores.splice(10);
        
        localStorage.setItem('highScores', JSON.stringify(highScores));
    }

    loadWordsFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        const encodedWords = urlParams.get('words');
        
        if (encodedWords) {
            try {
                this.wordPairs = JSON.parse(atob(encodedWords));
                this.updateWordPairsList();
                this.showNotification('Loaded shared word list!', 'success');
            } catch (error) {
                this.showNotification('Error loading shared words', 'error');
            }
        }
    }

    showModal(modalId) {
        const modal = document.getElementById(modalId);
        modal.style.display = 'flex';
        setTimeout(() => modal.classList.add('show'), 10);
    }

    hideModal(modalId) {
        const modal = document.getElementById(modalId);
        modal.classList.remove('show');
        setTimeout(() => modal.style.display = 'none', 300);
    }
}

// Initialize the game
const game = new NoughtsAndCrosses();

// Register service worker for PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./service-worker.js')
            .then(registration => {
                console.log('ServiceWorker registration successful');
            })
            .catch(err => {
                console.log('ServiceWorker registration failed: ', err);
            });
    });
}