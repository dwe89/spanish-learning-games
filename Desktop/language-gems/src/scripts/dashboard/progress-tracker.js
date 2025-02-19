import ApiService from './api-service.js';

class ProgressTracker {
    constructor() {
        this.progress = this.loadProgress();
        this.setupEventListeners();
    }

    loadProgress() {
        const savedProgress = localStorage.getItem('userProgress');
        if (savedProgress) {
            return JSON.parse(savedProgress);
        }
        return {
            spanish: {
                vocabulary: { completed: 0, total: 100 },
                grammar: { completed: 0, total: 50 },
                pronunciation: { completed: 0, total: 30 },
                listening: { completed: 0, total: 40 },
                reading: { completed: 0, total: 35 },
                speaking: { completed: 0, total: 25 }
            },
            french: {
                vocabulary: { completed: 0, total: 100 },
                grammar: { completed: 0, total: 50 },
                pronunciation: { completed: 0, total: 30 },
                listening: { completed: 0, total: 40 },
                reading: { completed: 0, total: 35 },
                speaking: { completed: 0, total: 25 }
            },
            achievements: [],
            streaks: {
                current: 0,
                longest: 0,
                lastActivity: null
            },
            gameStats: {
                wordMatch: {
                    gamesPlayed: 0,
                    highScore: 0,
                    totalScore: 0,
                    averageScore: 0
                },
                emojiMatch: {
                    gamesPlayed: 0,
                    highScore: 0,
                    totalScore: 0,
                    averageScore: 0
                }
            },
            xp: {
                total: 0,
                level: 1,
                currentLevelXp: 0,
                nextLevelXp: 1000
            }
        };
    }

    saveProgress() {
        localStorage.setItem('userProgress', JSON.stringify(this.progress));
        this.updateUI();
        this.checkAchievements();
    }

    updateProgress(language, skill, amount) {
        if (this.progress[language] && this.progress[language][skill]) {
            const skillProgress = this.progress[language][skill];
            skillProgress.completed = Math.min(skillProgress.completed + amount, skillProgress.total);
            this.addXP(amount * 10); // Award XP for progress
            this.updateStreak();
            this.saveProgress();
            return true;
        }
        return false;
    }

    addXP(amount) {
        this.progress.xp.total += amount;
        this.progress.xp.currentLevelXp += amount;

        // Check for level up
        while (this.progress.xp.currentLevelXp >= this.progress.xp.nextLevelXp) {
            this.progress.xp.currentLevelXp -= this.progress.xp.nextLevelXp;
            this.progress.xp.level++;
            this.progress.xp.nextLevelXp = Math.floor(this.progress.xp.nextLevelXp * 1.5);
            this.triggerAchievement('level', this.progress.xp.level);
        }
    }

    updateStreak() {
        const now = new Date();
        const lastActivity = this.progress.streaks.lastActivity ? new Date(this.progress.streaks.lastActivity) : null;

        if (!lastActivity) {
            this.progress.streaks.current = 1;
        } else {
            const daysSinceLastActivity = Math.floor((now - lastActivity) / (1000 * 60 * 60 * 24));
            
            if (daysSinceLastActivity === 1) {
                this.progress.streaks.current++;
                if (this.progress.streaks.current > this.progress.streaks.longest) {
                    this.progress.streaks.longest = this.progress.streaks.current;
                    this.checkStreakAchievements();
                }
            } else if (daysSinceLastActivity > 1) {
                this.progress.streaks.current = 1;
            }
        }
        
        this.progress.streaks.lastActivity = now.toISOString();
    }

    updateGameStats(game, score) {
        const gameStats = this.progress.gameStats[game];
        if (gameStats) {
            gameStats.gamesPlayed++;
            gameStats.totalScore += score;
            gameStats.averageScore = Math.floor(gameStats.totalScore / gameStats.gamesPlayed);
            
            if (score > gameStats.highScore) {
                gameStats.highScore = score;
                this.triggerAchievement('highscore', game);
            }
            
            this.saveProgress();
        }
    }

    checkAchievements() {
        // Check total XP achievements
        const xpMilestones = [1000, 5000, 10000, 50000];
        const currentXP = this.progress.xp.total;
        
        xpMilestones.forEach(milestone => {
            if (currentXP >= milestone && !this.hasAchievement('xp', milestone)) {
                this.triggerAchievement('xp', milestone);
            }
        });

        // Check completion achievements
        ['spanish', 'french'].forEach(language => {
            let totalCompleted = 0;
            let totalPossible = 0;
            
            Object.values(this.progress[language]).forEach(skill => {
                totalCompleted += skill.completed;
                totalPossible += skill.total;
            });
            
            const completionPercentage = (totalCompleted / totalPossible) * 100;
            const completionMilestones = [25, 50, 75, 100];
            
            completionMilestones.forEach(milestone => {
                if (completionPercentage >= milestone && !this.hasAchievement('completion', `${language}-${milestone}`)) {
                    this.triggerAchievement('completion', `${language}-${milestone}`);
                }
            });
        });
    }

    checkStreakAchievements() {
        const streakMilestones = [3, 7, 14, 30, 60, 90];
        const currentStreak = this.progress.streaks.current;
        
        streakMilestones.forEach(milestone => {
            if (currentStreak >= milestone && !this.hasAchievement('streak', milestone)) {
                this.triggerAchievement('streak', milestone);
            }
        });
    }

    hasAchievement(type, value) {
        return this.progress.achievements.some(a => a.type === type && a.value === value);
    }

    triggerAchievement(type, value) {
        if (!this.hasAchievement(type, value)) {
            const achievement = { type, value, date: new Date().toISOString() };
            this.progress.achievements.push(achievement);
            this.saveProgress();
            this.displayAchievementNotification(achievement);
        }
    }

    displayAchievementNotification(achievement) {
        // Create achievement notification element
        const notification = document.createElement('div');
        notification.className = 'achievement-notification';
        
        let message = '';
        switch (achievement.type) {
            case 'xp':
                message = `🌟 Achievement Unlocked: Earned ${achievement.value} XP!`;
                break;
            case 'streak':
                message = `🔥 Achievement Unlocked: ${achievement.value} Day Streak!`;
                break;
            case 'completion':
                const [language, percentage] = achievement.value.split('-');
                message = `🎯 Achievement Unlocked: ${percentage}% ${language} Completed!`;
                break;
            case 'highscore':
                message = `🏆 Achievement Unlocked: New High Score in ${achievement.value}!`;
                break;
            case 'level':
                message = `⭐ Achievement Unlocked: Reached Level ${achievement.value}!`;
                break;
        }
        
        notification.innerHTML = message;
        document.body.appendChild(notification);
        
        // Remove notification after animation
        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => notification.remove(), 500);
        }, 3000);
    }

    getProgressSummary() {
        return {
            spanish: this.calculateLanguageProgress('spanish'),
            french: this.calculateLanguageProgress('french'),
            totalXP: this.progress.xp.total,
            level: this.progress.xp.level,
            streak: this.progress.streaks.current,
            achievements: this.progress.achievements.length
        };
    }

    calculateLanguageProgress(language) {
        const langProgress = this.progress[language];
        let totalCompleted = 0;
        let totalPossible = 0;
        
        Object.values(langProgress).forEach(skill => {
            totalCompleted += skill.completed;
            totalPossible += skill.total;
        });
        
        return Math.floor((totalCompleted / totalPossible) * 100);
    }

    setupEventListeners() {
        // Listen for game completion events
        window.addEventListener('gameCompleted', (e) => {
            const { game, score } = e.detail;
            this.updateGameStats(game, score);
        });

        // Listen for lesson completion events
        window.addEventListener('lessonCompleted', (e) => {
            const { language, skill, progress } = e.detail;
            this.updateProgress(language, skill, progress);
        });
    }

    updateUI() {
        // Update progress bars if they exist
        const summary = this.getProgressSummary();
        
        const spanishProgress = document.getElementById('spanishProgress');
        const frenchProgress = document.getElementById('frenchProgress');
        
        if (spanishProgress) {
            spanishProgress.style.width = `${summary.spanish}%`;
            spanishProgress.textContent = `${summary.spanish}%`;
        }
        
        if (frenchProgress) {
            frenchProgress.style.width = `${summary.french}%`;
            frenchProgress.textContent = `${summary.french}%`;
        }

        // Update XP and level display if they exist
        const xpDisplay = document.getElementById('totalXP');
        const levelDisplay = document.getElementById('userLevel');
        
        if (xpDisplay) {
            xpDisplay.textContent = summary.totalXP;
        }
        
        if (levelDisplay) {
            levelDisplay.textContent = summary.level;
        }
    }
}

// Initialize progress tracker
const progressTracker = new ProgressTracker();

// Make it available globally
window.progressTracker = progressTracker; 