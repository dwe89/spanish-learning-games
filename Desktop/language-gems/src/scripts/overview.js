document.addEventListener('DOMContentLoaded', async () => {
    if (!await checkAuth()) {
        return;
    }

    initializeOverview();
});

async function initializeOverview() {
    try {
        await Promise.all([
            loadStatistics(),
            initializeCharts(),
            loadRecentActivity()
        ]);
        
        // Set up event listeners
        setupTimeframeFilter();
        
        showSuccess('Overview loaded successfully');
    } catch (error) {
        console.error('Error initializing overview:', error);
        showError('Failed to load overview data');
    }
}

async function loadStatistics() {
    try {
        const stats = await window.teacherApiService.getOverviewStatistics();
        
        updateStatCard('Total Students', stats.totalStudents, `${stats.studentsTrend}% this month`);
        updateStatCard('Active Classes', stats.activeClasses, `${stats.classesTrend}% this month`);
        updateStatCard('Pending Assignments', stats.pendingAssignments, `${stats.assignmentsTrend}% this week`);
        updateStatCard('Average Progress', `${stats.averageProgress}%`, `${stats.progressTrend}% this month`);
    } catch (error) {
        console.error('Error loading statistics:', error);
        showError('Failed to load statistics');
    }
}

function updateStatCard(title, value, trend) {
    const card = document.querySelector(`.stat-content h3:contains('${title}')`).closest('.stat-card');
    const numberEl = card.querySelector('.stat-number');
    const trendEl = card.querySelector('.stat-trend');
    
    numberEl.textContent = value;
    trendEl.textContent = trend;
    
    // Add trend styling
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

async function initializeCharts() {
    try {
        const data = await window.teacherApiService.getOverviewChartData();
        
        // Progress Chart
        const progressCtx = document.getElementById('progressChart').getContext('2d');
        new Chart(progressCtx, {
            type: 'line',
            data: {
                labels: data.progress.labels,
                datasets: [{
                    label: 'Average Progress',
                    data: data.progress.values,
                    borderColor: '#4f46e5',
                    tension: 0.4,
                    fill: false
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom'
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

        // Activity Chart
        const activityCtx = document.getElementById('activityChart').getContext('2d');
        new Chart(activityCtx, {
            type: 'doughnut',
            data: {
                labels: data.activity.labels,
                datasets: [{
                    data: data.activity.values,
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
    } catch (error) {
        console.error('Error initializing charts:', error);
        showError('Failed to load charts');
    }
}

async function loadRecentActivity() {
    try {
        const activities = await window.teacherApiService.getRecentActivities();
        const activityList = document.querySelector('.activity-list');
        
        activityList.innerHTML = activities.map(activity => `
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
        console.error('Error loading recent activity:', error);
        showError('Failed to load recent activity');
    }
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
    
    // Less than 1 hour
    if (diff < 3600000) {
        const minutes = Math.floor(diff / 60000);
        return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    }
    
    // Less than 1 day
    if (diff < 86400000) {
        const hours = Math.floor(diff / 3600000);
        return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    }
    
    // Format as date
    return date.toLocaleDateString();
}

function setupTimeframeFilter() {
    const timeframeSelect = document.querySelector('.timeframe-select');
    timeframeSelect.addEventListener('change', async () => {
        try {
            await Promise.all([
                loadStatistics(),
                initializeCharts()
            ]);
        } catch (error) {
            console.error('Error updating timeframe:', error);
            showError('Failed to update data');
        }
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