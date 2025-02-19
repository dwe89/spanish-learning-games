import { BaseGame } from '../../services/game/base-game.js';
import { UtilsService } from '../../services/core/utils-service.js';
import { supabase } from '../../services/core/base-service.js';

export class HangmanGame extends BaseGame {
    constructor() {
        super('hangman');
        
        this.currentWord = '';
        this.guessedLetters = new Set();
        this.mistakes = 0;
        this.maxMistakes = 6;
        this.hints = 3;
        this.streak = 0;
        this.wins = 0;
        this.losses = 0;
        
        // Initialize game elements
        this.elements = {
            wordDisplay: document.getElementById('wordDisplay'),
            lettersContainer: document.getElementById('lettersContainer'),
            hangmanCanvas: document.getElementById('hangmanCanvas'),
            scoreDisplay: document.getElementById('currentScore'),
            timerDisplay: document.getElementById('timer'),
            streakDisplay: document.getElementById('streak'),
            winsDisplay: document.getElementById('wins'),
            lossesDisplay: document.getElementById('losses'),
            hintButton: document.getElementById('hintBtn'),
            messageDisplay: document.getElementById('message')
        };

        // Bind additional methods
        this.handleGuess = this.handleGuess.bind(this);
        this.handleHint = this.handleHint.bind(this);
        this.createLetterButtons = this.createLetterButtons.bind(this);
    }

    async initialize() {
        await super.initialize();
        
        // Set up the game UI
        this.createLetterButtons();
        this.setupEventListeners();
        
        // Initialize the canvas
        this.ctx = this.elements.hangmanCanvas.getContext('2d');
        this.drawHangman(0);
        
        // Start with a new word
        await this.setNewWord();
    }

    createLetterButtons() {
        const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        this.elements.lettersContainer.innerHTML = '';
        
        for (const letter of alphabet) {
            const button = document.createElement('button');
            button.textContent = letter;
            button.className = 'letter-button';
            button.addEventListener('click', () => this.handleGuess(letter));
            this.elements.lettersContainer.appendChild(button);
        }
    }

    setupEventListeners() {
        this.elements.hintButton.addEventListener('click', this.handleHint);
        
        // Handle keyboard input
        document.addEventListener('keydown', (e) => {
            const key = e.key.toUpperCase();
            if (/^[A-Z]$/.test(key) && this.gameState === 'playing') {
                this.handleGuess(key);
            }
        });
    }

    async setNewWord() {
        try {
            const { data, error } = await supabase
                .from('word_lists')
                .select('word')
                .eq('category', 'general')
                .limit(1)
                .single();

            if (error) throw error;
            
            this.currentWord = data.word.toUpperCase();
            this.updateWordDisplay();
        } catch (error) {
            console.error('Error getting word:', error);
            this.currentWord = UtilsService.getRandomItem([
                'LANGUAGE', 'LEARNING', 'SPANISH', 'PRACTICE'
            ]);
        }
    }

    handleGuess(letter) {
        if (this.gameState !== 'playing' || this.guessedLetters.has(letter)) {
            return;
        }

        this.guessedLetters.add(letter);
        const letterButton = [...this.elements.lettersContainer.children]
            .find(btn => btn.textContent === letter);

        if (letterButton) {
            letterButton.disabled = true;
            letterButton.classList.add(
                this.currentWord.includes(letter) ? 'correct' : 'incorrect'
            );
        }

        if (!this.currentWord.includes(letter)) {
            this.mistakes++;
            this.drawHangman(this.mistakes);
            this.playSound('wrong');
            
            if (this.mistakes >= this.maxMistakes) {
                this.handleLoss();
            }
        } else {
            this.playSound('correct');
            this.updateScore(10);
            
            if (this.checkWin()) {
                this.handleWin();
            }
        }

        this.updateWordDisplay();
    }

    handleHint() {
        if (this.hints <= 0 || this.gameState !== 'playing') {
            return;
        }

        const unguessedLetters = [...this.currentWord].filter(
            letter => !this.guessedLetters.has(letter)
        );

        if (unguessedLetters.length > 0) {
            const hintLetter = UtilsService.getRandomItem(unguessedLetters);
            this.hints--;
            this.elements.hintButton.textContent = `Hints: ${this.hints}`;
            this.handleGuess(hintLetter);
        }
    }

    checkWin() {
        return [...this.currentWord].every(letter => this.guessedLetters.has(letter));
    }

    async handleWin() {
        this.wins++;
        this.streak++;
        this.updateScore(50 + (this.streak * 10));
        this.playSound('victory');
        await this.endGame();
    }

    async handleLoss() {
        this.losses++;
        this.streak = 0;
        this.playSound('gameover');
        await this.endGame();
    }

    updateWordDisplay() {
        const display = [...this.currentWord]
            .map(letter => this.guessedLetters.has(letter) ? letter : '_')
            .join(' ');
        
        this.elements.wordDisplay.textContent = display;
    }

    drawHangman(mistakes) {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.elements.hangmanCanvas.width, this.elements.hangmanCanvas.height);
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;

        // Draw gallows
        ctx.beginPath();
        ctx.moveTo(50, 150);
        ctx.lineTo(150, 150);
        ctx.moveTo(100, 150);
        ctx.lineTo(100, 50);
        ctx.lineTo(150, 50);
        ctx.lineTo(150, 70);
        ctx.stroke();

        if (mistakes > 0) {
            // Head
            ctx.beginPath();
            ctx.arc(150, 85, 15, 0, Math.PI * 2);
            ctx.stroke();
        }
        if (mistakes > 1) {
            // Body
            ctx.moveTo(150, 100);
            ctx.lineTo(150, 130);
            ctx.stroke();
        }
        if (mistakes > 2) {
            // Left arm
            ctx.moveTo(150, 110);
            ctx.lineTo(130, 120);
            ctx.stroke();
        }
        if (mistakes > 3) {
            // Right arm
            ctx.moveTo(150, 110);
            ctx.lineTo(170, 120);
            ctx.stroke();
        }
        if (mistakes > 4) {
            // Left leg
            ctx.moveTo(150, 130);
            ctx.lineTo(130, 145);
            ctx.stroke();
        }
        if (mistakes > 5) {
            // Right leg
            ctx.moveTo(150, 130);
            ctx.lineTo(170, 145);
            ctx.stroke();
        }
    }

    updateGameDisplay() {
        this.updateWordDisplay();
        this.updateScoreDisplay();
        this.updateStatsDisplay();
    }

    updateScoreDisplay() {
        this.elements.scoreDisplay.textContent = this.score;
    }

    updateStatsDisplay() {
        this.elements.streakDisplay.textContent = this.streak;
        this.elements.winsDisplay.textContent = this.wins;
        this.elements.lossesDisplay.textContent = this.losses;
    }

    showGameSummary() {
        const message = this.checkWin()
            ? `Congratulations! You won with ${this.mistakes} mistakes!`
            : `Game Over! The word was "${this.currentWord}"`;
        
        this.elements.messageDisplay.textContent = message;
        this.elements.messageDisplay.className = this.checkWin() ? 'success' : 'error';
    }

    getGameMetadata() {
        return {
            word: this.currentWord,
            mistakes: this.mistakes,
            hints_used: 3 - this.hints,
            time_bonus: this.timeBonus
        };
    }
} 