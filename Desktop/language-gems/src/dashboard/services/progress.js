class ProgressTracker {
    constructor() {
        this.progress = JSON.parse(localStorage.getItem('gameProgress')) || {
            wordsLearned: 0,
            gamesCompleted: 0,
            streak: 0,
            lastPlayed: null,
            achievements: []
        };
    }

    updateProgress(gameData) {
        this.progress.wordsLearned += gameData.newWords || 0;
        this.progress.gamesCompleted += 1;
        this.updateStreak();
        this.saveProgress();
        this.updateUI();
    }

    updateStreak() {
        const today = new Date().toDateString();
        if (this.progress.lastPlayed !== today) {
            this.progress.streak += 1;
            this.progress.lastPlayed = today;
        }
    }

    saveProgress() {
        localStorage.setItem('gameProgress', JSON.stringify(this.progress));
    }

    updateUI() {
        const progressFill = document.querySelector('.progress-fill');
        if (progressFill) {
            progressFill.style.width = `${(this.progress.wordsLearned / 200) * 100}%`;
        }
    }
}

const tracker = new ProgressTracker();

document.addEventListener('DOMContentLoaded', () => {
    initializeCharts();
    loadAchievements();
    loadStreakCalendar();
    setupTimeFilter();
});

function initializeCharts() {
    // Activity Chart
    const activityCtx = document.getElementById('activityChart').getContext('2d');
    new Chart(activityCtx, {
        type: 'line',
        data: {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            datasets: [{
                label: 'Study Minutes',
                data: [0, 0, 0, 0, 0, 0, 0],
                borderColor: 'rgb(75, 192, 192)',
                tension: 0.1,
                fill: true,
                backgroundColor: 'rgba(75, 192, 192, 0.1)'
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
                    title: {
                        display: true,
                        text: 'Minutes'
                    }
                }
            }
        }
    });

    // Skills Chart
    const skillsCtx = document.getElementById('skillsChart').getContext('2d');
    new Chart(skillsCtx, {
        type: 'radar',
        data: {
            labels: ['Vocabulary', 'Grammar', 'Reading', 'Writing', 'Speaking', 'Listening'],
            datasets: [{
                label: 'Current Level',
                data: [0, 0, 0, 0, 0, 0],
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                borderColor: 'rgb(75, 192, 192)',
                pointBackgroundColor: 'rgb(75, 192, 192)',
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: 'rgb(75, 192, 192)'
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
}

function loadAchievements() {
    const achievementsList = document.getElementById('recentAchievements');
    // This will be replaced with actual API calls
    const achievements = [];
    
    if (achievements.length === 0) {
        achievementsList.innerHTML = `
            <div class="empty-state">
                <p>Complete lessons and activities to earn achievements!</p>
            </div>
        `;
        return;
    }

    achievementsList.innerHTML = achievements.map(achievement => `
        <div class="achievement-item">
            <div class="achievement-icon">
                <i class="${achievement.icon}"></i>
            </div>
            <div class="achievement-info">
                <h4>${achievement.title}</h4>
                <p>${achievement.description}</p>
                <span class="achievement-date">${achievement.date}</span>
            </div>
        </div>
    `).join('');
}

function loadStreakCalendar() {
    const calendar = document.getElementById('streakCalendar');
    const today = new Date();
    const days = [];
    
    // Generate last 28 days
    for (let i = 27; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        days.push({
            date: date,
            hasActivity: false // This will be replaced with actual data
        });
    }

    calendar.innerHTML = days.map(day => `
        <div class="calendar-day ${day.hasActivity ? 'active' : ''}" 
             title="${day.date.toLocaleDateString()}">
        </div>
    `).join('');
}

function setupTimeFilter() {
    const timeRange = document.getElementById('timeRange');
    timeRange.addEventListener('change', (e) => {
        // This will be replaced with actual API calls to update the data
        console.log('Time range changed to:', e.target.value);
        // Refresh charts and stats based on new time range
    });
}

// API integration functions (to be implemented)
async function fetchProgressData(timeRange) {
    try {
        const response = await ApiService.get(`/progress?timeRange=${timeRange}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching progress data:', error);
        return null;
    }
}

async function fetchAchievements() {
    try {
        const response = await ApiService.get('/achievements');
        return response.data;
    } catch (error) {
        console.error('Error fetching achievements:', error);
        return [];
    }
}

async function fetchStreakData() {
    try {
        const response = await ApiService.get('/streak');
        return response.data;
    } catch (error) {
        console.error('Error fetching streak data:', error);
        return [];
    }
}
