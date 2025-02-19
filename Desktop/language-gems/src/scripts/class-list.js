document.addEventListener('DOMContentLoaded', async () => {
    if (!await checkAuth()) {
        return;
    }

    initializeClassList();
});

async function initializeClassList() {
    try {
        await loadClasses();
        setupEventListeners();
        showSuccess('Class list loaded successfully');
    } catch (error) {
        console.error('Error initializing class list:', error);
        showError('Failed to load class list');
    }
}

async function loadClasses() {
    try {
        const termFilter = document.getElementById('term-filter').value;
        const levelFilter = document.getElementById('level-filter').value;
        
        const classes = await window.teacherApiService.getClasses(termFilter, levelFilter);
        renderClassGrid(classes);
    } catch (error) {
        console.error('Error loading classes:', error);
        showError('Failed to load classes');
    }
}

function renderClassGrid(classes) {
    const classGrid = document.querySelector('.class-grid');
    
    if (classes.length === 0) {
        classGrid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-users"></i>
                <h3>No Classes Found</h3>
                <p>Create a new class to get started</p>
            </div>
        `;
        return;
    }
    
    classGrid.innerHTML = classes.map(classItem => `
        <div class="class-card ${classItem.status.toLowerCase()}" onclick="viewClassDetails('${classItem.id}')">
            <div class="class-header">
                <h3>${classItem.name}</h3>
                <span class="class-level ${classItem.level.toLowerCase()}">${classItem.level}</span>
            </div>
            <div class="class-info">
                <p class="class-schedule">
                    <i class="fas fa-calendar"></i>
                    ${formatSchedule(classItem.schedule)}
                </p>
                <p class="class-term">
                    <i class="fas fa-clock"></i>
                    ${classItem.term}
                </p>
            </div>
            <div class="class-stats">
                <div class="stat-item">
                    <i class="fas fa-users"></i>
                    <span>${classItem.enrolledCount}/${classItem.capacity} Students</span>
                </div>
                <div class="stat-item">
                    <i class="fas fa-chart-line"></i>
                    <span>${classItem.averageProgress}% Progress</span>
                </div>
            </div>
            <div class="class-footer">
                <button class="action-button" onclick="event.stopPropagation(); editClass('${classItem.id}')">
                    <i class="fas fa-edit"></i>
                    Edit
                </button>
                <button class="action-button" onclick="event.stopPropagation(); viewClassDetails('${classItem.id}')">
                    <i class="fas fa-eye"></i>
                    View Details
                </button>
            </div>
        </div>
    `).join('');
}

function formatSchedule(schedule) {
    const days = schedule.days.map(day => day.charAt(0).toUpperCase() + day.slice(1, 3)).join(', ');
    return `${days} ${formatTime(schedule.startTime)} - ${formatTime(schedule.endTime)}`;
}

function formatTime(time) {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function createNewClass() {
    const modal = document.getElementById('class-modal');
    modal.querySelector('h2').textContent = 'Create New Class';
    document.getElementById('class-form').reset();
    modal.style.display = 'block';
}

async function editClass(classId) {
    try {
        const classData = await window.teacherApiService.getClassDetails(classId);
        const modal = document.getElementById('class-modal');
        modal.querySelector('h2').textContent = 'Edit Class';
        
        // Populate form
        document.getElementById('class-name').value = classData.name;
        document.getElementById('class-level').value = classData.level;
        document.getElementById('class-term').value = classData.term;
        document.getElementById('class-capacity').value = classData.capacity;
        document.getElementById('class-description').value = classData.description;
        document.getElementById('start-time').value = classData.schedule.startTime;
        document.getElementById('end-time').value = classData.schedule.endTime;
        
        // Set schedule days
        const dayCheckboxes = document.getElementsByName('days');
        dayCheckboxes.forEach(checkbox => {
            checkbox.checked = classData.schedule.days.includes(checkbox.value);
        });
        
        modal.style.display = 'block';
        document.getElementById('class-form').dataset.classId = classId;
    } catch (error) {
        console.error('Error loading class details:', error);
        showError('Failed to load class details');
    }
}

async function submitClass(event) {
    event.preventDefault();
    
    const form = event.target;
    const classId = form.dataset.classId;
    const classData = {
        name: form['class-name'].value,
        level: form['class-level'].value,
        term: form['class-term'].value,
        capacity: parseInt(form['class-capacity'].value),
        description: form['class-description'].value,
        schedule: {
            days: Array.from(form.days).filter(cb => cb.checked).map(cb => cb.value),
            startTime: form['start-time'].value,
            endTime: form['end-time'].value
        }
    };
    
    try {
        if (classId) {
            await window.teacherApiService.updateClass(classId, classData);
            showSuccess('Class updated successfully');
        } else {
            await window.teacherApiService.createClass(classData);
            showSuccess('Class created successfully');
        }
        
        closeClassModal();
        loadClasses();
    } catch (error) {
        console.error('Error saving class:', error);
        showError('Failed to save class');
    }
}

function closeClassModal() {
    const modal = document.getElementById('class-modal');
    modal.style.display = 'none';
    document.getElementById('class-form').reset();
    delete document.getElementById('class-form').dataset.classId;
}

async function viewClassDetails(classId) {
    try {
        const classData = await window.teacherApiService.getClassDetails(classId);
        const modal = document.getElementById('class-details-modal');
        
        // Update class info
        modal.querySelector('.class-name').textContent = classData.name;
        modal.querySelector('.class-meta').textContent = `${classData.level} • ${formatSchedule(classData.schedule)}`;
        
        // Update stats
        modal.querySelector('.enrolled-count').textContent = `${classData.enrolledCount}/${classData.capacity}`;
        modal.querySelector('.average-progress').textContent = `${classData.averageProgress}%`;
        modal.querySelector('.completion-rate').textContent = `${classData.completionRate}%`;
        
        // Update student list
        const studentsTable = modal.querySelector('.students-table');
        if (classData.students.length === 0) {
            studentsTable.innerHTML = `
                <div class="empty-state">
                    <p>No students enrolled</p>
                </div>
            `;
        } else {
            studentsTable.innerHTML = `
                <table>
                    <thead>
                        <tr>
                            <th>Student</th>
                            <th>Progress</th>
                            <th>Last Activity</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${classData.students.map(student => `
                            <tr>
                                <td class="student-info">
                                    <img src="${student.avatar || '/assets/default-avatar.png'}" alt="${student.name}'s avatar" class="student-avatar">
                                    <div>
                                        <h4>${student.name}</h4>
                                        <p>${student.email}</p>
                                    </div>
                                </td>
                                <td>
                                    <div class="progress-bar">
                                        <div class="progress" style="width: ${student.progress}%"></div>
                                    </div>
                                    <span>${student.progress}%</span>
                                </td>
                                <td>${formatLastActivity(student.lastActivity)}</td>
                                <td>
                                    <button onclick="viewStudentDetails('${student.id}')" class="action-button">
                                        <i class="fas fa-eye"></i>
                                    </button>
                                    <button onclick="removeStudent('${student.id}')" class="action-button danger">
                                        <i class="fas fa-user-minus"></i>
                                    </button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
        }
        
        modal.style.display = 'block';
        modal.dataset.classId = classId;
    } catch (error) {
        console.error('Error loading class details:', error);
        showError('Failed to load class details');
    }
}

function closeClassDetails() {
    const modal = document.getElementById('class-details-modal');
    modal.style.display = 'none';
    delete modal.dataset.classId;
}

async function archiveClass() {
    const classId = document.getElementById('class-details-modal').dataset.classId;
    
    if (!confirm('Are you sure you want to archive this class?')) {
        return;
    }
    
    try {
        await window.teacherApiService.archiveClass(classId);
        showSuccess('Class archived successfully');
        closeClassDetails();
        loadClasses();
    } catch (error) {
        console.error('Error archiving class:', error);
        showError('Failed to archive class');
    }
}

async function addStudent() {
    const classId = document.getElementById('class-details-modal').dataset.classId;
    // Implementation depends on your student management system
    console.log('Add student to class:', classId);
}

async function removeStudent(studentId) {
    const classId = document.getElementById('class-details-modal').dataset.classId;
    
    if (!confirm('Are you sure you want to remove this student from the class?')) {
        return;
    }
    
    try {
        await window.teacherApiService.removeStudentFromClass(classId, studentId);
        showSuccess('Student removed successfully');
        viewClassDetails(classId);
    } catch (error) {
        console.error('Error removing student:', error);
        showError('Failed to remove student');
    }
}

function formatLastActivity(timestamp) {
    if (!timestamp) return 'Never';
    
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

function setupEventListeners() {
    // Term filter change
    document.getElementById('term-filter').addEventListener('change', loadClasses);
    
    // Level filter change
    document.getElementById('level-filter').addEventListener('change', loadClasses);
    
    // Class search
    let searchTimeout;
    document.getElementById('class-search').addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            const searchTerm = e.target.value.toLowerCase();
            const classCards = document.querySelectorAll('.class-card');
            
            classCards.forEach(card => {
                const className = card.querySelector('h3').textContent.toLowerCase();
                const classInfo = card.querySelector('.class-info').textContent.toLowerCase();
                
                if (className.includes(searchTerm) || classInfo.includes(searchTerm)) {
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