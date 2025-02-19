class LessonProgress {
    constructor() {
        this.progressTracker = window.progressTracker;
        this.currentLesson = document.title.split(' - ')[0].toLowerCase();
        this.progressBar = document.querySelector('.progress');
        this.vocabItems = document.querySelectorAll('.vocab-item');
        this.activityCards = document.querySelectorAll('.activity-card');
        
        this.setupEventListeners();
        this.loadProgress();
    }

    setupEventListeners() {
        // Add click listeners to vocabulary items for pronunciation
        this.vocabItems.forEach(item => {
            item.addEventListener('click', () => this.handleVocabClick(item));
        });

        // Add click listeners to activity cards
        this.activityCards.forEach(card => {
            card.addEventListener('click', (e) => this.handleActivityClick(e, card));
        });

        // Listen for progress updates
        window.addEventListener('progress-update', () => this.loadProgress());
    }

    async handleVocabClick(item) {
        const spanish = item.querySelector('.spanish').textContent;
        const audio = new Audio(`https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(spanish)}&tl=es&client=tw-ob`);
        
        try {
            await audio.play();
            this.updateProgress('vocabulary', 1);
        } catch (error) {
            console.error('Error playing pronunciation:', error);
            this.showNotification('Could not play pronunciation. Please try again.', 'error');
        }
    }

    handleActivityClick(e, card) {
        e.preventDefault();
        const activityType = card.querySelector('h3').textContent.toLowerCase();
        
        // Simulate activity completion for now
        setTimeout(() => {
            this.updateProgress('activity', 5);
            this.showNotification('Activity completed! +5 XP', 'success');
        }, 1000);
    }

    loadProgress() {
        if (!this.progressTracker) return;

        const lessonProgress = this.progressTracker.getLessonProgress(this.currentLesson);
        const totalProgress = Math.min(100, Math.round((lessonProgress.vocabulary + lessonProgress.activities) / 2));
        
        this.progressBar.style.width = `${totalProgress}%`;
        
        // Update vocab items with completion status
        this.vocabItems.forEach(item => {
            const spanish = item.querySelector('.spanish').textContent;
            if (lessonProgress.completedVocab.includes(spanish)) {
                item.classList.add('completed');
            }
        });

        // Update activity cards with completion status
        this.activityCards.forEach(card => {
            const activity = card.querySelector('h3').textContent;
            if (lessonProgress.completedActivities.includes(activity)) {
                card.classList.add('completed');
            }
        });
    }

    updateProgress(type, xp) {
        if (!this.progressTracker) return;

        switch (type) {
            case 'vocabulary':
                this.progressTracker.updateVocabularyProgress(this.currentLesson, xp);
                break;
            case 'activity':
                this.progressTracker.updateActivityProgress(this.currentLesson, xp);
                break;
        }

        this.loadProgress();
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
            setTimeout(() => {
                notification.classList.remove('show');
                setTimeout(() => notification.remove(), 300);
            }, 2000);
        }, 100);
    }
}

// Initialize lesson progress when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Wait for progress tracker to be available
    const checkProgressTracker = setInterval(() => {
        if (window.progressTracker) {
            clearInterval(checkProgressTracker);
            window.lessonProgress = new LessonProgress();
        }
    }, 100);
}); 