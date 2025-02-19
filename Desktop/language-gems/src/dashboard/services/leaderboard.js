class LeaderboardManager {
    constructor() {
        this.rankings = [];
        this.currentTimeRange = 'week';
        this.currentCategory = 'xp';
        this.initializeEventListeners();
        this.loadLeaderboardData();
    }

    initializeEventListeners() {
        // Time range filter
        const timeRangeSelect = document.getElementById('timeRange');
        if (timeRangeSelect) {
            timeRangeSelect.addEventListener('change', (e) => {
                this.currentTimeRange = e.target.value;
                this.loadLeaderboardData();
            });
        }

        // Category filter
        const categorySelect = document.getElementById('category');
        if (categorySelect) {
            categorySelect.addEventListener('change', (e) => {
                this.currentCategory = e.target.value;
                this.loadLeaderboardData();
            });
        }
    }

    async loadLeaderboardData() {
        try {
            // In a real application, this would be an API call
            // const response = await fetch(`/api/leaderboard?timeRange=${this.currentTimeRange}&category=${this.currentCategory}`);
            // if (!response.ok) throw new Error('Failed to load leaderboard data');
            // const data = await response.json();

            // Sample data for demonstration
            const data = {
                rankings: [
                    {
                        rank: 1,
                        user: {
                            name: 'Maria G.',
                            avatar: '/images/default-avatar.png',
                            level: 'Advanced'
                        },
                        score: 15000,
                        trend: 'up'
                    },
                    {
                        rank: 2,
                        user: {
                            name: 'John D.',
                            avatar: '/images/default-avatar.png',
                            level: 'Intermediate'
                        },
                        score: 12500,
                        trend: 'up'
                    },
                    {
                        rank: 3,
                        user: {
                            name: 'Sarah M.',
                            avatar: '/images/default-avatar.png',
                            level: 'Advanced'
                        },
                        score: 11000,
                        trend: 'down'
                    }
                ],
                currentUser: {
                    rank: 42,
                    percentile: 15,
                    stats: {
                        xp: 5000,
                        streak: 7,
                        level: 'Intermediate'
                    }
                }
            };

            this.rankings = data.rankings;
            this.updateTopPerformers();
            this.updateRankingsTable();
            this.updateUserRank(data.currentUser);
        } catch (error) {
            console.error('Error loading leaderboard data:', error);
        }
    }

    updateTopPerformers() {
        const topThree = this.rankings.slice(0, 3);
        
        topThree.forEach((user, index) => {
            const position = index + 1;
            const container = document.querySelector(`.position-${position}`);
            if (container) {
                const avatar = container.querySelector('img');
                const name = container.querySelector('h3');
                const score = container.querySelector('.score');

                if (avatar) avatar.src = user.user.avatar;
                if (name) name.textContent = user.user.name;
                if (score) score.textContent = this.formatScore(user.score);
            }
        });
    }

    updateRankingsTable() {
        const tableBody = document.querySelector('.table-body');
        if (!tableBody) return;

        tableBody.innerHTML = this.rankings.map(entry => `
            <div class="table-row">
                <span class="rank">#${entry.rank}</span>
                <div class="user">
                    <div class="user-avatar">
                        <img src="${entry.user.avatar}" alt="${entry.user.name}">
                    </div>
                    <span>${entry.user.name}</span>
                </div>
                <span class="level">${entry.user.level}</span>
                <span class="score">${this.formatScore(entry.score)}</span>
                <span class="trend">
                    <i class="fas fa-arrow-${entry.trend}" style="color: ${entry.trend === 'up' ? '#27ae60' : '#e74c3c'}"></i>
                </span>
            </div>
        `).join('');
    }

    updateUserRank(userData) {
        const rankNumber = document.querySelector('.rank-number');
        const rankPercentile = document.querySelector('.rank-percentile');
        const stats = document.querySelectorAll('.stat-value');

        if (rankNumber) rankNumber.textContent = `#${userData.rank}`;
        if (rankPercentile) rankPercentile.textContent = `Top ${userData.percentile}%`;

        stats.forEach(stat => {
            const label = stat.previousElementSibling?.textContent;
            if (label) {
                switch (label) {
                    case 'XP Points':
                        stat.textContent = this.formatScore(userData.stats.xp);
                        break;
                    case 'Streak':
                        stat.textContent = `${userData.stats.streak} days`;
                        break;
                    case 'Level':
                        stat.textContent = userData.stats.level;
                        break;
                }
            }
        });
    }

    formatScore(score) {
        if (this.currentCategory === 'xp') {
            return `${score.toLocaleString()} XP`;
        } else if (this.currentCategory === 'streak') {
            return `${score} days`;
        } else if (this.currentCategory === 'lessons') {
            return score.toLocaleString();
        } else if (this.currentCategory === 'vocabulary') {
            return `${score} words`;
        }
        return score.toLocaleString();
    }
}

// Initialize leaderboard manager when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.leaderboardManager = new LeaderboardManager();
}); 