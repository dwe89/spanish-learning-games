class SaveForLaterService {
    constructor() {
        this.storageKey = 'savedItems';
        this.savedItems = this.loadSavedItems();
        this.initializeSaveButtons();
    }

    loadSavedItems() {
        const items = localStorage.getItem(this.storageKey);
        return items ? JSON.parse(items) : [];
    }

    saveSavedItems() {
        localStorage.setItem(this.storageKey, JSON.stringify(this.savedItems));
        this.updateSaveButtons();
        this.dispatchUpdateEvent();
    }

    initializeSaveButtons() {
        // Add save buttons to all saveable content
        document.querySelectorAll('.lesson-content, .activity-content, .resource-content').forEach(content => {
            if (!content.querySelector('.save-later-btn')) {
                const saveButton = this.createSaveButton();
                content.insertBefore(saveButton, content.firstChild);
                this.updateButtonState(saveButton, content);
            }
        });
    }

    createSaveButton() {
        const button = document.createElement('button');
        button.className = 'save-later-btn';
        button.innerHTML = `
            <span class="icon">🔖</span>
            <span class="text">Save for Later</span>
        `;
        
        button.addEventListener('click', (e) => this.handleSaveClick(e));
        return button;
    }

    handleSaveClick(event) {
        const button = event.currentTarget;
        const content = button.closest('.lesson-content, .activity-content, .resource-content');
        
        if (!content) return;
        
        const item = this.createSaveItem(content);
        const index = this.findSavedItemIndex(item);
        
        if (index === -1) {
            // Save item
            this.savedItems.push(item);
            this.showNotification('Item saved for later');
        } else {
            // Remove item
            this.savedItems.splice(index, 1);
            this.showNotification('Item removed from saved items');
        }
        
        this.saveSavedItems();
        this.updateButtonState(button, content);
    }

    createSaveItem(content) {
        const title = content.querySelector('h1, h2, h3')?.textContent || 'Untitled';
        const description = content.querySelector('p')?.textContent || '';
        const path = window.location.pathname;
        
        return {
            id: this.generateId(path, title),
            title,
            description,
            path,
            timestamp: new Date().toISOString(),
            type: this.getContentType(content)
        };
    }

    generateId(path, title) {
        return `${path}-${title}`.replace(/[^a-zA-Z0-9]/g, '-');
    }

    getContentType(content) {
        if (content.classList.contains('lesson-content')) return 'lesson';
        if (content.classList.contains('activity-content')) return 'activity';
        if (content.classList.contains('resource-content')) return 'resource';
        return 'other';
    }

    findSavedItemIndex(item) {
        return this.savedItems.findIndex(saved => saved.id === item.id);
    }

    updateSaveButtons() {
        document.querySelectorAll('.save-later-btn').forEach(button => {
            const content = button.closest('.lesson-content, .activity-content, .resource-content');
            if (content) {
                this.updateButtonState(button, content);
            }
        });
    }

    updateButtonState(button, content) {
        const item = this.createSaveItem(content);
        const isSaved = this.findSavedItemIndex(item) !== -1;
        
        button.classList.toggle('saved', isSaved);
        button.querySelector('.text').textContent = isSaved ? 'Saved' : 'Save for Later';
        button.querySelector('.icon').textContent = isSaved ? '📑' : '🔖';
    }

    showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'save-notification';
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Trigger animation
        setTimeout(() => notification.classList.add('show'), 10);
        
        // Remove after animation
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 2000);
    }

    dispatchUpdateEvent() {
        window.dispatchEvent(new CustomEvent('saved-items-updated', {
            detail: { items: this.savedItems }
        }));
    }

    getSavedItems() {
        return [...this.savedItems];
    }
}

// Initialize service when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.saveForLater = new SaveForLaterService();
}); 