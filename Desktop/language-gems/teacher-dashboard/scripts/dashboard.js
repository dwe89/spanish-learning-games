import { DatabaseUtils } from '../../scripts/db-utils.js';

class TeacherDashboard {
    constructor() {
        this.dbUtils = new DatabaseUtils(window.env);
        this.teacherId = null;
        this.init();
    }

    async init() {
        // Check session and get teacher data
        const sessionId = localStorage.getItem('sessionId');
        if (!sessionId) {
            window.location.href = '/auth/login.html';
            return;
        }

        const session = await this.dbUtils.getSession(sessionId);
        if (!session) {
            localStorage.removeItem('sessionId');
            window.location.href = '/auth/login.html';
            return;
        }

        // Get teacher ID from user ID
        const teacherData = await this.db.prepare('SELECT id FROM teachers WHERE user_id = ?')
            .bind(session.userId)
            .first();
            
        if (!teacherData) {
            window.location.href = '/auth/login.html';
            return;
        }

        this.teacherId = teacherData.id;
        await this.loadDashboard();
    }

    async loadDashboard() {
        // Load all dashboard components in parallel
        await Promise.all([
            this.loadClasses(),
            this.loadRecentAssignments(),
            this.loadStudentProgress()
        ]);
    }

    async loadClasses() {
        const classes = await this.dbUtils.getTeacherClasses(this.teacherId);
        const classesContainer = document.getElementById('classes-list');
        classesContainer.innerHTML = '';

        classes.forEach(cls => {
            const classCard = document.createElement('div');
            classCard.className = 'class-card';
            classCard.innerHTML = `
                <h3>${cls.name}</h3>
                <p>${cls.language} - ${cls.level}</p>
                <p>Students: ${cls.student_count}</p>
                <div class="class-actions">
                    <button onclick="viewClass(${cls.id})">View Class</button>
                    <button onclick="createAssignment(${cls.id})">New Assignment</button>
                </div>
            `;
            classesContainer.appendChild(classCard);
        });
    }

    async loadRecentAssignments() {
        // Get recent assignments across all classes
        const assignments = await this.db.prepare(`
            SELECT a.*, c.name as class_name,
                   COUNT(s.id) as submissions_count,
                   AVG(s.score) as avg_score
            FROM assignments a
            JOIN classes c ON a.class_id = c.id
            LEFT JOIN assignment_submissions s ON a.id = s.assignment_id
            WHERE c.teacher_id = ?
            GROUP BY a.id
            ORDER BY a.created_at DESC
            LIMIT 10
        `).bind(this.teacherId).all();

        const assignmentsContainer = document.getElementById('recent-assignments');
        assignmentsContainer.innerHTML = '';

        assignments.forEach(assignment => {
            const dueDate = new Date(assignment.due_date).toLocaleDateString();
            const submissionRate = assignment.submissions_count ? 
                `${Math.round((assignment.submissions_count / assignment.student_count) * 100)}%` : 
                '0%';

            const assignmentCard = document.createElement('div');
            assignmentCard.className = 'assignment-card';
            assignmentCard.innerHTML = `
                <h3>${assignment.title}</h3>
                <p>Class: ${assignment.class_name}</p>
                <p>Due: ${dueDate}</p>
                <p>Submissions: ${submissionRate}</p>
                ${assignment.avg_score ? `<p>Average Score: ${Math.round(assignment.avg_score)}</p>` : ''}
                <button onclick="viewAssignment(${assignment.id})">View Details</button>
            `;
            assignmentsContainer.appendChild(assignmentCard);
        });
    }

    async loadStudentProgress() {
        // Get aggregated progress data for all students
        const progress = await this.db.prepare(`
            SELECT c.name as class_name,
                   COUNT(DISTINCT ce.student_id) as total_students,
                   AVG(up.level) as avg_level,
                   AVG(up.xp) as avg_xp
            FROM classes c
            JOIN class_enrollments ce ON c.id = ce.class_id
            JOIN user_progress up ON ce.student_id = up.user_id
            WHERE c.teacher_id = ?
            GROUP BY c.id
        `).bind(this.teacherId).all();

        const progressContainer = document.getElementById('class-progress');
        progressContainer.innerHTML = '';

        progress.forEach(classProgress => {
            const progressCard = document.createElement('div');
            progressCard.className = 'progress-card';
            progressCard.innerHTML = `
                <h3>${classProgress.class_name}</h3>
                <p>Students: ${classProgress.total_students}</p>
                <p>Average Level: ${Math.round(classProgress.avg_level)}</p>
                <p>Average XP: ${Math.round(classProgress.avg_xp)}</p>
            `;
            progressContainer.appendChild(progressCard);
        });
    }

    async viewClass(classId) {
        const students = await this.dbUtils.getClassStudents(classId);
        // Implementation for viewing detailed class information
        // This would typically update the UI to show a class view
    }

    async createAssignment(classId) {
        // Show assignment creation modal
        const modal = document.getElementById('assignment-modal');
        modal.dataset.classId = classId;
        modal.style.display = 'block';
    }

    async submitNewAssignment(formData) {
        const classId = document.getElementById('assignment-modal').dataset.classId;
        await this.dbUtils.createAssignment(
            classId,
            formData.get('title'),
            formData.get('description'),
            formData.get('due-date'),
            parseInt(formData.get('points'))
        );

        // Close modal and refresh assignments
        document.getElementById('assignment-modal').style.display = 'none';
        await this.loadRecentAssignments();
    }

    async viewAssignment(assignmentId) {
        const submissions = await this.dbUtils.getAssignmentSubmissions(assignmentId);
        // Implementation for viewing detailed assignment information
        // This would typically update the UI to show submission details
    }

    async updateSubmissionScore(submissionId, score) {
        await this.dbUtils.updateAssignmentScore(submissionId, score);
        // Refresh the assignment view
    }
}

// Initialize dashboard when page loads
window.addEventListener('load', () => {
    window.dashboard = new TeacherDashboard();
});
