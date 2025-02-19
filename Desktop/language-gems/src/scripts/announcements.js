document.addEventListener('DOMContentLoaded', async () => {
    if (!await checkAuth()) {
        return;
    }

    initializeAnnouncements();
});

let activeAnnouncementId = null;
let selectedStudents = new Set();
let selectedClasses = new Set();

async function initializeAnnouncements() {
    try {
        await loadAnnouncements();
        setupEventListeners();
        setupDragAndDrop();
        showSuccess('Announcements loaded successfully');
    } catch (error) {
        console.error('Error initializing announcements:', error);
        showError('Failed to load announcements');
    }
}

async function loadAnnouncements() {
    try {
        const filters = getActiveFilters();
        const announcements = await window.teacherApiService.getAnnouncements(filters);
        renderAnnouncementsList(announcements);
    } catch (error) {
        console.error('Error loading announcements:', error);
        showError('Failed to load announcements');
    }
}

function getActiveFilters() {
    const filters = {
        status: document.querySelector('input[name="status"]:checked').value,
        priority: Array.from(document.querySelectorAll('input[name="priority"]:checked')).map(input => input.value),
        audience: Array.from(document.querySelectorAll('input[name="audience"]:checked')).map(input => input.value)
    };
    return filters;
}

function renderAnnouncementsList(announcements) {
    const announcementsList = document.querySelector('.announcements-list');
    
    if (announcements.length === 0) {
        announcementsList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-bullhorn"></i>
                <h3>No announcements</h3>
                <p>Create a new announcement to get started</p>
            </div>
        `;
        return;
    }
    
    announcementsList.innerHTML = announcements.map(announcement => `
        <div class="announcement-card ${announcement.status}" onclick="viewAnnouncement('${announcement.id}')">
            <div class="announcement-header">
                <span class="priority-badge ${announcement.priority}">${announcement.priority}</span>
                <div class="announcement-meta">
                    <h3>${announcement.title}</h3>
                    <span class="announcement-time">${formatDate(announcement.startDate)}</span>
                </div>
            </div>
            <div class="announcement-preview">
                <p>${announcement.content}</p>
            </div>
            <div class="announcement-footer">
                <div class="audience-info">
                    <i class="fas fa-users"></i>
                    <span>${formatAudience(announcement.audience)}</span>
                </div>
                <div class="stats">
                    <span class="stat">
                        <i class="fas fa-eye"></i>
                        ${announcement.viewCount}
                    </span>
                    <span class="stat">
                        <i class="fas fa-check-circle"></i>
                        ${announcement.acknowledgmentCount}
                    </span>
                </div>
            </div>
        </div>
    `).join('');
}

function formatAudience(audience) {
    if (audience.type === 'all-classes') {
        return 'All Classes';
    }
    if (audience.type === 'specific-classes') {
        return `${audience.classes.length} Classes`;
    }
    return `${audience.students.length} Students`;
}

// Create Announcement
function createAnnouncement() {
    const modal = document.getElementById('announcement-modal');
    document.getElementById('announcement-form').reset();
    document.querySelector('.editor-content').innerHTML = '';
    document.querySelector('.uploaded-files').innerHTML = '';
    selectedStudents.clear();
    selectedClasses.clear();
    
    // Set default start date to now
    const startDateInput = document.querySelector('input[name="start-date"]');
    startDateInput.value = formatDateTimeLocal(new Date());
    
    modal.style.display = 'block';
}

function closeAnnouncementModal() {
    const modal = document.getElementById('announcement-modal');
    modal.style.display = 'none';
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

function addLink() {
    const url = prompt('Enter URL:');
    if (url) {
        document.execCommand('createLink', false, url);
    }
}

// File Upload
function setupDragAndDrop() {
    const uploadArea = document.getElementById('announcement-upload-area');
    const fileInput = document.getElementById('announcement-files');
    
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

// Audience Selection
function toggleClassSelect(value) {
    const classSelect = document.getElementById('class-select');
    const studentSelect = document.getElementById('student-select');
    
    if (value === 'specific-classes') {
        classSelect.style.display = 'block';
        studentSelect.style.display = 'none';
        loadClasses();
    } else if (value === 'individual-students') {
        classSelect.style.display = 'none';
        studentSelect.style.display = 'block';
    } else {
        classSelect.style.display = 'none';
        studentSelect.style.display = 'none';
    }
}

async function loadClasses() {
    try {
        const classes = await window.teacherApiService.getClasses();
        const classOptions = document.querySelector('.class-options');
        
        classOptions.innerHTML = classes.map(cls => `
            <label class="class-option">
                <input type="checkbox" value="${cls.id}" onchange="toggleClass('${cls.id}', '${cls.name}', this.checked)">
                <span class="class-name">${cls.name}</span>
                <span class="student-count">${cls.studentCount} students</span>
            </label>
        `).join('');
    } catch (error) {
        console.error('Error loading classes:', error);
        showError('Failed to load classes');
    }
}

function toggleClass(id, name, checked) {
    if (checked) {
        selectedClasses.add({ id, name });
    } else {
        selectedClasses.delete({ id, name });
    }
}

async function searchStudents(query) {
    try {
        const results = await window.teacherApiService.searchStudents(query);
        const suggestions = document.querySelector('.student-suggestions');
        
        if (results.length === 0) {
            suggestions.innerHTML = '<div class="no-results">No results found</div>';
            return;
        }
        
        suggestions.innerHTML = results.map(student => `
            <div class="student-suggestion" onclick="addStudent('${student.id}', '${student.name}')">
                <div class="student-avatar">${student.name.charAt(0)}</div>
                <div class="student-info">
                    <div class="student-name">${student.name}</div>
                    <div class="student-class">${student.className}</div>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error searching students:', error);
        showError('Failed to search students');
    }
}

function addStudent(id, name) {
    if (selectedStudents.has(id)) {
        return;
    }
    
    selectedStudents.add(id);
    
    const studentTag = document.createElement('div');
    studentTag.className = 'student-tag';
    studentTag.innerHTML = `
        <span>${name}</span>
        <button type="button" onclick="removeStudent('${id}', this.parentElement)">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    document.querySelector('.selected-students').appendChild(studentTag);
    document.querySelector('.student-suggestions').innerHTML = '';
    document.querySelector('.student-search input').value = '';
}

function removeStudent(id, element) {
    selectedStudents.delete(id);
    element.remove();
}

// Submit Announcement
async function submitAnnouncement(event) {
    event.preventDefault();
    
    const form = event.target;
    const formData = new FormData();
    
    formData.append('title', form.title.value);
    formData.append('content', document.querySelector('.editor-content').innerHTML);
    formData.append('priority', form.priority.value);
    
    const audience = form.audience.value;
    formData.append('audienceType', audience);
    
    if (audience === 'specific-classes') {
        formData.append('classes', JSON.stringify(Array.from(selectedClasses)));
    } else if (audience === 'individual-students') {
        formData.append('students', JSON.stringify(Array.from(selectedStudents)));
    }
    
    formData.append('startDate', form['start-date'].value);
    if (form['end-date'].value) {
        formData.append('endDate', form['end-date'].value);
    }
    
    // Add attachments
    const fileElements = form.querySelector('.uploaded-files').children;
    Array.from(fileElements).forEach(element => {
        const fileName = element.querySelector('.file-name').textContent;
        const file = Array.from(document.getElementById('announcement-files').files)
            .find(f => f.name === fileName);
        if (file) {
            formData.append('files', file);
        }
    });
    
    try {
        await window.teacherApiService.createAnnouncement(formData);
        showSuccess('Announcement published successfully');
        closeAnnouncementModal();
        await loadAnnouncements();
    } catch (error) {
        console.error('Error creating announcement:', error);
        showError('Failed to publish announcement');
    }
}

// View Announcement
async function viewAnnouncement(announcementId) {
    try {
        activeAnnouncementId = announcementId;
        const announcement = await window.teacherApiService.getAnnouncementDetails(announcementId);
        
        const modal = document.getElementById('view-announcement-modal');
        
        // Update announcement info
        modal.querySelector('.priority-badge').className = `priority-badge ${announcement.priority}`;
        modal.querySelector('.priority-badge').textContent = announcement.priority;
        modal.querySelector('.announcement-title').textContent = announcement.title;
        modal.querySelector('.announcement-author').textContent = announcement.author;
        modal.querySelector('.announcement-date').textContent = formatDateRange(announcement.startDate, announcement.endDate);
        modal.querySelector('.announcement-audience').textContent = formatAudience(announcement.audience);
        
        // Update content
        modal.querySelector('.announcement-content').innerHTML = announcement.content;
        
        // Update attachments
        modal.querySelector('.announcement-attachments').innerHTML = announcement.attachments.map(file => `
            <div class="attachment-item">
                <i class="fas ${getFileIcon(file.type)}"></i>
                <span class="file-name">${file.name}</span>
                <span class="file-size">${formatFileSize(file.size)}</span>
                <button onclick="downloadAttachment('${file.id}')" class="download-button">
                    <i class="fas fa-download"></i>
                </button>
            </div>
        `).join('');
        
        // Update stats
        modal.querySelector('.views-count').textContent = announcement.viewCount;
        modal.querySelector('.ack-count').textContent = announcement.acknowledgmentCount;
        
        modal.style.display = 'block';
    } catch (error) {
        console.error('Error viewing announcement:', error);
        showError('Failed to load announcement details');
    }
}

function closeViewModal() {
    const modal = document.getElementById('view-announcement-modal');
    modal.style.display = 'none';
    activeAnnouncementId = null;
}

// Announcement Actions
async function editAnnouncement() {
    try {
        const announcement = await window.teacherApiService.getAnnouncementDetails(activeAnnouncementId);
        
        // Populate create form with announcement data
        const form = document.getElementById('announcement-form');
        form.title.value = announcement.title;
        document.querySelector('.editor-content').innerHTML = announcement.content;
        form.priority.value = announcement.priority;
        form.audience.value = announcement.audience.type;
        
        // Set dates
        form['start-date'].value = formatDateTimeLocal(new Date(announcement.startDate));
        if (announcement.endDate) {
            form['end-date'].value = formatDateTimeLocal(new Date(announcement.endDate));
        }
        
        // Handle audience selection
        toggleClassSelect(announcement.audience.type);
        if (announcement.audience.type === 'specific-classes') {
            announcement.audience.classes.forEach(cls => {
                const checkbox = document.querySelector(`input[value="${cls.id}"]`);
                if (checkbox) {
                    checkbox.checked = true;
                    toggleClass(cls.id, cls.name, true);
                }
            });
        } else if (announcement.audience.type === 'individual-students') {
            announcement.audience.students.forEach(student => {
                addStudent(student.id, student.name);
            });
        }
        
        // Close view modal and open create modal
        closeViewModal();
        document.getElementById('announcement-modal').style.display = 'block';
    } catch (error) {
        console.error('Error editing announcement:', error);
        showError('Failed to load announcement for editing');
    }
}

async function duplicateAnnouncement() {
    try {
        await window.teacherApiService.duplicateAnnouncement(activeAnnouncementId);
        showSuccess('Announcement duplicated successfully');
        closeViewModal();
        await loadAnnouncements();
    } catch (error) {
        console.error('Error duplicating announcement:', error);
        showError('Failed to duplicate announcement');
    }
}

async function deleteAnnouncement() {
    if (!confirm('Are you sure you want to delete this announcement?')) {
        return;
    }
    
    try {
        await window.teacherApiService.deleteAnnouncement(activeAnnouncementId);
        showSuccess('Announcement deleted successfully');
        closeViewModal();
        await loadAnnouncements();
    } catch (error) {
        console.error('Error deleting announcement:', error);
        showError('Failed to delete announcement');
    }
}

// Utility Functions
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

function formatDateRange(startDate, endDate) {
    const start = new Date(startDate);
    const formattedStart = formatDate(start);
    
    if (!endDate) {
        return `From ${formattedStart}`;
    }
    
    const end = new Date(endDate);
    const formattedEnd = formatDate(end);
    return `${formattedStart} - ${formattedEnd}`;
}

function formatDateTimeLocal(date) {
    return date.toISOString().slice(0, 16);
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
    // Announcement search
    let searchTimeout;
    document.getElementById('announcement-search').addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            const searchTerm = e.target.value.toLowerCase();
            const announcementCards = document.querySelectorAll('.announcement-card');
            
            announcementCards.forEach(card => {
                const title = card.querySelector('h3').textContent.toLowerCase();
                const content = card.querySelector('.announcement-preview p').textContent.toLowerCase();
                
                if (title.includes(searchTerm) || content.includes(searchTerm)) {
                    card.style.display = 'block';
                } else {
                    card.style.display = 'none';
                }
            });
        }, 300);
    });
    
    // Filter changes
    document.querySelectorAll('input[name="status"], input[name="priority"], input[name="audience"]')
        .forEach(input => {
            input.addEventListener('change', loadAnnouncements);
        });
    
    // Student search
    let studentSearchTimeout;
    const studentSearchInput = document.querySelector('.student-search input');
    if (studentSearchInput) {
        studentSearchInput.addEventListener('input', (e) => {
            clearTimeout(studentSearchTimeout);
            studentSearchTimeout = setTimeout(() => {
                const query = e.target.value.trim();
                if (query) {
                    searchStudents(query);
                } else {
                    document.querySelector('.student-suggestions').innerHTML = '';
                }
            }, 300);
        });
    }
}

function showSuccess(message) {
    // Implementation depends on your toast/notification system
    console.log('Success:', message);
}

function showError(message) {
    // Implementation depends on your toast/notification system
    console.error('Error:', message);
} 