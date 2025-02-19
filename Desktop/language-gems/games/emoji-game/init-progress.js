import { ProgressTracker } from './progress-tracker.js';

// Initialize progress tracking
async function initializeProgressTracking() {
    try {
        const tracker = new ProgressTracker();
        await tracker.init();
        console.log('Progress tracking initialized successfully');
        return tracker;
    } catch (error) {
        console.error('Failed to initialize progress tracking:', error);
        throw error;
    }
}

// Initialize when the page loads and export the tracker
let progressTracker = null;
document.addEventListener('DOMContentLoaded', async () => {
    try {
        progressTracker = await initializeProgressTracking();
    } catch (error) {
        console.error('Progress tracking initialization failed:', error);
    }
});

export { progressTracker };
