import { DashboardAuth } from './dashboard-auth.js';
import { TeacherApiService } from './teacher-api-service.js';

class TeacherAssignmentsDashboard {
    constructor() {
        this.auth = new DashboardAuth();
        this.api = new TeacherApiService();
        this.selectedClass = 'all';
        this.selectedStatus = 'all';
        this.selectedType = 'all';
    }

    async initialize() {
        if (await this.auth.checkAuth()) {
            this.auth.updateUI();
            await this.loadClassList();
            await this.loadAssignments();
            this.setupEventListeners();
            document.body.style.visibility = 'visible';
        }
    }

    async loadClassList() {
        try {
            const classes = await this.api.getTeacherClasses();
            const classFilter = document.getElementById('classFilter');
            const assignmentClass = document.getElementById('assignmentClass');
            
            [classFilter, assignmentClass].forEach(select => {
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

        document.getElementById('statusFilter').addEventListener('change', (e) => {
            this.selectedStatus = e.target.value;
            this.updateDashboard();
        });

        document.getElementById('typeFilter').addEventListener('change', (e) => {
            this.selectedType = e.target.value;
            this.updateDashboard();
        });

        // Create assignment button
        document.querySelector('.create-assignment').addEventListener('click', () => {
            this.showCreateModal();
        });

        // Modal event listeners
        const modal = document.getElementById('createAssignmentModal');
        const form = document.getElementById('assignmentForm');
        const cancelBtn = modal.querySelector('.cancel-btn');

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.createAssignment();
        });

        cancelBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });

        // Search functionality
        const searchInput = document.querySelector('.header-search input');
        searchInput.addEventListener('input', this.debounce(() => {
            this.updateDashboard();
        }, 300));
    }

    async loadAssignments() {
        try {
            const assignments = await this.api.getAssignments(
                this.selectedClass,
                this.selectedStatus,
                this.selectedType
            );
            this.renderAssignments(assignments);
            this.updateStats(assignments);
            await this.loadRecentSubmissions();
        } catch (error) {
            console.error('Error loading assignments:', error);
            this.showError('Failed to load assignments');
        }
    }

    renderAssignments(assignments) {
        const grid = document.querySelector('.assignments-grid');
        grid.innerHTML = assignments.map(assignment => `
            <div class="assignment-card ${assignment.status}">
                <div class="assignment-header">
                    <h3>${assignment.title}</h3>
                    <span class="assignment-type">${assignment.type}</span>
                </div>
                <p>${assignment.description}</p>
                <div class="assignment-meta">
                    <span class="due-date">
                        <i class="fas fa-clock"></i>
                        Due: ${new Date(assignment.dueDate).toLocaleDateString()}
                    </span>
                    <span class="points">
                        <i class="fas fa-star"></i>
                        ${assignment.points} points
                    </span>
                </div>
                <div class="assignment-stats">
                    <span class="submitted">
                        <i class="fas fa-check-circle"></i>
                        ${assignment.submittedCount}/${assignment.totalStudents} submitted
                    </span>
                    <span class="average-score">
                        <i class="fas fa-chart-line"></i>
                        Avg: ${assignment.averageScore}%
                    </span>
                </div>
                <div class="assignment-actions">
                    <button class="edit-btn" data-id="${assignment.id}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="delete-btn" data-id="${assignment.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                    <button class="view-submissions-btn" data-id="${assignment.id}">
                        <i class="fas fa-eye"></i>
                    </button>
                </div>
            </div>
        `).join('');

        // Add event listeners to buttons
        grid.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', () => this.editAssignment(btn.dataset.id));
        });

        grid.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', () => this.deleteAssignment(btn.dataset.id));
        });

        grid.querySelectorAll('.view-submissions-btn').forEach(btn => {
            btn.addEventListener('click', () => this.viewSubmissions(btn.dataset.id));
        });
    }

    async loadRecentSubmissions() {
        try {
            const submissions = await this.api.getRecentSubmissions(this.selectedClass);
            const submissionsList = document.querySelector('.submissions-list');
            submissionsList.innerHTML = submissions.map(submission => `
                <div class="submission-item">
                    <div class="student-info">
                        <img src="${submission.studentAvatar || '/images/default-avatar.png'}" 
                             alt="${submission.studentName}">
                        <div class="student-details">
                            <h4>${submission.studentName}</h4>
                            <p>${submission.assignmentTitle}</p>
                        </div>
                    </div>
                    <div class="submission-meta">
                        <span class="submission-time">
                            ${this.formatTimeAgo(submission.submittedAt)}
                        </span>
                        <button class="grade-btn" data-id="${submission.id}">
                            Grade
                        </button>
                    </div>
                </div>
            `).join('');

            // Add event listeners to grade buttons
            submissionsList.querySelectorAll('.grade-btn').forEach(btn => {
                btn.addEventListener('click', () => this.gradeSubmission(btn.dataset.id));
            });
        } catch (error) {
            console.error('Error loading submissions:', error);
            this.showError('Failed to load recent submissions');
        }
    }

    updateStats(assignments) {
        const activeCount = assignments.filter(a => a.status === 'active').length;
        const completionRate = this.calculateCompletionRate(assignments);
        const pendingReview = assignments.reduce((count, a) => 
            count + (a.ungraded || 0), 0);

        document.querySelector('.stat-card:nth-child(1) .stat-value').textContent = activeCount;
        document.querySelector('.stat-card:nth-child(2) .stat-value').textContent = `${completionRate}%`;
        document.querySelector('.stat-card:nth-child(3) .stat-value').textContent = pendingReview;
    }

    calculateCompletionRate(assignments) {
        if (assignments.length === 0) return 0;
        const totalSubmissions = assignments.reduce((sum, a) => sum + a.submittedCount, 0);
        const totalPossible = assignments.reduce((sum, a) => sum + a.totalStudents, 0);
        return Math.round((totalSubmissions / totalPossible) * 100) || 0;
    }

    async createAssignment() {
        const form = document.getElementById('assignmentForm');
        const assignmentData = {
            title: form.assignmentTitle.value,
            description: form.assignmentDescription.value,
            type: form.assignmentType.value,
            classId: form.assignmentClass.value,
            dueDate: form.dueDate.value,
            points: parseInt(form.points.value),
            status: form.isDraft.checked ? 'draft' : 'active'
        };

        try {
            await this.api.createAssignment(assignmentData);
            document.getElementById('createAssignmentModal').style.display = 'none';
            this.showSuccess('Assignment created successfully');
            await this.loadAssignments();
        } catch (error) {
            console.error('Error creating assignment:', error);
            this.showError('Failed to create assignment');
        }
    }

    async editAssignment(id) {
        try {
            const assignment = await this.api.getAssignment(id);
            const form = document.getElementById('assignmentForm');
            
            form.assignmentTitle.value = assignment.title;
            form.assignmentDescription.value = assignment.description;
            form.assignmentType.value = assignment.type;
            form.assignmentClass.value = assignment.classId;
            form.dueDate.value = assignment.dueDate;
            form.points.value = assignment.points;
            form.isDraft.checked = assignment.status === 'draft';
            
            document.getElementById('createAssignmentModal').style.display = 'block';
        } catch (error) {
            console.error('Error editing assignment:', error);
            this.showError('Failed to load assignment details');
        }
    }

    async deleteAssignment(id) {
        if (confirm('Are you sure you want to delete this assignment?')) {
            try {
                await this.api.deleteAssignment(id);
                this.showSuccess('Assignment deleted successfully');
                await this.loadAssignments();
            } catch (error) {
                console.error('Error deleting assignment:', error);
                this.showError('Failed to delete assignment');
            }
        }
    }

    async viewSubmissions(id) {
        // Implement view submissions functionality
        console.log('View submissions for assignment:', id);
    }

    async gradeSubmission(id) {
        // Implement grade submission functionality
        console.log('Grade submission:', id);
    }

    showCreateModal() {
        const modal = document.getElementById('createAssignmentModal');
        const form = document.getElementById('assignmentForm');
        form.reset();
        modal.style.display = 'block';
    }

    formatTimeAgo(date) {
        const now = new Date();
        const submittedDate = new Date(date);
        const diffInSeconds = Math.floor((now - submittedDate) / 1000);

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
        await this.loadAssignments();
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
    const dashboard = new TeacherAssignmentsDashboard();
    dashboard.initialize();
}); 