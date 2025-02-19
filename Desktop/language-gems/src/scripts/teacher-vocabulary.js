import { DashboardAuth } from './dashboard-auth.js';
import { TeacherApiService } from './teacher-api-service.js';

class TeacherVocabularyDashboard {
    constructor() {
        this.auth = new DashboardAuth();
        this.api = new TeacherApiService();
        this.selectedClass = 'all';
        this.selectedLevel = 'all';
        this.selectedCategory = 'all';
    }

    async initialize() {
        if (await this.auth.checkAuth()) {
            this.auth.updateUI();
            await this.loadClassList();
            await this.loadVocabulary();
            this.setupEventListeners();
            document.body.style.visibility = 'visible';
        }
    }

    async loadClassList() {
        try {
            const classes = await this.api.getTeacherClasses();
            const classFilter = document.getElementById('classFilter');
            const assignToClass = document.getElementById('assignToClass');
            
            [classFilter, assignToClass].forEach(select => {
                if (select) {
                    select.innerHTML = '<option value="all">All Classes</option>' +
                        classes.map(cls => `
                            <option value="${cls.id}">${cls.name}</option>
                        `).join('');
                }
            });
        } catch (error) {
            console.error('Error loading classes:', error);
            this.showError('Failed to load class list');
        }
    }

    setupEventListeners() {
        // Filter event listeners
        document.getElementById('classFilter').addEventListener('change', (e) => {
            this.selectedClass = e.target.value;
            this.updateDashboard();
        });

        document.getElementById('levelFilter').addEventListener('change', (e) => {
            this.selectedLevel = e.target.value;
            this.updateDashboard();
        });

        document.getElementById('categoryFilter').addEventListener('change', (e) => {
            this.selectedCategory = e.target.value;
            this.updateDashboard();
        });

        // Action buttons
        document.querySelector('.create-vocab').addEventListener('click', () => {
            this.showAddModal();
        });

        document.querySelector('.import-vocab').addEventListener('click', () => {
            this.showImportModal();
        });

        // Modal forms
        const addForm = document.getElementById('vocabularyForm');
        const importForm = document.getElementById('importForm');

        addForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.addVocabulary();
        });

        importForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.importVocabulary();
        });

        // Modal cancel buttons
        document.querySelectorAll('.cancel-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.modal').forEach(modal => {
                    modal.style.display = 'none';
                });
            });
        });

        // Search functionality
        const searchInput = document.querySelector('.header-search input');
        searchInput.addEventListener('input', this.debounce(() => {
            this.updateDashboard();
        }, 300));
    }

    async loadVocabulary() {
        try {
            const vocabulary = await this.api.getVocabulary(
                this.selectedClass,
                this.selectedLevel,
                this.selectedCategory
            );
            this.renderVocabulary(vocabulary);
            this.updateStats(vocabulary);
            await this.loadRecentActivity();
        } catch (error) {
            console.error('Error loading vocabulary:', error);
            this.showError('Failed to load vocabulary');
        }
    }

    renderVocabulary(vocabulary) {
        const grid = document.querySelector('.vocabulary-grid');
        grid.innerHTML = vocabulary.map(list => `
            <div class="vocabulary-card">
                <div class="vocabulary-header">
                    <h3>${list.title}</h3>
                    <span class="vocabulary-meta">
                        <span class="category">${list.category}</span>
                        <span class="level">${list.level}</span>
                    </span>
                </div>
                <div class="word-count">
                    <i class="fas fa-book"></i>
                    ${list.words.length} words
                </div>
                <div class="vocabulary-stats">
                    <span class="mastery-rate">
                        <i class="fas fa-chart-line"></i>
                        ${list.masteryRate}% mastery
                    </span>
                    <span class="assigned-to">
                        <i class="fas fa-users"></i>
                        ${list.assignedTo.length} classes
                    </span>
                </div>
                <div class="vocabulary-actions">
                    <button class="edit-btn" data-id="${list.id}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="delete-btn" data-id="${list.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                    <button class="assign-btn" data-id="${list.id}">
                        <i class="fas fa-user-plus"></i>
                    </button>
                    <button class="export-btn" data-id="${list.id}">
                        <i class="fas fa-download"></i>
                    </button>
                </div>
            </div>
        `).join('');

        // Add event listeners to buttons
        grid.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', () => this.editVocabularyList(btn.dataset.id));
        });

        grid.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', () => this.deleteVocabularyList(btn.dataset.id));
        });

        grid.querySelectorAll('.assign-btn').forEach(btn => {
            btn.addEventListener('click', () => this.assignVocabularyList(btn.dataset.id));
        });

        grid.querySelectorAll('.export-btn').forEach(btn => {
            btn.addEventListener('click', () => this.exportVocabularyList(btn.dataset.id));
        });
    }

    async loadRecentActivity() {
        try {
            const activities = await this.api.getVocabularyActivity();
            const activityList = document.querySelector('.activity-list');
            activityList.innerHTML = activities.map(activity => `
                <div class="activity-item">
                    <div class="activity-icon">
                        <i class="fas ${this.getActivityIcon(activity.type)}"></i>
                    </div>
                    <div class="activity-details">
                        <p>${activity.description}</p>
                        <span class="activity-time">${this.formatTimeAgo(activity.timestamp)}</span>
                    </div>
                </div>
            `).join('');
        } catch (error) {
            console.error('Error loading activity:', error);
            this.showError('Failed to load recent activity');
        }
    }

    updateStats(vocabulary) {
        const totalWords = vocabulary.reduce((sum, list) => sum + list.words.length, 0);
        const categories = new Set(vocabulary.map(list => list.category)).size;
        const averageMastery = vocabulary.reduce((sum, list) => sum + list.masteryRate, 0) / vocabulary.length || 0;

        document.querySelector('.stat-card:nth-child(1) .stat-value').textContent = totalWords.toLocaleString();
        document.querySelector('.stat-card:nth-child(2) .stat-value').textContent = categories;
        document.querySelector('.stat-card:nth-child(3) .stat-value').textContent = `${Math.round(averageMastery)}%`;
    }

    async addVocabulary() {
        const form = document.getElementById('vocabularyForm');
        const words = form.wordList.value.split('\n')
            .map(line => {
                const [spanish, english] = line.split('=').map(s => s.trim());
                return { spanish, english };
            })
            .filter(word => word.spanish && word.english);

        const vocabularyData = {
            words,
            category: form.category.value,
            level: form.level.value,
            classId: form.assignToClass.value
        };

        try {
            await this.api.createVocabularyList(vocabularyData);
            document.getElementById('addVocabularyModal').style.display = 'none';
            this.showSuccess('Vocabulary list created successfully');
            await this.loadVocabulary();
        } catch (error) {
            console.error('Error creating vocabulary list:', error);
            this.showError('Failed to create vocabulary list');
        }
    }

    async importVocabulary() {
        const form = document.getElementById('importForm');
        const file = form.importFile.files[0];
        const formData = new FormData();
        formData.append('file', file);
        formData.append('category', form.importCategory.value);
        formData.append('level', form.importLevel.value);

        try {
            await this.api.importVocabulary(formData);
            document.getElementById('importModal').style.display = 'none';
            this.showSuccess('Vocabulary imported successfully');
            await this.loadVocabulary();
        } catch (error) {
            console.error('Error importing vocabulary:', error);
            this.showError('Failed to import vocabulary');
        }
    }

    async editVocabularyList(id) {
        try {
            const list = await this.api.getVocabularyList(id);
            const form = document.getElementById('vocabularyForm');
            
            form.wordList.value = list.words
                .map(word => `${word.spanish} = ${word.english}`)
                .join('\n');
            form.category.value = list.category;
            form.level.value = list.level;
            form.assignToClass.value = list.classId;
            
            document.getElementById('addVocabularyModal').style.display = 'block';
        } catch (error) {
            console.error('Error editing vocabulary list:', error);
            this.showError('Failed to load vocabulary list');
        }
    }

    async deleteVocabularyList(id) {
        if (confirm('Are you sure you want to delete this vocabulary list?')) {
            try {
                await this.api.deleteVocabularyList(id);
                this.showSuccess('Vocabulary list deleted successfully');
                await this.loadVocabulary();
            } catch (error) {
                console.error('Error deleting vocabulary list:', error);
                this.showError('Failed to delete vocabulary list');
            }
        }
    }

    async assignVocabularyList(id) {
        // Implement assign vocabulary functionality
        console.log('Assign vocabulary list:', id);
    }

    async exportVocabularyList(id) {
        try {
            const list = await this.api.getVocabularyList(id);
            const csv = this.generateCSV(list.words);
            this.downloadCSV(csv, `vocabulary_${id}.csv`);
        } catch (error) {
            console.error('Error exporting vocabulary list:', error);
            this.showError('Failed to export vocabulary list');
        }
    }

    generateCSV(words) {
        const headers = ['Spanish', 'English'];
        const rows = words.map(word => [word.spanish, word.english]);
        return [headers, ...rows]
            .map(row => row.map(cell => `"${cell}"`).join(','))
            .join('\n');
    }

    downloadCSV(csv, filename) {
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    getActivityIcon(type) {
        const icons = {
            create: 'fa-plus',
            update: 'fa-edit',
            delete: 'fa-trash',
            import: 'fa-file-import',
            export: 'fa-file-export',
            assign: 'fa-user-plus'
        };
        return icons[type] || 'fa-info-circle';
    }

    showAddModal() {
        const modal = document.getElementById('addVocabularyModal');
        const form = document.getElementById('vocabularyForm');
        form.reset();
        modal.style.display = 'block';
    }

    showImportModal() {
        const modal = document.getElementById('importModal');
        const form = document.getElementById('importForm');
        form.reset();
        modal.style.display = 'block';
    }

    formatTimeAgo(date) {
        const now = new Date();
        const timestamp = new Date(date);
        const diffInSeconds = Math.floor((now - timestamp) / 1000);

        if (diffInSeconds < 60) return 'just now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
        return `${Math.floor(diffInSeconds / 86400)}d ago`;
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

    async updateDashboard() {
        await this.loadVocabulary();
    }

    showError(message) {
        const errorDiv = document.querySelector('.error-message');
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
        setTimeout(() => {
            errorDiv.style.display = 'none';
        }, 5000);
    }

    showSuccess(message) {
        const successDiv = document.querySelector('.success-message');
        successDiv.textContent = message;
        successDiv.style.display = 'block';
        setTimeout(() => {
            successDiv.style.display = 'none';
        }, 5000);
    }
}

// Initialize the dashboard when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const dashboard = new TeacherVocabularyDashboard();
    dashboard.initialize();
}); 