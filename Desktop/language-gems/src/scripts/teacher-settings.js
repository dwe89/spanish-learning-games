import { DashboardAuth } from './dashboard-auth.js';
import { TeacherApiService } from './teacher-api-service.js';

class TeacherSettingsDashboard {
    constructor() {
        this.auth = new DashboardAuth();
        this.api = new TeacherApiService();
        this.currentSection = 'profile';
    }

    async initialize() {
        try {
            await this.auth.checkAuth();
            this.setupEventListeners();
            await this.loadUserSettings();
            document.body.style.visibility = 'visible';
        } catch (error) {
            this.showError('Failed to initialize settings: ' + error.message);
        }
    }

    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.settings-nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const section = item.getAttribute('href').substring(1);
                this.switchSection(section);
            });
        });

        // Profile form
        document.querySelector('#profile form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveProfile();
        });

        // Change avatar
        document.querySelector('.change-avatar').addEventListener('click', () => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.onchange = (e) => this.handleAvatarChange(e.target.files[0]);
            input.click();
        });

        // Password form
        document.querySelector('#account form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.changePassword();
        });

        // Theme selection
        document.querySelectorAll('input[name="theme"]').forEach(input => {
            input.addEventListener('change', (e) => {
                this.changeTheme(e.target.value);
            });
        });

        // Language selection
        document.getElementById('language').addEventListener('change', (e) => {
            this.changeLanguage(e.target.value);
        });

        // Timezone selection
        document.getElementById('timezone').addEventListener('change', (e) => {
            this.changeTimezone(e.target.value);
        });

        // 2FA toggle
        document.querySelector('.enable-2fa').addEventListener('click', () => {
            this.setup2FA();
        });

        // Delete account
        document.querySelector('.delete-account').addEventListener('click', () => {
            this.confirmDeleteAccount();
        });

        // Integration buttons
        document.querySelectorAll('.connect-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const service = btn.closest('.integration-item').querySelector('h4').textContent;
                this.connectService(service);
            });
        });

        document.querySelectorAll('.disconnect-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const service = btn.closest('.integration-item').querySelector('h4').textContent;
                this.disconnectService(service);
            });
        });

        // API key management
        document.querySelector('.copy-btn').addEventListener('click', () => {
            this.copyApiKey();
        });

        document.querySelector('.regenerate-btn').addEventListener('click', () => {
            this.regenerateApiKey();
        });
    }

    async loadUserSettings() {
        try {
            const settings = await this.api.getUserSettings();
            this.populateSettings(settings);
        } catch (error) {
            this.showError('Failed to load settings: ' + error.message);
        }
    }

    populateSettings(settings) {
        // Profile
        document.getElementById('fullName').value = settings.fullName;
        document.getElementById('email').value = settings.email;
        document.getElementById('phone').value = settings.phone;
        document.getElementById('bio').value = settings.bio;
        
        if (settings.avatar) {
            document.querySelector('.profile-avatar img').src = settings.avatar;
        }

        // Preferences
        document.querySelector(`input[name="theme"][value="${settings.theme}"]`).checked = true;
        document.getElementById('language').value = settings.language;
        document.getElementById('timezone').value = settings.timezone;

        // Notifications
        document.querySelectorAll('.notification-options input').forEach(input => {
            const setting = input.closest('.toggle-option').querySelector('span').textContent.toLowerCase().replace(/\s+/g, '_');
            input.checked = settings.notifications?.[setting] ?? true;
        });

        // Privacy
        document.querySelector(`input[name="visibility"][value="${settings.privacy.visibility}"]`).checked = true;
        document.querySelectorAll('.privacy-options .toggle-option input').forEach(input => {
            const setting = input.closest('.toggle-option').querySelector('span').textContent.toLowerCase().replace(/\s+/g, '_');
            input.checked = settings.privacy?.[setting] ?? true;
        });
    }

    switchSection(section) {
        // Update navigation
        document.querySelectorAll('.settings-nav-item').forEach(item => {
            item.classList.toggle('active', item.getAttribute('href') === `#${section}`);
        });

        // Update content
        document.querySelectorAll('.settings-section').forEach(content => {
            content.classList.toggle('active', content.id === section);
        });

        this.currentSection = section;
    }

    async saveProfile() {
        const profileData = {
            fullName: document.getElementById('fullName').value,
            email: document.getElementById('email').value,
            phone: document.getElementById('phone').value,
            bio: document.getElementById('bio').value
        };

        try {
            await this.api.updateProfile(profileData);
            this.showSuccess('Profile updated successfully');
        } catch (error) {
            this.showError('Failed to update profile: ' + error.message);
        }
    }

    async handleAvatarChange(file) {
        if (!file) return;

        try {
            const formData = new FormData();
            formData.append('avatar', file);
            const avatarUrl = await this.api.uploadAvatar(formData);
            document.querySelector('.profile-avatar img').src = avatarUrl;
            this.showSuccess('Avatar updated successfully');
        } catch (error) {
            this.showError('Failed to update avatar: ' + error.message);
        }
    }

    async changePassword() {
        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        if (newPassword !== confirmPassword) {
            this.showError('New passwords do not match');
            return;
        }

        try {
            await this.api.changePassword(currentPassword, newPassword);
            document.getElementById('account').querySelector('form').reset();
            this.showSuccess('Password changed successfully');
        } catch (error) {
            this.showError('Failed to change password: ' + error.message);
        }
    }

    async changeTheme(theme) {
        try {
            await this.api.updateSettings({ theme });
            document.documentElement.setAttribute('data-theme', theme);
            this.showSuccess('Theme updated successfully');
        } catch (error) {
            this.showError('Failed to update theme: ' + error.message);
        }
    }

    async changeLanguage(language) {
        try {
            await this.api.updateSettings({ language });
            this.showSuccess('Language updated successfully');
            // Reload page to apply new language
            setTimeout(() => window.location.reload(), 1500);
        } catch (error) {
            this.showError('Failed to update language: ' + error.message);
        }
    }

    async changeTimezone(timezone) {
        try {
            await this.api.updateSettings({ timezone });
            this.showSuccess('Timezone updated successfully');
        } catch (error) {
            this.showError('Failed to update timezone: ' + error.message);
        }
    }

    async setup2FA() {
        try {
            const qrCode = await this.api.setup2FA();
            // Implement 2FA setup modal with QR code
            console.log('2FA setup:', qrCode);
        } catch (error) {
            this.showError('Failed to setup 2FA: ' + error.message);
        }
    }

    async confirmDeleteAccount() {
        if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
            try {
                await this.api.deleteAccount();
                this.showSuccess('Account deleted successfully');
                setTimeout(() => {
                    this.auth.logout();
                    window.location.href = '/login.html';
                }, 1500);
            } catch (error) {
                this.showError('Failed to delete account: ' + error.message);
            }
        }
    }

    async connectService(service) {
        try {
            const authUrl = await this.api.getServiceAuthUrl(service);
            window.location.href = authUrl;
        } catch (error) {
            this.showError(`Failed to connect to ${service}: ${error.message}`);
        }
    }

    async disconnectService(service) {
        if (confirm(`Are you sure you want to disconnect ${service}?`)) {
            try {
                await this.api.disconnectService(service);
                this.showSuccess(`${service} disconnected successfully`);
                // Update UI
                const item = document.querySelector(`.integration-item:contains('${service}')`);
                const btn = item.querySelector('.disconnect-btn');
                btn.className = 'connect-btn';
                btn.textContent = 'Connect';
                item.querySelector('p').textContent = 'Not connected';
            } catch (error) {
                this.showError(`Failed to disconnect ${service}: ${error.message}`);
            }
        }
    }

    async copyApiKey() {
        const input = document.querySelector('.api-key input');
        try {
            await navigator.clipboard.writeText(input.value);
            this.showSuccess('API key copied to clipboard');
        } catch (error) {
            this.showError('Failed to copy API key');
        }
    }

    async regenerateApiKey() {
        if (confirm('Are you sure you want to regenerate your API key? All existing integrations will need to be updated.')) {
            try {
                const newKey = await this.api.regenerateApiKey();
                document.querySelector('.api-key input').value = newKey;
                this.showSuccess('API key regenerated successfully');
            } catch (error) {
                this.showError('Failed to regenerate API key: ' + error.message);
            }
        }
    }

    showError(message) {
        const errorDiv = document.querySelector('.error-message');
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
        setTimeout(() => {
            errorDiv.style.display = 'none';
        }, 5000);
    }

    showSuccess(message) {
        const successDiv = document.querySelector('.success-message');
        successDiv.textContent = message;
        successDiv.style.display = 'block';
        setTimeout(() => {
            successDiv.style.display = 'none';
        }, 5000);
    }
}

// Initialize the dashboard when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const dashboard = new TeacherSettingsDashboard();
    dashboard.initialize();
}); 