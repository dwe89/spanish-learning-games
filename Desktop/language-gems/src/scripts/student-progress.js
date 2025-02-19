document.addEventListener('DOMContentLoaded', async () => {
    if (!await checkAuth()) {
        return;
    }

    initializeStudentProgress();
});

async function initializeStudentProgress() {
    try {
        await Promise.all([
            loadClasses(),
            loadStudents()
        ]);
        
        setupEventListeners();
        showSuccess('Student progress data loaded successfully');
    } catch (error) {
        console.error('Error initializing student progress:', error);
        showError('Failed to load student progress data');
    }
}

async function loadClasses() {
    try {
        const classes = await window.teacherApiService.getClasses();
        const classFilter = document.getElementById('class-filter');
        
        classes.forEach(classItem => {
            const option = document.createElement('option');
            option.value = classItem.id;
            option.textContent = classItem.name;
            classFilter.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading classes:', error);
        showError('Failed to load classes');
    }
}

async function loadStudents(classId = 'all', filter = 'all') {
    try {
        const students = classId === 'all' 
            ? await window.teacherApiService.getAllStudentsProgress()
            : await window.teacherApiService.getStudentsByClass(classId);
        
        const filteredStudents = filterStudents(students, filter);
        renderStudentGrid(filteredStudents);
    } catch (error) {
        console.error('Error loading students:', error);
        showError('Failed to load student data');
    }
}

function filterStudents(students, filter) {
    switch (filter) {
        case 'at-risk':
            return students.filter(student => student.overallProgress < 60);
        case 'excelling':
            return students.filter(student => student.overallProgress >= 90);
        case 'inactive':
            return students.filter(student => !student.isActive);
        default:
            return students;
    }
}

function renderStudentGrid(students) {
    const studentsGrid = document.querySelector('.students-grid');
    
    studentsGrid.innerHTML = students.map(student => `
        <div class="student-card ${getStudentStatusClass(student)}" onclick="viewStudentDetails(${student.id})">
            <div class="student-info">
                <img src="${student.avatar || '/assets/default-avatar.png'}" alt="${student.name}'s avatar" class="student-avatar">
                <div class="student-details">
                    <h4>${student.name}</h4>
                    <p>${student.email}</p>
                </div>
            </div>
            <div class="progress-section">
                <div class="progress-item">
                    <label>Overall Progress</label>
                    <div class="progress-bar">
                        <div class="progress" style="width: ${student.overallProgress}%"></div>
                    </div>
                    <span>${student.overallProgress}%</span>
                </div>
                <div class="progress-item">
                    <label>Assignments</label>
                    <div class="progress-bar">
                        <div class="progress" style="width: ${student.assignmentCompletion}%"></div>
                    </div>
                    <span>${student.assignmentCompletion}%</span>
                </div>
                <div class="progress-item">
                    <label>Quiz Scores</label>
                    <div class="progress-bar">
                        <div class="progress" style="width: ${student.quizAverage}%"></div>
                    </div>
                    <span>${student.quizAverage}%</span>
                </div>
            </div>
        </div>
    `).join('');
}

function getStudentStatusClass(student) {
    if (!student.isActive) return 'inactive';
    if (student.overallProgress < 60) return 'at-risk';
    if (student.overallProgress >= 90) return 'excelling';
    return '';
}

async function viewStudentDetails(studentId) {
    try {
        const student = await window.teacherApiService.getStudentDetails(studentId);
        const modal = document.getElementById('student-details-modal');
        
        // Update student profile
        modal.querySelector('.student-avatar').src = student.avatar || '/assets/default-avatar.png';
        modal.querySelector('.student-name').textContent = student.name;
        modal.querySelector('.student-email').textContent = student.email;
        modal.querySelector('.student-id').textContent = `ID: ${student.id}`;
        
        // Initialize charts
        initializeStudentCharts(student);
        
        // Load activities and assignments
        loadStudentActivities(student.id);
        loadStudentAssignments(student.id);
        
        modal.style.display = 'block';
    } catch (error) {
        console.error('Error loading student details:', error);
        showError('Failed to load student details');
    }
}

function initializeStudentCharts(student) {
    // Progress Chart
    const progressCtx = document.getElementById('studentProgressChart').getContext('2d');
    new Chart(progressCtx, {
        type: 'line',
        data: {
            labels: student.progressHistory.labels,
            datasets: [{
                label: 'Progress',
                data: student.progressHistory.values,
                borderColor: '#4f46e5',
                tension: 0.4,
                fill: false
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100
                }
            }
        }
    });

    // Skills Chart
    const skillsCtx = document.getElementById('studentSkillsChart').getContext('2d');
    new Chart(skillsCtx, {
        type: 'radar',
        data: {
            labels: student.skills.labels,
            datasets: [{
                label: 'Skills',
                data: student.skills.values,
                backgroundColor: 'rgba(79, 70, 229, 0.2)',
                borderColor: '#4f46e5',
                pointBackgroundColor: '#4f46e5'
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                r: {
                    beginAtZero: true,
                    max: 100
                }
            }
        }
    });
}

async function loadStudentActivities(studentId) {
    try {
        const activities = await window.teacherApiService.getStudentActivities(studentId);
        const activitiesList = document.querySelector('.activities-list');
        
        activitiesList.innerHTML = activities.map(activity => `
            <div class="activity-item">
                <div class="activity-icon">
                    <i class="fas ${getActivityIcon(activity.type)}"></i>
                </div>
                <div class="activity-details">
                    <p class="activity-text">${activity.description}</p>
                    <span class="activity-time">${formatActivityTime(activity.timestamp)}</span>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading student activities:', error);
        showError('Failed to load student activities');
    }
}

async function loadStudentAssignments(studentId) {
    try {
        const assignments = await window.teacherApiService.getStudentAssignments(studentId);
        const assignmentsList = document.querySelector('.assignments-list');
        
        assignmentsList.innerHTML = assignments.map(assignment => `
            <div class="assignment-item ${assignment.status.toLowerCase()}">
                <div class="assignment-header">
                    <h5>${assignment.title}</h5>
                    <span class="status-badge">${assignment.status}</span>
                </div>
                <div class="assignment-details">
                    <p>Due: ${new Date(assignment.dueDate).toLocaleDateString()}</p>
                    <p>Score: ${assignment.score !== null ? `${assignment.score}%` : 'Not graded'}</p>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading student assignments:', error);
        showError('Failed to load student assignments');
    }
}

function closeStudentDetails() {
    const modal = document.getElementById('student-details-modal');
    modal.style.display = 'none';
}

async function exportProgress() {
    try {
        const classId = document.getElementById('class-filter').value;
        const filter = document.querySelector('.filter-btn.active').dataset.filter;
        
        const exportUrl = await window.teacherApiService.exportStudentProgress(classId, filter);
        window.location.href = exportUrl;
    } catch (error) {
        console.error('Error exporting progress data:', error);
        showError('Failed to export progress data');
    }
}

function setupEventListeners() {
    // Class filter change
    document.getElementById('class-filter').addEventListener('change', (e) => {
        loadStudents(e.target.value, document.querySelector('.filter-btn.active').dataset.filter);
    });
    
    // Status filter buttons
    document.querySelectorAll('.filter-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            document.querySelector('.filter-btn.active').classList.remove('active');
            e.target.classList.add('active');
            loadStudents(document.getElementById('class-filter').value, e.target.dataset.filter);
        });
    });
    
    // Student search
    let searchTimeout;
    document.getElementById('student-search').addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            const searchTerm = e.target.value.toLowerCase();
            const studentCards = document.querySelectorAll('.student-card');
            
            studentCards.forEach(card => {
                const studentName = card.querySelector('h4').textContent.toLowerCase();
                const studentEmail = card.querySelector('p').textContent.toLowerCase();
                
                if (studentName.includes(searchTerm) || studentEmail.includes(searchTerm)) {
                    card.style.display = 'block';
                } else {
                    card.style.display = 'none';
                }
            });
        }, 300);
    });
}

function getActivityIcon(type) {
    const icons = {
        'assignment': 'fa-tasks',
        'quiz': 'fa-question-circle',
        'progress': 'fa-chart-line',
        'achievement': 'fa-trophy',
        'message': 'fa-envelope'
    };
    return icons[type] || 'fa-circle';
}

function formatActivityTime(timestamp) {
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