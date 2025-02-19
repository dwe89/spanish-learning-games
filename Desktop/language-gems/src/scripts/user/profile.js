// User profile data management
class UserProfile {
    constructor() {
        this.userData = null;
        this.achievements = [];
        this.activity = [];
        this.gameStats = {};
        this.db = getFirestore();
        this.setupAuthListener();
        this.init();
    }

    async init() {
        await this.loadUserData();
        this.setupEventListeners();
        this.updateUI();
    }

    async loadUserData() {
        // In a real app, this would be an API call
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = '/index.html';
            return;
        }

        try {
            // Simulated user data
            this.userData = {
                id: '123',
                username: 'Language Learner',
                email: 'learner@example.com',
                avatar: 'assets/default-avatar.png',
                totalPoints: 1250,
                gamesPlayed: 45,
                achievements: 12,
                progress: {
                    spanish: 65,
                    french: 35
                }
            };

            // Simulated achievements
            this.achievements = [
                { id: 1, icon: '🌟', title: 'First Steps', description: 'Started learning journey' },
                { id: 2, icon: '🎯', title: 'Perfect Score', description: 'Got 100% in a game' },
                { id: 3, icon: '🔥', title: '5 Day Streak', description: 'Practiced for 5 days' }
            ];

            // Simulated activity
            this.activity = [
                { type: 'game', icon: '🎮', description: 'Completed Word Match game', points: 50, time: '2 hours ago' },
                { type: 'achievement', icon: '🏆', description: 'Earned Perfect Score badge', points: 100, time: 'Yesterday' },
                { type: 'progress', icon: '📈', description: 'Reached 65% in Spanish', points: 75, time: '2 days ago' }
            ];

            // Simulated game stats
            this.gameStats = {
                wordMatch: {
                    bestScore: 950,
                    gamesPlayed: 25,
                    accuracy: 85
                },
                emojiMatch: {
                    bestScore: 850,
                    gamesPlayed: 20,
                    accuracy: 80
                }
            };

        } catch (error) {
            console.error('Error loading user data:', error);
        }
    }

    setupEventListeners() {
        // Avatar change
        const changeAvatarBtn = document.getElementById('changeAvatarBtn');
        if (changeAvatarBtn) {
            changeAvatarBtn.addEventListener('click', () => this.handleAvatarChange());
        }

        // Settings form
        const settingsForm = document.getElementById('profileSettingsForm');
        if (settingsForm) {
            settingsForm.addEventListener('submit', (e) => this.handleSettingsSave(e));
        }
    }

    updateUI() {
        // Update user info
        document.getElementById('userName').textContent = this.userData.username;
        document.getElementById('userEmail').textContent = this.userData.email;
        document.getElementById('userAvatar').src = this.userData.avatar;

        // Update stats
        document.getElementById('totalPoints').textContent = this.userData.totalPoints;
        document.getElementById('gamesPlayed').textContent = this.userData.gamesPlayed;
        document.getElementById('achievements').textContent = this.userData.achievements;

        // Update progress bars
        document.getElementById('spanishProgress').style.width = `${this.userData.progress.spanish}%`;
        document.getElementById('spanishProgress').textContent = `${this.userData.progress.spanish}%`;
        document.getElementById('frenchProgress').style.width = `${this.userData.progress.french}%`;
        document.getElementById('frenchProgress').textContent = `${this.userData.progress.french}%`;

        // Update achievements
        this.updateAchievements();

        // Update activity feed
        this.updateActivityFeed();

        // Update game stats
        this.updateGameStats();
    }

    updateAchievements() {
        const achievementsList = document.getElementById('achievementsList');
        if (!achievementsList) return;

        achievementsList.innerHTML = this.achievements.map(achievement => `
            <div class="achievement-card">
                <div class="achievement-icon">${achievement.icon}</div>
                <h3>${achievement.title}</h3>
                <p>${achievement.description}</p>
            </div>
        `).join('');
    }

    updateActivityFeed() {
        const activityFeed = document.getElementById('activityFeed');
        if (!activityFeed) return;

        activityFeed.innerHTML = this.activity.map(activity => `
            <div class="activity-item">
                <div class="activity-icon">${activity.icon}</div>
                <div class="activity-details">
                    <div class="activity-description">${activity.description}</div>
                    <div class="activity-time">${activity.time}</div>
                </div>
                <div class="activity-points">+${activity.points} XP</div>
            </div>
        `).join('');
    }

    updateGameStats() {
        // Word Match stats
        document.getElementById('wordMatchBest').textContent = this.gameStats.wordMatch.bestScore;
        document.getElementById('wordMatchPlayed').textContent = this.gameStats.wordMatch.gamesPlayed;
        document.getElementById('wordMatchAccuracy').textContent = `${this.gameStats.wordMatch.accuracy}%`;

        // Emoji Match stats
        document.getElementById('emojiMatchBest').textContent = this.gameStats.emojiMatch.bestScore;
        document.getElementById('emojiMatchPlayed').textContent = this.gameStats.emojiMatch.gamesPlayed;
        document.getElementById('emojiMatchAccuracy').textContent = `${this.gameStats.emojiMatch.accuracy}%`;
    }

    async handleAvatarChange() {
        // In a real app, this would open a file picker and upload the image
        alert('Avatar change functionality will be implemented soon!');
    }

    async handleSettingsSave(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const settings = {
            displayName: formData.get('displayName'),
            language: formData.get('language'),
            notifications: formData.getAll('notifications')
        };

        try {
            // In a real app, this would be an API call
            console.log('Saving settings:', settings);
            alert('Settings saved successfully!');
        } catch (error) {
            console.error('Error saving settings:', error);
            alert('Error saving settings. Please try again.');
        }
    }

    setupAuthListener() {
        auth.onAuthStateChanged((user) => {
            if (user) {
                this.loadUserProfile();
            } else {
                this.handleUnauthenticated();
            }
        });
    }

    async loadUserProfile() {
        if (!auth.currentUser) {
            throw new Error('No authenticated user');
        }

        try {
            // Get additional user data from Firestore
            const userRef = doc(this.db, 'users', auth.currentUser.uid);
            const userDoc = await getDoc(userRef);
            const userData = userDoc.data() || {};

            // Update profile display
            this.updateProfileDisplay({
                ...userData,
                email: auth.currentUser.email,
                displayName: auth.currentUser.displayName
            });
        } catch (error) {
            console.error('Error loading user profile:', error);
            this.showError('Error loading profile');
        }
    }

    async updateProfile(profileData) {
        if (!auth.currentUser) {
            throw new Error('No authenticated user');
        
    

            // Update additional data in Firestore
            const userRef = doc(this.db, 'users', auth.currentUser.uid);
            await updateDoc(userRef, {
                ...profileData,
                updatedAt: new Date()
            });

            this.showSuccess('Profile updated successfully');
            await this.loadUserProfile(); // Reload profile
        } catch (error) {
            console.error('Error updating profile:', error);
            this.showError('Error updating profile');
        }
    }

    async updateEmail(newEmail) {
        if (!auth.currentUser) {
            throw new Error('No authenticated user');
        }

        try {
            await updateEmail(auth.currentUser, newEmail);
            this.showSuccess('Email updated successfully');
            await this.loadUserProfile(); // Reload profile
        } catch (error) {
            console.error('Error updating email:', error);
            this.showError(this.getErrorMessage(error));
        }
    }

    async updatePassword(currentPassword, newPassword) {
        if (!auth.currentUser) {
            throw new Error('No authenticated user');
        }

        try {
            // Re-authenticate if needed
            // Update password
            await updatePassword(auth.currentUser, newPassword);
            this.showSuccess('Password updated successfully');
        } catch (error) {
            console.error('Error updating password:', error);
            this.showError(this.getErrorMessage(error));
        }
    }

    updateProfileDisplay(userData) {
        // Update profile form
        const profileForm = document.getElementById('profile-form');
        if (profileForm) {
            profileForm.elements.displayName.value = userData.displayName || '';
            profileForm.elements.email.value = userData.email || '';
            // Update other profile fields as needed
        }

        // Update profile header
        const profileName = document.querySelector('.profile-name');
        if (profileName) {
            profileName.textContent = userData.displayName || userData.email;
        }
    }

    handleUnauthenticated() {
        // Redirect to login page
        window.location.href = '/index.html';
    }

    showError(message) {
        const errorElement = document.querySelector('.error-message');
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
        }
    }

    showSuccess(message) {
        const successElement = document.querySelector('.success-message');
        if (successElement) {
            successElement.textContent = message;
            successElement.style.display = 'block';
            setTimeout(() => {
                successElement.style.display = 'none';
            }, 3000);
        }
    }

    getErrorMessage(error) {
        const errorMessages = {
            'auth/requires-recent-login': 'Please log in again to update your profile',
            'auth/email-already-in-use': 'Email is already in use',
            'auth/invalid-email': 'Invalid email address',
            'auth/weak-password': 'Password should be at least 6 characters'
        };
        return errorMessages[error.code] || error.message;
    }
}

// Initialize profile when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new UserProfile();
});