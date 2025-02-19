
async function checkTeacherRole(uid) {
    try {
        const userDoc = await db.collection('users').doc(uid).get();
        return userDoc.exists && userDoc.data().role === 'teacher';
    } catch (error) {
        console.error('Error checking teacher role:', error);
        return false;
    }
}

export class DashboardAuth {
    constructor() {
        this.token = localStorage.getItem('token');
        this.role = localStorage.getItem('role');
        this.username = localStorage.getItem('username');
    }

    async checkAuth() {
        console.log('Auth State Check');
        console.log('Token:', this.token ? 'present' : 'not present');
        console.log('Role:', this.role);
        console.log('Username:', this.username);
        console.log('Is Authenticated:', this.isAuthenticated());

        if (!this.isAuthenticated()) {
            window.location.href = '/index.html';
            return false;
        }

        // Verify teacher role if on teacher dashboard
        if (window.location.pathname.includes('/teacher-dashboard')) {
            const user = auth.currentUser;
            if (!user || !(await checkTeacherRole(user.uid))) {
                window.location.href = '/index.html';
                return false;
            }
        }

        // Check if user is on the correct dashboard
        const currentPath = window.location.pathname;
        const expectedPath = this.role === 'teacher' ? '/teacher-dashboard' : '/student-dashboard';
        
        console.log('Path check:', { currentPath, expectedPath, role: this.role });

        if (!currentPath.includes(expectedPath)) {
            window.location.href = `${expectedPath}/index.html`;
            return false;
        }

        return true;
    }

    updateUI() {
        const userInfo = {
            hasToken: Boolean(this.token),
            username: this.username,
            role: this.role,
            isAuthenticated: this.isAuthenticated()
        };
        
        // Dispatch event for menu to update
        const event = new CustomEvent('updateMenuUI', { detail: userInfo });
        document.dispatchEvent(event);
    }

    isAuthenticated() {
        return Boolean(this.token && this.role && this.username);
    }

    logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        localStorage.removeItem('username');
        window.location.href = '/index.html';
    }
}