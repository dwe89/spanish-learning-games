import { assignmentsService } from '../services/assignments-service.js";
import { authService } from '../services/auth-service.js";
import { LoadingState } from '../components/loading-state.js";
import { ErrorBoundary } from '../components/error-boundary.js";
import { Notification } from '../components/notification.js";

// Initialize components
const loadingState = new LoadingState('main-content');
const errorBoundary = new ErrorBoundary('main-content', {
    onRetry: () => initializeAssignments()
});
const notification = Notification.getInstance();

// Keep track of active listeners
let activeListeners = [];

document.addEventListener('DOMContentLoaded', async () => {
    try {
        await authService.requireTeacherAuth();
        await initializeAssignments();
    } catch (error) {
        errorBoundary.show(error);
    }
});

async function initializeAssignments() {
    try {
        loadingState.show();
        await Promise.all([
            loadClasses(),
            loadAssignments()
        ]);
        setupEventListeners();
        notification.success('Assignments loaded successfully');
    } catch (error) {
        console.error('Error initializing assignments:', error);
        errorBoundary.show(error);
    } finally {
        loadingState.hide();
    }
}

async function loadClasses() {
    try {
        const classes = await classesService.getTeacherClasses(authService.auth.currentUser.uid);
        const classFilters = [
            document.getElementById('class-filter'),
            document.getElementById('assignment-class')
        ];
        
        classFilters.forEach(select => {
            select.innerHTML = '<option value="">Select Class</option>';
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

        let assignments = [];
        if (classId) {
            assignments = await assignmentsService.getAssignmentsByClass(classId);
        } else {
            assignments = await assignmentsService.getByTeacher(authService.auth.currentUser.uid);
        }

        // Apply filters
        assignments = assignments.filter(assignment => {
            if (status && assignment.status !== status) return false;
            if (type && assignment.type !== type) return false;
            return true;
        });

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

async function createAssignment() {
    try {
        const form = document.getElementById('assignment-form');
        const formData = new FormData(form);
        
        const assignmentData = {
            title: formData.get('title'),
            description: formData.get('description'),
            classId: formData.get('class'),
            dueDate: new Date(formData.get('due-date')),
            type: formData.get('type'),
            points: parseInt(formData.get('points')),
            instructions: formData.get('instructions')
        };

        await assignmentsService.createAssignment(assignmentData);
        closeAssignmentModal();
        await loadAssignments();
        showSuccess('Assignment created successfully');
    } catch (error) {
        console.error('Error creating assignment:', error);
        showError(error.message || 'Failed to create assignment');
    }
}

async function editAssignment(assignmentId) {
    try {
        const assignment = await assignmentsService.getById(assignmentId);
        if (!assignment) {
            showError('Assignment not found');
            return;
        }

        // Populate form
        const form = document.getElementById('assignment-form');
        form.elements['title'].value = assignment.title;
        form.elements['description'].value = assignment.description;
        form.elements['class'].value = assignment.classId;
        form.elements['due-date'].value = new Date(assignment.dueDate.toDate()).toISOString().slice(0, 16);
        form.elements['type'].value = assignment.type;
        form.elements['points'].value = assignment.points;
        form.elements['instructions'].value = assignment.instructions;

        // Update form submission handler
        form.onsubmit = async (e) => {
            e.preventDefault();
            await updateAssignment(assignmentId);
        };

        // Show modal
        document.getElementById('assignment-modal').classList.remove('hidden');
    } catch (error) {
        console.error('Error editing assignment:', error);
        showError('Failed to load assignment details');
    }
}

async function updateAssignment(assignmentId) {
    try {
        const form = document.getElementById('assignment-form');
        const formData = new FormData(form);
        
        const assignmentData = {
            title: formData.get('title'),
            description: formData.get('description'),
            classId: formData.get('class'),
            dueDate: new Date(formData.get('due-date')),
            type: formData.get('type'),
            points: parseInt(formData.get('points')),
            instructions: formData.get('instructions')
        };

        await assignmentsService.updateAssignment(assignmentId, assignmentData);
        closeAssignmentModal();
        await loadAssignments();
        showSuccess('Assignment updated successfully');
    } catch (error) {
        console.error('Error updating assignment:', error);
        showError(error.message || 'Failed to update assignment');
    }
}

function closeAssignmentModal() {
    const modal = document.getElementById('assignment-modal');
    modal.classList.add('hidden');
    document.getElementById('assignment-form').reset();
}

async function viewAssignmentDetails(assignmentId) {
    try {
        const assignment = await assignmentsService.getById(assignmentId);
        if (!assignment) {
            showError('Assignment not found');
            return;
        }

        const submissions = await assignmentsService.getSubmissions(assignmentId);
        
        // Update modal content
        document.getElementById('assignment-details-title').textContent = assignment.title;
        document.getElementById('assignment-details-description').textContent = assignment.description;
        document.getElementById('assignment-details-type').textContent = assignment.type;
        document.getElementById('assignment-details-due-date').textContent = formatDueDate(assignment.dueDate.toDate());
        document.getElementById('assignment-details-points').textContent = assignment.points;
        document.getElementById('assignment-details-status').textContent = assignment.status;
        
        // Render submissions
        const submissionsContainer = document.getElementById('submissions-list');
        submissionsContainer.innerHTML = submissions.length ? '' : '<p>No submissions yet</p>';
        
        submissions.forEach(submission => {
            const submissionEl = document.createElement('div');
            submissionEl.className = 'submission-item';
            submissionEl.innerHTML = `
                <div class="submission-header">
                    <span class="student-name">${submission.studentName}</span>
                    <span class="submission-time">${formatSubmissionTime(submission.submittedAt)}</span>
                </div>
                <div class="submission-content">
                    <p>${submission.content}</p>
                    ${submission.attachments ? `
                        <div class="attachments">
                            ${submission.attachments.map(att => `
                                <a href="${att.url}" target="_blank" class="attachment">
                                    ${att.name}
                                </a>
                            `).join('')}
                        </div>
                    ` : ''}
                </div>
                <div class="grading-section">
                    <input type="number" class="grade-input" value="${submission.grade || ''}" 
                           placeholder="Grade (/${assignment.points})" max="${assignment.points}">
                    <textarea class="feedback-input" placeholder="Feedback">${submission.feedback || ''}</textarea>
                    <button onclick="gradeSubmission('${assignmentId}', '${submission.id}', this.parentElement)">
                        Save Grade
                    </button>
                </div>
            `;
            submissionsContainer.appendChild(submissionEl);
        });

        // Show modal
        document.getElementById('assignment-details-modal').classList.remove('hidden');
    } catch (error) {
        console.error('Error viewing assignment details:', error);
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
    modal.classList.add('hidden');
}

async function duplicateAssignment(assignmentId) {
    try {
        const original = await assignmentsService.getById(assignmentId);
        if (!original) {
            showError('Assignment not found');
            return;
        }

        const { id, submissions, createdAt, createdBy, ...assignmentData } = original;
        assignmentData.title = `Copy of ${assignmentData.title}`;
        
        await assignmentsService.createAssignment(assignmentData);
        await loadAssignments();
        showSuccess('Assignment duplicated successfully');
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
        await assignmentsService.archiveAssignment(assignmentId);
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
        const exportUrl = await assignmentsService.exportAssignmentGrades(assignmentId);
        window.location.href = exportUrl;
    } catch (error) {
        console.error('Error exporting grades:', error);
        showError('Failed to export grades');
    }
}

function setupEventListeners() {
    // Clean up any existing listeners
    activeListeners.forEach(unsubscribe => unsubscribe());
    activeListeners = [];

    // Filter change handlers
    document.getElementById('class-filter').addEventListener('change', () => {
        loadingState.show();
        loadAssignments()
            .catch(error => errorBoundary.show(error))
            .finally(() => loadingState.hide());
    });

    document.getElementById('status-filter').addEventListener('change', () => {
        loadingState.show();
        loadAssignments()
            .catch(error => errorBoundary.show(error))
            .finally(() => loadingState.hide());
    });

    document.getElementById('type-filter').addEventListener('change', () => {
        loadingState.show();
        loadAssignments()
            .catch(error => errorBoundary.show(error))
            .finally(() => loadingState.hide());
    });

    // Modal handlers
    document.getElementById('create-assignment-btn').addEventListener('click', () => {
        const form = document.getElementById('assignment-form');
        form.reset();
        form.onsubmit = async (e) => {
            e.preventDefault();
            loadingState.show();
            try {
                await createAssignment();
                notification.success('Assignment created successfully');
            } catch (error) {
                console.error('Error creating assignment:', error);
                notification.error(error.message || 'Failed to create assignment');
            } finally {
                loadingState.hide();
            }
        };
        document.getElementById('assignment-modal').classList.remove('hidden');
    });

    // Close modal handlers
    document.querySelectorAll('.modal-close').forEach(button => {
        button.addEventListener('click', () => {
            button.closest('.modal').classList.add('hidden');
        });
    });

    // Export grades handler
    document.getElementById('export-grades-btn')?.addEventListener('click', () => {
        loadingState.show();
        exportGrades()
            .catch(error => notification.error('Failed to export grades'))
            .finally(() => loadingState.hide());
    });

    // Set up real-time listeners
    const classId = document.getElementById('class-filter').value;
    if (classId) {
        const unsubscribe = assignmentsService.setupAssignmentsListener(classId, (assignments) => {
            renderAssignmentsGrid(assignments);
        });
        activeListeners.push(unsubscribe);
    }
}

function showSuccess(message) {
    notification.success(message);
}

function showError(message) {
    notification.error(message);
}

// Clean up function
function cleanup() {
    activeListeners.forEach(unsubscribe => unsubscribe());
    activeListeners = [];
} 