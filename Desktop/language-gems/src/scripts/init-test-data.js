import { testDataService } from '../services/test-data-service.js";
import { authService } from '../services/auth-service.js";
import { LoadingState } from '../components/loading-state.js";
import { Notification } from '../components/notification.js";

const loadingState = new LoadingState('app');
const notification = Notification.getInstance();

document.addEventListener('DOMContentLoaded', async () => {
    const initButton = document.getElementById('init-test-data');
    if (initButton) {
        initButton.addEventListener('click', initializeTestData);
    }
});

async function initializeTestData() {
    try {
        loadingState.show();
        loadingState.setText('Creating test data...');

        // Ensure user is authenticated as a teacher
        await authService.requireTeacherAuth();

        // Create test data
        await testDataService.createTestData();

        notification.success('Test data created successfully');
    } catch (error) {
        console.error('Error initializing test data:', error);
        notification.error(error.message || 'Failed to create test data');
    } finally {
        loadingState.hide();
    }
} 