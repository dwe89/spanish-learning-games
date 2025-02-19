// Newsletter subscription functionality
class NewsletterSubscription {
    constructor() {
        this.form = document.getElementById('newsletter-form');
        this.emailInput = document.getElementById('newsletter-email');
        this.submitButton = document.getElementById('newsletter-submit');
        this.messageContainer = document.getElementById('newsletter-message');
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
        this.emailInput.addEventListener('input', () => this.validateEmail());
    }

    validateEmail() {
        const email = this.emailInput.value.trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const isValid = emailRegex.test(email);

        if (email === '') {
            this.setInputState('neutral');
            return false;
        }

        if (isValid) {
            this.setInputState('valid');
            return true;
        } else {
            this.setInputState('invalid');
            return false;
        }
    }

    setInputState(state) {
        this.emailInput.classList.remove('valid', 'invalid');
        
        switch (state) {
            case 'valid':
                this.emailInput.classList.add('valid');
                this.submitButton.disabled = false;
                break;
            case 'invalid':
                this.emailInput.classList.add('invalid');
                this.submitButton.disabled = true;
                break;
            case 'neutral':
                this.submitButton.disabled = true;
                break;
        }
    }

    async handleSubmit(e) {
        e.preventDefault();

        if (!this.validateEmail()) {
            this.showMessage('Please enter a valid email address.', 'error');
            return;
        }

        const email = this.emailInput.value.trim();
        
        try {
            this.setLoading(true);
            await this.subscribeToNewsletter(email);
            this.showMessage('Successfully subscribed to the newsletter!', 'success');
            this.form.reset();
        } catch (error) {
            this.showMessage(error.message || 'An error occurred. Please try again later.', 'error');
        } finally {
            this.setLoading(false);
        }
    }

    async subscribeToNewsletter(email) {
        // This would be replaced with actual API call
        // Simulating API call with a delay
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                // Simulate success/failure randomly
                if (Math.random() > 0.1) {
                    resolve();
                } else {
                    reject(new Error('Failed to subscribe. Please try again.'));
                }
            }, 1000);
        });
    }

    setLoading(isLoading) {
        if (isLoading) {
            this.submitButton.disabled = true;
            this.submitButton.classList.add('loading');
            this.submitButton.innerHTML = '<span class="spinner"></span> Subscribing...';
        } else {
            this.submitButton.disabled = false;
            this.submitButton.classList.remove('loading');
            this.submitButton.textContent = 'Subscribe';
        }
    }

    showMessage(message, type) {
        this.messageContainer.textContent = message;
        this.messageContainer.className = `newsletter-message ${type}`;
        
        // Auto-hide success messages after 5 seconds
        if (type === 'success') {
            setTimeout(() => {
                this.messageContainer.textContent = '';
                this.messageContainer.className = 'newsletter-message';
            }, 5000);
        }
    }
}

// Initialize newsletter subscription when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new NewsletterSubscription();
}); 