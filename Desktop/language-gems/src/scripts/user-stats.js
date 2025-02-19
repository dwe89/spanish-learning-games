class UserStats {
    constructor() {
        this.stats = this.loadStats();
    }

    loadStats() {
        const savedStats = localStorage.getItem('userStats');
        if (savedStats) {
            return JSON.parse(savedStats);
        }
        
        // Initialize default stats for new users
        const defaultStats = {
            streak: {
                current: 1,
                lastLogin: new Date().toISOString().split('T')[0], // Store date as YYYY-MM-DD
            },
            xp: {
                total: 0,
                today: 0,
                lastUpdate: new Date().toISOString().split('T')[0]
            },
            studyTime: {
                total: 0,
                today: 0,
                lastUpdate: new Date().toISOString().split('T')[0]
            },
            completedLessons: {
                total: 0,
                thisWeek: 0,
                weekStart: this.getWeekStart()
            },
            achievements: {
                unlocked: [],
                inProgress: {}
            },
            vocabulary: {
                learned: [],
                practicing: [],
                mastered: []
            },
            displayName: localStorage.getItem('userName') || 'Student'
        };
        
        this.saveStats(defaultStats);
        return defaultStats;
    }

    saveStats(stats = this.stats) {
        localStorage.setItem('userStats', JSON.stringify(stats));
        this.stats = stats;
    }

    getWeekStart() {
        const now = new Date();
        const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - dayOfWeek);
        return weekStart.toISOString().split('T')[0];
    }

    updateLoginStreak() {
        const today = new Date().toISOString().split('T')[0];
        const lastLogin = this.stats.streak.lastLogin;
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        if (today === lastLogin) {
            // Already logged in today
            return this.stats.streak.current;
        } else if (yesterdayStr === lastLogin) {
            // Logged in yesterday, increment streak
            this.stats.streak.current += 1;
        } else {
            // Streak broken
            this.stats.streak.current = 1;
        }

        this.stats.streak.lastLogin = today;
        this.saveStats();
        return this.stats.streak.current;
    }

    addXP(amount) {
        const today = new Date().toISOString().split('T')[0];
        
        // Reset daily XP if it's a new day
        if (today !== this.stats.xp.lastUpdate) {
            this.stats.xp.today = 0;
            this.stats.xp.lastUpdate = today;
        }

        this.stats.xp.total += amount;
        this.stats.xp.today += amount;
        this.saveStats();

        // Check for XP-based achievements
        this.checkXPAchievements();
    }

    addStudyTime(minutes) {
        const today = new Date().toISOString().split('T')[0];
        
        // Reset daily study time if it's a new day
        if (today !== this.stats.studyTime.lastUpdate) {
            this.stats.studyTime.today = 0;
            this.stats.studyTime.lastUpdate = today;
        }

        this.stats.studyTime.total += minutes;
        this.stats.studyTime.today += minutes;
        this.saveStats();

        // Check for study time achievements
        this.checkStudyTimeAchievements();
    }

    completeLesson() {
        const currentWeekStart = this.getWeekStart();
        
        // Reset weekly count if it's a new week
        if (currentWeekStart !== this.stats.completedLessons.weekStart) {
            this.stats.completedLessons.thisWeek = 0;
            this.stats.completedLessons.weekStart = currentWeekStart;
        }

        this.stats.completedLessons.total += 1;
        this.stats.completedLessons.thisWeek += 1;
        this.saveStats();

        // Check for lesson completion achievements
        this.checkLessonAchievements();
    }

    addVocabularyWord(word, status = 'practicing') {
        if (!['learned', 'practicing', 'mastered'].includes(status)) {
            throw new Error('Invalid vocabulary status');
        }

        // Remove word from other lists if it exists
        ['learned', 'practicing', 'mastered'].forEach(list => {
            this.stats.vocabulary[list] = this.stats.vocabulary[list].filter(w => w !== word);
        });

        // Add to specified list
        this.stats.vocabulary[status].push(word);
        this.saveStats();

        // Check for vocabulary achievements
        this.checkVocabularyAchievements();
    }

    setDisplayName(name) {
        this.stats.displayName = name;
        this.saveStats();
    }

    getStats() {
        return this.stats;
    }

    // Achievement checking methods
    checkXPAchievements() {
        const xpAchievements = {
            'Quick Learner': { required: 100, icon: 'graduation-cap' },
            'Knowledge Seeker': { required: 500, icon: 'book' },
            'Language Master': { required: 1000, icon: 'crown' }
        };

        Object.entries(xpAchievements).forEach(([name, data]) => {
            if (this.stats.xp.total >= data.required && !this.stats.achievements.unlocked.includes(name)) {
                this.unlockAchievement(name, data.icon);
            }
        });
    }

    checkStudyTimeAchievements() {
        const timeAchievements = {
            'Dedicated Student': { required: 60, icon: 'clock' }, // 1 hour
            'Time Master': { required: 300, icon: 'hourglass' }, // 5 hours
            'Language Enthusiast': { required: 600, icon: 'star' } // 10 hours
        };

        Object.entries(timeAchievements).forEach(([name, data]) => {
            if (this.stats.studyTime.total >= data.required && !this.stats.achievements.unlocked.includes(name)) {
                this.unlockAchievement(name, data.icon);
            }
        });
    }

    checkLessonAchievements() {
        const lessonAchievements = {
            'First Steps': { required: 1, icon: 'shoe-prints' },
            'Regular Learner': { required: 10, icon: 'calendar-check' },
            'Lesson Master': { required: 50, icon: 'trophy' }
        };

        Object.entries(lessonAchievements).forEach(([name, data]) => {
            if (this.stats.completedLessons.total >= data.required && !this.stats.achievements.unlocked.includes(name)) {
                this.unlockAchievement(name, data.icon);
            }
        });
    }

    checkVocabularyAchievements() {
        const vocabAchievements = {
            'Word Collector': { required: 10, icon: 'book' },
            'Vocabulary Builder': { required: 50, icon: 'books' },
            'Language Expert': { required: 100, icon: 'certificate' }
        };

        const totalWords = this.stats.vocabulary.learned.length + 
                          this.stats.vocabulary.practicing.length + 
                          this.stats.vocabulary.mastered.length;

        Object.entries(vocabAchievements).forEach(([name, data]) => {
            if (totalWords >= data.required && !this.stats.achievements.unlocked.includes(name)) {
                this.unlockAchievement(name, data.icon);
            }
        });
    }

    unlockAchievement(name, icon) {
        if (!this.stats.achievements.unlocked.includes(name)) {
            this.stats.achievements.unlocked.push(name);
            this.saveStats();

            // Dispatch event for UI notification
            const event = new CustomEvent('achievementUnlocked', {
                detail: { name, icon }
            });
            window.dispatchEvent(event);
        }
    }
}

// Create global instance
window.userStats = new UserStats(); 