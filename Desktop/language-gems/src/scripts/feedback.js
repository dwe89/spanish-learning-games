document.addEventListener('DOMContentLoaded', async () => {
    if (!await checkAuth()) {
        return;
    }

    initializeFeedback();
});

let activeFeedbackId = null;
let selectedSkills = new Set();

async function initializeFeedback() {
    try {
        await Promise.all([
            loadClasses(),
            loadFeedback()
        ]);
        
        setupEventListeners();
        setupDragAndDrop();
        showSuccess('Feedback loaded successfully');
    } catch (error) {
        console.error('Error initializing feedback:', error);
        showError('Failed to load feedback');
    }
}

async function loadClasses() {
    try {
        const classes = await window.teacherApiService.getClasses();
        const classFilter = document.getElementById('class-filter');
        const classSelect = document.querySelector('select[name="class"]');
        
        const classOptions = classes.map(cls => `
            <option value="${cls.id}">${cls.name}</option>
        `).join('');
        
        classFilter.innerHTML += classOptions;
        classSelect.innerHTML += classOptions;
    } catch (error) {
        console.error('Error loading classes:', error);
        showError('Failed to load classes');
    }
}

async function loadStudents(classId) {
    try {
        const students = await window.teacherApiService.getStudents(classId);
        const studentSelect = document.querySelector('select[name="student"]');
        
        studentSelect.innerHTML = `
            <option value="">Select Student</option>
            ${students.map(student => `
                <option value="${student.id}">${student.name}</option>
            `).join('')}
        `;
    } catch (error) {
        console.error('Error loading students:', error);
        showError('Failed to load students');
    }
}

async function loadFeedback() {
    try {
        const filters = getActiveFilters();
        const feedback = await window.teacherApiService.getFeedback(filters);
        updateStats(feedback.stats);
        renderFeedbackList(feedback.items);
    } catch (error) {
        console.error('Error loading feedback:', error);
        showError('Failed to load feedback');
    }
}

function getActiveFilters() {
    const filters = {
        class: document.getElementById('class-filter').value,
        types: Array.from(document.querySelectorAll('input[name="type"]:checked')).map(input => input.value),
        startDate: document.getElementById('start-date').value,
        endDate: document.getElementById('end-date').value
    };
    return filters;
}

function updateStats(stats) {
    document.getElementById('total-feedback').textContent = stats.total;
    document.getElementById('avg-rating').textContent = stats.averageRating.toFixed(1);
    document.getElementById('pending-feedback').textContent = stats.pending;
}

function renderFeedbackList(feedbackItems) {
    const feedbackList = document.querySelector('.feedback-list');
    
    if (feedbackItems.length === 0) {
        feedbackList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-clipboard-check"></i>
                <h3>No feedback found</h3>
                <p>Create new feedback to get started</p>
            </div>
        `;
        return;
    }
    
    feedbackList.innerHTML = feedbackItems.map(feedback => `
        <div class="feedback-card ${feedback.type}" onclick="viewFeedback('${feedback.id}')">
            <div class="feedback-header">
                <div class="student-info">
                    <div class="student-avatar">${feedback.student.name.charAt(0)}</div>
                    <div class="student-details">
                        <h3>${feedback.student.name}</h3>
                        <span class="class-name">${feedback.className}</span>
                    </div>
                </div>
                <div class="feedback-meta">
                    <span class="feedback-type ${feedback.type}">${formatFeedbackType(feedback.type)}</span>
                    <div class="feedback-rating">
                        ${generateRatingStars(feedback.rating)}
                    </div>
                </div>
            </div>
            
            ${feedback.type === 'assessment' ? `
                <div class="assessment-info">
                    <div class="score-display">
                        <span class="score-value">${feedback.score}</span>
                        <span class="score-total">/${feedback.totalPoints}</span>
                    </div>
                    <div class="score-percentage">${calculatePercentage(feedback.score, feedback.totalPoints)}%</div>
                </div>
            ` : ''}
            
            <div class="feedback-preview">
                <p>${feedback.content}</p>
            </div>
            
            <div class="feedback-footer">
                <div class="feedback-date">
                    <i class="fas fa-calendar"></i>
                    ${formatDate(feedback.date)}
                </div>
                ${feedback.attachments.length > 0 ? `
                    <div class="attachment-count">
                        <i class="fas fa-paperclip"></i>
                        ${feedback.attachments.length}
                    </div>
                ` : ''}
            </div>
        </div>
    `).join('');
}

// Create Feedback
function createFeedback() {
    const modal = document.getElementById('feedback-modal');
    document.getElementById('feedback-form').reset();
    document.querySelector('.editor-content').innerHTML = '';
    document.querySelector('.uploaded-files').innerHTML = '';
    selectedSkills.clear();
    
    // Reset rating stars
    document.querySelectorAll('.rating-input i').forEach(star => {
        star.className = 'fas fa-star';
    });
    document.querySelector('input[name="rating"]').value = '';
    
    modal.style.display = 'block';
}

function closeFeedbackModal() {
    const modal = document.getElementById('feedback-modal');
    modal.style.display = 'none';
}

function toggleAssessmentFields(type) {
    const assessmentFields = document.getElementById('assessment-fields');
    if (type === 'assessment') {
        assessmentFields.style.display = 'block';
        loadSkills();
    } else {
        assessmentFields.style.display = 'none';
    }
}

async function loadSkills() {
    try {
        const skills = await window.teacherApiService.getSkills();
        const skillsSelect = document.querySelector('.skills-select');
        
        skillsSelect.innerHTML = skills.map(skill => `
            <label class="skill-option">
                <input type="checkbox" value="${skill.id}" onchange="toggleSkill('${skill.id}', '${skill.name}', this.checked)">
                <span class="skill-name">${skill.name}</span>
                <span class="skill-category">${skill.category}</span>
            </label>
        `).join('');
    } catch (error) {
        console.error('Error loading skills:', error);
        showError('Failed to load skills');
    }
}

function toggleSkill(id, name, checked) {
    if (checked) {
        selectedSkills.add({ id, name });
    } else {
        selectedSkills.delete({ id, name });
    }
}

// Rating Input
document.querySelectorAll('.rating-input i').forEach(star => {
    star.addEventListener('mouseover', function() {
        const rating = this.dataset.rating;
        updateStars(rating, true);
    });
    
    star.addEventListener('mouseout', function() {
        const currentRating = document.querySelector('input[name="rating"]').value;
        updateStars(currentRating, false);
    });
    
    star.addEventListener('click', function() {
        const rating = this.dataset.rating;
        document.querySelector('input[name="rating"]').value = rating;
        updateStars(rating, false);
    });
});

function updateStars(rating, hover) {
    document.querySelectorAll('.rating-input i').forEach(star => {
        const starRating = star.dataset.rating;
        if (starRating <= rating) {
            star.className = hover ? 'fas fa-star hover' : 'fas fa-star active';
        } else {
            star.className = 'fas fa-star';
        }
    });
}

// Rich Text Editor
function formatText(command) {
    document.execCommand(command, false, null);
}

function formatList(type) {
    if (type === 'bullet') {
        document.execCommand('insertUnorderedList', false, null);
    } else {
        document.execCommand('insertOrderedList', false, null);
    }
}

// File Upload
function setupDragAndDrop() {
    const uploadArea = document.getElementById('feedback-upload-area');
    const fileInput = document.getElementById('feedback-files');
    
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });
    
    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragover');
    });
    
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        handleFiles(e.dataTransfer.files);
    });
    
    fileInput.addEventListener('change', () => {
        handleFiles(fileInput.files);
    });
}

function handleFiles(files) {
    const uploadedFiles = document.querySelector('.uploaded-files');
    
    Array.from(files).forEach(file => {
        const fileElement = document.createElement('div');
        fileElement.className = 'uploaded-file';
        fileElement.innerHTML = `
            <i class="fas ${getFileIcon(file.type)}"></i>
            <span class="file-name">${file.name}</span>
            <span class="file-size">${formatFileSize(file.size)}</span>
            <button type="button" class="remove-file" onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;
        uploadedFiles.appendChild(fileElement);
    });
}

// Submit Feedback
async function submitFeedback(event) {
    event.preventDefault();
    
    const form = event.target;
    const formData = new FormData();
    
    formData.append('classId', form.class.value);
    formData.append('studentId', form.student.value);
    formData.append('type', form.type.value);
    formData.append('rating', form.rating.value);
    formData.append('content', document.querySelector('.editor-content').innerHTML);
    
    if (form.type.value === 'assessment') {
        formData.append('score', form.score.value);
        formData.append('totalPoints', form['total-points'].value);
        formData.append('skills', JSON.stringify(Array.from(selectedSkills)));
    }
    
    // Add attachments
    const fileElements = form.querySelector('.uploaded-files').children;
    Array.from(fileElements).forEach(element => {
        const fileName = element.querySelector('.file-name').textContent;
        const file = Array.from(document.getElementById('feedback-files').files)
            .find(f => f.name === fileName);
        if (file) {
            formData.append('files', file);
        }
    });
    
    try {
        await window.teacherApiService.createFeedback(formData);
        showSuccess('Feedback submitted successfully');
        closeFeedbackModal();
        await loadFeedback();
    } catch (error) {
        console.error('Error submitting feedback:', error);
        showError('Failed to submit feedback');
    }
}

// View Feedback
async function viewFeedback(feedbackId) {
    try {
        activeFeedbackId = feedbackId;
        const feedback = await window.teacherApiService.getFeedbackDetails(feedbackId);
        
        const modal = document.getElementById('view-feedback-modal');
        
        // Update feedback type and title
        modal.querySelector('.feedback-type').className = `feedback-type ${feedback.type}`;
        modal.querySelector('.feedback-type').textContent = formatFeedbackType(feedback.type);
        modal.querySelector('.feedback-title').textContent = feedback.title || 'Untitled Feedback';
        
        // Update student info
        modal.querySelector('.student-avatar').textContent = feedback.student.name.charAt(0);
        modal.querySelector('.student-name').textContent = feedback.student.name;
        modal.querySelector('.student-class').textContent = feedback.className;
        
        // Update rating
        modal.querySelector('.feedback-rating').innerHTML = generateRatingStars(feedback.rating);
        
        // Update assessment details if applicable
        const assessmentDetails = modal.querySelector('#assessment-details');
        if (feedback.type === 'assessment') {
            assessmentDetails.style.display = 'block';
            assessmentDetails.querySelector('.score-value').textContent = feedback.score;
            assessmentDetails.querySelector('.score-total').textContent = `/${feedback.totalPoints}`;
            assessmentDetails.querySelector('.score-percentage').textContent = 
                `${calculatePercentage(feedback.score, feedback.totalPoints)}%`;
            
            // Update skills grid
            const skillsGrid = assessmentDetails.querySelector('.skills-grid');
            skillsGrid.innerHTML = feedback.skills.map(skill => `
                <div class="skill-item">
                    <span class="skill-name">${skill.name}</span>
                    <span class="skill-level ${skill.level}">${skill.level}</span>
                </div>
            `).join('');
        } else {
            assessmentDetails.style.display = 'none';
        }
        
        // Update content
        modal.querySelector('.feedback-content').innerHTML = feedback.content;
        
        // Update attachments
        modal.querySelector('.feedback-attachments').innerHTML = feedback.attachments.map(file => `
            <div class="attachment-item">
                <i class="fas ${getFileIcon(file.type)}"></i>
                <span class="file-name">${file.name}</span>
                <span class="file-size">${formatFileSize(file.size)}</span>
                <button onclick="downloadAttachment('${file.id}')" class="download-button">
                    <i class="fas fa-download"></i>
                </button>
            </div>
        `).join('');
        
        // Update meta info
        modal.querySelector('.feedback-author').textContent = feedback.author;
        modal.querySelector('.feedback-date').textContent = formatDate(feedback.date);
        
        modal.style.display = 'block';
    } catch (error) {
        console.error('Error viewing feedback:', error);
        showError('Failed to load feedback details');
    }
}

function closeViewModal() {
    const modal = document.getElementById('view-feedback-modal');
    modal.style.display = 'none';
    activeFeedbackId = null;
}

// Feedback Actions
async function editFeedback() {
    try {
        const feedback = await window.teacherApiService.getFeedbackDetails(activeFeedbackId);
        
        // Populate create form with feedback data
        const form = document.getElementById('feedback-form');
        form.class.value = feedback.classId;
        await loadStudents(feedback.classId);
        form.student.value = feedback.studentId;
        form.type.value = feedback.type;
        form.rating.value = feedback.rating;
        updateStars(feedback.rating, false);
        
        // Handle assessment fields
        toggleAssessmentFields(feedback.type);
        if (feedback.type === 'assessment') {
            form.score.value = feedback.score;
            form['total-points'].value = feedback.totalPoints;
            
            // Wait for skills to load
            await loadSkills();
            feedback.skills.forEach(skill => {
                const checkbox = document.querySelector(`input[value="${skill.id}"]`);
                if (checkbox) {
                    checkbox.checked = true;
                    toggleSkill(skill.id, skill.name, true);
                }
            });
        }
        
        // Update content
        document.querySelector('.editor-content').innerHTML = feedback.content;
        
        // Close view modal and open create modal
        closeViewModal();
        document.getElementById('feedback-modal').style.display = 'block';
    } catch (error) {
        console.error('Error editing feedback:', error);
        showError('Failed to load feedback for editing');
    }
}

async function printFeedback() {
    try {
        const printUrl = await window.teacherApiService.getFeedbackPrintUrl(activeFeedbackId);
        window.open(printUrl, '_blank');
    } catch (error) {
        console.error('Error printing feedback:', error);
        showError('Failed to print feedback');
    }
}

function shareFeedback() {
    document.getElementById('share-feedback-modal').style.display = 'block';
}

function closeShareModal() {
    document.getElementById('share-feedback-modal').style.display = 'none';
}

async function submitShare() {
    const shareData = {
        feedbackId: activeFeedbackId,
        shareWith: {
            student: document.getElementById('share-student').checked,
            parent: document.getElementById('share-parent').checked,
            admin: document.getElementById('share-admin').checked
        },
        notificationMethod: {
            email: document.getElementById('notify-email').checked,
            platform: document.getElementById('notify-platform').checked
        },
        message: document.querySelector('.form-textarea').value
    };
    
    try {
        await window.teacherApiService.shareFeedback(shareData);
        showSuccess('Feedback shared successfully');
        closeShareModal();
    } catch (error) {
        console.error('Error sharing feedback:', error);
        showError('Failed to share feedback');
    }
}

async function deleteFeedback() {
    if (!confirm('Are you sure you want to delete this feedback?')) {
        return;
    }
    
    try {
        await window.teacherApiService.deleteFeedback(activeFeedbackId);
        showSuccess('Feedback deleted successfully');
        closeViewModal();
        await loadFeedback();
    } catch (error) {
        console.error('Error deleting feedback:', error);
        showError('Failed to delete feedback');
    }
}

// Utility Functions
function formatFeedbackType(type) {
    return type.charAt(0).toUpperCase() + type.slice(1);
}

function generateRatingStars(rating) {
    return Array(5).fill(0).map((_, index) => `
        <i class="fas fa-star${index < rating ? ' active' : ''}"></i>
    `).join('');
}

function calculatePercentage(score, total) {
    return Math.round((score / total) * 100);
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
    });
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function getFileIcon(fileType) {
    const iconMap = {
        'application/pdf': 'fa-file-pdf',
        'application/msword': 'fa-file-word',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'fa-file-word',
        'application/vnd.ms-powerpoint': 'fa-file-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'fa-file-powerpoint',
        'image/jpeg': 'fa-file-image',
        'image/png': 'fa-file-image',
        'image/gif': 'fa-file-image',
        'application/zip': 'fa-file-archive'
    };
    return iconMap[fileType] || 'fa-file';
}

function setupEventListeners() {
    // Feedback search
    let searchTimeout;
    document.getElementById('feedback-search').addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            const searchTerm = e.target.value.toLowerCase();
            const feedbackCards = document.querySelectorAll('.feedback-card');
            
            feedbackCards.forEach(card => {
                const studentName = card.querySelector('.student-details h3').textContent.toLowerCase();
                const className = card.querySelector('.class-name').textContent.toLowerCase();
                const content = card.querySelector('.feedback-preview p').textContent.toLowerCase();
                
                if (studentName.includes(searchTerm) || className.includes(searchTerm) || content.includes(searchTerm)) {
                    card.style.display = 'block';
                } else {
                    card.style.display = 'none';
                }
            });
        }, 300);
    });
    
    // Filter changes
    document.getElementById('class-filter').addEventListener('change', loadFeedback);
    document.querySelectorAll('input[name="type"]').forEach(input => {
        input.addEventListener('change', loadFeedback);
    });
    
    // Date filter changes
    document.getElementById('start-date').addEventListener('change', loadFeedback);
    document.getElementById('end-date').addEventListener('change', loadFeedback);
}

function showSuccess(message) {
    // Implementation depends on your toast/notification system
    console.log('Success:', message);
}

function showError(message) {
    // Implementation depends on your toast/notification system
    console.error('Error:', message);
} 