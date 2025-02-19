class AssignmentsManager {
    constructor() {
        this.db = getFirestore();
    }

    async getAssignments() {
        if (!auth.currentUser) {
            throw new Error('No authenticated user');
        }

        try {
            const assignmentsRef = collection(this.db, 'assignments');
            const q = query(assignmentsRef, where('userId', '==', auth.currentUser.uid));
            const snapshot = await getDocs(q);
            
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Error fetching assignments:', error);
            throw error;
        }
    }

    async createAssignment(assignmentData) {
        if (!auth.currentUser) {
            throw new Error('No authenticated user');
        }

        try {
            const assignmentsRef = collection(this.db, 'assignments');
            const newAssignment = {
                ...assignmentData,
                userId: auth.currentUser.uid,
                createdAt: new Date(),
                status: 'pending'
            };

            const docRef = await addDoc(assignmentsRef, newAssignment);
            return {
                id: docRef.id,
                ...newAssignment
            };
        } catch (error) {
            console.error('Error creating assignment:', error);
            throw error;
        }
    }

    async updateAssignment(assignmentId, updates) {
        if (!auth.currentUser) {
            throw new Error('No authenticated user');
        }

        try {
            const assignmentRef = doc(this.db, 'assignments', assignmentId);
            await updateDoc(assignmentRef, {
                ...updates,
                updatedAt: new Date()
            });
        } catch (error) {
            console.error('Error updating assignment:', error);
            throw error;
        }
    }

    async deleteAssignment(assignmentId) {
        if (!auth.currentUser) {
            throw new Error('No authenticated user');
        }

        try {
            const assignmentRef = doc(this.db, 'assignments', assignmentId);
            await deleteDoc(assignmentRef);
        } catch (error) {
            console.error('Error deleting assignment:', error);
            throw error;
        }
    }

    async submitAssignment(assignmentId, submission) {
        if (!auth.currentUser) {
            throw new Error('No authenticated user');
        }

        try {
            const assignmentRef = doc(this.db, 'assignments', assignmentId);
            await updateDoc(assignmentRef, {
                submission,
                status: 'submitted',
                submittedAt: new Date()
            });
        } catch (error) {
            console.error('Error submitting assignment:', error);
            throw error;
        }
    }
}

export const assignmentsManager = new AssignmentsManager();

// Initialize assignments when the page loads
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Wait for auth state to be determined
        await new Promise((resolve) => {
            const unsubscribe = auth.onAuthStateChanged((user) => {
                unsubscribe();
                resolve(user);
            });
        });

        if (!auth.currentUser) {
            console.warn('User not authenticated');
            return;
        }

        const assignments = await assignmentsManager.getAssignments();
        displayAssignments(assignments);
    } catch (error) {
        console.error('Error initializing assignments:', error);
    }
});

// Add auth state change listener
auth.onAuthStateChanged((user) => {
    if (user) {
        assignmentsManager.getAssignments()
            .then(assignments => displayAssignments(assignments))
            .catch(error => console.error('Error loading assignments:', error));
    } else {
        // Clear assignments display when user logs out
        const assignmentsContainer = document.getElementById('assignments-container');
        if (assignmentsContainer) {
            assignmentsContainer.innerHTML = '<p>Please log in to view assignments</p>';
        }
    }
});

class Assignments {
    constructor() {
        this.assignments = [];
        this.filters = {
            status: 'all',
            type: 'all'
        };
        this.typeIcons = {
            vocabulary: 'book',
            grammar: 'pencil-alt',
            speaking: 'microphone',
            writing: 'pen'
        };
        this.initialize();
    }

    async initialize() {
        await this.loadAssignments();
        this.setupEventListeners();
        this.renderAssignments();
        this.startDeadlineChecking();
    }

    async loadAssignments() {
        try {
            // Load assignments from API
            const token = localStorage.getItem('token');
            if (!token) return;

            const response = await fetch('/api/assignments', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.assignments = data;
            }
        } catch (error) {
            console.error('Failed to load assignments:', error);
            // Load from localStorage as fallback
            const savedAssignments = localStorage.getItem('assignments');
            if (savedAssignments) {
                this.assignments = JSON.parse(savedAssignments);
            }
        }

        // If no assignments loaded (first time), create some sample assignments
        if (this.assignments.length === 0) {
            this.createSampleAssignments();
        }
    }

    createSampleAssignments() {
        const now = new Date();
        this.assignments = [
            {
                id: 1,
                title: 'Basic Spanish Vocabulary',
                type: 'vocabulary',
                description: 'Learn 20 essential Spanish words related to food and dining.',
                deadline: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(),
                status: 'pending',
                progress: 0,
                totalTasks: 20
            },
            {
                id: 2,
                title: 'Present Tense Practice',
                type: 'grammar',
                description: 'Complete exercises on Spanish present tense conjugation.',
                deadline: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString(),
                status: 'pending',
                progress: 0,
                totalTasks: 15
            },
            {
                id: 3,
                title: 'Pronunciation Exercise',
                type: 'speaking',
                description: 'Record yourself pronouncing 10 challenging Spanish words.',
                deadline: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(),
                status: 'pending',
                progress: 0,
                totalTasks: 10
            }
        ];
        this.saveAssignments();
    }

    setupEventListeners() {
        // Set up filter listeners
        const statusFilter = document.getElementById('statusFilter');
        const typeFilter = document.getElementById('typeFilter');

        if (statusFilter) {
            statusFilter.addEventListener('change', (e) => {
                this.filters.status = e.target.value;
                this.renderAssignments();
            });
        }

        if (typeFilter) {
            typeFilter.addEventListener('change', (e) => {
                this.filters.type = e.target.value;
                this.renderAssignments();
            });
        }
    }

    renderAssignments() {
        const container = document.getElementById('assignmentsList');
        if (!container) return;

        const filteredAssignments = this.getFilteredAssignments();

        if (filteredAssignments.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-tasks"></i>
                    <h3>No Assignments Found</h3>
                    <p>There are no assignments matching your current filters.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = filteredAssignments.map(assignment => `
            <div class="assignment-card">
                <div class="assignment-header">
                    <h3 class="assignment-title">${assignment.title}</h3>
                    <span class="assignment-status status-${assignment.status}">
                        ${assignment.status.charAt(0).toUpperCase() + assignment.status.slice(1)}
                    </span>
                </div>
                <div class="assignment-meta">
                    <div class="meta-item">
                        <i class="fas fa-${this.typeIcons[assignment.type]}"></i>
                        <span>${this.formatType(assignment.type)}</span>
                    </div>
                    <div class="meta-item">
                        <i class="fas fa-clock"></i>
                        <span>${this.formatDeadline(assignment.deadline)}</span>
                    </div>
                </div>
                <p class="assignment-description">${assignment.description}</p>
                <div class="assignment-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${(assignment.progress / assignment.totalTasks) * 100}%"></div>
                    </div>
                    <div class="progress-label">
                        <span>${assignment.progress} of ${assignment.totalTasks} tasks completed</span>
                        <span>${Math.round((assignment.progress / assignment.totalTasks) * 100)}%</span>
                    </div>
                </div>
                <div class="assignment-actions">
                    ${this.renderAssignmentActions(assignment)}
                </div>
            </div>
        `).join('');

        // Add event listeners for buttons
        this.setupAssignmentEventListeners();
    }

    renderAssignmentActions(assignment) {
        if (assignment.status === 'completed') {
            return `
                <button class="btn btn-secondary" onclick="window.assignments.reviewAssignment(${assignment.id})">
                    <i class="fas fa-eye"></i> Review
                </button>
            `;
        }

        return `
            <button class="btn btn-primary" onclick="window.assignments.startAssignment(${assignment.id})">
                ${assignment.progress > 0 ? '<i class="fas fa-play"></i> Continue' : '<i class="fas fa-play"></i> Start'}
            </button>
            ${assignment.progress > 0 ? `
                <button class="btn btn-secondary" onclick="window.assignments.submitAssignment(${assignment.id})">
                    <i class="fas fa-check"></i> Submit
                </button>
            ` : ''}
        `;
    }

    setupAssignmentEventListeners() {
        // Event listeners will be added by onclick attributes in renderAssignmentActions
    }

    getFilteredAssignments() {
        return this.assignments.filter(assignment => {
            if (this.filters.status !== 'all' && assignment.status !== this.filters.status) {
                return false;
            }
            if (this.filters.type !== 'all' && assignment.type !== this.filters.type) {
                return false;
            }
            return true;
        });
    }

    formatType(type) {
        return type.charAt(0).toUpperCase() + type.slice(1);
    }

    formatDeadline(deadline) {
        const date = new Date(deadline);
        const now = new Date();
        const diffDays = Math.ceil((date - now) / (1000 * 60 * 60 * 24));

        if (diffDays < 0) {
            return 'Overdue';
        }
        if (diffDays === 0) {
            return 'Due Today';
        }
        if (diffDays === 1) {
            return 'Due Tomorrow';
        }
        return `Due in ${diffDays} days`;
    }

    startAssignment(id) {
        // Redirect to the assignment page
        window.location.href = `/assignment/${id}`;
    }

    async submitAssignment(id) {
        const assignment = this.assignments.find(a => a.id === id);
        if (!assignment) return;

        if (confirm('Are you sure you want to submit this assignment? You won\'t be able to make further changes.')) {
            assignment.status = 'completed';
            await this.saveAssignments();
            this.renderAssignments();
            this.showNotification('Assignment Submitted', 'Your work has been submitted successfully!');
        }
    }

    reviewAssignment(id) {
        // Redirect to the assignment review page
        window.location.href = `/assignment/${id}/review`;
    }

    startDeadlineChecking() {
        // Check for overdue assignments every hour
        setInterval(() => {
            const now = new Date();
            let updated = false;

            this.assignments.forEach(assignment => {
                if (assignment.status === 'pending' && new Date(assignment.deadline) < now) {
                    assignment.status = 'overdue';
                    updated = true;
                }
            });

            if (updated) {
                this.saveAssignments();
                this.renderAssignments();
            }
        }, 60 * 60 * 1000); // Check every hour
    }

    showNotification(title, message) {
        const notification = document.createElement('div');
        notification.className = 'achievement-notification';
        notification.innerHTML = `
            <i class="fas fa-check-circle"></i>
            <div class="notification-content">
                <h4>${title}</h4>
                <p>${message}</p>
            </div>
        `;
        
        document.body.appendChild(notification);
        setTimeout(() => {
            notification.classList.add('show');
            setTimeout(() => {
                notification.classList.remove('show');
                setTimeout(() => notification.remove(), 300);
            }, 3000);
        }, 100);
    }

    async saveAssignments() {
        try {
            // Save to API
            const token = localStorage.getItem('token');
            if (token) {
                await fetch('/api/assignments', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(this.assignments)
                });
            }
        } catch (error) {
            console.error('Failed to save assignments:', error);
        }

        // Save to localStorage as backup
        localStorage.setItem('assignments', JSON.stringify(this.assignments));
    }
}

// Initialize assignments when the page loads
document.addEventListener('DOMContentLoaded', async () => {
    if (!await checkAuth()) {
        return;
    }

    initializeAssignments();
    setupEventListeners();
});

async function initializeAssignments() {
    try {
        await Promise.all([
            loadClasses(),
            loadAssignments()
        ]);
        
        setupEventListeners();
        showSuccess('Assignments loaded successfully');
    } catch (error) {
        console.error('Error initializing assignments:', error);
        showError('Failed to load assignments');
    }
}

async function loadClasses() {
    try {
        const classes = await window.teacherApiService.getClasses();
        const classFilters = [
            document.getElementById('class-filter'),
            document.getElementById('assignment-class')
        ];
        
        classFilters.forEach(select => {
            classes.forEach(classItem => {
                const option = document.createElement('option');
                option.value = classItem.id;
                option.textContent = classItem.name;
                select.appendChild(option);
            });
        });
    } catch (error) {
        console.error('Error loading classes:', error);
        showError('Failed to load classes');
    }
}

async function loadAssignments() {
    try {
        const classId = document.getElementById('class-filter').value;
        const status = document.getElementById('status-filter').value;
        const type = document.getElementById('type-filter').value;
        
        const assignments = await window.teacherApiService.getAssignments(classId, status, type);
        renderAssignmentsGrid(assignments);
    } catch (error) {
        console.error('Error loading assignments:', error);
        showError('Failed to load assignments');
    }
}

function renderAssignmentsGrid(assignments) {
    const assignmentsGrid = document.querySelector('.assignments-grid');
    
    if (assignments.length === 0) {
        assignmentsGrid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-tasks"></i>
                <h3>No Assignments Found</h3>
                <p>Create a new assignment to get started</p>
            </div>
        `;
        return;
    }
    
    assignmentsGrid.innerHTML = assignments.map(assignment => `
        <div class="assignment-card ${assignment.status.toLowerCase()}" onclick="viewAssignmentDetails('${assignment.id}')">
            <div class="assignment-header">
                <div class="assignment-type">
                    <i class="fas ${getAssignmentIcon(assignment.type)}"></i>
                    <span>${assignment.type}</span>
                </div>
                <span class="status-badge ${assignment.status.toLowerCase()}">${assignment.status}</span>
            </div>
            <div class="assignment-content">
                <h3>${assignment.title}</h3>
                <p class="assignment-class">${assignment.className}</p>
                <p class="assignment-description">${assignment.description}</p>
            </div>
            <div class="assignment-meta">
                <div class="meta-item">
                    <i class="fas fa-calendar"></i>
                    <span>Due: ${formatDueDate(assignment.dueDate)}</span>
                </div>
                <div class="meta-item">
                    <i class="fas fa-users"></i>
                    <span>${assignment.submissionCount}/${assignment.totalStudents} Submitted</span>
                </div>
            </div>
            <div class="assignment-footer">
                <button class="action-button" onclick="event.stopPropagation(); editAssignment('${assignment.id}')">
                    <i class="fas fa-edit"></i>
                    Edit
                </button>
                <button class="action-button" onclick="event.stopPropagation(); duplicateAssignment('${assignment.id}')">
                    <i class="fas fa-copy"></i>
                    Duplicate
                </button>
            </div>
        </div>
    `).join('');
}

function getAssignmentIcon(type) {
    const icons = {
        'quiz': 'fa-question-circle',
        'exercise': 'fa-dumbbell',
        'project': 'fa-project-diagram',
        'homework': 'fa-book'
    };
    return icons[type] || 'fa-tasks';
}

function formatDueDate(dueDate) {
    const date = new Date(dueDate);
    const now = new Date();
    const diff = date - now;
    
    if (diff < 0) {
        return `Past due (${date.toLocaleDateString()})`;
    }
    
    if (diff < 86400000) { // Less than 24 hours
        const hours = Math.ceil(diff / 3600000);
        return `Due in ${hours} hour${hours !== 1 ? 's' : ''}`;
    }
    
    const days = Math.ceil(diff / 86400000);
    if (days < 7) {
        return `Due in ${days} day${days !== 1 ? 's' : ''}`;
    }
    
    return `Due ${date.toLocaleDateString()}`;
}

function createAssignment() {
    const modal = document.getElementById('assignment-modal');
    modal.querySelector('h2').textContent = 'Create Assignment';
    document.getElementById('assignment-form').reset();
    
    // Set default due date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    document.getElementById('due-date').value = tomorrow.toISOString().split('T')[0];
    document.getElementById('due-time').value = '23:59';
    
    modal.style.display = 'block';
}

async function editAssignment(assignmentId) {
    try {
        const assignment = await window.teacherApiService.getAssignmentDetails(assignmentId);
        const modal = document.getElementById('assignment-modal');
        modal.querySelector('h2').textContent = 'Edit Assignment';
        
        // Populate form
        const form = document.getElementById('assignment-form');
        form.dataset.assignmentId = assignmentId;
        
        document.getElementById('assignment-title').value = assignment.title;
        document.getElementById('assignment-type').value = assignment.type;
        document.getElementById('assignment-class').value = assignment.classId;
        document.getElementById('assignment-description').value = assignment.description;
        document.getElementById('assignment-instructions').value = assignment.instructions;
        
        const dueDate = new Date(assignment.dueDate);
        document.getElementById('due-date').value = dueDate.toISOString().split('T')[0];
        document.getElementById('due-time').value = dueDate.toTimeString().slice(0, 5);
        
        document.getElementById('points').value = assignment.points;
        
        // Set settings checkboxes
        const settingsCheckboxes = document.getElementsByName('settings');
        settingsCheckboxes.forEach(checkbox => {
            checkbox.checked = assignment.settings.includes(checkbox.value);
        });
        
        modal.style.display = 'block';
    } catch (error) {
        console.error('Error loading assignment details:', error);
        showError('Failed to load assignment details');
    }
}

async function submitAssignment(event) {
    event.preventDefault();
    
    const form = event.target;
    const assignmentId = form.dataset.assignmentId;
    const assignmentData = {
        title: form['assignment-title'].value,
        type: form['assignment-type'].value,
        classId: form['assignment-class'].value,
        description: form['assignment-description'].value,
        instructions: form['assignment-instructions'].value,
        dueDate: `${form['due-date'].value}T${form['due-time'].value}:00`,
        points: parseInt(form['points'].value),
        settings: Array.from(form.settings)
            .filter(checkbox => checkbox.checked)
            .map(checkbox => checkbox.value)
    };
    
    try {
        if (assignmentId) {
            await window.teacherApiService.updateAssignment(assignmentId, assignmentData);
            showSuccess('Assignment updated successfully');
        } else {
            await window.teacherApiService.createAssignment(assignmentData);
            showSuccess('Assignment created successfully');
        }
        
        closeAssignmentModal();
        loadAssignments();
    } catch (error) {
        console.error('Error saving assignment:', error);
        showError('Failed to save assignment');
    }
}

function closeAssignmentModal() {
    const modal = document.getElementById('assignment-modal');
    modal.style.display = 'none';
    document.getElementById('assignment-form').reset();
    delete document.getElementById('assignment-form').dataset.assignmentId;
}

async function viewAssignmentDetails(assignmentId) {
    try {
        const assignment = await window.teacherApiService.getAssignmentDetails(assignmentId);
        const modal = document.getElementById('assignment-details-modal');
        
        // Update assignment info
        modal.querySelector('.assignment-title').textContent = assignment.title;
        modal.querySelector('.assignment-meta').textContent = `${assignment.type} • ${assignment.className}`;
        
        // Update stats
        modal.querySelector('.submission-count').textContent = `${assignment.submissionCount}/${assignment.totalStudents}`;
        modal.querySelector('.average-score').textContent = `${assignment.averageScore}%`;
        modal.querySelector('.time-remaining').textContent = formatTimeRemaining(assignment.dueDate);
        
        // Update submissions list
        const submissionsTable = modal.querySelector('.submissions-table');
        if (assignment.submissions.length === 0) {
            submissionsTable.innerHTML = `
                <div class="empty-state">
                    <p>No submissions yet</p>
                </div>
            `;
        } else {
            submissionsTable.innerHTML = `
                <table>
                    <thead>
                        <tr>
                            <th>Student</th>
                            <th>Status</th>
                            <th>Submitted</th>
                            <th>Score</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${assignment.submissions.map(submission => `
                            <tr>
                                <td class="student-info">
                                    <img src="${submission.student.avatar || '/assets/default-avatar.png'}" alt="${submission.student.name}'s avatar" class="student-avatar">
                                    <div>
                                        <h4>${submission.student.name}</h4>
                                        <p>${submission.student.email}</p>
                                    </div>
                                </td>
                                <td>
                                    <span class="status-badge ${submission.status.toLowerCase()}">
                                        ${submission.status}
                                    </span>
                                </td>
                                <td>${formatSubmissionTime(submission.submittedAt)}</td>
                                <td>${submission.score !== null ? `${submission.score}/${assignment.points}` : '-'}</td>
                                <td>
                                    <button onclick="viewSubmission('${submission.id}')" class="action-button">
                                        <i class="fas fa-eye"></i>
                                        View
                                    </button>
                                    ${submission.status === 'Submitted' ? `
                                        <button onclick="gradeSubmission('${submission.id}')" class="action-button">
                                            <i class="fas fa-check"></i>
                                            Grade
                                        </button>
                                    ` : ''}
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
        }
        
        modal.style.display = 'block';
        modal.dataset.assignmentId = assignmentId;
    } catch (error) {
        console.error('Error loading assignment details:', error);
        showError('Failed to load assignment details');
    }
}

function formatTimeRemaining(dueDate) {
    const date = new Date(dueDate);
    const now = new Date();
    const diff = date - now;
    
    if (diff < 0) {
        return 'Past due';
    }
    
    const days = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    
    if (days > 0) {
        return `${days}d ${hours}h remaining`;
    }
    
    if (hours > 0) {
        return `${hours}h ${minutes}m remaining`;
    }
    
    return `${minutes}m remaining`;
}

function formatSubmissionTime(timestamp) {
    if (!timestamp) return 'Not submitted';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 3600000) {
        const minutes = Math.floor(diff / 60000);
        return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    }
    
    if (diff < 86400000) {
        const hours = Math.floor(diff / 3600000);
        return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    }
    
    return date.toLocaleDateString();
}

function closeAssignmentDetails() {
    const modal = document.getElementById('assignment-details-modal');
    modal.style.display = 'none';
    delete modal.dataset.assignmentId;
}

async function duplicateAssignment(assignmentId) {
    try {
        await window.teacherApiService.duplicateAssignment(assignmentId);
        showSuccess('Assignment duplicated successfully');
        loadAssignments();
    } catch (error) {
        console.error('Error duplicating assignment:', error);
        showError('Failed to duplicate assignment');
    }
}

async function archiveAssignment() {
    const assignmentId = document.getElementById('assignment-details-modal').dataset.assignmentId;
    
    if (!confirm('Are you sure you want to archive this assignment?')) {
        return;
    }
    
    try {
        await window.teacherApiService.archiveAssignment(assignmentId);
        showSuccess('Assignment archived successfully');
        closeAssignmentDetails();
        loadAssignments();
    } catch (error) {
        console.error('Error archiving assignment:', error);
        showError('Failed to archive assignment');
    }
}

async function exportGrades() {
    const assignmentId = document.getElementById('assignment-details-modal').dataset.assignmentId;
    
    try {
        const exportUrl = await window.teacherApiService.exportAssignmentGrades(assignmentId);
        window.location.href = exportUrl;
    } catch (error) {
        console.error('Error exporting grades:', error);
        showError('Failed to export grades');
    }
}

function setupEventListeners() {
    // Class filter change
    document.getElementById('class-filter').addEventListener('change', loadAssignments);
    
    // Status filter change
    document.getElementById('status-filter').addEventListener('change', loadAssignments);
    
    // Type filter change
    document.getElementById('type-filter').addEventListener('change', loadAssignments);
    
    // Assignment search
    let searchTimeout;
    document.getElementById('assignment-search').addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            const searchTerm = e.target.value.toLowerCase();
            const assignmentCards = document.querySelectorAll('.assignment-card');
            
            assignmentCards.forEach(card => {
                const title = card.querySelector('h3').textContent.toLowerCase();
                const description = card.querySelector('.assignment-description').textContent.toLowerCase();
                const className = card.querySelector('.assignment-class').textContent.toLowerCase();
                
                if (title.includes(searchTerm) || description.includes(searchTerm) || className.includes(searchTerm)) {
                    card.style.display = 'block';
                } else {
                    card.style.display = 'none';
                }
            });
        }, 300);
    });
}

function showSuccess(message) {
    // Implementation depends on your toast/notification system
    console.log('Success:', message);
}

function showError(message) {
    // Implementation depends on your toast/notification system
    console.error('Error:', message);
} 