import { gameService } from './game-service.js';
import { UtilsService } from '../core/utils-service.js';
import { authService } from '../auth/auth-service.js';

export class BaseGame {
    constructor(gameType) {
        this.gameType = gameType;
        this.score = 0;
        this.startTime = null;
        this.gameState = 'idle'; // idle, playing, paused, completed
        this.soundEnabled = true;
        this.theme = localStorage.getItem('theme') || 'light';
        
        // Bind methods
        this.startGame = this.startGame.bind(this);
        this.pauseGame = this.pauseGame.bind(this);
        this.resumeGame = this.resumeGame.bind(this);
        this.endGame = this.endGame.bind(this);
        this.toggleSound = this.toggleSound.bind(this);
        this.toggleTheme = this.toggleTheme.bind(this);
    }

    async initialize() {
        // Check authentication
        const user = await authService.getCurrentUser();
        if (!user) {
            throw new Error('User must be authenticated to play games');
        }

        // Load game stats
        await this.loadGameStats();

        // Set up theme
        this.applyTheme();

        // Initialize sound settings
        this.soundEnabled = localStorage.getItem('soundEnabled') !== 'false';
        this.updateSoundIcon();
    }

    async loadGameStats() {
        try {
            const stats = await gameService.getUserStats(this.gameType);
            this.stats = stats[0] || {
                high_score: 0,
                average_score: 0,
                total_games: 0
            };
            this.updateStatsDisplay();
        } catch (error) {
            console.error('Error loading game stats:', error);
        }
    }

    startGame() {
        if (this.gameState === 'playing') return;
        
        this.score = 0;
        this.startTime = Date.now();
        this.gameState = 'playing';
        this.updateGameDisplay();
    }

    pauseGame() {
        if (this.gameState !== 'playing') return;
        
        this.gameState = 'paused';
        this.pauseTime = Date.now();
        this.updateGameDisplay();
    }

    resumeGame() {
        if (this.gameState !== 'paused') return;
        
        this.startTime += (Date.now() - this.pauseTime);
        this.gameState = 'playing';
        this.updateGameDisplay();
    }

    async endGame() {
        if (this.gameState !== 'playing') return;
        
        this.gameState = 'completed';
        const timeSpent = (Date.now() - this.startTime) / 1000;

        try {
            await gameService.saveGameProgress(
                this.gameType,
                this.score,
                timeSpent,
                this.getGameMetadata()
            );

            await this.loadGameStats();
            this.showGameSummary();
        } catch (error) {
            console.error('Error saving game progress:', error);
        }
    }

    updateScore(points) {
        this.score += points;
        this.updateScoreDisplay();
    }

    toggleSound() {
        this.soundEnabled = !this.soundEnabled;
        localStorage.setItem('soundEnabled', this.soundEnabled);
        this.updateSoundIcon();
    }

    playSound(soundName) {
        if (!this.soundEnabled) return;
        
        const audio = new Audio(`/assets/sounds/${soundName}.mp3`);
        audio.play().catch(error => console.error('Error playing sound:', error));
    }

    toggleTheme() {
        this.theme = this.theme === 'light' ? 'dark' : 'light';
        localStorage.setItem('theme', this.theme);
        this.applyTheme();
    }

    applyTheme() {
        document.body.setAttribute('data-theme', this.theme);
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 3000);
    }

    // Methods to be implemented by specific games
    updateGameDisplay() {
        throw new Error('updateGameDisplay must be implemented by the game class');
    }

    updateScoreDisplay() {
        throw new Error('updateScoreDisplay must be implemented by the game class');
    }

    updateStatsDisplay() {
        throw new Error('updateStatsDisplay must be implemented by the game class');
    }

    showGameSummary() {
        throw new Error('showGameSummary must be implemented by the game class');
    }

    getGameMetadata() {
        throw new Error('getGameMetadata must be implemented by the game class');
    }

    updateSoundIcon() {
        const soundIcon = document.getElementById('soundIcon');
        if (soundIcon) {
            soundIcon.className = `fas fa-volume-${this.soundEnabled ? 'up' : 'mute'}`;
        }
    }
} 