class ErrorBoundary {
    static init() {
        window.onerror = (msg, url, lineNo, columnNo, error) => {
            this.handleError(error);
            return false;
        };

        window.addEventListener('unhandledrejection', (event) => {
            this.handleError(event.reason);
        });
    }

    static handleError(error) {
        console.error('Application error:', error);
        this.showErrorNotification();
    }

    static showErrorNotification() {
        const notification = document.createElement('div');
        notification.className = 'notification error';
        notification.textContent = 'An error occurred. Please try again.';
        document.body.appendChild(notification);
        
        setTimeout(() => notification.remove(), 5000);
    }
}

ErrorBoundary.init(); 