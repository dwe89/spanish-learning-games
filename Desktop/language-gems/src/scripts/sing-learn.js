import songService from './services/songService.js';

class SingLearnApp {
    constructor() {
        this.currentSong = null;
        this.audioPlayer = new Audio();
        this.userSubscription = null; // Will be set when user logs in
        this.setupEventListeners();
        this.loadInitialData();
        this.setupNotificationSystem();
    }

    async loadInitialData() {
        try {
            // Load categories and levels for filters
            const [categories, levels] = await Promise.all([
                songService.getCategories(),
                songService.getLevels()
            ]);

            this.populateFilters(categories, levels);

            // Load initial songs
            const songs = await songService.getAllSongs();
            this.displaySongs(songs);

            // If user is logged in, load recommendations
            if (this.userSubscription && this.userSubscription.userId) {
                const recommendations = await songService.getRecommendations(this.userSubscription.userId);
                this.displayRecommendations(recommendations);
            }

            this.showSuccess('Content loaded successfully');
        } catch (error) {
            console.error('Error loading initial data:', error);
            this.showError('Failed to load content. Please try again later.');
        }
    }

    setupEventListeners() {
        // Language selector
        document.querySelectorAll('.language-tab').forEach(tab => {
            tab.addEventListener('click', () => this.handleLanguageChange(tab));
        });

        // Level selector
        document.querySelectorAll('.level-btn').forEach(btn => {
            btn.addEventListener('click', () => this.handleLevelChange(btn));
        });

        // Goals checkboxes
        document.querySelectorAll('.goal-checkbox input').forEach(checkbox => {
            checkbox.addEventListener('change', () => this.handleGoalChange(checkbox));
        });

        // Style radio buttons
        document.querySelectorAll('.style-radio input').forEach(radio => {
            radio.addEventListener('change', () => this.handleStyleChange(radio));
        });

        // Song controls
        document.addEventListener('click', (e) => {
            if (e.target.closest('.play-btn')) {
                const songCard = e.target.closest('.song-card');
                this.handlePlayClick(songCard);
            } else if (e.target.closest('.lyrics-toggle')) {
                const songCard = e.target.closest('.song-card');
                this.handleLyricsToggle(songCard);
            }
        });

        // Audio player events
        this.audioPlayer.addEventListener('timeupdate', () => this.updateProgress());
        this.audioPlayer.addEventListener('ended', () => this.handleSongEnd());
    }

    async handlePlayClick(songCard) {
        const songId = songCard.dataset.songId;
        const songUrl = songCard.dataset.songUrl;

        try {
            if (this.currentSong === songId && !this.audioPlayer.paused) {
                this.pauseSong();
            } else {
                const song = await songService.getSongById(songId);
                
                if (!songService.isAvailable(song, this.userSubscription)) {
                    this.showPremiumPrompt();
                    return;
                }

                await this.playSong(song, songCard);
                this.showSuccess('Now playing: ' + song.title);
            }
        } catch (error) {
            console.error('Error playing song:', error);
            this.showError('Failed to play song. Please try again.');
        }
    }

    async playSong(song, songCard) {
        try {
            // Update UI
            document.querySelectorAll('.song-card').forEach(card => {
                card.classList.remove('playing');
            });
            songCard.classList.add('playing');

            // Set up audio
            this.currentSong = song.id;
            this.audioPlayer.src = songService.getPreviewUrl(song);
            await this.audioPlayer.play();

            // Update play button icon
            const playBtn = songCard.querySelector('.play-btn i');
            playBtn.className = 'fas fa-pause';
        } catch (error) {
            console.error('Error in playSong:', error);
            throw error;
        }
    }

    pauseSong() {
        this.audioPlayer.pause();
        document.querySelectorAll('.song-card').forEach(card => {
            card.classList.remove('playing');
            const playBtn = card.querySelector('.play-btn i');
            playBtn.className = 'fas fa-play';
        });
    }

    handleSongEnd() {
        this.currentSong = null;
        document.querySelectorAll('.song-card').forEach(card => {
            card.classList.remove('playing');
            const playBtn = card.querySelector('.play-btn i');
            playBtn.className = 'fas fa-play';
        });
    }

    updateProgress() {
        const progress = (this.audioPlayer.currentTime / this.audioPlayer.duration) * 100;
        document.querySelectorAll('.progress-bar').forEach(bar => {
            bar.style.width = `${progress}%`;
        });
    }

    async handleLyricsToggle(songCard) {
        const lyricsPanel = songCard.querySelector('.lyrics-panel');
        const songId = songCard.dataset.songId;

        if (lyricsPanel.classList.contains('active')) {
            lyricsPanel.classList.remove('active');
            return;
        }

        try {
            const lyrics = await songService.getSongLyrics(songId);
            this.displayLyrics(lyricsPanel, lyrics);
            lyricsPanel.classList.add('active');
        } catch (error) {
            console.error('Error loading lyrics:', error);
            this.showError('Failed to load lyrics. Please try again.');
        }
    }

    displayLyrics(panel, lyrics) {
        const html = lyrics.map(line => `
            <div class="lyrics-line">
                <span class="original">${line.original}</span>
                <span class="translation">${line.translation}</span>
            </div>
        `).join('');
        panel.innerHTML = html;
    }

    async handleLanguageChange(tab) {
        document.querySelectorAll('.language-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        const language = tab.dataset.language;
        try {
            const songs = await songService.getAllSongs({ language });
            this.displaySongs(songs);
        } catch (error) {
            console.error('Error filtering songs by language:', error);
            this.showError('Failed to update songs. Please try again.');
        }
    }

    displaySongs(songs) {
        const container = document.querySelector('.song-grid');
        if (!container) return;

        const html = songs.map(song => this.createSongCard(song)).join('');
        container.innerHTML = html;
    }

    createSongCard(song) {
        const difficulty = songService.getDifficultyInfo(song.level);
        const dots = Array(3).fill('')
            .map((_, i) => `<span class="difficulty-dot${i < difficulty.dots ? ' active' : ''}"></span>`)
            .join('');

        return `
            <div class="song-card${song.premium ? ' premium' : ''}" 
                 data-song-id="${song.id}"
                 data-song-url="${song.url}">
                ${song.premium ? '<span class="premium-badge">Premium</span>' : ''}
                <h3 class="song-title">${song.title}</h3>
                <div class="song-meta">
                    <div class="difficulty-indicator">
                        ${dots}
                    </div>
                    <span>${song.level}</span>
                </div>
                <div class="song-controls">
                    <button class="play-btn">
                        <i class="fas fa-play"></i>
                    </button>
                    <div class="song-progress">
                        <div class="progress-bar"></div>
                    </div>
                </div>
                <div class="song-features">
                    ${song.features.map(feature => `
                        <span class="feature-tag">${feature}</span>
                    `).join('')}
                </div>
                <div class="lyrics-panel" id="lyrics-${song.id}"></div>
                <button class="lyrics-toggle" data-song-id="${song.id}">Show Lyrics</button>
            </div>
        `;
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showPremiumPrompt() {
        const prompt = document.querySelector('.premium-prompt');
        const overlay = document.querySelector('.premium-prompt-overlay');
        prompt.classList.add('show');
        overlay.classList.add('show');
        document.body.style.overflow = 'hidden';
    }

    hidePremiumPrompt() {
        const prompt = document.querySelector('.premium-prompt');
        const overlay = document.querySelector('.premium-prompt-overlay');
        prompt.classList.remove('show');
        overlay.classList.remove('show');
        document.body.style.overflow = '';
    }

    handleUpgradeClick() {
        // Implement upgrade flow
        this.hidePremiumPrompt();
        // Redirect to pricing page or show payment modal
        window.location.href = '/pricing';
    }

    setupNotificationSystem() {
        // Create notification container if it doesn't exist
        if (!document.querySelector('.notification-container')) {
            const container = document.createElement('div');
            container.className = 'notification-container';
            document.body.appendChild(container);
        }

        // Create premium prompt if it doesn't exist
        if (!document.querySelector('.premium-prompt')) {
            const prompt = document.createElement('div');
            prompt.className = 'premium-prompt';
            prompt.innerHTML = `
                <div class="premium-prompt-header">
                    <i class="fas fa-crown"></i>
                    <h3>Unlock Premium Content</h3>
                    <p>Get unlimited access to all songs and features</p>
                </div>
                <div class="premium-features">
                    <div class="premium-feature">
                        <i class="fas fa-check"></i>
                        <span>Access all premium songs</span>
                    </div>
                    <div class="premium-feature">
                        <i class="fas fa-check"></i>
                        <span>Download lyrics and translations</span>
                    </div>
                    <div class="premium-feature">
                        <i class="fas fa-check"></i>
                        <span>Ad-free experience</span>
                    </div>
                    <div class="premium-feature">
                        <i class="fas fa-check"></i>
                        <span>Personalized recommendations</span>
                    </div>
                </div>
                <div class="premium-prompt-actions">
                    <button class="premium-prompt-btn upgrade">Upgrade Now</button>
                    <button class="premium-prompt-btn cancel">Maybe Later</button>
                </div>
            `;
            document.body.appendChild(prompt);

            const overlay = document.createElement('div');
            overlay.className = 'premium-prompt-overlay';
            document.body.appendChild(overlay);

            // Add event listeners for premium prompt
            prompt.querySelector('.premium-prompt-btn.upgrade').addEventListener('click', () => {
                this.handleUpgradeClick();
            });

            prompt.querySelector('.premium-prompt-btn.cancel').addEventListener('click', () => {
                this.hidePremiumPrompt();
            });

            overlay.addEventListener('click', () => {
                this.hidePremiumPrompt();
            });
        }
    }

    showNotification(message, type = 'info') {
        const container = document.querySelector('.notification-container');
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        
        const icon = type === 'error' ? 'exclamation-circle' :
                    type === 'success' ? 'check-circle' : 'info-circle';
        
        notification.innerHTML = `
            <i class="fas fa-${icon}"></i>
            <span>${message}</span>
            <button class="notification-close">
                <i class="fas fa-times"></i>
            </button>
        `;

        container.appendChild(notification);

        // Add close button listener
        notification.querySelector('.notification-close').addEventListener('click', () => {
            this.hideNotification(notification);
        });

        // Show notification
        setTimeout(() => notification.classList.add('show'), 10);

        // Auto hide after 5 seconds
        setTimeout(() => {
            this.hideNotification(notification);
        }, 5000);
    }

    hideNotification(notification) {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }
}

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const app = new SingLearnApp();
}); 