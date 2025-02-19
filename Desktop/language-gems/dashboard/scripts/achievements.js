class Achievements {
    constructor() {
        this.achievements = [];
        this.init();
    }

    init() {
        this.loadAchievements();
        this.setupEventListeners();
    }

    setupEventListeners() {
        const filterSelect = document.querySelector('.filter-select');
        if (filterSelect) {
            filterSelect.addEventListener('change', (e) => {
                this.filterAchievements(e.target.value);
            });
        }
    }

    async loadAchievements() {
        try {
            // Mock achievements data for now
            this.achievements = [
                {
                    id: 1,
                    title: 'First Perfect Score',
                    description: 'Complete a lesson with 100% accuracy',
                    progress: 100,
                    completed: true,
                    date: '2024-01-15'
                },
                {
                    id: 2,
                    title: '7-Day Streak',
                    description: 'Study consistently for 7 days in a row',
                    progress: 43,
                    completed: false,
                    current: 3,
                    total: 7
                },
                {
                    id: 3,
                    title: 'Vocabulary Master',
                    description: 'Learn 100 new words',
                    progress: 25,
                    completed: false,
                    current: 25,
                    total: 100
                }
            ];

            this.renderAchievements();
            this.updateAchievementsStats();
        } catch (error) {
            console.error('Error loading achievements:', error);
        }
    }

    renderAchievements() {
        const container = document.querySelector('.achievements-grid');
        if (!container) return;

        container.innerHTML = this.achievements.map(achievement => `
            <div class="achievement-card ${achievement.completed ? 'unlocked' : ''}">
                <div class="achievement-icon">
                    <i class="fas ${this.getAchievementIcon(achievement)}"></i>
                </div>
                <div class="achievement-content">
                    <h3>${achievement.title}</h3>
                    <p>${achievement.description}</p>
                    <div class="achievement-progress">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${achievement.progress}%"></div>
                        </div>
                        <span class="progress-text">
                            ${achievement.completed ? 'Completed!' : 
                              `${achievement.current}/${achievement.total}`}
                        </span>
                    </div>
                    ${achievement.completed ? 
                      `<span class="achievement-date">Unlocked ${new Date(achievement.date).toLocaleDateString()}</span>` : 
                      ''}
                </div>
            </div>
        `).join('');
    }

    getAchievementIcon(achievement) {
        // Map achievement types to Font Awesome icons
        const iconMap = {
            'First Perfect Score': 'fa-star',
            '7-Day Streak': 'fa-fire',
            'Vocabulary Master': 'fa-book'
        };
        return iconMap[achievement.title] || 'fa-trophy';
    }

    updateAchievementsStats() {
        const completed = this.achievements.filter(a => a.completed).length;
        const total = this.achievements.length;
        
        const statsCard = document.querySelector('.stat-card:has(h3:contains("Achievements"))');
        if (statsCard) {
            const numberEl = statsCard.querySelector('.stat-number');
            if (numberEl) {
                numberEl.textContent = `${completed}/${total}`;
            }
        }
    }

    filterAchievements(filter) {
        const container = document.querySelector('.achievements-grid');
        if (!container) return;

        const cards = container.querySelectorAll('.achievement-card');
        cards.forEach(card => {
            switch (filter) {
                case 'unlocked':
                    card.style.display = card.classList.contains('unlocked') ? 'flex' : 'none';
                    break;
                case 'locked':
                    card.style.display = !card.classList.contains('unlocked') ? 'flex' : 'none';
                    break;
                default:
                    card.style.display = 'flex';
            }
        });
    }
}

// Initialize achievements when page loads
window.addEventListener('DOMContentLoaded', () => {
    window.achievements = new Achievements();
}); 