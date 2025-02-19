// Learning Path Management
class LearningPathManager {
    constructor() {
        this.progressTracker = window.progressTracker;
        this.achievementSystem = window.achievementSystem;
        this.currentLanguage = 'spanish';
        this.currentLevel = 'beginner';
        this.setupEventListeners();
        this.loadProgress();
    }

    setupEventListeners() {
        // Language selection
        document.querySelectorAll('.language-card').forEach(card => {
            card.addEventListener('click', (e) => this.switchLanguage(e.currentTarget.dataset.language));
        });

        // Unit card clicks
        document.querySelectorAll('.unit-card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (card.classList.contains('locked')) {
                    e.preventDefault();
                    this.showNotification('Complete previous units to unlock this one', 'info');
                }
            });
        });
    }

    switchLanguage(language) {
        if (language === this.currentLanguage) return;

        // Update active language
        document.querySelectorAll('.language-card').forEach(card => {
            card.classList.toggle('active', card.dataset.language === language);
        });

        this.currentLanguage = language;
        this.loadProgress();
    }

    loadProgress() {
        if (!this.progressTracker) {
            console.warn('Progress tracker not loaded');
            return;
        }

        // Load language progress
        const languageProgress = this.progressTracker.getLanguageProgress(this.currentLanguage);
        this.updateLanguageProgress(languageProgress);

        // Load path progress
        const pathProgress = this.progressTracker.getPathProgress(this.currentLanguage);
        this.updatePathProgress(pathProgress);

        // Load learning stats
        this.updateLearningStats();
    }

    updateLanguageProgress(progress) {
        const languageCard = document.querySelector(`.language-card.${this.currentLanguage}`);
        if (!languageCard) return;

        const progressBar = languageCard.querySelector('.progress');
        const progressText = languageCard.querySelector('.progress-text');

        if (progressBar) {
            progressBar.style.width = `${progress.percentage}%`;
        }

        if (progressText) {
            progressText.textContent = `${progress.percentage}% Complete`;
        }
    }

    updatePathProgress(progress) {
        Object.entries(progress).forEach(([level, pathProgress]) => {
            const section = document.querySelector(`.path-section.${level}`);
            if (!section) return;

            const progressBar = section.querySelector('.progress');
            const progressText = section.querySelector('.progress-text');
            const unitsGrid = section.querySelector('.units-grid');

            if (progressBar) {
                progressBar.style.width = `${pathProgress.percentage}%`;
            }

            if (progressText) {
                progressText.textContent = `${pathProgress.completed}/${pathProgress.total} Units Complete`;
            }

            // Update unit cards
            if (unitsGrid) {
                this.updateUnitCards(unitsGrid, pathProgress.units);
            }
        });
    }

    updateUnitCards(grid, units) {
        units.forEach((unit, index) => {
            const card = grid.children[index];
            if (!card) return;

            // Update progress bar
            const progressBar = card.querySelector('.progress');
            if (progressBar) {
                progressBar.style.width = `${unit.progress}%`;
            }

            // Update locked state
            card.classList.toggle('locked', !unit.unlocked);

            // Add completed state if 100%
            card.classList.toggle('completed', unit.progress === 100);
        });
    }

    updateLearningStats() {
        const stats = this.progressTracker.getLearningStats(this.currentLanguage);
        
        // Update streak
        const streakValue = document.querySelector('.stat-card:nth-child(1) .stat-value');
        if (streakValue) {
            streakValue.textContent = `${stats.streak} days`;
        }

        // Update XP
        const xpValue = document.querySelector('.stat-card:nth-child(2) .stat-value');
        if (xpValue) {
            xpValue.textContent = `${stats.xp} XP`;
        }

        // Update lessons completed
        const lessonsValue = document.querySelector('.stat-card:nth-child(3) .stat-value');
        if (lessonsValue) {
            lessonsValue.textContent = stats.lessonsCompleted;
        }

        // Update achievements
        const achievementsValue = document.querySelector('.stat-card:nth-child(4) .stat-value');
        if (achievementsValue) {
            achievementsValue.textContent = this.achievementSystem.getUnlockedCount();
        }
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;

        document.body.appendChild(notification);

        // Remove after 3 seconds
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Wait for progress tracker and achievement system to be available
    const checkDependencies = setInterval(() => {
        if (window.progressTracker && window.achievementSystem) {
            clearInterval(checkDependencies);
            const pathManager = new LearningPathManager();
        }
    }, 100);

    // Timeout after 5 seconds
    setTimeout(() => {
        clearInterval(checkDependencies);
        console.warn('Progress tracker or achievement system not loaded');
    }, 5000);
}); 