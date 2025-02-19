class Menu {
    constructor() {
        this.menuContainer = document.querySelector('.menu-container');
        this.setupAuthListener();
    }

    setupAuthListener() {
        auth.onAuthStateChanged((user) => {
            this.updateMenuState(user);
        });
    }

    updateMenuState(user) {
        if (!this.menuContainer) return;

        const authButtons = this.menuContainer.querySelector('.auth-buttons');
        const userProfile = this.menuContainer.querySelector('.user-profile');
        const studentMenu = this.menuContainer.querySelector('.student-menu');
        const teacherMenu = this.menuContainer.querySelector('.teacher-menu');

        if (user) {
            // User is logged in
            if (authButtons) authButtons.style.display = 'none';
            if (userProfile) {
                userProfile.style.display = 'flex';
                const usernameElements = userProfile.querySelectorAll('.username');
                usernameElements.forEach(el => {
                    el.textContent = user.displayName || user.email;
                });
            }

            // Check user claims for role
            user.getIdTokenResult().then((idTokenResult) => {
                const role = idTokenResult.claims.role || 'student';
                
                if (studentMenu) {
                    studentMenu.style.display = role === 'student' ? 'block' : 'none';
                }
                if (teacherMenu) {
                    teacherMenu.style.display = role === 'teacher' ? 'block' : 'none';
                }

                // Update role display
                const roleElement = userProfile?.querySelector('.role');
                if (roleElement) {
                    roleElement.textContent = role.charAt(0).toUpperCase() + role.slice(1);
                }
            });
        } else {
            // User is logged out
            if (authButtons) authButtons.style.display = 'flex';
            if (userProfile) userProfile.style.display = 'none';
            if (studentMenu) studentMenu.style.display = 'none';
            if (teacherMenu) teacherMenu.style.display = 'none';
        }
    }

    async handleLogout() {
        try {
            await auth.signOut();
            window.location.href = '/';
        } catch (error) {
            console.error('Error signing out:', error);
        }
    }
}

// Initialize menu
const menu = new Menu();

// Export for use in other files
export default menu; 