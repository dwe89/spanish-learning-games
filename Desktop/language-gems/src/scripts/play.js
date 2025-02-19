// Game Stats Management
class GameStatsManager {
    constructor() {
        this.gameState = window.gameState;
        this.achievementSystem = window.achievementSystem;
        this.loadGameStats();
        this.setupAchievementsPreview();
    }

    loadGameStats() {
        const games = [
            'wordMatch',
            'emojiMatch',
            'sentenceBuilder',
            'verbQuest',
            'fillLyrics',
            'rhythmMaster',
            'memoryMatch',
            'wordScramble'
        ];

        games.forEach(game => {
            const stats = this.gameState.getGameStats(game);
            if (stats) {
                this.updateGameCard(game, stats);
            }
        });
    }

    updateGameCard(gameId, stats) {
        const card = document.querySelector(`[href*="${this.getGamePath(gameId)}"]`);
        if (!card) return;

        const bestScore = card.querySelector('.best-score');
        const gamesPlayed = card.querySelector('.games-played');

        if (bestScore) {
            bestScore.textContent = `Best: ${stats.bestScore || '-'}`;
        }

        if (gamesPlayed) {
            gamesPlayed.textContent = `Played: ${stats.gamesPlayed || '-'}`;
        }

        // Add completion indicator if applicable
        if (stats.bestScore > 0) {
            card.classList.add('completed');
        }
    }

    getGamePath(gameId) {
        const paths = {
            wordMatch: 'word-match',
            emojiMatch: 'emoji-game',
            sentenceBuilder: 'sentence-builder',
            verbQuest: 'verb-quest',
            fillLyrics: 'fill-lyrics',
            rhythmMaster: 'rhythm-game',
            memoryMatch: 'memory-game',
            wordScramble: 'word-scramble'
        };
        return paths[gameId] || gameId;
    }

    setupAchievementsPreview() {
        const achievementsList = document.getElementById('recentAchievements');
        if (!achievementsList) return;

        const achievements = this.achievementSystem.getRecentAchievements(4);
        
        if (achievements.length === 0) {
            return; // Empty state message is already in the HTML
        }

        achievementsList.innerHTML = achievements.map(achievement => this.createAchievementCard(achievement)).join('');
    }

    createAchievementCard(achievement) {
        return `
            <div class="achievement-card ${achievement.category.toLowerCase()}">
                <div class="achievement-icon">${achievement.icon}</div>
                <div class="achievement-info">
                    <h3>${achievement.title}</h3>
                    <p>${achievement.description}</p>
                </div>
                <div class="achievement-date">
                    ${this.formatDate(achievement.unlockedAt)}
                </div>
            </div>
        `;
    }

    formatDate(date) {
        const now = new Date();
        const achievementDate = new Date(date);
        const diffTime = Math.abs(now - achievementDate);
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {
            return 'Today';
        } else if (diffDays === 1) {
            return 'Yesterday';
        } else if (diffDays < 7) {
            return `${diffDays} days ago`;
        } else {
            return achievementDate.toLocaleDateString();
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Wait for game state and achievement system to be available
    const checkDependencies = setInterval(() => {
        if (window.gameState && window.achievementSystem) {
            clearInterval(checkDependencies);
            const statsManager = new GameStatsManager();
        }
    }, 100);

    // Timeout after 5 seconds
    setTimeout(() => {
        clearInterval(checkDependencies);
        console.warn('Game state or achievement system not loaded');
    }, 5000);
}); 