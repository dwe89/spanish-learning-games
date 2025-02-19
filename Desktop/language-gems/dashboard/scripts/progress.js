// Progress section implementation
class Progress {
    constructor() {
        this.timeRange = 'week';
        this.initialize();
    }

    initialize() {
        this.setupEventListeners();
        this.loadProgressData();
        this.initializeCharts();
    }

    setupEventListeners() {
        const timeRangeSelect = document.getElementById('timeRange');
        if (timeRangeSelect) {
            timeRangeSelect.addEventListener('change', (e) => {
                this.timeRange = e.target.value;
                this.loadProgressData();
                this.updateCharts();
            });
        }
    }

    async loadProgressData() {
        try {
            // Mock data - replace with actual API calls
            const data = {
                studyTime: { value: 12, trend: 2 },
                xpEarned: { value: 1500, trend: 300 },
                lessonsCompleted: { value: 8, trend: 3 },
                goalsMet: { value: 2, total: 3 }
            };

            this.updateStats(data);
        } catch (error) {
            console.error('Error loading progress data:', error);
        }
    }

    updateStats(data) {
        // Update study time
        const studyTimeNumber = document.querySelector('.stat-card:nth-child(1) .stat-number');
        const studyTimeTrend = document.querySelector('.stat-card:nth-child(1) .stat-trend');
        if (studyTimeNumber && studyTimeTrend) {
            studyTimeNumber.textContent = `${data.studyTime.value} hrs`;
            studyTimeTrend.textContent = `+${data.studyTime.trend} hrs this week`;
        }

        // Update XP earned
        const xpNumber = document.querySelector('.stat-card:nth-child(2) .stat-number');
        const xpTrend = document.querySelector('.stat-card:nth-child(2) .stat-trend');
        if (xpNumber && xpTrend) {
            xpNumber.textContent = data.xpEarned.value;
            xpTrend.textContent = `+${data.xpEarned.trend} this week`;
        }

        // Update lessons completed
        const lessonsNumber = document.querySelector('.stat-card:nth-child(3) .stat-number');
        const lessonsTrend = document.querySelector('.stat-card:nth-child(3) .stat-trend');
        if (lessonsNumber) {
            lessonsNumber.textContent = data.lessonsCompleted.value;
        }

        // Update goals met
        const goalsNumber = document.querySelector('.stat-card:nth-child(4) .stat-number');
        if (goalsNumber) {
            goalsNumber.textContent = `${data.goalsMet.value}/${data.goalsMet.total}`;
        }
    }

    initializeCharts() {
        this.initActivityChart();
        this.initVocabularyChart();
        this.initSkillsChart();
    }

    initActivityChart() {
        const ctx = document.getElementById('activityChart')?.getContext('2d');
        if (!ctx) return;

        new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                datasets: [{
                    label: 'Study Minutes',
                    data: [45, 60, 30, 90, 45, 75, 60],
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

    initVocabularyChart() {
        const ctx = document.getElementById('vocabularyChart')?.getContext('2d');
        if (!ctx) return;

        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
                datasets: [{
                    label: 'New Words Learned',
                    data: [25, 35, 28, 42],
                    backgroundColor: '#4CAF50'
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

    initSkillsChart() {
        const ctx = document.getElementById('skillsChart')?.getContext('2d');
        if (!ctx) return;

        new Chart(ctx, {
            type: 'radar',
            data: {
                labels: ['Speaking', 'Listening', 'Reading', 'Writing', 'Grammar', 'Vocabulary'],
                datasets: [{
                    label: 'Current Level',
                    data: [70, 65, 80, 75, 60, 85],
                    backgroundColor: 'rgba(76, 175, 80, 0.2)',
                    borderColor: '#4CAF50',
                    pointBackgroundColor: '#4CAF50'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    r: {
                        beginAtZero: true,
                        max: 100
                    }
                }
            }
        });
    }

    updateCharts() {
        // Update charts based on selected time range
        // Implementation will depend on actual data structure
    }
}

// Initialize progress when the module loads
const progress = new Progress();