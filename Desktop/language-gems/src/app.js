class SpanishLearningApp {
    constructor() {
        this.initializeErrorHandling();
        this.auth = new AuthSystem();
        this.vocabulary = new VocabularySystem();
        this.rewards = new RewardSystem(this.auth.currentUser);
        this.progress = new ProgressTracker();
        
        this.initializeUI();
        this.attachEventListeners();
    }

    initializeErrorHandling() {
        window.addEventListener('error', (event) => {
            console.error('Application error:', event.error);
            // Implement user-friendly error notification
        });
    }

    initializeUI() {
        // Update gem count
        const gemCount = document.getElementById('gemCount');
        if (gemCount) {
            gemCount.textContent = this.rewards.gems;
        }

        // Initialize review cards if on vocabulary section
        this.initializeReviewCards();

        // Update progress bars and stats
        this.progress.updateUI();
    }

    attachEventListeners() {
        // Auth buttons
        document.getElementById('loginBtn')?.addEventListener('click', () => this.showModal('loginModal'));
        document.getElementById('signupBtn')?.addEventListener('click', () => this.showModal('signupModal'));

        // Form submissions
        document.getElementById('loginForm')?.addEventListener('submit', (e) => this.handleLogin(e));
        document.getElementById('signupForm')?.addEventListener('submit', (e) => this.handleSignup(e));

        // Review button
        document.getElementById('startReviewBtn')?.addEventListener('click', () => this.startReview());
    }

    async handleLogin(e) {
        e.preventDefault();
        const username = document.getElementById('loginUsername').value;
        const password = document.getElementById('loginPassword').value;
        const success = await this.auth.login(username, password);
        if (success) {
            this.hideModal('loginModal');
            this.refreshUserData();
        }
    }

    async handleSignup(e) {
        e.preventDefault();
        // Implementation here
    }

    initializeReviewCards() {
        const reviewCards = document.getElementById('reviewCards');
        if (!reviewCards) return;

        const wordsForReview = this.vocabulary.getWordsForReview();
        reviewCards.innerHTML = wordsForReview.map(word => `
            <div class="review-card" data-word-id="${word.id}">
                <!-- Card content -->
            </div>
        `).join('');
    }

    showModal(modalId) {
        document.getElementById(modalId)?.classList.add('show');
    }

    hideModal(modalId) {
        document.getElementById(modalId)?.classList.remove('show');
    }

    refreshUserData() {
        // Refresh all user-dependent data
        this.rewards = new RewardSystem(this.auth.currentUser);
        this.progress.updateUI();
        this.initializeReviewCards();
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new SpanishLearningApp();
});
