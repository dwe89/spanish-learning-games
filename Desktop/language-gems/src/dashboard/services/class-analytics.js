document.addEventListener('DOMContentLoaded', async () => {
    if (!await checkAuth()) {
        return;
    }

    initializeClassAnalytics();
});

async function initializeClassAnalytics() {
    try {
        await Promise.all([
            loadClasses(),
            loadAnalytics()
        ]);
        
        setupEventListeners();
        showSuccess('Class analytics loaded successfully');
    } catch (error) {
        console.error('Error initializing class analytics:', error);
        showError('Failed to load class analytics');
    }
}

async function loadClasses() {
    try {
        const classes = await window.teacherApiService.getClasses();
        const classSelect = document.getElementById('class-select');
        
        classes.forEach(classItem => {
            const option = document.createElement('option');
            option.value = classItem.id;
            option.textContent = classItem.name;
            classSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading classes:', error);
        showError('Failed to load classes');
    }
}

async function loadAnalytics() {
    const classId = document.getElementById('class-select').value;
    const timeframe = document.getElementById('timeframe-select').value;
    
    try {
        const analytics = await window.teacherApiService.getClassAnalytics(classId, timeframe);
        
        updateStatCards(analytics.stats);
        initializeCharts(analytics.charts);
        updatePerformanceBreakdown(analytics.performance);
    } catch (error) {
        console.error('Error loading analytics:', error);
        showError('Failed to load analytics data');
    }
}

function updateStatCards(stats) {
    updateStatCard('Class Size', stats.classSize, `${stats.classSizeTrend}% from last period`);
    updateStatCard('Average Progress', `${stats.averageProgress}%`, `${stats.progressTrend}% from last period`);
    updateStatCard('Completion Rate', `${stats.completionRate}%`, `${stats.completionTrend}% from last period`);
    updateStatCard('Avg. Study Time', `${stats.averageStudyTime} min`, `${stats.studyTimeTrend}% from last period`);
}

function updateStatCard(title, value, trend) {
    const card = document.querySelector(`.stat-content h3:contains('${title}')`).closest('.stat-card');
    const numberEl = card.querySelector('.stat-number');
    const trendEl = card.querySelector('.stat-trend');
    
    numberEl.textContent = value;
    trendEl.textContent = trend;
    
    const trendValue = parseFloat(trend);
    if (trendValue > 0) {
        trendEl.classList.add('positive');
        trendEl.classList.remove('negative');
    } else if (trendValue < 0) {
        trendEl.classList.add('negative');
        trendEl.classList.remove('positive');
    } else {
        trendEl.classList.remove('positive', 'negative');
    }
}

function initializeCharts(chartData) {
    // Performance Distribution Chart
    const performanceCtx = document.getElementById('performanceChart').getContext('2d');
    new Chart(performanceCtx, {
        type: 'bar',
        data: {
            labels: ['0-20%', '21-40%', '41-60%', '61-80%', '81-100%'],
            datasets: [{
                label: 'Number of Students',
                data: chartData.performanceDistribution,
                backgroundColor: '#4f46e5',
                borderRadius: 8
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
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });

    // Skills Overview Chart
    const skillsCtx = document.getElementById('skillsChart').getContext('2d');
    new Chart(skillsCtx, {
        type: 'radar',
        data: {
            labels: chartData.skills.labels,
            datasets: [{
                label: 'Class Average',
                data: chartData.skills.values,
                backgroundColor: 'rgba(79, 70, 229, 0.2)',
                borderColor: '#4f46e5',
                pointBackgroundColor: '#4f46e5'
            }]
        },
        options: {
            responsive: true,
            scales: {
                r: {
                    beginAtZero: true,
                    max: 100
                }
            }
        }
    });

    // Progress Over Time Chart
    const progressCtx = document.getElementById('progressChart').getContext('2d');
    new Chart(progressCtx, {
        type: 'line',
        data: {
            labels: chartData.progress.labels,
            datasets: [{
                label: 'Class Progress',
                data: chartData.progress.values,
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

    // Activity Breakdown Chart
    const activityCtx = document.getElementById('activityChart').getContext('2d');
    new Chart(activityCtx, {
        type: 'doughnut',
        data: {
            labels: chartData.activities.labels,
            datasets: [{
                data: chartData.activities.values,
                backgroundColor: [
                    '#4f46e5',
                    '#06b6d4',
                    '#10b981',
                    '#f59e0b'
                ]
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

function updatePerformanceBreakdown(performance) {
    // Update Top Performers
    const topPerformers = document.getElementById('top-performers');
    topPerformers.innerHTML = performance.topPerformers.map(student => `
        <div class="student-item">
            <img src="${student.avatar || '/assets/default-avatar.png'}" alt="${student.name}'s avatar" class="student-avatar">
            <div class="student-info">
                <h5>${student.name}</h5>
                <p>${student.score}% overall</p>
            </div>
        </div>
    `).join('');

    // Update Needs Attention
    const needsAttention = document.getElementById('needs-attention');
    needsAttention.innerHTML = performance.needsAttention.map(student => `
        <div class="student-item">
            <img src="${student.avatar || '/assets/default-avatar.png'}" alt="${student.name}'s avatar" class="student-avatar">
            <div class="student-info">
                <h5>${student.name}</h5>
                <p>${student.score}% overall</p>
            </div>
        </div>
    `).join('');

    // Update Most Improved
    const mostImproved = document.getElementById('most-improved');
    mostImproved.innerHTML = performance.mostImproved.map(student => `
        <div class="student-item">
            <img src="${student.avatar || '/assets/default-avatar.png'}" alt="${student.name}'s avatar" class="student-avatar">
            <div class="student-info">
                <h5>${student.name}</h5>
                <p>+${student.improvement}% improvement</p>
            </div>
        </div>
    `).join('');

    // Update Recent Activity
    const recentActivity = document.getElementById('recent-activity');
    recentActivity.innerHTML = performance.recentActivity.map(activity => `
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

async function exportAnalytics() {
    try {
        const classId = document.getElementById('class-select').value;
        const timeframe = document.getElementById('timeframe-select').value;
        
        const exportUrl = await window.teacherApiService.exportClassAnalytics(classId, timeframe);
        window.location.href = exportUrl;
    } catch (error) {
        console.error('Error exporting analytics:', error);
        showError('Failed to export analytics');
    }
}

function setupEventListeners() {
    // Class selection change
    document.getElementById('class-select').addEventListener('change', loadAnalytics);
    
    // Timeframe selection change
    document.getElementById('timeframe-select').addEventListener('change', loadAnalytics);
}

function showSuccess(message) {
    // Implementation depends on your toast/notification system
    console.log('Success:', message);
}

function showError(message) {
    // Implementation depends on your toast/notification system
    console.error('Error:', message);
} 