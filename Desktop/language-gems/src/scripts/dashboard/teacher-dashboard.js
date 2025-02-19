// Initialize theme system
class ThemeManager {
    constructor() {
        this.themeToggle = document.querySelector('.theme-toggle');
        this.body = document.body;
        this.initialize();
    }

    initialize() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        this.body.setAttribute('data-theme', savedTheme);
        this.updateThemeIcon(savedTheme);
        this.setupEventListeners();
    }

    setupEventListeners() {
        this.themeToggle.addEventListener('click', () => {
            const currentTheme = this.body.getAttribute('data-theme');
            const newTheme = currentTheme === 'light' ? 'dark' : 'light';
            
            this.body.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            this.updateThemeIcon(newTheme);
        });
    }

    updateThemeIcon(theme) {
        const icon = this.themeToggle.querySelector('i');
        if (icon) {
            icon.className = theme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
        }
    }
}

// Notifications
const notificationsBtn = document.querySelector('.notifications') || null;

// Initialize notifications array
const notifications = [
    {
        id: 1,
        title: 'New Achievement Unlocked!',
        message: 'You\'ve completed your first week streak!',
        time: '2 hours ago',
        read: false
    },
    {
        id: 2,
        title: 'Daily Goal Reminder',
        message: 'You\'re close to completing today\'s vocabulary goal!',
        time: '5 hours ago',
        read: false
    }
];

// Only initialize notifications if the button exists
if (notificationsBtn) {
    // Create notifications dropdown
    const notificationsDropdown = document.createElement('div');
    notificationsDropdown.className = 'notifications-dropdown';
    notificationsDropdown.style.display = 'none';
    notificationsBtn.parentElement.appendChild(notificationsDropdown);

    // Update notifications badge
    function updateNotificationsBadge() {
        const unreadCount = notifications.filter(n => !n.read).length;
        const badge = notificationsBtn.querySelector('.notification-badge');
        if (badge) {
            badge.textContent = unreadCount;
            badge.style.display = unreadCount > 0 ? 'block' : 'none';
        }
    }

    // Initialize notifications
    updateNotificationsBadge();
}

// Render notifications
function renderNotifications() {
    notificationsDropdown.innerHTML = `
        <div class="notifications-header">
            <h3>Notifications</h3>
            <button class="mark-all-read">Mark all as read</button>
        </div>
        <div class="notifications-list">
            ${notifications.map(notification => `
                <div class="notification-item ${notification.read ? 'read' : ''}" data-id="${notification.id}">
                    <div class="notification-content">
                        <h4>${notification.title}</h4>
                        <p>${notification.message}</p>
                        <span class="notification-time">${notification.time}</span>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

// Toggle notifications dropdown
if (notificationsBtn && notificationsDropdown) {
    notificationsBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isVisible = notificationsDropdown.style.display === 'block';
        notificationsDropdown.style.display = isVisible ? 'none' : 'block';
        renderNotifications();
    });

    // Close notifications when clicking outside
    document.addEventListener('click', (e) => {
        if (!notificationsDropdown.contains(e.target) && e.target !== notificationsBtn) {
            notificationsDropdown.style.display = 'none';
        }
    });

    // Mark notification as read
    notificationsDropdown.addEventListener('click', (e) => {
        const notificationItem = e.target.closest('.notification-item');
        if (notificationItem) {
            const id = parseInt(notificationItem.dataset.id);
            const notification = notifications.find(n => n.id === id);
            if (notification) {
                notification.read = true;
                notificationItem.classList.add('read');
                updateNotificationsBadge();
            }
        }

        if (e.target.classList.contains('mark-all-read')) {
            notifications.forEach(n => n.read = true);
            updateNotificationsBadge();
            renderNotifications();
        }
    });
}

// Initial notifications setup
updateNotificationsBadge();

// Avatar Upload
const avatarUpload = document.getElementById('avatarUpload');
const userAvatar = document.getElementById('userAvatar');

avatarUpload.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        // Check file type
        if (!file.type.startsWith('image/')) {
            alert('Please upload an image file');
            return;
        }

        // Check file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert('Please upload an image smaller than 5MB');
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            // Save to localStorage
            localStorage.setItem('userAvatar', event.target.result);
            userAvatar.src = event.target.result;
        };
        reader.readAsDataURL(file);
    }
});

// Load saved avatar
const savedAvatar = localStorage.getItem('userAvatar');
if (savedAvatar) {
    userAvatar.src = savedAvatar;
}

class Dashboard {
    constructor() {
        this.stats = window.userStats;
        this.initializeDashboard();
        this.setupEventListeners();
        this.startActivityTracking();
    }

    initializeDashboard() {
        // Update login streak
        const streak = this.stats.updateLoginStreak();
        this.updateStreakDisplay(streak);

        // Update welcome message with display name
        this.updateWelcomeMessage();

        // Update all stats displays
        this.updateStatCards();

        // Initialize achievements
        this.updateAchievements();

        // Update vocabulary progress
        this.updateVocabularyLists();

        // Update games progress
        this.updateGamesProgress();

        // Update recent activity
        this.updateRecentActivity();

        // Set up avatar change functionality
        this.setupAvatarUpload();
    }

    updateStreakDisplay(streak) {
        const streakCounter = document.querySelector('.streak-counter span');
        if (streakCounter) {
            streakCounter.textContent = `${streak} Day${streak !== 1 ? 's' : ''} Streak!`;
        }
    }

    updateWelcomeMessage() {
        const welcomeMessage = document.querySelector('.section-header h2 .student-name');
        if (welcomeMessage) {
            welcomeMessage.textContent = this.stats.getStats().displayName;
            welcomeMessage.contentEditable = true;
            welcomeMessage.addEventListener('blur', async () => {
                const newName = welcomeMessage.textContent.trim();
                if (newName) {
                    // Update both local storage and server
                    this.stats.setDisplayName(newName);
                    try {
                        await this.apiService.updateUserProfile({ displayName: newName });
                    } catch (error) {
                        console.error('Failed to update display name on server:', error);
                    }
                }
            });
        }
    }

    updateStatCards() {
        const stats = this.stats.getStats();
        
        // Update XP
        this.updateStatCard('XP Points', stats.xp.total, `+${stats.xp.today} today`);
        
        // Update Study Time
        const studyTimeMinutes = Math.floor(stats.studyTime.today);
        const timeDisplay = studyTimeMinutes >= 60 
            ? `${Math.floor(studyTimeMinutes/60)}h ${studyTimeMinutes%60}m`
            : `${studyTimeMinutes}m`;
        this.updateStatCard('Study Time', timeDisplay, 'Today');
        
        // Update Completed Lessons
        this.updateStatCard('Completed', 
            stats.completedLessons.thisWeek, 
            'Lessons this week');
        
        // Update Achievements
        this.updateStatCard('Achievements', 
            `${stats.achievements.unlocked.length}/12`, 
            'This month');
    }

    updateVocabularyLists() {
        const stats = this.stats.getStats();
        
        // Update vocabulary stats
        const learningCount = document.querySelector('.vocab-learning');
        const masteredCount = document.querySelector('.vocab-mastered');
        
        if (learningCount) {
            learningCount.textContent = stats.vocabulary.practicing.length;
        }
        if (masteredCount) {
            masteredCount.textContent = stats.vocabulary.mastered.length;
        }

        // Update vocabulary lists
        this.updateVocabList('learning', stats.vocabulary.practicing);
        this.updateVocabList('mastered', stats.vocabulary.mastered);
    }

    updateVocabList(type, words) {
        const list = document.querySelector(`.vocab-list.${type}`);
        if (list) {
            list.innerHTML = words.length ? words.map(word => `
                <div class="vocab-item">
                    <span class="word">${word}</span>
                    ${type === 'learning' ? `
                        <button class="mark-mastered" onclick="window.dashboard.markWordMastered('${word}')">
                            <i class="fas fa-check"></i>
                        </button>
                    ` : ''}
                </div>
            `).join('') : '<p class="empty-state">No words yet</p>';
        }
    }

    markWordMastered(word) {
        this.stats.addVocabularyWord(word, 'mastered');
        this.updateVocabularyLists();
    }

    updateGamesProgress() {
        const gamesStats = document.querySelector('.games-list');
        if (!gamesStats) return;

        const gameData = {
            'memory': { name: 'Memory Game', icon: 'puzzle-piece' },
            'hangman': { name: 'Hangman', icon: 'gamepad' },
            'quiz': { name: 'Language Quiz', icon: 'question-circle' }
        };

        const stats = this.stats.getStats();
        const gamesPlayed = stats.gamesPlayed || {};

        gamesStats.innerHTML = Object.entries(gameData).map(([game, data]) => `
            <div class="game-stat">
                <i class="fas fa-${data.icon}"></i>
                <span class="game-name">${data.name}</span>
                <span class="play-count">${gamesPlayed[game]?.count || 0} played</span>
                <span class="best-score">Best: ${gamesPlayed[game]?.bestScore || 0}</span>
            </div>
        `).join('');
    }

    updateRecentActivity() {
        const activityList = document.querySelector('.activity-list');
        if (!activityList) return;

        const stats = this.stats.getStats();
        const activities = stats.recentActivities || [];

        activityList.innerHTML = activities.length ? activities.map(activity => `
            <div class="activity-item">
                <div class="activity-icon ${activity.type}">
                    <i class="fas fa-${this.getActivityIcon(activity.type)}"></i>
                </div>
                <div class="activity-content">
                    <p>${activity.description}</p>
                    <span class="activity-time">${this.formatActivityTime(activity.timestamp)}</span>
                </div>
            </div>
        `).join('') : '<p class="empty-state">No recent activity</p>';
    }

    getActivityIcon(type) {
        const icons = {
            'game': 'gamepad',
            'lesson': 'book',
            'achievement': 'trophy',
            'vocabulary': 'language'
        };
        return icons[type] || 'star';
    }

    formatActivityTime(timestamp) {
        const now = new Date();
        const activityTime = new Date(timestamp);
        const diffMinutes = Math.floor((now - activityTime) / 60000);

        if (diffMinutes < 1) return 'Just now';
        if (diffMinutes < 60) return `${diffMinutes}m ago`;
        if (diffMinutes < 1440) return `${Math.floor(diffMinutes/60)}h ago`;
        return activityTime.toLocaleDateString();
    }

    startActivityTracking() {
        // Track page visibility for study time
        let studyInterval;
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                clearInterval(studyInterval);
            } else {
                studyInterval = setInterval(() => {
                    this.stats.addStudyTime(1/60); // Add 1 second converted to minutes
                    this.updateStatCards();
                }, 1000);
            }
        });

        // Initialize study time tracking if page is visible
        if (!document.hidden) {
            studyInterval = setInterval(() => {
                this.stats.addStudyTime(1/60);
                this.updateStatCards();
            }, 1000);
        }
    }

    addActivity(type, description) {
        const stats = this.stats.getStats();
        const activities = stats.recentActivities || [];
        
        activities.unshift({
            type,
            description,
            timestamp: new Date().toISOString()
        });

        // Keep only last 10 activities
        stats.recentActivities = activities.slice(0, 10);
        this.stats.saveStats(stats);
        this.updateRecentActivity();
    }

    updateStatCard(title, value, trend) {
        const card = document.querySelector(`.stat-card:has(h3:contains('${title}'))`);
        if (card) {
            const numberEl = card.querySelector('.stat-number');
            const trendEl = card.querySelector('.stat-trend');
            
            if (numberEl) numberEl.textContent = value;
            if (trendEl) trendEl.textContent = trend;
        }
    }

    updateAchievements() {
        const stats = this.stats.getStats();
        const achievementsGrid = document.querySelector('.achievements-grid');
        
        if (achievementsGrid) {
            achievementsGrid.innerHTML = stats.achievements.unlocked.map(achievement => `
                <div class="achievement-card unlocked">
                    <div class="achievement-icon">
                        <i class="fas fa-${achievement.icon}"></i>
                    </div>
                    <h4>${achievement.name}</h4>
                    <p>${achievement.description}</p>
                </div>
            `).join('');
        }
    }

    setupAvatarUpload() {
        const avatarUpload = document.getElementById('avatarUpload');
        const avatarImg = document.getElementById('userAvatar');
        
        if (avatarUpload && avatarImg) {
            // Load existing avatar from API first, fallback to localStorage
            this.loadUserAvatar(avatarImg);

            avatarUpload.addEventListener('change', async (e) => {
                const file = e.target.files[0];
                if (file) {
                    // Check file type and size
                    if (!file.type.startsWith('image/')) {
                        alert('Please upload an image file');
                        return;
                    }
                    if (file.size > 5 * 1024 * 1024) {
                        alert('Please upload an image smaller than 5MB');
                        return;
                    }

                    try {
                        // First update the server
                        const formData = new FormData();
                        formData.append('avatar', file);
                        await this.apiService.updateUserAvatar(formData);

                        // Then update local display
                        const reader = new FileReader();
                        reader.onload = (e) => {
                            const newAvatar = e.target.result;
                            avatarImg.src = newAvatar;
                            localStorage.setItem('userAvatar', newAvatar);
                        };
                        reader.readAsDataURL(file);
                    } catch (error) {
                        console.error('Failed to update avatar on server:', error);
                        alert('Failed to update avatar. Please try again.');
                    }
                }
            });
        }
    }

    async loadUserAvatar(avatarImg) {
        try {
            // Try to get avatar from API first
            const avatarUrl = await this.apiService.getUserAvatar();
            if (avatarUrl) {
                avatarImg.src = avatarUrl;
                localStorage.setItem('userAvatar', avatarUrl);
                return;
            }
        } catch (error) {
            console.error('Failed to load avatar from server:', error);
        }

        // Fallback to localStorage
        const savedAvatar = localStorage.getItem('userAvatar');
        if (savedAvatar) {
            avatarImg.src = savedAvatar;
        }
    }

    setupEventListeners() {
        // Listen for achievement unlocks
        window.addEventListener('achievementUnlocked', (e) => {
            const { name, icon } = e.detail;
            this.showAchievementNotification(name, icon);
            this.updateAchievements();
            this.updateStatCards();
        });

        // Listen for study time updates
        let studyInterval;
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                // User left the page, stop counting study time
                clearInterval(studyInterval);
            } else {
                // User returned to the page, start counting study time
                studyInterval = setInterval(() => {
                    this.stats.addStudyTime(1/60); // Add 1 second converted to minutes
                    this.updateStatCards();
                }, 1000);
            }
        });
    }

    showAchievementNotification(name, icon) {
        const notification = document.createElement('div');
        notification.className = 'achievement-notification';
        notification.innerHTML = `
            <i class="fas fa-${icon}"></i>
            <div class="notification-content">
                <h4>Achievement Unlocked!</h4>
                <p>${name}</p>
            </div>
        `;
        
        document.body.appendChild(notification);
        setTimeout(() => {
            notification.classList.add('show');
            setTimeout(() => {
                notification.classList.remove('show');
                setTimeout(() => notification.remove(), 300);
            }, 3000);
        }, 100);
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Load user stats script first
    const statsScript = document.createElement('script');
    statsScript.src = '/scripts/user-stats.js';
    statsScript.onload = () => {
        // Then initialize dashboard
        window.dashboard = new Dashboard();
    };
    document.body.appendChild(statsScript);
});