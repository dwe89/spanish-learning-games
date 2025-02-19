class StateService {
    constructor() {
        this.state = {
            classes: [],
            lessons: [],
            assignments: [],
            achievements: [],
            settings: {},
            loading: {},
            errors: {},
            cache: new Map()
        };
        this.listeners = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    }

    // State management methods
    setState(key, value, notify = true) {
        this.state[key] = value;
        if (notify) {
            this.notifyListeners(key);
        }
    }

    getState(key) {
        return this.state[key];
    }

    // Loading state management
    setLoading(key, isLoading) {
        this.state.loading[key] = isLoading;
        this.notifyListeners('loading');
    }

    isLoading(key) {
        return this.state.loading[key] || false;
    }

    // Error state management
    setError(key, error) {
        this.state.errors[key] = error;
        this.notifyListeners('errors');
    }

    clearError(key) {
        delete this.state.errors[key];
        this.notifyListeners('errors');
    }

    // Cache management
    setCacheItem(key, value, timeout = this.cacheTimeout) {
        this.state.cache.set(key, {
            value,
            timestamp: Date.now(),
            timeout
        });
    }

    getCacheItem(key) {
        const item = this.state.cache.get(key);
        if (!item) return null;

        if (Date.now() - item.timestamp > item.timeout) {
            this.state.cache.delete(key);
            return null;
        }

        return item.value;
    }

    clearCache() {
        this.state.cache.clear();
    }

    // Subscription management
    subscribe(key, listener) {
        if (!this.listeners.has(key)) {
            this.listeners.set(key, new Set());
        }
        this.listeners.get(key).add(listener);
        
        // Return unsubscribe function
        return () => {
            const keyListeners = this.listeners.get(key);
            if (keyListeners) {
                keyListeners.delete(listener);
                if (keyListeners.size === 0) {
                    this.listeners.delete(key);
                }
            }
        };
    }

    notifyListeners(key) {
        const keyListeners = this.listeners.get(key);
        if (keyListeners) {
            keyListeners.forEach(listener => listener(this.state[key]));
        }
    }

    // Batch updates
    batchUpdate(updates) {
        const notifyKeys = new Set();
        
        updates.forEach(({ key, value }) => {
            this.setState(key, value, false);
            notifyKeys.add(key);
        });

        notifyKeys.forEach(key => this.notifyListeners(key));
    }

    // Reset state
    resetState() {
        this.state = {
            classes: [],
            lessons: [],
            assignments: [],
            achievements: [],
            settings: {},
            loading: {},
            errors: {},
            cache: new Map()
        };
        this.listeners.forEach((listeners, key) => {
            this.notifyListeners(key);
        });
    }
}

// Create a singleton instance
const stateService = new StateService();
export default stateService; 