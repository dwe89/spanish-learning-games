class UIUtils {
    constructor() {
        this.loadingElements = new Map();
        this.errorElements = new Map();
        this.modalStack = [];
    }

    // Loading state management
    showLoading(elementId, message = 'Loading...') {
        const element = document.getElementById(elementId);
        if (!element) return;

        const loadingEl = document.createElement('div');
        loadingEl.className = 'loading-spinner';
        loadingEl.innerHTML = `
            <div class="spinner"></div>
            <p class="loading-message">${message}</p>
        `;

        element.appendChild(loadingEl);
        this.loadingElements.set(elementId, loadingEl);

        // Add loading state class to parent
        element.classList.add('loading-state');
    }

    hideLoading(elementId) {
        const element = document.getElementById(elementId);
        const loadingEl = this.loadingElements.get(elementId);
        
        if (element && loadingEl) {
            element.removeChild(loadingEl);
            element.classList.remove('loading-state');
            this.loadingElements.delete(elementId);
        }
    }

    // Error handling
    showError(elementId, error, duration = 5000) {
        const element = document.getElementById(elementId);
        if (!element) return;

        // Remove existing error if present
        this.hideError(elementId);

        const errorEl = document.createElement('div');
        errorEl.className = 'error-message';
        errorEl.textContent = error instanceof Error ? error.message : error;

        element.appendChild(errorEl);
        this.errorElements.set(elementId, errorEl);

        if (duration > 0) {
            setTimeout(() => this.hideError(elementId), duration);
        }

        return errorEl;
    }

    hideError(elementId) {
        const element = document.getElementById(elementId);
        const errorEl = this.errorElements.get(elementId);
        
        if (element && errorEl) {
            element.removeChild(errorEl);
            this.errorElements.delete(elementId);
        }
    }

    // Modal management
    showModal(content, options = {}) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-overlay"></div>
            <div class="modal-container">
                <div class="modal-header">
                    ${options.title ? `<h2>${options.title}</h2>` : ''}
                    ${options.closable !== false ? '<button class="modal-close">&times;</button>' : ''}
                </div>
                <div class="modal-content">${content}</div>
                ${options.footer ? `<div class="modal-footer">${options.footer}</div>` : ''}
            </div>
        `;

        document.body.appendChild(modal);
        this.modalStack.push(modal);

        // Event listeners
        const closeBtn = modal.querySelector('.modal-close');
        const overlay = modal.querySelector('.modal-overlay');

        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closeModal(modal));
        }

        if (overlay && options.closeOnOverlay !== false) {
            overlay.addEventListener('click', () => this.closeModal(modal));
        }

        // Prevent body scroll
        document.body.style.overflow = 'hidden';

        return modal;
    }

    closeModal(modal = null) {
        if (!modal) {
            modal = this.modalStack[this.modalStack.length - 1];
        }

        if (modal) {
            document.body.removeChild(modal);
            this.modalStack = this.modalStack.filter(m => m !== modal);

            // Restore body scroll if no more modals
            if (this.modalStack.length === 0) {
                document.body.style.overflow = '';
            }
        }
    }

    closeAllModals() {
        while (this.modalStack.length > 0) {
            this.closeModal();
        }
    }

    // Form handling
    serializeForm(form) {
        const formData = new FormData(form);
        const data = {};
        
        for (const [key, value] of formData.entries()) {
            if (data[key] !== undefined) {
                if (!Array.isArray(data[key])) {
                    data[key] = [data[key]];
                }
                data[key].push(value);
            } else {
                data[key] = value;
            }
        }

        return data;
    }

    // Element creation helpers
    createElement(tag, attributes = {}, children = []) {
        const element = document.createElement(tag);
        
        Object.entries(attributes).forEach(([key, value]) => {
            if (key === 'className') {
                element.className = value;
            } else if (key === 'dataset') {
                Object.entries(value).forEach(([dataKey, dataValue]) => {
                    element.dataset[dataKey] = dataValue;
                });
            } else {
                element.setAttribute(key, value);
            }
        });

        children.forEach(child => {
            if (typeof child === 'string') {
                element.appendChild(document.createTextNode(child));
            } else {
                element.appendChild(child);
            }
        });

        return element;
    }

    // Event delegation helper
    delegateEvent(parentElement, eventType, selector, handler) {
        parentElement.addEventListener(eventType, (event) => {
            const targetElement = event.target.closest(selector);
            
            if (targetElement && parentElement.contains(targetElement)) {
                handler(event, targetElement);
            }
        });
    }

    // Debounce helper
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Throttle helper
    throttle(func, limit) {
        let inThrottle;
        return function executedFunction(...args) {
            if (!inThrottle) {
                func(...args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
}

// Create singleton instance
const uiUtils = new UIUtils();
export default uiUtils; 