class Goals {
    constructor() {
        this.goals = [];
        this.categoryIcons = {
            vocabulary: 'book',
            lessons: 'graduation-cap',
            practice: 'clock',
            games: 'gamepad',
            points: 'star'
        };
        this.initialize();
    }

    async initialize() {
        await this.loadGoals();
        this.setupEventListeners();
        this.renderGoals();
        this.startProgressTracking();
    }

    async loadGoals() {
        try {
            // Load goals from API
            const token = localStorage.getItem('token');
            if (!token) return;

            const response = await fetch('/api/goals', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.goals = data;
            }
        } catch (error) {
            console.error('Failed to load goals:', error);
            // Load from localStorage as fallback
            const savedGoals = localStorage.getItem('goals');
            if (savedGoals) {
                this.goals = JSON.parse(savedGoals);
            }
        }
    }

    setupEventListeners() {
        const form = document.getElementById('goalForm');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.createGoal();
            });
        }

        // Listen for progress updates
        window.addEventListener('goalProgress', (e) => {
            const { category, amount } = e.detail;
            this.updateGoalProgress(category, amount);
        });
    }

    createGoal() {
        const type = document.getElementById('goalType').value;
        const category = document.getElementById('goalCategory').value;
        const target = parseInt(document.getElementById('goalTarget').value);

        if (!type || !category || !target) return;

        const goal = {
            id: Date.now(),
            type,
            category,
            target,
            progress: 0,
            createdAt: new Date().toISOString(),
            status: 'active'
        };

        this.goals.push(goal);
        this.saveGoals();
        this.renderGoals();
        document.getElementById('goalForm').reset();
    }

    renderGoals() {
        const container = document.getElementById('goalsList');
        if (!container) return;

        if (this.goals.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-bullseye"></i>
                    <h3>No Goals Set</h3>
                    <p>Set your first learning goal to start tracking your progress!</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.goals
            .sort((a, b) => {
                // Sort by status (active first) then by date
                if (a.status === b.status) {
                    return new Date(b.createdAt) - new Date(a.createdAt);
                }
                return a.status === 'active' ? -1 : 1;
            })
            .map(goal => `
                <div class="goal-card">
                    <div class="goal-header">
                        <div class="goal-type">
                            <i class="fas fa-${this.categoryIcons[goal.category]}"></i>
                            ${this.formatCategory(goal.category)}
                        </div>
                        <span class="goal-status ${goal.status}">
                            ${goal.status.charAt(0).toUpperCase() + goal.status.slice(1)}
                        </span>
                    </div>
                    <div class="goal-progress">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${(goal.progress / goal.target) * 100}%"></div>
                        </div>
                        <div class="goal-details">
                            <span>${goal.progress} / ${goal.target}</span>
                            <span>${this.formatGoalPeriod(goal.type)}</span>
                        </div>
                    </div>
                    <div class="goal-actions">
                        ${goal.status === 'active' ? `
                            <button onclick="window.goals.completeGoal(${goal.id})">
                                <i class="fas fa-check"></i>
                            </button>
                        ` : ''}
                        <button onclick="window.goals.deleteGoal(${goal.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `).join('');
    }

    formatCategory(category) {
        return category.split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }

    formatGoalPeriod(type) {
        switch (type) {
            case 'daily': return 'Today';
            case 'weekly': return 'This Week';
            case 'monthly': return 'This Month';
            default: return '';
        }
    }

    updateGoalProgress(category, amount) {
        let updated = false;
        this.goals.forEach(goal => {
            if (goal.status === 'active' && goal.category === category) {
                const oldProgress = goal.progress;
                goal.progress = Math.min(goal.progress + amount, goal.target);
                
                if (goal.progress >= goal.target && oldProgress < goal.target) {
                    this.showGoalCompletionNotification(goal);
                    goal.status = 'completed';
                }
                updated = true;
            }
        });

        if (updated) {
            this.saveGoals();
            this.renderGoals();
        }
    }

    completeGoal(id) {
        const goal = this.goals.find(g => g.id === id);
        if (goal) {
            goal.status = 'completed';
            this.saveGoals();
            this.renderGoals();
        }
    }

    deleteGoal(id) {
        if (confirm('Are you sure you want to delete this goal?')) {
            this.goals = this.goals.filter(g => g.id !== id);
            this.saveGoals();
            this.renderGoals();
        }
    }

    showGoalCompletionNotification(goal) {
        const notification = document.createElement('div');
        notification.className = 'achievement-notification';
        notification.innerHTML = `
            <i class="fas fa-${this.categoryIcons[goal.category]}"></i>
            <div class="notification-content">
                <h4>Goal Completed!</h4>
                <p>${this.formatCategory(goal.category)} goal achieved</p>
            </div>
        `;
        
        document.body.appendChild(notification);
        setTimeout(() => {
            notification.classList.add('show');
            setTimeout(() => {
                notification.classList.remove('show');
                setTimeout(() => notification.remove(), 300);
            }, 3000);
        }, 100);
    }

    async saveGoals() {
        try {
            // Save to API
            const token = localStorage.getItem('token');
            if (token) {
                await fetch('/api/goals', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(this.goals)
                });
            }
        } catch (error) {
            console.error('Failed to save goals:', error);
        }

        // Save to localStorage as backup
        localStorage.setItem('goals', JSON.stringify(this.goals));
    }

    startProgressTracking() {
        // Reset daily goals at midnight
        const now = new Date();
        const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
        const timeUntilMidnight = tomorrow - now;

        setTimeout(() => {
            this.resetDailyGoals();
            // Set up daily reset
            setInterval(this.resetDailyGoals.bind(this), 24 * 60 * 60 * 1000);
        }, timeUntilMidnight);

        // Check weekly goals on Sunday
        const daysUntilSunday = 7 - now.getDay();
        const timeUntilSunday = daysUntilSunday * 24 * 60 * 60 * 1000;

        setTimeout(() => {
            this.resetWeeklyGoals();
            // Set up weekly reset
            setInterval(this.resetWeeklyGoals.bind(this), 7 * 24 * 60 * 60 * 1000);
        }, timeUntilSunday);

        // Check monthly goals on the 1st
        const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        const timeUntilNextMonth = nextMonth - now;

        setTimeout(() => {
            this.resetMonthlyGoals();
            // Set up monthly reset
            setInterval(() => {
                const now = new Date();
                const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
                const timeUntilNextMonth = nextMonth - now;
                setTimeout(this.resetMonthlyGoals.bind(this), timeUntilNextMonth);
            }, 24 * 60 * 60 * 1000);
        }, timeUntilNextMonth);
    }

    resetDailyGoals() {
        this.goals.forEach(goal => {
            if (goal.type === 'daily' && goal.status === 'active') {
                goal.progress = 0;
            }
        });
        this.saveGoals();
        this.renderGoals();
    }

    resetWeeklyGoals() {
        this.goals.forEach(goal => {
            if (goal.type === 'weekly' && goal.status === 'active') {
                goal.progress = 0;
            }
        });
        this.saveGoals();
        this.renderGoals();
    }

    resetMonthlyGoals() {
        this.goals.forEach(goal => {
            if (goal.type === 'monthly' && goal.status === 'active') {
                goal.progress = 0;
            }
        });
        this.saveGoals();
        this.renderGoals();
    }
}

// Initialize goals when the page loads
document.addEventListener('DOMContentLoaded', () => {
    initializeGoals();
    setupEventListeners();
});

let goals = [];
let currentFilter = 'active';

function setupEventListeners() {
    // Create goal button
    const createGoalBtn = document.getElementById('createGoalBtn');
    const modal = document.getElementById('createGoalModal');
    const closeBtn = modal.querySelector('.close-btn');
    const cancelBtn = document.getElementById('cancelGoalBtn');
    const createGoalForm = document.getElementById('createGoalForm');

    createGoalBtn.addEventListener('click', () => {
        modal.classList.add('active');
    });

    closeBtn.addEventListener('click', () => {
        modal.classList.remove('active');
    });

    cancelBtn.addEventListener('click', () => {
        modal.classList.remove('active');
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
        }
    });

    // Goal type change handler
    const goalType = document.getElementById('goalType');
    const deadlineInput = document.getElementById('goalDeadline');

    goalType.addEventListener('change', () => {
        const today = new Date();
        switch (goalType.value) {
            case 'daily':
                today.setDate(today.getDate() + 1);
                break;
            case 'weekly':
                today.setDate(today.getDate() + 7);
                break;
            case 'monthly':
                today.setMonth(today.getMonth() + 1);
                break;
        }
        if (goalType.value !== 'custom') {
            deadlineInput.value = today.toISOString().split('T')[0];
        }
    });

    // Form submission
    createGoalForm.addEventListener('submit', handleGoalSubmit);

    // Filter buttons
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            currentFilter = button.dataset.filter;
            renderGoals();
        });
    });
}

async function initializeGoals() {
    try {
        goals = await fetchGoals();
        updateGoalsStats();
        renderGoals();
    } catch (error) {
        console.error('Error initializing goals:', error);
    }
}

function updateGoalsStats() {
    const activeGoals = goals.filter(goal => !goal.completed).length;
    const completedGoals = goals.filter(goal => goal.completed).length;
    const weeklyStreak = calculateWeeklyStreak();

    document.querySelectorAll('.stat-number')[0].textContent = activeGoals;
    document.querySelectorAll('.stat-number')[1].textContent = completedGoals;
    document.querySelectorAll('.stat-number')[2].textContent = weeklyStreak;
}

function calculateWeeklyStreak() {
    // This will be replaced with actual streak calculation logic
    return 0;
}

function renderGoals() {
    const goalsList = document.querySelector('.goals-list');
    const filteredGoals = filterGoals();

    if (filteredGoals.length === 0) {
        goalsList.innerHTML = `
            <div class="empty-state">
                <p>No ${currentFilter} goals found. Create a new goal to get started!</p>
            </div>
        `;
        return;
    }

    goalsList.innerHTML = filteredGoals.map(goal => `
        <div class="goal-card">
            <div class="goal-header">
                <div>
                    <h4 class="goal-title">${goal.title}</h4>
                    <span class="goal-category">${goal.category}</span>
                </div>
                <span class="goal-status ${goal.completed ? 'completed' : 'active'}">
                    ${goal.completed ? 'Completed' : 'In Progress'}
                </span>
            </div>
            <div class="goal-progress">
                <div class="progress-bar">
                    <div class="progress" style="width: ${goal.progress}%"></div>
                </div>
                <div class="progress-text">
                    <span>${goal.current}/${goal.target} ${goal.unit}</span>
                    <span>${goal.progress}%</span>
                </div>
            </div>
            <div class="goal-footer">
                <span class="goal-deadline">
                    <i class="fas fa-calendar"></i>
                    Due ${formatDate(goal.deadline)}
                </span>
                <div class="goal-actions">
                    ${!goal.completed ? `
                        <button onclick="updateGoalProgress('${goal.id}')" title="Update Progress">
                            <i class="fas fa-plus"></i>
                        </button>
                    ` : ''}
                    <button onclick="editGoal('${goal.id}')" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="deleteGoal('${goal.id}')" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

function filterGoals() {
    switch (currentFilter) {
        case 'active':
            return goals.filter(goal => !goal.completed);
        case 'completed':
            return goals.filter(goal => goal.completed);
        default:
            return goals;
    }
}

async function handleGoalSubmit(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const goalData = {
        id: generateId(),
        title: formData.get('goalTitle'),
        type: formData.get('goalType'),
        category: formData.get('goalCategory'),
        target: parseInt(formData.get('goalTarget')),
        deadline: formData.get('goalDeadline'),
        reminders: Array.from(formData.getAll('reminders')),
        current: 0,
        progress: 0,
        completed: false,
        createdAt: new Date().toISOString()
    };

    try {
        await createGoal(goalData);
        goals.push(goalData);
        updateGoalsStats();
        renderGoals();
        document.getElementById('createGoalModal').classList.remove('active');
        e.target.reset();
    } catch (error) {
        console.error('Error creating goal:', error);
    }
}

// Helper functions
function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function generateId() {
    return Math.random().toString(36).substr(2, 9);
}

// API integration functions
async function fetchGoals() {
    try {
        const response = await ApiService.get('/goals');
        return response.data || [];
    } catch (error) {
        console.error('Error fetching goals:', error);
        return [];
    }
}

async function createGoal(goalData) {
    try {
        const response = await ApiService.post('/goals', goalData);
        return response.data;
    } catch (error) {
        console.error('Error creating goal:', error);
        throw error;
    }
}

async function updateGoalProgress(goalId) {
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;

    const newProgress = prompt('Enter new progress value:', goal.current);
    if (newProgress === null) return;

    const progress = parseInt(newProgress);
    if (isNaN(progress)) return;

    try {
        await ApiService.patch(`/goals/${goalId}/progress`, { progress });
        goal.current = progress;
        goal.progress = Math.min(100, Math.round((progress / goal.target) * 100));
        goal.completed = goal.progress === 100;
        updateGoalsStats();
        renderGoals();
    } catch (error) {
        console.error('Error updating goal progress:', error);
    }
}

async function editGoal(goalId) {
    // To be implemented
    console.log('Edit goal:', goalId);
}

async function deleteGoal(goalId) {
    if (!confirm('Are you sure you want to delete this goal?')) return;

    try {
        await ApiService.delete(`/goals/${goalId}`);
        goals = goals.filter(g => g.id !== goalId);
        updateGoalsStats();
        renderGoals();
    } catch (error) {
        console.error('Error deleting goal:', error);
    }
} 