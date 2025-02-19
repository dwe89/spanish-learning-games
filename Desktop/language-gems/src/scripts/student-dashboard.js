import { 
    query, 
    where, 
    orderBy, 
    limit, 
    onSnapshot 
} from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js';
import { auth } from '../firebase/config.js";
import { progressRef, assignmentsRef } from '../models/collections.js";

class StudentDashboard {
    constructor() {
        this.user = auth.currentUser;
        this.unsubscribeProgress = null;
        this.unsubscribeAssignments = null;
        this.initialize();
    }

    async initialize() {
        onAuthStateChanged(auth, (user) => {
            if (user) {
                this.user = user;
                this.setupProgressListener();
                this.setupAssignmentsListener();
                this.setupEventListeners();
                this.loadInitialData();
                this.initializeNavigation();
                this.initializeCharts();
                this.loadRecentActivity();
                this.initializeDarkMode();
            } else {
                console.log('No user logged in');
                window.location.href = '/index.html';
            }
        });
    }

// Load dashboard content
async loadDashboardContent() {
    try {
        // Add your dashboard content loading logic here
        // This will only be called when the user is authenticated
        
        // Show welcome message
        const welcomeMessage = document.querySelector('.welcome-message');
        if (welcomeMessage && auth.currentUser) {
            welcomeMessage.textContent = `Welcome, ${auth.currentUser.displayName || auth.currentUser.email}!`;
        }

        // Load other dashboard content
        await loadProgressData();
        await loadGamesList();
        await loadLeaderboard();
    } catch (error) {
        console.error('Error loading dashboard content:', error);
    }
}

// Load progress data
async function loadProgressData() {
    try {
        // Implement progress data loading logic
    } catch (error) {
        console.error('Error loading progress data:', error);
    }
}

// Load games list
async function loadGamesList() {
    try {
        // Implement games list loading logic
    } catch (error) {
        console.error('Error loading games list:', error);
    }
}

// Load leaderboard
async function loadLeaderboard() {
    try {
        // Implement leaderboard loading logic
    } catch (error) {
        console.error('Error loading leaderboard:', error);
    }
}

// Initialize when the page loads
document.addEventListener('DOMContentLoaded', initializeDashboard);

function initializeNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('.dashboard-section');
    
    // Set initial active state based on current URL
    const currentPath = window.location.pathname;
    const isOverviewPage = currentPath.endsWith('/student-dashboard/index.html') || 
                          currentPath.endsWith('/student-dashboard/');
    
    // Show the overview section by default on the index page
    if (isOverviewPage) {
        const overviewSection = document.getElementById('overview');
        if (overviewSection) {
            overviewSection.classList.add('active');
        }
    }
    
    navItems.forEach(item => {
        const href = item.getAttribute('href');
        
        // Set initial active state
        if ((isOverviewPage && href.includes('index.html')) ||
            (!isOverviewPage && href === currentPath)) {
            item.classList.add('active');
        }

        item.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Get the target section ID
            const targetId = href.split('/').pop().split('.')[0];
            const sectionId = targetId === 'index' ? 'overview' : targetId;
            
            // Only proceed if we have a valid section
            const targetSection = document.getElementById(sectionId);
            if (!targetSection) return;
            
            // Update active states
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');
            
            // Update section visibility
            sections.forEach(section => {
                if (section.id === sectionId) {
                    section.classList.add('active');
                } else {
                    section.classList.remove('active');
                }
            });
        });
    });
}

function initializeCharts() {
    // Progress Line Chart
    const progressCtx = document.createElement('canvas');
    progressCtx.id = 'progressChart';
    document.querySelector('.progress-section').appendChild(progressCtx);
    
    new Chart(progressCtx, {
        type: 'line',
        data: {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            datasets: [{
                label: 'XP Gained',
                data: [100, 150, 120, 200, 180, 150, 250],
                borderColor: '#4CAF50',
                tension: 0.4,
                fill: false
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
                    beginAtZero: true
                }
            }
        }
    });
}

function loadRecentActivity() {
    // Simulated recent activity data
    const activities = [
        { type: 'completion', text: 'Completed Basic Verbs lesson', time: '2 hours ago' },
        { type: 'achievement', text: 'Earned "Vocabulary Master" badge', time: '4 hours ago' },
        { type: 'progress', text: 'Reached level 5 in Grammar', time: 'Yesterday' }
    ];
    
    const activityContainer = document.createElement('div');
    activityContainer.className = 'recent-activity';
    activityContainer.innerHTML = `
        <h3>Recent Activity</h3>
        <div class="activity-list">
            ${activities.map(activity => `
                <div class="activity-item ${activity.type}">
                    <div class="activity-icon">
                        <i class="fas fa-${getActivityIcon(activity.type)}"></i>
                    </div>
                    <div class="activity-details">
                        <p>${activity.text}</p>
                        <span>${activity.time}</span>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
    
    document.querySelector('.dashboard-content').appendChild(activityContainer);
}

function getActivityIcon(type) {
    switch (type) {
        case 'completion':
            return 'check-circle';
        case 'achievement':
            return 'trophy';
        case 'progress':
            return 'level-up-alt';
        default:
            return 'circle';
    }
}

function setupEventListeners() {
    // Search functionality
    const searchInput = document.querySelector('.header-search input');
    searchInput.addEventListener('input', (e) => {
        // Implement search functionality
        console.log('Searching for:', e.target.value);
    });
    
    // Notifications
    const notificationsBtn = document.querySelector('.notifications');
    notificationsBtn.addEventListener('click', () => {
        // Show notifications modal
        showNotificationsModal();
    });
    
    // Play buttons
    document.querySelectorAll('.play-button').forEach(button => {
        button.addEventListener('click', (e) => {
            const activityTitle = e.target.closest('.activity-card').querySelector('h4').textContent;
            startActivity(activityTitle);
        });
    });
}

function showNotificationsModal() {
    const modal = document.createElement('div');
    modal.className = 'modal notifications-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>Notifications</h3>
                <button class="close-modal">&times;</button>
            </div>
            <div class="modal-body">
                <div class="notification-item unread">
                    <div class="notification-icon">
                        <i class="fas fa-star"></i>
                    </div>
                    <div class="notification-content">
                        <p>You've earned a new achievement!</p>
                        <span>10 minutes ago</span>
                    </div>
                </div>
                <div class="notification-item">
                    <div class="notification-icon">
                        <i class="fas fa-book"></i>
                    </div>
                    <div class="notification-content">
                        <p>New lesson available: Advanced Conjugation</p>
                        <span>1 hour ago</span>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    modal.querySelector('.close-modal').addEventListener('click', () => {
        modal.remove();
    });
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

function startActivity(activityTitle) {
    // Redirect to the appropriate activity page or load activity component
    console.log('Starting activity:', activityTitle);
    // Implement activity start logic
}

function initializeDarkMode() {
    const darkModeToggle = document.querySelector('.theme-toggle');
    const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');
    
    // Check for saved dark mode preference
    const savedDarkMode = localStorage.getItem('darkMode');
    if (savedDarkMode === 'true' || (savedDarkMode === null && prefersDarkScheme.matches)) {
        document.body.classList.add('dark-mode');
        darkModeToggle.querySelector('i').classList.replace('fa-moon', 'fa-sun');
    }
    
    darkModeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        const isDarkMode = document.body.classList.contains('dark-mode');
        localStorage.setItem('darkMode', isDarkMode);
        
        const icon = darkModeToggle.querySelector('i');
        icon.classList.toggle('fa-moon');
        icon.classList.toggle('fa-sun');
    });
    
    // Listen for system dark mode changes
    prefersDarkScheme.addEventListener('change', (e) => {
        if (localStorage.getItem('darkMode') === null) {
            if (e.matches) {
                document.body.classList.add('dark-mode');
                darkModeToggle.querySelector('i').classList.replace('fa-moon', 'fa-sun');
            } else {
                document.body.classList.remove('dark-mode');
                darkModeToggle.querySelector('i').classList.replace('fa-sun', 'fa-moon');
            }
        }
    });
}