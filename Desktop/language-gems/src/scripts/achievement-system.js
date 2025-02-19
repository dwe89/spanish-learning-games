class AchievementSystem {
    constructor() {
        this.achievements = this.defineAchievements();
        this.unlockedAchievements = this.loadUnlockedAchievements();
        this.setupEventListeners();
        this.setupNotifications();
    }

    defineAchievements() {
        return {
            // XP Achievements
            xpAchievements: [
                { id: 'xp-100', name: 'First Steps', description: 'Earn 100 XP', icon: '🌱', xp: 100 },
                { id: 'xp-1000', name: 'Growing Strong', description: 'Earn 1,000 XP', icon: '🌿', xp: 1000 },
                { id: 'xp-5000', name: 'XP Master', description: 'Earn 5,000 XP', icon: '🌳', xp: 5000 },
                { id: 'xp-10000', name: 'XP Legend', description: 'Earn 10,000 XP', icon: '🏆', xp: 10000 }
            ],

            // Streak Achievements
            streakAchievements: [
                { id: 'streak-3', name: 'Getting Started', description: '3 day learning streak', icon: '🔥', days: 3 },
                { id: 'streak-7', name: 'Week Warrior', description: '7 day learning streak', icon: '🗓️', days: 7 },
                { id: 'streak-30', name: 'Monthly Master', description: '30 day learning streak', icon: '📅', days: 30 },
                { id: 'streak-100', name: 'Dedication Master', description: '100 day learning streak', icon: '⭐', days: 100 }
            ],

            // Game Achievements
            gameAchievements: {
                wordMatch: [
                    { id: 'word-match-first', name: 'Word Matcher', description: 'Complete your first Word Match game', icon: '🎮' },
                    { id: 'word-match-perfect', name: 'Perfect Match', description: 'Get a perfect score in Word Match', icon: '💯' },
                    { id: 'word-match-master', name: 'Match Master', description: 'Win 50 Word Match games', icon: '👑' }
                ],
                emojiMatch: [
                    { id: 'emoji-match-first', name: 'Emoji Explorer', description: 'Complete your first Emoji Match game', icon: '😊' },
                    { id: 'emoji-match-perfect', name: 'Emoji Expert', description: 'Get a perfect score in Emoji Match', icon: '🎯' },
                    { id: 'emoji-match-master', name: 'Emoji Master', description: 'Win 50 Emoji Match games', icon: '🏅' }
                ]
            },

            // Language Achievements
            languageAchievements: {
                spanish: [
                    { id: 'spanish-beginner', name: 'Spanish Starter', description: 'Complete first Spanish lesson', icon: '🇪🇸' },
                    { id: 'spanish-intermediate', name: 'Spanish Explorer', description: 'Complete 50% of Spanish course', icon: '📚' },
                    { id: 'spanish-advanced', name: 'Spanish Master', description: 'Complete Spanish course', icon: '🎓' }
                ],
                french: [
                    { id: 'french-beginner', name: 'French Starter', description: 'Complete first French lesson', icon: '🇫🇷' },
                    { id: 'french-intermediate', name: 'French Explorer', description: 'Complete 50% of French course', icon: '📖' },
                    { id: 'french-advanced', name: 'French Master', description: 'Complete French course', icon: '🎓' }
                ]
            },

            // Special Achievements
            specialAchievements: [
                { id: 'early-bird', name: 'Early Bird', description: 'Study before 7 AM', icon: '🌅' },
                { id: 'night-owl', name: 'Night Owl', description: 'Study after 10 PM', icon: '🌙' },
                { id: 'weekend-warrior', name: 'Weekend Warrior', description: 'Study on both Saturday and Sunday', icon: '📅' }
            ]
        };
    }

    loadUnlockedAchievements() {
        const saved = localStorage.getItem('unlockedAchievements');
        return saved ? JSON.parse(saved) : [];
    }

    saveUnlockedAchievements() {
        localStorage.setItem('unlockedAchievements', JSON.stringify(this.unlockedAchievements));
    }

    setupEventListeners() {
        // Listen for XP changes
        window.addEventListener('xpEarned', (e) => {
            this.checkXPAchievements(e.detail.totalXP);
        });

        // Listen for streak updates
        window.addEventListener('streakUpdated', (e) => {
            this.checkStreakAchievements(e.detail.days);
        });

        // Listen for game completions
        window.addEventListener('gameCompleted', (e) => {
            this.checkGameAchievements(e.detail.game, e.detail.score);
        });

        // Listen for language progress
        window.addEventListener('languageProgress', (e) => {
            this.checkLanguageAchievements(e.detail.language, e.detail.progress);
        });

        // Listen for special conditions
        window.addEventListener('activityLogged', (e) => {
            this.checkSpecialAchievements(e.detail);
        });
    }

    setupNotifications() {
        // Create notification container if it doesn't exist
        if (!document.getElementById('achievement-notifications')) {
            const container = document.createElement('div');
            container.id = 'achievement-notifications';
            document.body.appendChild(container);
        }
    }

    checkXPAchievements(totalXP) {
        this.achievements.xpAchievements.forEach(achievement => {
            if (totalXP >= achievement.xp && !this.isUnlocked(achievement.id)) {
                this.unlockAchievement(achievement);
            }
        });
    }

    checkStreakAchievements(days) {
        this.achievements.streakAchievements.forEach(achievement => {
            if (days >= achievement.days && !this.isUnlocked(achievement.id)) {
                this.unlockAchievement(achievement);
            }
        });
    }

    checkGameAchievements(game, score) {
        const gameAchievements = this.achievements.gameAchievements[game];
        if (!gameAchievements) return;

        gameAchievements.forEach(achievement => {
            if (!this.isUnlocked(achievement.id)) {
                if (achievement.id.includes('first')) {
                    this.unlockAchievement(achievement);
                } else if (achievement.id.includes('perfect') && score === 100) {
                    this.unlockAchievement(achievement);
                }
                // Add more specific game achievement conditions here
            }
        });
    }

    checkLanguageAchievements(language, progress) {
        const languageAchievements = this.achievements.languageAchievements[language];
        if (!languageAchievements) return;

        languageAchievements.forEach(achievement => {
            if (!this.isUnlocked(achievement.id)) {
                if (achievement.id.includes('beginner') && progress > 0) {
                    this.unlockAchievement(achievement);
                } else if (achievement.id.includes('intermediate') && progress >= 50) {
                    this.unlockAchievement(achievement);
                } else if (achievement.id.includes('advanced') && progress >= 100) {
                    this.unlockAchievement(achievement);
                }
            }
        });
    }

    checkSpecialAchievements(activityData) {
        const hour = new Date().getHours();
        const day = new Date().getDay();

        this.achievements.specialAchievements.forEach(achievement => {
            if (!this.isUnlocked(achievement.id)) {
                if (achievement.id === 'early-bird' && hour < 7) {
                    this.unlockAchievement(achievement);
                } else if (achievement.id === 'night-owl' && hour >= 22) {
                    this.unlockAchievement(achievement);
                } else if (achievement.id === 'weekend-warrior' && (day === 0 || day === 6)) {
                    const hasWeekendActivity = this.checkWeekendActivity();
                    if (hasWeekendActivity) {
                        this.unlockAchievement(achievement);
                    }
                }
            }
        });
    }

    checkWeekendActivity() {
        // Implementation for checking activity on both Saturday and Sunday
        // This would typically involve checking activity logs
        return true; // Simplified for this example
    }

    isUnlocked(achievementId) {
        return this.unlockedAchievements.some(a => a.id === achievementId);
    }

    unlockAchievement(achievement) {
        if (!this.isUnlocked(achievement.id)) {
            const unlockedAchievement = {
                ...achievement,
                unlockedAt: new Date().toISOString()
            };
            
            this.unlockedAchievements.push(unlockedAchievement);
            this.saveUnlockedAchievements();
            this.showNotification(unlockedAchievement);
            
            // Dispatch event for other components
            window.dispatchEvent(new CustomEvent('achievementUnlocked', {
                detail: unlockedAchievement
            }));
        }
    }

    showNotification(achievement) {
        const container = document.getElementById('achievement-notifications');
        const notification = document.createElement('div');
        notification.className = 'achievement-notification';
        notification.innerHTML = `
            <div class="achievement-icon">${achievement.icon}</div>
            <div class="achievement-content">
                <h3>Achievement Unlocked!</h3>
                <h4>${achievement.name}</h4>
                <p>${achievement.description}</p>
            </div>
        `;
        
        container.appendChild(notification);
        
        // Trigger animation
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        // Remove notification after animation
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 5000);
    }

    getUnlockedAchievements() {
        return this.unlockedAchievements;
    }

    getAchievementProgress() {
        const total = Object.values(this.achievements).reduce((count, category) => {
            if (Array.isArray(category)) {
                return count + category.length;
            } else {
                return count + Object.values(category).reduce((sum, subcategory) => {
                    return sum + subcategory.length;
                }, 0);
            }
        }, 0);

        return {
            unlocked: this.unlockedAchievements.length,
            total: total,
            percentage: Math.round((this.unlockedAchievements.length / total) * 100)
        };
    }
}

// Initialize achievement system
const achievementSystem = new AchievementSystem();

// Make it available globally
window.achievementSystem = achievementSystem; 