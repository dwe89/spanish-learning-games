import { auth, db } from '../firebase/config.js";
import { 
    updateProfile, 
    updateEmail, 
    updatePassword, 
    reauthenticateWithCredential,
    EmailAuthProvider,
    deleteUser
} from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js';
import { 
    doc, 
    getDoc, 
    setDoc, 
    updateDoc,
    deleteDoc 
} from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js';
import { 
    getStorage, 
    ref, 
    uploadBytes, 
    getDownloadURL 
} from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-storage.js';

class SettingsManager {
    constructor() {
        this.currentUser = auth.currentUser;
        this.storage = getStorage();
        this.initialize();
    }

    async initialize() {
        this.setupEventListeners();
        await this.loadUserSettings();
        this.setupNavigation();
    }

    setupEventListeners() {
        // Avatar upload
        const avatarUpload = document.getElementById('avatarUpload');
        if (avatarUpload) {
            avatarUpload.addEventListener('change', (e) => this.handleAvatarUpload(e));
        }

        // Forms
        const forms = {
            profile: document.getElementById('profileForm'),
            account: document.getElementById('accountForm'),
            preferences: document.getElementById('preferencesForm'),
            notifications: document.getElementById('notificationsForm'),
            privacy: document.getElementById('privacyForm'),
            language: document.getElementById('languageForm')
        };

        Object.entries(forms).forEach(([key, form]) => {
            if (form) {
                form.addEventListener('submit', (e) => this.handleFormSubmit(e, key));
            }
        });

        // Danger zone buttons
        const deactivateBtn = document.getElementById('deactivateAccount');
        const deleteBtn = document.getElementById('deleteAccount');

        if (deactivateBtn) {
            deactivateBtn.addEventListener('click', () => this.handleAccountDeactivation());
        }
        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => this.handleAccountDeletion());
        }

        // Theme selection
        const themeInputs = document.querySelectorAll('input[name="theme"]');
        themeInputs.forEach(input => {
            input.addEventListener('change', (e) => this.handleThemeChange(e));
        });
    }

    setupNavigation() {
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const section = item.getAttribute('data-section');
                this.showSection(section);
            });
        });

        // Handle direct links with hash
        if (window.location.hash) {
            const section = window.location.hash.substring(1);
            this.showSection(section);
        }
    }

    showSection(sectionId) {
        // Update navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.toggle('active', item.getAttribute('data-section') === sectionId);
        });

        // Update sections
        document.querySelectorAll('.settings-section').forEach(section => {
            section.classList.toggle('active', section.id === sectionId);
        });

        // Update URL hash without scrolling
        history.replaceState(null, null, `#${sectionId}`);
    }

    async loadUserSettings() {
        try {
            const userDoc = await getDoc(doc(db, 'users', this.currentUser.uid));
            const userData = userDoc.data() || {};

            // Update avatar
            const avatarImg = document.getElementById('userAvatar');
            if (avatarImg) {
                avatarImg.src = this.currentUser.photoURL || '../assets/default-avatar.png';
            }

            // Fill profile form
            const profileForm = document.getElementById('profileForm');
            if (profileForm) {
                profileForm.displayName.value = this.currentUser.displayName || '';
                profileForm.bio.value = userData.bio || '';
                profileForm.learningGoal.value = userData.learningGoal || 'beginner';
            }

            // Fill account form
            const accountForm = document.getElementById('accountForm');
            if (accountForm) {
                accountForm.email.value = this.currentUser.email || '';
            }

            // Set preferences
            const preferencesForm = document.getElementById('preferencesForm');
            if (preferencesForm) {
                const theme = localStorage.getItem('theme') || 'system';
                preferencesForm.querySelector(`input[name="theme"][value="${theme}"]`).checked = true;
                
                if (userData.studyReminders) {
                    userData.studyReminders.forEach(reminder => {
                        const input = preferencesForm.querySelector(`input[name="studyReminders"][value="${reminder}"]`);
                        if (input) input.checked = true;
                    });
                }
                
                if (userData.studyGoal) {
                    preferencesForm.studyGoal.value = userData.studyGoal;
                }
            }

            // Set notifications
            const notificationsForm = document.getElementById('notificationsForm');
            if (notificationsForm && userData.notifications) {
                Object.entries(userData.notifications).forEach(([key, value]) => {
                    const input = notificationsForm.querySelector(`input[name="${key}"]`);
                    if (input) input.checked = value;
                });
            }

            // Set privacy settings
            const privacyForm = document.getElementById('privacyForm');
            if (privacyForm && userData.privacy) {
                const { profileVisibility, activitySharing } = userData.privacy;
                
                if (profileVisibility) {
                    privacyForm.querySelector(`input[name="profileVisibility"][value="${profileVisibility}"]`).checked = true;
                }
                
                if (activitySharing) {
                    Object.entries(activitySharing).forEach(([key, value]) => {
                        const input = privacyForm.querySelector(`input[name="activitySharing"][value="${key}"]`);
                        if (input) input.checked = value;
                    });
                }
            }

            // Set language preferences
            const languageForm = document.getElementById('languageForm');
            if (languageForm && userData.language) {
                const { interfaceLanguage, learningLanguage, proficiencyLevel } = userData.language;
                if (interfaceLanguage) languageForm.interfaceLanguage.value = interfaceLanguage;
                if (learningLanguage) languageForm.learningLanguage.value = learningLanguage;
                if (proficiencyLevel) languageForm.proficiencyLevel.value = proficiencyLevel;
            }
        } catch (error) {
            console.error('Error loading user settings:', error);
            this.showError('Failed to load settings');
        }
    }

    async handleAvatarUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        try {
            // Show loading state
            const avatarImg = document.getElementById('userAvatar');
            const originalSrc = avatarImg.src;
            avatarImg.style.opacity = '0.5';

            // Upload file
            const storageRef = ref(this.storage, `avatars/${this.currentUser.uid}`);
            await uploadBytes(storageRef, file);

            // Get download URL
            const downloadURL = await getDownloadURL(storageRef);

            // Update profile
            await updateProfile(this.currentUser, {
                photoURL: downloadURL
            });

            // Update UI
            avatarImg.src = downloadURL;
            avatarImg.style.opacity = '1';
            this.showSuccess('Profile photo updated successfully');
        } catch (error) {
            console.error('Error uploading avatar:', error);
            this.showError('Failed to update profile photo');
            // Restore original avatar
            const avatarImg = document.getElementById('userAvatar');
            avatarImg.style.opacity = '1';
        }
    }

    async handleFormSubmit(event, formType) {
        event.preventDefault();
        const form = event.target;
        const submitBtn = form.querySelector('button[type="submit"]');
        submitBtn.disabled = true;

        try {
            switch (formType) {
                case 'profile':
                    await this.updateProfile(form);
                    break;
                case 'account':
                    await this.updateAccount(form);
                    break;
                case 'preferences':
                    await this.updatePreferences(form);
                    break;
                case 'notifications':
                    await this.updateNotifications(form);
                    break;
                case 'privacy':
                    await this.updatePrivacy(form);
                    break;
                case 'language':
                    await this.updateLanguage(form);
                    break;
            }

            this.showSuccess('Settings updated successfully');
        } catch (error) {
            console.error(`Error updating ${formType} settings:`, error);
            this.showError(error.message);
        } finally {
            submitBtn.disabled = false;
        }
    }

    async updateProfile(form) {
        const updates = {
            displayName: form.displayName.value,
            bio: form.bio.value,
            learningGoal: form.learningGoal.value
        };


        // Update Firestore document
        await updateDoc(doc(db, 'users', this.currentUser.uid), updates);
    }

    async updateAccount(form) {
        const newEmail = form.email.value;
        const currentPassword = form.currentPassword.value;
        const newPassword = form.newPassword.value;
        const confirmPassword = form.confirmPassword.value;

        // Verify current password
        if (currentPassword) {
            const credential = EmailAuthProvider.credential(
                this.currentUser.email,
                currentPassword
            );
            await reauthenticateWithCredential(this.currentUser, credential);
        }

        // Update email if changed
        if (newEmail !== this.currentUser.email) {
            await updateEmail(this.currentUser, newEmail);
        }

        // Update password if provided
        if (newPassword) {
            if (newPassword !== confirmPassword) {
                throw new Error('New passwords do not match');
            }
            await updatePassword(this.currentUser, newPassword);
        }
    }

    async updatePreferences(form) {
        const preferences = {
            theme: form.querySelector('input[name="theme"]:checked').value,
            studyReminders: Array.from(form.querySelectorAll('input[name="studyReminders"]:checked'))
                .map(input => input.value),
            studyGoal: form.studyGoal.value
        };

        // Update theme
        document.documentElement.setAttribute('data-theme', preferences.theme);
        localStorage.setItem('theme', preferences.theme);

        // Update Firestore
        await updateDoc(doc(db, 'users', this.currentUser.uid), { preferences });
    }

    async updateNotifications(form) {
        const notifications = {
            emailNotifications: this.getCheckboxValues(form, 'emailNotifications'),
            pushNotifications: this.getCheckboxValues(form, 'pushNotifications')
        };

        await updateDoc(doc(db, 'users', this.currentUser.uid), { notifications });
    }

    async updatePrivacy(form) {
        const privacy = {
            profileVisibility: form.querySelector('input[name="profileVisibility"]:checked').value,
            activitySharing: this.getCheckboxValues(form, 'activitySharing')
        };

        await updateDoc(doc(db, 'users', this.currentUser.uid), { privacy });
    }

    async updateLanguage(form) {
        const language = {
            interfaceLanguage: form.interfaceLanguage.value,
            learningLanguage: form.learningLanguage.value,
            proficiencyLevel: form.proficiencyLevel.value
        };

        await updateDoc(doc(db, 'users', this.currentUser.uid), { language });
    }

    getCheckboxValues(form, name) {
        const result = {};
        form.querySelectorAll(`input[name="${name}"]`).forEach(input => {
            result[input.value] = input.checked;
        });
        return result;
    }

    async handleAccountDeactivation() {
        if (await this.showConfirmation('Are you sure you want to deactivate your account? You can reactivate it later by signing in again.')) {
            try {
                await updateDoc(doc(db, 'users', this.currentUser.uid), {
                    status: 'inactive',
                    deactivatedAt: new Date().toISOString()
                });
                await auth.signOut();
                window.location.href = '/';
            } catch (error) {
                console.error('Error deactivating account:', error);
                this.showError('Failed to deactivate account');
            }
        }
    }

    async handleAccountDeletion() {
        if (await this.showConfirmation('Are you sure you want to permanently delete your account? This action cannot be undone.')) {
            try {
                // Delete Firestore document
                await deleteDoc(doc(db, 'users', this.currentUser.uid));
                
                // Delete user
                await deleteUser(this.currentUser);
                
                window.location.href = '/';
            } catch (error) {
                console.error('Error deleting account:', error);
                this.showError('Failed to delete account');
            }
        }
    }

    handleThemeChange(event) {
        const theme = event.target.value;
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }

    showSuccess(message) {
        const successDiv = document.querySelector('.success-message');
        if (successDiv) {
            successDiv.textContent = message;
            successDiv.style.display = 'block';
            setTimeout(() => {
                successDiv.style.display = 'none';
            }, 3000);
        }
    }

    showError(message) {
        const errorDiv = document.querySelector('.error-message');
        if (errorDiv) {
            errorDiv.textContent = message;
            errorDiv.style.display = 'block';
            setTimeout(() => {
                errorDiv.style.display = 'none';
            }, 5000);
        }
    }

    async showConfirmation(message) {
        return new Promise((resolve) => {
            const modal = document.getElementById('confirmationModal');
            const messageEl = document.getElementById('confirmationMessage');
            const confirmBtn = document.getElementById('confirmAction');
            const cancelBtn = document.getElementById('cancelAction');

            messageEl.textContent = message;
            modal.classList.add('active');

            const handleConfirm = () => {
                modal.classList.remove('active');
                cleanup();
                resolve(true);
            };

            const handleCancel = () => {
                modal.classList.remove('active');
                cleanup();
                resolve(false);
            };

            const cleanup = () => {
                confirmBtn.removeEventListener('click', handleConfirm);
                cancelBtn.removeEventListener('click', handleCancel);
            };

            confirmBtn.addEventListener('click', handleConfirm);
            cancelBtn.addEventListener('click', handleCancel);
        });
    }
}

// Initialize settings when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new SettingsManager();
});
