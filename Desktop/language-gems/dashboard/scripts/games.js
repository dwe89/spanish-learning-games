class Games {
    constructor() {
        this.progressData = null;
        this.initializeEventListeners();
    }

    async initialize() {
        await this.loadGameData();
        this.updateGameStats();
        this.updateGameHistory();
    }

    initializeEventListeners() {
        document.addEventListener('DOMContentLoaded', () => {
            const gameLinks = document.querySelectorAll('.game-link');
            gameLinks.forEach(link => {
                link.addEventListener('click', (e) => {
                    this.trackGameLaunch(link.dataset.game);
                });
            });

            const gamesNav = document.querySelector('a[href="#games"]');
            if (gamesNav) {
                gamesNav.addEventListener('click', () => {
                    this.initialize();
                });
            }

            if (window.location.hash === '#games') {
                this.initialize();
            }
        });
    }

    async loadGameData() {
        try {
            const token = localStorage.getItem('auth_token');
            if (!token) return;

            // Load game stats
            const statsResponse = await fetch('/api/games/stats', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!statsResponse.ok) {
                throw new Error('Failed to load game stats');
            }

            const statsData = await statsResponse.json();

            // Load game history
            const historyResponse = await fetch('/api/games/history', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!historyResponse.ok) {
                throw new Error('Failed to load game history');
            }

            const historyData = await historyResponse.json();

            this.progressData = {
                stats: statsData.stats,
                history: historyData.history
            };

            return this.progressData;
        } catch (error) {
            console.error('Error loading game data:', error);
            // Show error message to user
            const errorElement = document.querySelector('.games-error');
            if (errorElement) {
                errorElement.textContent = 'Failed to load game data. Please try again later.';
                errorElement.style.display = 'block';
            }
        }
    }

    updateGameStats() {
        if (!this.progressData?.stats) return;

        const { stats } = this.progressData;
        
        // Update XP display
        const xpElement = document.querySelector('.stat-card .xp-points');
        if (xpElement) {
            xpElement.textContent = stats.xp || 0;
        }

        // Update streak display
        const streakElement = document.querySelector('.stat-card .streak-days');
        if (streakElement) {
            streakElement.textContent = stats.streakDays || 0;
        }

        // Update games played
        const gamesPlayedElement = document.querySelector('.stat-card .games-played');
        if (gamesPlayedElement) {
            gamesPlayedElement.textContent = stats.totalGames || 0;
        }

        // Update best score
        const bestScoreElement = document.querySelector('.stat-card .best-score');
        if (bestScoreElement) {
            bestScoreElement.textContent = stats.highScore || 0;
        }

        // Update level
        const levelElement = document.querySelector('.stat-card .level');
        if (levelElement) {
            levelElement.textContent = stats.level || 1;
        }
    }

    updateGameHistory() {
        if (!this.progressData?.history) return;

        const historyContainer = document.querySelector('.game-history');
        if (!historyContainer) return;

        const history = this.progressData.history
            .sort((a, b) => new Date(b.completed_at) - new Date(a.completed_at))
            .slice(0, 5); // Show last 5 games

        historyContainer.innerHTML = `
            <h3>Recent Games</h3>
            <div class="history-list">
                ${history.map(game => `
                    <div class="history-item">
                        <div class="game-info">
                            <span class="game-type">${this.formatGameType(game.game_type)}</span>
                            <span class="game-date">${new Date(game.completed_at).toLocaleDateString()}</span>
                        </div>
                        <div class="game-stats">
                            <span class="score">Score: ${game.score}</span>
                            <span class="time">Time: ${this.formatTime(game.time_spent)}</span>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${String(remainingSeconds).padStart(2, '0')}`;
    }

    formatGameType(type) {
        return type
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }

    async trackGameLaunch(gameType) {
        console.log(`Launching game: ${gameType}`);
        // Additional tracking logic can be added here
    }

    async recordGameCompletion(gameType, score, timeSpent) {
        try {
            const token = localStorage.getItem('auth_token');
            if (!token) return;

            const response = await fetch('/api/games/complete', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    game_type: gameType,
                    score,
                    time_spent: timeSpent
                })
            });

            if (!response.ok) {
                throw new Error('Failed to record game completion');
            }

            const result = await response.json();
            
            // Show XP gained notification
            if (result.xpGained) {
                this.showXPNotification(result.xpGained);
            }

            // Refresh game data
            await this.initialize();
        } catch (error) {
            console.error('Error recording game completion:', error);
        }
    }

    showXPNotification(xpGained) {
        const notification = document.createElement('div');
        notification.className = 'xp-notification';
        notification.textContent = `+${xpGained} XP`;
        document.body.appendChild(notification);

        // Animate and remove
        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => notification.remove(), 500);
        }, 2000);
    }
}

// Initialize games when the module loads
const games = new Games();
export default games; 