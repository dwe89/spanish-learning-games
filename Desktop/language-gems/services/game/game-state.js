class GameStateManager {
    constructor() {
        this.gameStates = this.loadGameStates();
        this.setupEventListeners();
    }

    loadGameStates() {
        const savedStates = localStorage.getItem('gameStates');
        return savedStates ? JSON.parse(savedStates) : {
            wordMatch: {},
            emojiMatch: {}
        };
    }

    saveGameStates() {
        localStorage.setItem('gameStates', JSON.stringify(this.gameStates));
    }

    saveGameState(game, gameId, state) {
        if (!this.gameStates[game]) {
            this.gameStates[game] = {};
        }

        this.gameStates[game][gameId] = {
            ...state,
            timestamp: new Date().toISOString(),
            lastModified: new Date().toISOString()
        };

        this.saveGameStates();
        this.notifyStateChange(game, gameId, 'save');
    }

    loadGameState(game, gameId) {
        if (this.gameStates[game] && this.gameStates[game][gameId]) {
            const state = this.gameStates[game][gameId];
            state.lastAccessed = new Date().toISOString();
            this.saveGameStates();
            this.notifyStateChange(game, gameId, 'load');
            return state;
        }
        return null;
    }

    deleteGameState(game, gameId) {
        if (this.gameStates[game] && this.gameStates[game][gameId]) {
            delete this.gameStates[game][gameId];
            this.saveGameStates();
            this.notifyStateChange(game, gameId, 'delete');
            return true;
        }
        return false;
    }

    getAllGameStates(game) {
        return this.gameStates[game] || {};
    }

    getRecentGames(limit = 5) {
        const allGames = [];
        
        Object.entries(this.gameStates).forEach(([gameType, games]) => {
            Object.entries(games).forEach(([gameId, state]) => {
                allGames.push({
                    gameType,
                    gameId,
                    ...state
                });
            });
        });

        return allGames
            .sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified))
            .slice(0, limit);
    }

    autoSave(game, gameId, state) {
        const existingState = this.loadGameState(game, gameId);
        if (!existingState || this.hasStateChanged(existingState, state)) {
            this.saveGameState(game, gameId, state);
        }
    }

    hasStateChanged(oldState, newState) {
        // Compare relevant state properties
        const relevantProps = ['score', 'level', 'progress', 'completed'];
        return relevantProps.some(prop => 
            JSON.stringify(oldState[prop]) !== JSON.stringify(newState[prop])
        );
    }

    setupEventListeners() {
        // Listen for game state changes
        window.addEventListener('gameStateUpdate', (e) => {
            const { game, gameId, state } = e.detail;
            this.autoSave(game, gameId, state);
        });

        // Auto-save on window blur
        window.addEventListener('blur', () => {
            this.handleWindowBlur();
        });

        // Handle page visibility change
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.handleWindowBlur();
            }
        });
    }

    handleWindowBlur() {
        // Dispatch event for games to save their current state
        window.dispatchEvent(new CustomEvent('saveGameState'));
    }

    notifyStateChange(game, gameId, action) {
        window.dispatchEvent(new CustomEvent('gameStateChanged', {
            detail: {
                game,
                gameId,
                action,
                timestamp: new Date().toISOString()
            }
        }));
    }

    createGameStateUI(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const recentGames = this.getRecentGames();
        
        container.innerHTML = `
            <div class="saved-games">
                <h3>Recent Games</h3>
                ${recentGames.length === 0 ? '<p>No saved games found</p>' : ''}
                <div class="saved-games-list">
                    ${recentGames.map(game => `
                        <div class="saved-game-card" data-game="${game.gameType}" data-id="${game.gameId}">
                            <div class="game-info">
                                <h4>${this.formatGameTitle(game.gameType)}</h4>
                                <p>Score: ${game.score || 0}</p>
                                <p>Last played: ${this.formatDate(game.lastModified)}</p>
                            </div>
                            <div class="game-actions">
                                <button class="resume-btn">Resume</button>
                                <button class="delete-btn">Delete</button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        // Add event listeners
        container.querySelectorAll('.saved-game-card').forEach(card => {
            const game = card.dataset.game;
            const gameId = card.dataset.id;

            card.querySelector('.resume-btn').addEventListener('click', () => {
                this.resumeGame(game, gameId);
            });

            card.querySelector('.delete-btn').addEventListener('click', () => {
                if (confirm('Are you sure you want to delete this saved game?')) {
                    this.deleteGameState(game, gameId);
                    card.remove();
                }
            });
        });
    }

    formatGameTitle(gameType) {
        return gameType
            .split(/(?=[A-Z])/)
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now - date;

        // Less than 24 hours
        if (diff < 24 * 60 * 60 * 1000) {
            if (diff < 60 * 60 * 1000) {
                const minutes = Math.floor(diff / (60 * 1000));
                return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
            }
            const hours = Math.floor(diff / (60 * 60 * 1000));
            return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
        }

        // Less than 7 days
        if (diff < 7 * 24 * 60 * 60 * 1000) {
            const days = Math.floor(diff / (24 * 60 * 60 * 1000));
            return `${days} day${days !== 1 ? 's' : ''} ago`;
        }

        // Format as date
        return date.toLocaleDateString();
    }

    resumeGame(game, gameId) {
        const state = this.loadGameState(game, gameId);
        if (state) {
            // Dispatch event to resume game
            window.dispatchEvent(new CustomEvent('resumeGame', {
                detail: {
                    game,
                    gameId,
                    state
                }
            }));
        }
    }
}

// Initialize game state manager
const gameStateManager = new GameStateManager();

// Make it available globally
window.gameStateManager = gameStateManager; 