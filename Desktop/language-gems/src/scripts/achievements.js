class AchievementsManager {
    constructor() {
        this.db = getFirestore();
    }

    async getAchievements() {
        if (!auth.currentUser) {
            throw new Error('No authenticated user');
        }

        try {
            const achievementsRef = collection(this.db, 'achievements');
            const q = query(achievementsRef, where('userId', '==', auth.currentUser.uid));
            const snapshot = await getDocs(q);

            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Error fetching achievements:', error);
            throw error;
        }
    }

    async unlockAchievement(achievementId) {
        if (!auth.currentUser) {
            throw new Error('No authenticated user');
        }

        try {
            const achievementRef = doc(this.db, 'achievements', achievementId);
            await updateDoc(achievementRef, {
                unlocked: true,
                unlockedAt: new Date()
            });

            // Show achievement notification
            this.showAchievementNotification(achievementId);
        } catch (error) {
            console.error('Error unlocking achievement:', error);
            throw error;
        }
    }

    async checkAndUpdateProgress(activityType, value) {
        if (!auth.currentUser) {
            throw new Error('No authenticated user');
        }

        try {
            // Get all achievements that might be affected by this activity
            const achievementsRef = collection(this.db, 'achievements');
            const q = query(
                achievementsRef, 
                where('userId', '==', auth.currentUser.uid),
                where('activityType', '==', activityType),
                where('unlocked', '==', false)
            );
            const snapshot = await getDocs(q);

            // Check each achievement's criteria
            for (const doc of snapshot.docs) {
                const achievement = doc.data();
                if (this.checkAchievementCriteria(achievement, value)) {
                    await this.unlockAchievement(doc.id);
                }
            }
        } catch (error) {
            console.error('Error checking achievements:', error);
            throw error;
        }
    }

    checkAchievementCriteria(achievement, value) {
        switch (achievement.type) {
            case 'threshold':
                return value >= achievement.threshold;
            case 'count':
                return value >= achievement.requiredCount;
            case 'streak':
                return value >= achievement.requiredStreak;
            default:
                return false;
        }
    }

    showAchievementNotification(achievementId) {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = 'achievement-notification';
        
        // Get achievement details and update notification content
        const achievementRef = doc(this.db, 'achievements', achievementId);
        getDocs(achievementRef).then(doc => {
            const achievement = doc.data();
            notification.innerHTML = `
                <div class="achievement-icon">🏆</div>
                <div class="achievement-details">
                    <h3>Achievement Unlocked!</h3>
                    <p>${achievement.title}</p>
                    <p class="achievement-description">${achievement.description}</p>
                </div>
            `;
        });

        // Add notification to page
        document.body.appendChild(notification);

        // Remove notification after delay
        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => notification.remove(), 500);
        }, 5000);
    }
}

export const achievementsManager = new AchievementsManager();

// Initialize achievements when the page loads
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Wait for auth state to be determined
        await new Promise((resolve) => {
            const unsubscribe = auth.onAuthStateChanged((user) => {
                unsubscribe();
                resolve(user);
            });
        });

        if (!auth.currentUser) {
            console.warn('User not authenticated');
            return;
        }

        const achievements = await achievementsManager.getAchievements();
        displayAchievements(achievements);
    } catch (error) {
        console.error('Error initializing achievements:', error);
    }
});

// Add auth state change listener
auth.onAuthStateChanged((user) => {
    if (user) {
        achievementsManager.getAchievements()
            .then(achievements => displayAchievements(achievements))
            .catch(error => console.error('Error loading achievements:', error));
    } else {
        // Clear achievements display when user logs out
        const achievementsContainer = document.getElementById('achievements-container');
        if (achievementsContainer) {
            achievementsContainer.innerHTML = '<p>Please log in to view achievements</p>';
        }
    }
});

class Achievements {
    constructor() {
        this.achievements = {
            learning: [
                {
                    id: 'first_lesson',
                    name: 'First Steps',
                    description: 'Complete your first lesson',
                    icon: 'graduation-cap',
                    progress: 0,
                    target: 1,
                    points: 10
                },
                {
                    id: 'vocab_master',
                    name: 'Vocabulary Master',
                    description: 'Learn 50 new words',
                    icon: 'book',
                    progress: 0,
                    target: 50,
                    points: 50
                },
                {
                    id: 'study_streak',
                    name: 'Dedicated Learner',
                    description: 'Maintain a 7-day study streak',
                    icon: 'fire',
                    progress: 0,
                    target: 7,
                    points: 70
                }
            ],
            games: [
                {
                    id: 'game_explorer',
                    name: 'Game Explorer',
                    description: 'Try all available games',
                    icon: 'gamepad',
                    progress: 0,
                    target: 5,
                    points: 30
                },
                {
                    id: 'perfect_score',
                    name: 'Perfect Score',
                    description: 'Get 100% in any game',
                    icon: 'star',
                    progress: 0,
                    target: 1,
                    points: 50
                },
                {
                    id: 'game_master',
                    name: 'Game Master',
                    description: 'Win 10 games',
                    icon: 'trophy',
                    progress: 0,
                    target: 10,
                    points: 100
                }
            ],
            social: [
                {
                    id: 'community_member',
                    name: 'Community Member',
                    description: 'Join the community',
                    icon: 'users',
                    progress: 0,
                    target: 1,
                    points: 20
                },
                {
                    id: 'helpful_student',
                    name: 'Helpful Student',
                    description: 'Help 5 other students',
                    icon: 'hands-helping',
                    progress: 0,
                    target: 5,
                    points: 50
                },
                {
                    id: 'social_butterfly',
                    name: 'Social Butterfly',
                    description: 'Make 3 friends',
                    icon: 'user-friends',
                    progress: 0,
                    target: 3,
                    points: 40
                }
            ]
        };

        this.stats = {
            totalAchievements: 0,
            completionRate: 0,
            pointsEarned: 0
        };

        this.initialize();
    }

    async initialize() {
        await this.loadProgress();
        this.renderAchievements();
        this.updateStats();
        this.setupEventListeners();
    }

    async loadProgress() {
        try {
            // Load progress from API
            const token = localStorage.getItem('token');
            if (!token) return;

            const response = await fetch('/api/achievements', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.updateProgress(data);
            }
        } catch (error) {
            console.error('Failed to load achievements:', error);
            // Load from localStorage as fallback
            const savedProgress = localStorage.getItem('achievements');
            if (savedProgress) {
                this.updateProgress(JSON.parse(savedProgress));
            }
        }
    }

    updateProgress(data) {
        // Update achievement progress
        Object.keys(this.achievements).forEach(category => {
            this.achievements[category].forEach(achievement => {
                if (data[achievement.id]) {
                    achievement.progress = data[achievement.id];
                }
            });
        });
    }

    renderAchievements() {
        Object.keys(this.achievements).forEach(category => {
            const container = document.getElementById(`${category}-achievements`);
            if (!container) return;

            container.innerHTML = this.achievements[category].map(achievement => `
                <div class="achievement-item">
                    <div class="achievement-icon ${achievement.progress >= achievement.target ? 'unlocked' : 'locked'}">
                        <i class="fas fa-${achievement.icon}"></i>
                    </div>
                    <div class="achievement-details">
                        <h4>${achievement.name}</h4>
                        <p>${achievement.description}</p>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${(achievement.progress / achievement.target) * 100}%"></div>
                        </div>
                    </div>
                </div>
            `).join('');
        });
    }

    updateStats() {
        let total = 0;
        let completed = 0;
        let points = 0;

        Object.values(this.achievements).flat().forEach(achievement => {
            total++;
            if (achievement.progress >= achievement.target) {
                completed++;
                points += achievement.points;
            }
        });

        this.stats.totalAchievements = completed;
        this.stats.completionRate = Math.round((completed / total) * 100);
        this.stats.pointsEarned = points;

        // Update UI
        document.querySelector('.stat-value:nth-child(1)').textContent = completed;
        document.querySelector('.stat-value:nth-child(2)').textContent = `${this.stats.completionRate}%`;
        document.querySelector('.stat-value:nth-child(3)').textContent = points;
    }

    setupEventListeners() {
        // Listen for achievement progress events
        window.addEventListener('achievementProgress', (e) => {
            const { id, progress } = e.detail;
            this.updateAchievementProgress(id, progress);
        });
    }

    updateAchievementProgress(id, progress) {
        let achievement;
        let category;

        // Find the achievement
        Object.entries(this.achievements).forEach(([cat, achievements]) => {
            const found = achievements.find(a => a.id === id);
            if (found) {
                achievement = found;
                category = cat;
            }
        });

        if (!achievement) return;

        const oldProgress = achievement.progress;
        achievement.progress = Math.min(progress, achievement.target);

        // Check if achievement was just completed
        if (oldProgress < achievement.target && achievement.progress >= achievement.target) {
            this.showAchievementNotification(achievement);
        }

        // Save progress
        this.saveProgress();
        
        // Update UI
        this.renderAchievements();
        this.updateStats();
    }

    showAchievementNotification(achievement) {
        const notification = document.createElement('div');
        notification.className = 'achievement-notification';
        notification.innerHTML = `
            <i class="fas fa-${achievement.icon}"></i>
            <div class="notification-content">
                <h4>Achievement Unlocked!</h4>
                <p>${achievement.name}</p>
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

    async saveProgress() {
        const progress = {};
        Object.values(this.achievements).flat().forEach(achievement => {
            progress[achievement.id] = achievement.progress;
        });

        try {
            // Save to API
            const token = localStorage.getItem('token');
            if (token) {
                await fetch('/api/achievements', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(progress)
                });
            }
        } catch (error) {
            console.error('Failed to save achievements:', error);
        }

        // Save to localStorage as backup
        localStorage.setItem('achievements', JSON.stringify(progress));
    }
}

// Initialize achievements when the page loads
document.addEventListener('DOMContentLoaded', () => {
    initializeAchievements();
    setupCategoryFilters();
    setupModalHandlers();
});

let achievements = [];
let currentCategory = 'all';

async function initializeAchievements() {
    try {
        achievements = await fetchAchievements();
        updateAchievementsStats();
        renderAchievements();
    } catch (error) {
        console.error('Error initializing achievements:', error);
    }
}

function updateAchievementsStats() {
    const totalAchievements = achievements.length;
    const unlockedAchievements = achievements.filter(a => a.unlocked).length;
    const completionRate = totalAchievements > 0 
        ? Math.round((unlockedAchievements / totalAchievements) * 100) 
        : 0;

    document.querySelector('.achievements-stats .stat-value').textContent = unlockedAchievements;
    document.querySelectorAll('.achievements-stats .stat-value')[1].textContent = `${completionRate}%`;
}

function renderAchievements() {
    const grid = document.querySelector('.achievements-grid');
    const filteredAchievements = currentCategory === 'all'
        ? achievements
        : achievements.filter(a => a.category === currentCategory);

    grid.innerHTML = filteredAchievements.map(achievement => `
        <div class="achievement-card ${achievement.unlocked ? '' : 'locked'}" 
             data-id="${achievement.id}">
            <div class="achievement-icon">
                <i class="${achievement.icon}"></i>
            </div>
            <h4 class="achievement-title">${achievement.title}</h4>
            <p class="achievement-description">${achievement.description}</p>
            <div class="achievement-progress">
                <div class="progress-bar">
                    <div class="progress" style="width: ${achievement.progress}%"></div>
                </div>
                <span class="progress-text">${achievement.current}/${achievement.target}</span>
            </div>
        </div>
    `).join('');

    // Add click handlers to cards
    document.querySelectorAll('.achievement-card').forEach(card => {
        card.addEventListener('click', () => showAchievementDetails(card.dataset.id));
    });
}

function setupCategoryFilters() {
    const categoryButtons = document.querySelectorAll('.category-btn');
    categoryButtons.forEach(button => {
        button.addEventListener('click', () => {
            categoryButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            currentCategory = button.dataset.category;
            renderAchievements();
        });
    });
}

function setupModalHandlers() {
    const modal = document.getElementById('achievementModal');
    const closeBtn = modal.querySelector('.close-btn');

    closeBtn.addEventListener('click', () => {
        modal.classList.remove('active');
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
        }
    });
}

async function showAchievementDetails(achievementId) {
    const achievement = achievements.find(a => a.id === achievementId);
    if (!achievement) return;

    const modal = document.getElementById('achievementModal');
    const modalContent = modal.querySelector('.modal-body');

    modalContent.innerHTML = `
        <div class="achievement-icon">
            <i class="${achievement.icon}"></i>
        </div>
        <h4 class="achievement-title">${achievement.title}</h4>
        <p class="achievement-description">${achievement.description}</p>
        <div class="achievement-progress">
            <div class="progress-bar">
                <div class="progress" style="width: ${achievement.progress}%"></div>
            </div>
            <span class="progress-text">${achievement.current}/${achievement.target}</span>
        </div>
        <div class="achievement-rewards">
            <h5>Rewards</h5>
            <ul class="rewards-list">
                ${achievement.rewards.map(reward => `
                    <li>
                        <i class="${reward.icon}"></i>
                        <span>${reward.description}</span>
                    </li>
                `).join('')}
            </ul>
        </div>
    `;

    modal.classList.add('active');
}

// API integration functions
async function fetchAchievements() {
    try {
        const response = await ApiService.get('/achievements');
        return response.data || [];
    } catch (error) {
        console.error('Error fetching achievements:', error);
        // Return sample data for development
        return [
            {
                id: '1',
                title: 'First Steps',
                description: 'Complete your first lesson',
                category: 'learning',
                icon: 'fas fa-star',
                unlocked: true,
                progress: 100,
                current: 1,
                target: 1,
                rewards: [
                    { icon: 'fas fa-gem', description: '50 XP Points' },
                    { icon: 'fas fa-medal', description: 'Beginner Badge' }
                ]
            },
            {
                id: '2',
                title: 'Vocabulary Master',
                description: 'Learn 100 new words',
                category: 'learning',
                icon: 'fas fa-book',
                unlocked: false,
                progress: 45,
                current: 45,
                target: 100,
                rewards: [
                    { icon: 'fas fa-gem', description: '200 XP Points' },
                    { icon: 'fas fa-crown', description: 'Vocabulary Expert Badge' }
                ]
            }
        ];
    }
} 