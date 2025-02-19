// Content Management
class TeachingContentManager {
    constructor() {
        this.content = [];
        this.currentFilter = 'all';
        this.setupEventListeners();
        this.initializeCharts();
    }

    setupEventListeners() {
        // Create content buttons
        document.querySelectorAll('.btn-create').forEach(button => {
            button.addEventListener('click', () => this.showCreationModal());
        });

        // Filter buttons
        document.querySelectorAll('.filter-btn').forEach(button => {
            button.addEventListener('click', (e) => this.filterContent(e.target.dataset.filter));
        });

        // Modal form
        const form = document.getElementById('contentForm');
        if (form) {
            form.addEventListener('submit', (e) => this.handleContentCreation(e));
        }

        // Cancel button
        const cancelBtn = document.getElementById('cancelCreate');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => this.hideCreationModal());
        }
    }

    showCreationModal() {
        const modal = document.getElementById('creationModal');
        if (modal) {
            modal.classList.add('show');
        }
    }

    hideCreationModal() {
        const modal = document.getElementById('creationModal');
        if (modal) {
            modal.classList.remove('show');
        }
    }

    async handleContentCreation(e) {
        e.preventDefault();
        
        const title = document.getElementById('contentTitle').value;
        const type = document.getElementById('contentType').value;
        const description = document.getElementById('contentDescription').value;

        try {
            // Simulate API call
            await this.createContent({ title, type, description });
            this.hideCreationModal();
            this.showNotification('Content created successfully!', 'success');
            this.refreshContentGrid();
        } catch (error) {
            this.showNotification('Failed to create content. Please try again.', 'error');
        }
    }

    async createContent(contentData) {
        // Simulate API call
        return new Promise((resolve) => {
            setTimeout(() => {
                this.content.push({
                    id: Date.now(),
                    ...contentData,
                    created: new Date(),
                    stats: {
                        views: 0,
                        completions: 0,
                        rating: 0
                    }
                });
                resolve();
            }, 500);
        });
    }

    filterContent(filter) {
        this.currentFilter = filter;
        
        // Update active button
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === filter);
        });

        this.refreshContentGrid();
    }

    refreshContentGrid() {
        const grid = document.getElementById('contentGrid');
        if (!grid) return;

        const filteredContent = this.currentFilter === 'all' 
            ? this.content 
            : this.content.filter(item => item.type === this.currentFilter);

        if (filteredContent.length === 0) {
            grid.innerHTML = '<p class="empty-state">No content found. Create some!</p>';
            return;
        }

        grid.innerHTML = filteredContent.map(item => this.createContentCard(item)).join('');
    }

    createContentCard(item) {
        return `
            <div class="content-card">
                <h3>${item.title}</h3>
                <p>${item.description}</p>
                <div class="content-stats">
                    <span>${item.stats.views} views</span>
                    <span>${item.stats.completions} completions</span>
                    <span>${item.stats.rating}/5 rating</span>
                </div>
                <div class="content-actions">
                    <button class="btn-edit" data-id="${item.id}">Edit</button>
                    <button class="btn-delete" data-id="${item.id}">Delete</button>
                </div>
            </div>
        `;
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;

        document.body.appendChild(notification);

        // Remove after 3 seconds
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    initializeCharts() {
        this.initializePerformanceChart();
        this.initializeProgressChart();
    }

    initializePerformanceChart() {
        const ctx = document.getElementById('performanceChart');
        if (!ctx) return;

        new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                datasets: [{
                    label: 'Content Views',
                    data: [0, 0, 0, 0, 0, 0],
                    borderColor: '#1a2a6c',
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    initializeProgressChart() {
        const ctx = document.getElementById('progressChart');
        if (!ctx) return;

        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Lessons', 'Games', 'Quizzes'],
                datasets: [{
                    label: 'Completion Rate',
                    data: [0, 0, 0],
                    backgroundColor: [
                        '#1a2a6c',
                        '#b21f1f',
                        '#4a90e2'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const contentManager = new TeachingContentManager();
}); 