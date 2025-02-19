import stateService from './state-service.js';
import loadingIndicator from '../components/Loading/loading-indicator.js';

class LoadingService {
    constructor() {
        this.loadingStates = new Map();
        this.initialize();
    }

    initialize() {
        // Initialize loading states
        this.setInitialStates();
    }

    setInitialStates() {
        this.loadingStates.set('auth', false);
        this.loadingStates.set('data', false);
        this.loadingStates.set('resources', false);
        this.loadingStates.set('assignments', false);
        this.updateLoadingState();
    }

    startLoading(key, message = '') {
        this.loadingStates.set(key, true);
        this.updateLoadingState(message);
    }

    stopLoading(key) {
        this.loadingStates.set(key, false);
        this.updateLoadingState();
    }

    updateLoadingState(message = '') {
        const isLoading = Array.from(this.loadingStates.values()).some(state => state);
        
        // Update state service
        stateService.setLoading(isLoading);
        
        // Update UI
        if (isLoading) {
            loadingIndicator.show(message);
        } else {
            loadingIndicator.hide();
        }
        
        // Add loading class to body
        document.body.classList.toggle('loading', isLoading);
    }

    // Utility method to wrap async functions with loading state
    async withLoading(key, callback, message = '') {
        this.startLoading(key, message);
        try {
            const result = await callback();
            return result;
        } catch (error) {
            loadingIndicator.showError(error.message);
            throw error;
        } finally {
            this.stopLoading(key);
        }
    }

    // Check if a specific operation is loading
    isLoading(key) {
        return this.loadingStates.get(key) || false;
    }

    // Get all current loading states
    getLoadingStates() {
        return Object.fromEntries(this.loadingStates);
    }

    // Show success message
    showSuccess(message) {
        loadingIndicator.showSuccess(message);
    }

    // Show error message
    showError(message) {
        loadingIndicator.showError(message);
    }

    // Update loading message
    updateMessage(message) {
        loadingIndicator.updateMessage(message);
    }

    // Set loading progress
    setProgress(percent) {
        loadingIndicator.setProgress(percent);
    }
}

// Create singleton instance
const loadingService = new LoadingService();
export default loadingService; 