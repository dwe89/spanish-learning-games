// Create a new file to handle dashboard authentication
class DashboardAuth {
    static checkAuth() {
        const token = localStorage.getItem('token');
        const role = localStorage.getItem('userRole');
        const username = localStorage.getItem('userName');
        const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';

        // Debug auth state
        console.group('Auth State Check');
        console.log('Token:', token ? 'present' : 'missing');
        console.log('Role:', role || 'No role');
        console.log('Username:', username || 'No username');
        console.log('Is Authenticated:', isAuthenticated);
        console.groupEnd();

        if (!token || !isAuthenticated || !role || !username) {
            console.log('Authentication check failed, redirecting to login');
            window.location.href = '/index.html';
            return false;
        }

        // Verify user is on correct dashboard
        const currentPath = window.location.pathname;
        const expectedPath = `/${role}-dashboard`;
        
        console.log('Path check:', { currentPath, expectedPath, role });
        
        if (!currentPath.includes(expectedPath)) {
            console.log(`User on wrong dashboard (${currentPath}), redirecting to ${expectedPath}`);
            window.location.href = `${expectedPath}/index.html`;
            return false;
        }

        // Additional check for teacher dashboard
        if (currentPath.includes('/teacher-dashboard/') && role !== 'teacher') {
            console.log('Non-teacher attempting to access teacher dashboard');
            window.location.href = `/${role}-dashboard/index.html`;
            return false;
        }

        return true;
    }

    static updateUI() {
        const username = localStorage.getItem('userName');
        const role = localStorage.getItem('userRole');
        
        // Update username if element exists
        const studentNameElement = document.querySelector('.student-name');
        if (studentNameElement && username) {
            studentNameElement.textContent = username;
        }
        
        // Update role display if element exists
        const roleElement = document.querySelector('.role');
        if (roleElement && role) {
            roleElement.textContent = role.charAt(0).toUpperCase() + role.slice(1);
        }
    }
} 