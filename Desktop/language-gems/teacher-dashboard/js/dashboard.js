import { dashboardService } from '../../src/services/dashboard-service.js';
import { authService } from '../../src/services/auth-service.js';
import { LoadingState } from '../../src/components/loading-state.js';
import { ErrorBoundary } from '../../src/components/error-boundary.js';
import { Notification } from '../../src/components/notification.js';

// Initialize components
const loadingState = new LoadingState('main-content');
const errorBoundary = new ErrorBoundary('main-content', {
    onRetry: () => initializeDashboard()
});
const notification = Notification.getInstance();

// Keep track of active listeners
let activeListeners = [];

document.addEventListener('DOMContentLoaded', async () => {
    try {
        await authService.requireTeacherAuth();
        await initializeDashboard();
    } catch (error) {
        errorBoundary.show(error);
    }
});

async function initializeDashboard() {
    try {
        loadingState.show();
        const [dashboardData, upcomingEvents] = await Promise.all([
            dashboardService.getDashboardData(),
            dashboardService.getUpcomingEvents()
        ]);

        updateOverview(dashboardData.overview);
        updateRecentActivity(dashboardData.recentActivity);
        updateClassList(dashboardData.classes);
        updateUpcomingEvents(upcomingEvents);

        setupEventListeners();
    } catch (error) {
        console.error('Error initializing dashboard:', error);
        errorBoundary.show(error);
    } finally {
        loadingState.hide();
    }
}

function updateOverview(overview) {
    // Update statistics cards
    document.getElementById('total-classes').textContent = overview.classes.total;
    document.getElementById('total-students').textContent = overview.classes.totalStudents;
    document.getElementById('active-assignments').textContent = overview.assignments.active;
    document.getElementById('ungraded-submissions').textContent = overview.assignments.ungraded;
}

function updateRecentActivity(activity) {
    const assignmentsList = document.getElementById('recent-assignments');
    const announcementsList = document.getElementById('recent-announcements');

    // Update recent assignments
    assignmentsList.innerHTML = activity.assignments.map(assignment => `
        <div class="activity-item">
            <div class="activity-icon ${assignment.type}">
                <i class="fas ${getAssignmentIcon(assignment.type)}"></i>
            </div>
            <div class="activity-content">
                <h4>${assignment.title}</h4>
                <p>${assignment.className}</p>
                <div class="activity-meta">
                    <span><i class="fas fa-clock"></i> Due ${formatDate(assignment.dueDate)}</span>
                    <span><i class="fas fa-users"></i> ${assignment.submissions}/${assignment.totalStudents} submitted</span>
                </div>
            </div>
            <a href="assignments.html?id=${assignment.id}" class="activity-action">
                <i class="fas fa-chevron-right"></i>
            </a>
        </div>
    `).join('');

    // Update recent announcements
    announcementsList.innerHTML = activity.announcements.map(announcement => `
        <div class="activity-item">
            <div class="activity-icon announcement">
                <i class="fas fa-bullhorn"></i>
            </div>
            <div class="activity-content">
                <h4>${announcement.title}</h4>
                <p>${announcement.className}</p>
                <div class="activity-meta">
                    <span><i class="fas fa-clock"></i> Posted ${formatDate(announcement.publishedAt)}</span>
                    <span><i class="fas fa-eye"></i> ${announcement.readBy}/${announcement.totalStudents} read</span>
                </div>
            </div>
            <a href="announcements.html?id=${announcement.id}" class="activity-action">
                <i class="fas fa-chevron-right"></i>
            </a>
        </div>
    `).join('');
}

function updateClassList(classes) {
    const classesList = document.getElementById('active-classes');
    classesList.innerHTML = classes.map(cls => `
        <div class="class-card">
            <div class="class-header">
                <h3>${cls.name}</h3>
                <span class="student-count">
                    <i class="fas fa-users"></i>
                    ${cls.studentCount} students
                </span>
            </div>
            <div class="class-schedule">
                <i class="fas fa-calendar"></i>
                ${formatSchedule(cls.schedule)}
            </div>
            <div class="class-actions">
                <a href="class-analytics.html?id=${cls.id}" class="button">
                    <i class="fas fa-chart-line"></i>
                    Analytics
                </a>
                <a href="assignments.html?class=${cls.id}" class="button">
                    <i class="fas fa-tasks"></i>
                    Assignments
                </a>
            </div>
        </div>
    `).join('');
}

function updateUpcomingEvents(events) {
    const eventsList = document.getElementById('upcoming-events');
    eventsList.innerHTML = events.map(event => `
        <div class="event-item ${event.type}">
            <div class="event-time">
                <span class="date">${formatEventDate(event.date)}</span>
                <span class="time">${formatEventTime(event.date)}</span>
            </div>
            <div class="event-content">
                <h4>${event.title}</h4>
                <p>${event.details}</p>
            </div>
        </div>
    `).join('');
}

function setupEventListeners() {
    // Clean up any existing listeners
    activeListeners.forEach(unsubscribe => unsubscribe());
    activeListeners = [];

    // Add quick action button listeners
    document.getElementById('create-assignment-btn')?.addEventListener('click', () => {
        window.location.href = 'assignments.html?action=create';
    });

    document.getElementById('create-announcement-btn')?.addEventListener('click', () => {
        window.location.href = 'announcements.html?action=create';
    });

    document.getElementById('view-analytics-btn')?.addEventListener('click', () => {
        window.location.href = 'class-analytics.html';
    });
}

// Helper functions
function getAssignmentIcon(type) {
    const icons = {
        'quiz': 'fa-question-circle',
        'homework': 'fa-book',
        'project': 'fa-project-diagram',
        'exercise': 'fa-dumbbell'
    };
    return icons[type] || 'fa-tasks';
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
}

function formatEventDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
    });
}

function formatEventTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit'
    });
}

function formatSchedule(schedule) {
    if (!schedule || !schedule.days || !schedule.time) return 'No schedule set';
    return `${schedule.days.join(', ')} at ${schedule.time}`;
}

// Clean up function
function cleanup() {
    activeListeners.forEach(unsubscribe => unsubscribe());
    activeListeners = [];
} 