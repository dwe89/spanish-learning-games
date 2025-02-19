// Community Forum functionality
class CommunityForum {
    constructor() {
        this.currentCategory = 'all';
        this.currentSort = 'recent';
        this.currentPage = 1;
        this.itemsPerPage = 10;
        this.topics = [];
        
        this.initializeElements();
        this.loadTopics();
        this.initializeEventListeners();
    }

    initializeElements() {
        // Navigation elements
        this.categoryButtons = document.querySelectorAll('.category-btn');
        this.sortSelect = document.getElementById('sort-topics');
        this.searchInput = document.getElementById('forum-search');
        
        // Topic list and pagination
        this.topicsList = document.querySelector('.topics-list');
        this.pagination = document.querySelector('.forum-pagination');
        
        // Modal elements
        this.newTopicButton = document.getElementById('new-topic');
        this.modal = document.getElementById('new-topic-modal');
        this.closeModalButton = document.querySelector('.close-modal');
        this.newTopicForm = document.getElementById('new-topic-form');
        this.cancelTopicButton = document.getElementById('cancel-topic');
    }

    initializeEventListeners() {
        // Category filtering
        this.categoryButtons.forEach(button => {
            button.addEventListener('click', () => {
                this.changeCategory(button.dataset.category);
            });
        });

        // Sorting
        this.sortSelect.addEventListener('change', () => {
            this.changeSort(this.sortSelect.value);
        });

        // Search
        this.searchInput.addEventListener('input', this.debounce(() => {
            this.searchTopics(this.searchInput.value);
        }, 300));

        // Modal handling
        this.newTopicButton.addEventListener('click', () => this.openModal());
        this.closeModalButton.addEventListener('click', () => this.closeModal());
        this.cancelTopicButton.addEventListener('click', () => this.closeModal());
        this.newTopicForm.addEventListener('submit', (e) => this.handleNewTopic(e));

        // Close modal when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.closeModal();
            }
        });
    }

    async loadTopics() {
        try {
            // This would be replaced with actual API call
            this.topics = await this.fetchTopics();
            this.filterAndDisplayTopics();
        } catch (error) {
            console.error('Error loading topics:', error);
            this.showError('Failed to load topics. Please try again.');
        }
    }

    async fetchTopics() {
        // Simulated API response
        return [
            {
                id: 1,
                title: 'Forum Rules and Guidelines',
                author: 'Admin',
                date: '2024-01-15T10:00:00',
                category: 'announcements',
                views: 1200,
                replies: 45,
                pinned: true,
                content: 'Please read our community guidelines...'
            },
            {
                id: 2,
                title: 'Tips for Rolling Your R\'s in Spanish',
                author: 'Maria',
                date: new Date(Date.now() - 7200000).toISOString(),
                category: 'pronunciation',
                views: 234,
                replies: 18,
                hot: true,
                content: 'I\'ve been struggling with rolling my R\'s...'
            },
            // Add more topics...
        ];
    }

    filterAndDisplayTopics() {
        let filteredTopics = [...this.topics];

        // Apply category filter
        if (this.currentCategory !== 'all') {
            filteredTopics = filteredTopics.filter(topic => 
                topic.category === this.currentCategory
            );
        }

        // Apply search filter if there's a search query
        const searchQuery = this.searchInput.value.toLowerCase().trim();
        if (searchQuery) {
            filteredTopics = filteredTopics.filter(topic =>
                topic.title.toLowerCase().includes(searchQuery) ||
                topic.content.toLowerCase().includes(searchQuery)
            );
        }

        // Apply sorting
        filteredTopics.sort((a, b) => {
            switch (this.currentSort) {
                case 'recent':
                    return new Date(b.date) - new Date(a.date);
                case 'popular':
                    return b.views - a.views;
                case 'unanswered':
                    return a.replies - b.replies;
                default:
                    return 0;
            }
        });

        // Always keep pinned topics at top
        filteredTopics.sort((a, b) => {
            if (a.pinned && !b.pinned) return -1;
            if (!a.pinned && b.pinned) return 1;
            return 0;
        });

        this.displayTopics(filteredTopics);
        this.updatePagination(filteredTopics.length);
    }

    displayTopics(topics) {
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const pageTopics = topics.slice(startIndex, endIndex);

        this.topicsList.innerHTML = pageTopics.map(topic => `
            <div class="topic-item ${topic.pinned ? 'pinned' : ''} ${topic.hot ? 'hot' : ''}">
                ${this.getTopicStatus(topic)}
                <div class="topic-main">
                    <h3 class="topic-title">
                        <a href="#/topic/${topic.id}">${topic.title}</a>
                    </h3>
                    <div class="topic-meta">
                        <span class="author">by ${topic.author}</span>
                        <span class="date">${this.formatDate(topic.date)}</span>
                        <span class="category">${topic.category}</span>
                    </div>
                    ${topic.content ? `
                        <div class="topic-preview">
                            ${this.truncateText(topic.content, 100)}
                        </div>
                    ` : ''}
                </div>
                <div class="topic-stats">
                    <div class="views">
                        <i class="fas fa-eye"></i>
                        <span>${this.formatNumber(topic.views)}</span>
                    </div>
                    <div class="replies">
                        <i class="fas fa-comment"></i>
                        <span>${topic.replies}</span>
                    </div>
                </div>
            </div>
        `).join('');
    }

    getTopicStatus(topic) {
        if (topic.pinned) {
            return `
                <div class="topic-status">
                    <i class="fas fa-thumbtack"></i>
                    <span class="status-text">Pinned</span>
                </div>
            `;
        }
        if (topic.hot) {
            return `
                <div class="topic-status">
                    <i class="fas fa-fire"></i>
                    <span class="status-text">Hot</span>
                </div>
            `;
        }
        return '';
    }

    updatePagination(totalItems) {
        const totalPages = Math.ceil(totalItems / this.itemsPerPage);
        const pageNumbers = document.querySelector('.page-numbers');
        const prevButton = document.querySelector('.pagination-btn:first-child');
        const nextButton = document.querySelector('.pagination-btn:last-child');

        // Update prev/next buttons
        prevButton.disabled = this.currentPage === 1;
        nextButton.disabled = this.currentPage === totalPages;

        // Generate page numbers
        let pages = [];
        if (totalPages <= 5) {
            pages = Array.from({ length: totalPages }, (_, i) => i + 1);
        } else {
            if (this.currentPage <= 3) {
                pages = [1, 2, 3, 4, '...', totalPages];
            } else if (this.currentPage >= totalPages - 2) {
                pages = [1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
            } else {
                pages = [1, '...', this.currentPage - 1, this.currentPage, this.currentPage + 1, '...', totalPages];
            }
        }

        pageNumbers.innerHTML = pages.map(page => {
            if (page === '...') {
                return '<span class="page-ellipsis">...</span>';
            }
            return `
                <button class="page-number ${page === this.currentPage ? 'active' : ''}"
                        ${page === this.currentPage ? 'disabled' : ''}>
                    ${page}
                </button>
            `;
        }).join('');

        // Add click handlers to page numbers
        pageNumbers.querySelectorAll('.page-number').forEach(button => {
            button.addEventListener('click', () => {
                this.changePage(parseInt(button.textContent));
            });
        });
    }

    changeCategory(category) {
        this.currentCategory = category;
        this.currentPage = 1;
        this.categoryButtons.forEach(button => {
            button.classList.toggle('active', button.dataset.category === category);
        });
        this.filterAndDisplayTopics();
    }

    changeSort(sort) {
        this.currentSort = sort;
        this.currentPage = 1;
        this.filterAndDisplayTopics();
    }

    changePage(page) {
        this.currentPage = page;
        this.filterAndDisplayTopics();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    searchTopics(query) {
        this.currentPage = 1;
        this.filterAndDisplayTopics();
    }

    openModal() {
        this.modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }

    closeModal() {
        this.modal.style.display = 'none';
        document.body.style.overflow = '';
        this.newTopicForm.reset();
    }

    async handleNewTopic(e) {
        e.preventDefault();

        const formData = {
            title: document.getElementById('topic-title').value,
            category: document.getElementById('topic-category').value,
            content: document.getElementById('topic-content').value
        };

        try {
            await this.createTopic(formData);
            this.closeModal();
            this.loadTopics();
            this.showSuccess('Topic created successfully!');
        } catch (error) {
            console.error('Error creating topic:', error);
            this.showError('Failed to create topic. Please try again.');
        }
    }

    async createTopic(topicData) {
        // This would be replaced with actual API call
        return new Promise((resolve) => {
            setTimeout(() => {
                this.topics.unshift({
                    id: Date.now(),
                    title: topicData.title,
                    category: topicData.category,
                    content: topicData.content,
                    author: 'Current User',
                    date: new Date().toISOString(),
                    views: 0,
                    replies: 0
                });
                resolve();
            }, 1000);
        });
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now - date;

        if (diff < 60000) { // Less than 1 minute
            return 'Just now';
        } else if (diff < 3600000) { // Less than 1 hour
            const minutes = Math.floor(diff / 60000);
            return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
        } else if (diff < 86400000) { // Less than 1 day
            const hours = Math.floor(diff / 3600000);
            return `${hours} hour${hours === 1 ? '' : 's'} ago`;
        } else if (diff < 604800000) { // Less than 1 week
            const days = Math.floor(diff / 86400000);
            return `${days} day${days === 1 ? '' : 's'} ago`;
        } else {
            return date.toLocaleDateString();
        }
    }

    formatNumber(number) {
        if (number >= 1000) {
            return (number / 1000).toFixed(1) + 'k';
        }
        return number.toString();
    }

    truncateText(text, maxLength) {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }

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

    showError(message) {
        // Implement error notification
        console.error(message);
    }

    showSuccess(message) {
        // Implement success notification
        console.log(message);
    }
}

// Initialize forum when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new CommunityForum();
}); 