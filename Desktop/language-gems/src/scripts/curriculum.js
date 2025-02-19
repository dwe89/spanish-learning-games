document.addEventListener('DOMContentLoaded', async () => {
    if (!await checkAuth()) {
        return;
    }

    initializeCurriculum();
});

let activeUnitId = null;
let activeLessonId = null;

async function initializeCurriculum() {
    try {
        await Promise.all([
            loadClasses(),
            loadCurriculum()
        ]);
        
        setupEventListeners();
        setupDragAndDrop();
        showSuccess('Curriculum loaded successfully');
    } catch (error) {
        console.error('Error initializing curriculum:', error);
        showError('Failed to load curriculum');
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

async function loadCurriculum() {
    try {
        const filters = getActiveFilters();
        const curriculum = await window.teacherApiService.getCurriculum(filters);
        updateStats(curriculum.stats);
        renderUnitsList(curriculum.units);
    } catch (error) {
        console.error('Error loading curriculum:', error);
        showError('Failed to load curriculum');
    }
}

function getActiveFilters() {
    return {
        class: document.getElementById('class-filter').value,
        level: document.getElementById('level-filter').value,
        status: document.getElementById('status-filter').value
    };
}

function updateStats(stats) {
    document.getElementById('total-units').textContent = stats.totalUnits;
    document.getElementById('total-lessons').textContent = stats.totalLessons;
    document.getElementById('completion-rate').textContent = `${stats.averageCompletion}%`;
    document.getElementById('active-students').textContent = stats.activeStudents;
}

function renderUnitsList(units) {
    const unitsList = document.querySelector('.units-list');
    
    if (units.length === 0) {
        unitsList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-book"></i>
                <h3>No units found</h3>
                <p>Create a new unit to get started</p>
            </div>
        `;
        return;
    }
    
    unitsList.innerHTML = units.map(unit => `
        <div class="unit-card" onclick="viewUnit('${unit.id}')">
            <div class="unit-header">
                <div class="unit-info">
                    <span class="unit-level ${unit.level}">${formatLevel(unit.level)}</span>
                    <h3>${unit.title}</h3>
                    <span class="class-name">${unit.className}</span>
                </div>
                <div class="unit-meta">
                    <div class="meta-item">
                        <i class="fas fa-book"></i>
                        <span>${unit.lessonsCount} Lessons</span>
                    </div>
                    <div class="meta-item">
                        <i class="fas fa-clock"></i>
                        <span>${formatDuration(unit.totalDuration)}</span>
                    </div>
                </div>
            </div>
            <div class="unit-progress">
                <div class="progress-bar">
                    <div class="progress" style="width: ${unit.completionRate}%"></div>
                </div>
                <span class="progress-text">${unit.completionRate}% Complete</span>
            </div>
            <div class="unit-preview">
                <p>${unit.description}</p>
            </div>
            <div class="unit-footer">
                <div class="status ${unit.status}">${formatStatus(unit.status)}</div>
                <div class="lesson-count">
                    <i class="fas fa-users"></i>
                    ${unit.activeStudents} Students
                </div>
            </div>
        </div>
    `).join('');
}

// Unit Management
function createUnit() {
    const modal = document.getElementById('unit-modal');
    document.getElementById('unit-form').reset();
    document.querySelector('.objectives-list').innerHTML = `
        <div class="objective-item">
            <input type="text" class="form-input" name="objectives[]" required>
            <button type="button" class="remove-objective" onclick="removeObjective(this)">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    modal.style.display = 'block';
}

function closeUnitModal() {
    document.getElementById('unit-modal').style.display = 'none';
}

function addObjective() {
    const objectivesList = document.querySelector('.objectives-list');
    const objectiveItem = document.createElement('div');
    objectiveItem.className = 'objective-item';
    objectiveItem.innerHTML = `
        <input type="text" class="form-input" name="objectives[]" required>
        <button type="button" class="remove-objective" onclick="removeObjective(this)">
            <i class="fas fa-times"></i>
        </button>
    `;
    objectivesList.appendChild(objectiveItem);
}

function removeObjective(button) {
    const objectivesList = document.querySelector('.objectives-list');
    if (objectivesList.children.length > 1) {
        button.parentElement.remove();
    }
}

async function submitUnit(event) {
    event.preventDefault();
    
    const form = event.target;
    const formData = {
        title: form.title.value,
        description: form.description.value,
        classId: form.class.value,
        level: form.level.value,
        objectives: Array.from(form.querySelectorAll('input[name="objectives[]"]'))
            .map(input => input.value)
    };
    
    try {
        await window.teacherApiService.createUnit(formData);
        showSuccess('Unit created successfully');
        closeUnitModal();
        await loadCurriculum();
    } catch (error) {
        console.error('Error creating unit:', error);
        showError('Failed to create unit');
    }
}

async function viewUnit(unitId) {
    try {
        activeUnitId = unitId;
        const unit = await window.teacherApiService.getUnitDetails(unitId);
        
        const modal = document.getElementById('view-unit-modal');
        
        // Update unit level and title
        modal.querySelector('.unit-level').className = `unit-level ${unit.level}`;
        modal.querySelector('.unit-level').textContent = formatLevel(unit.level);
        modal.querySelector('.modal-title').textContent = unit.title;
        
        // Update meta information
        modal.querySelector('.class-name').textContent = unit.className;
        modal.querySelector('.total-duration').textContent = formatDuration(unit.totalDuration);
        modal.querySelector('.lessons-count').textContent = `${unit.lessonsCount} Lessons`;
        
        // Update description
        modal.querySelector('.unit-description').textContent = unit.description;
        
        // Update objectives
        modal.querySelector('.objectives-list').innerHTML = unit.objectives
            .map(objective => `<li>${objective}</li>`).join('');
        
        // Update lessons list
        modal.querySelector('.lessons-list').innerHTML = unit.lessons.map(lesson => `
            <div class="lesson-item" onclick="viewLesson('${lesson.id}')">
                <div class="lesson-info">
                    <span class="lesson-number">Lesson ${lesson.order}</span>
                    <h4>${lesson.title}</h4>
                    <span class="duration">${formatDuration(lesson.duration)}</span>
                </div>
                <div class="lesson-progress">
                    <div class="progress-bar">
                        <div class="progress" style="width: ${lesson.completionRate}%"></div>
                    </div>
                    <span class="progress-text">${lesson.completionRate}% Complete</span>
                </div>
            </div>
        `).join('');
        
        // Initialize progress chart
        initializeProgressChart(unit.progress);
        
        modal.style.display = 'block';
    } catch (error) {
        console.error('Error viewing unit:', error);
        showError('Failed to load unit details');
    }
}

function closeViewUnitModal() {
    document.getElementById('view-unit-modal').style.display = 'none';
    activeUnitId = null;
}

async function editUnit() {
    try {
        const unit = await window.teacherApiService.getUnitDetails(activeUnitId);
        
        // Populate unit form
        const form = document.getElementById('unit-form');
        form.title.value = unit.title;
        form.description.value = unit.description;
        form.class.value = unit.classId;
        form.level.value = unit.level;
        
        // Update objectives
        const objectivesList = form.querySelector('.objectives-list');
        objectivesList.innerHTML = unit.objectives.map(objective => `
            <div class="objective-item">
                <input type="text" class="form-input" name="objectives[]" value="${objective}" required>
                <button type="button" class="remove-objective" onclick="removeObjective(this)">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `).join('');
        
        // Close view modal and open edit modal
        closeViewUnitModal();
        document.getElementById('unit-modal').style.display = 'block';
    } catch (error) {
        console.error('Error editing unit:', error);
        showError('Failed to load unit for editing');
    }
}

async function duplicateUnit() {
    try {
        await window.teacherApiService.duplicateUnit(activeUnitId);
        showSuccess('Unit duplicated successfully');
        closeViewUnitModal();
        await loadCurriculum();
    } catch (error) {
        console.error('Error duplicating unit:', error);
        showError('Failed to duplicate unit');
    }
}

async function deleteUnit() {
    if (!confirm('Are you sure you want to delete this unit? This will also delete all lessons within the unit.')) {
        return;
    }
    
    try {
        await window.teacherApiService.deleteUnit(activeUnitId);
        showSuccess('Unit deleted successfully');
        closeViewUnitModal();
        await loadCurriculum();
    } catch (error) {
        console.error('Error deleting unit:', error);
        showError('Failed to delete unit');
    }
}

// Lesson Management
function createLesson() {
    const modal = document.getElementById('lesson-modal');
    document.getElementById('lesson-form').reset();
    document.querySelector('.editor-content').innerHTML = '';
    document.querySelector('.uploaded-files').innerHTML = '';
    loadUnits();
    modal.style.display = 'block';
}

function closeLessonModal() {
    document.getElementById('lesson-modal').style.display = 'none';
}

async function loadUnits() {
    try {
        const units = await window.teacherApiService.getUnits();
        const unitSelect = document.querySelector('select[name="unit"]');
        
        unitSelect.innerHTML = `
            <option value="">Select Unit</option>
            ${units.map(unit => `
                <option value="${unit.id}">${unit.title}</option>
            `).join('')}
        `;
    } catch (error) {
        console.error('Error loading units:', error);
        showError('Failed to load units');
    }
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
    const uploadArea = document.getElementById('lesson-upload-area');
    const fileInput = document.getElementById('lesson-files');
    
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

async function submitLesson(event) {
    event.preventDefault();
    
    const form = event.target;
    const formData = new FormData();
    
    formData.append('title', form.title.value);
    formData.append('unitId', form.unit.value);
    formData.append('description', form.description.value);
    formData.append('duration', form.duration.value);
    formData.append('order', form.order.value);
    formData.append('content', document.querySelector('.editor-content').innerHTML);
    
    // Add resources
    const fileElements = form.querySelector('.uploaded-files').children;
    Array.from(fileElements).forEach(element => {
        const fileName = element.querySelector('.file-name').textContent;
        const file = Array.from(document.getElementById('lesson-files').files)
            .find(f => f.name === fileName);
        if (file) {
            formData.append('resources', file);
        }
    });
    
    try {
        await window.teacherApiService.createLesson(formData);
        showSuccess('Lesson created successfully');
        closeLessonModal();
        await loadCurriculum();
    } catch (error) {
        console.error('Error creating lesson:', error);
        showError('Failed to create lesson');
    }
}

async function viewLesson(lessonId) {
    try {
        activeLessonId = lessonId;
        const lesson = await window.teacherApiService.getLessonDetails(lessonId);
        
        const modal = document.getElementById('view-lesson-modal');
        
        // Update lesson number and title
        modal.querySelector('.lesson-number').textContent = `Lesson ${lesson.order}`;
        modal.querySelector('.modal-title').textContent = lesson.title;
        
        // Update meta information
        modal.querySelector('.duration').textContent = formatDuration(lesson.duration);
        modal.querySelector('.completion-rate').textContent = `${lesson.completionRate}% Complete`;
        
        // Update description and content
        modal.querySelector('.lesson-description').textContent = lesson.description;
        modal.querySelector('.lesson-content').innerHTML = lesson.content;
        
        // Update resources
        modal.querySelector('.resources-list').innerHTML = lesson.resources.map(resource => `
            <div class="resource-item">
                <i class="fas ${getFileIcon(resource.type)}"></i>
                <span class="resource-name">${resource.name}</span>
                <span class="resource-size">${formatFileSize(resource.size)}</span>
                <button onclick="downloadResource('${resource.id}')" class="download-button">
                    <i class="fas fa-download"></i>
                </button>
            </div>
        `).join('');
        
        // Update progress list
        modal.querySelector('.progress-list').innerHTML = lesson.studentProgress.map(progress => `
            <div class="student-progress">
                <div class="student-info">
                    <div class="student-avatar">${progress.studentName.charAt(0)}</div>
                    <span class="student-name">${progress.studentName}</span>
                </div>
                <div class="progress-bar">
                    <div class="progress" style="width: ${progress.completionRate}%"></div>
                </div>
                <span class="progress-text">${progress.completionRate}% Complete</span>
            </div>
        `).join('');
        
        modal.style.display = 'block';
    } catch (error) {
        console.error('Error viewing lesson:', error);
        showError('Failed to load lesson details');
    }
}

function closeViewLessonModal() {
    document.getElementById('view-lesson-modal').style.display = 'none';
    activeLessonId = null;
}

async function editLesson() {
    try {
        const lesson = await window.teacherApiService.getLessonDetails(activeLessonId);
        
        // Populate lesson form
        const form = document.getElementById('lesson-form');
        form.title.value = lesson.title;
        await loadUnits();
        form.unit.value = lesson.unitId;
        form.description.value = lesson.description;
        form.duration.value = lesson.duration;
        form.order.value = lesson.order;
        
        // Update content
        document.querySelector('.editor-content').innerHTML = lesson.content;
        
        // Update resources
        const uploadedFiles = form.querySelector('.uploaded-files');
        uploadedFiles.innerHTML = lesson.resources.map(resource => `
            <div class="uploaded-file">
                <i class="fas ${getFileIcon(resource.type)}"></i>
                <span class="file-name">${resource.name}</span>
                <span class="file-size">${formatFileSize(resource.size)}</span>
                <button type="button" class="remove-file" onclick="this.parentElement.remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `).join('');
        
        // Close view modal and open edit modal
        closeViewLessonModal();
        document.getElementById('lesson-modal').style.display = 'block';
    } catch (error) {
        console.error('Error editing lesson:', error);
        showError('Failed to load lesson for editing');
    }
}

async function duplicateLesson() {
    try {
        await window.teacherApiService.duplicateLesson(activeLessonId);
        showSuccess('Lesson duplicated successfully');
        closeViewLessonModal();
        await loadCurriculum();
    } catch (error) {
        console.error('Error duplicating lesson:', error);
        showError('Failed to duplicate lesson');
    }
}

async function deleteLesson() {
    if (!confirm('Are you sure you want to delete this lesson?')) {
        return;
    }
    
    try {
        await window.teacherApiService.deleteLesson(activeLessonId);
        showSuccess('Lesson deleted successfully');
        closeViewLessonModal();
        await loadCurriculum();
    } catch (error) {
        console.error('Error deleting lesson:', error);
        showError('Failed to delete lesson');
    }
}

// Progress Chart
function initializeProgressChart(progressData) {
    const ctx = document.querySelector('.progress-chart').getContext('2d');
    
    if (window.progressChart) {
        window.progressChart.destroy();
    }
    
    window.progressChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: progressData.labels,
            datasets: [{
                label: 'Class Progress',
                data: progressData.values,
                borderColor: 'var(--primary)',
                backgroundColor: 'rgba(var(--primary-rgb), 0.1)',
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        callback: value => `${value}%`
                    }
                }
            }
        }
    });
}

// Utility Functions
function formatLevel(level) {
    return level.charAt(0).toUpperCase() + level.slice(1);
}

function formatStatus(status) {
    return status.charAt(0).toUpperCase() + status.slice(1);
}

function formatDuration(minutes) {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (hours === 0) {
        return `${minutes} min`;
    }
    
    return `${hours}h ${remainingMinutes}min`;
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
        'application/zip': 'fa-file-archive',
        'video/mp4': 'fa-file-video',
        'audio/mpeg': 'fa-file-audio'
    };
    return iconMap[fileType] || 'fa-file';
}

function setupEventListeners() {
    // Curriculum search
    let searchTimeout;
    document.getElementById('curriculum-search').addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            const searchTerm = e.target.value.toLowerCase();
            const unitCards = document.querySelectorAll('.unit-card');
            
            unitCards.forEach(card => {
                const title = card.querySelector('h3').textContent.toLowerCase();
                const className = card.querySelector('.class-name').textContent.toLowerCase();
                const description = card.querySelector('.unit-preview p').textContent.toLowerCase();
                
                if (title.includes(searchTerm) || className.includes(searchTerm) || description.includes(searchTerm)) {
                    card.style.display = 'block';
                } else {
                    card.style.display = 'none';
                }
            });
        }, 300);
    });
    
    // Filter changes
    document.getElementById('class-filter').addEventListener('change', loadCurriculum);
    document.getElementById('level-filter').addEventListener('change', loadCurriculum);
    document.getElementById('status-filter').addEventListener('change', loadCurriculum);
    
    // Upload area click
    document.getElementById('lesson-upload-area').addEventListener('click', () => {
        document.getElementById('lesson-files').click();
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