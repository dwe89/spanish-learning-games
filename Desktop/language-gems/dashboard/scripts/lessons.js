// Lessons section implementation
class Lessons {
    constructor() {
        this.initialize();
    }

    initialize() {
        this.loadLessons();
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Add event listeners for lesson interactions
        document.querySelectorAll('.lesson-card').forEach(card => {
            card.addEventListener('click', () => this.showLessonDetails(card.dataset.id));
        });

        // Add event listener for lesson filters
        const filterSelect = document.getElementById('lessonFilter');
        if (filterSelect) {
            filterSelect.addEventListener('change', (e) => this.filterLessons(e.target.value));
        }
    }

    async loadLessons() {
        try {
            // Mock lesson data - replace with actual API calls
            const lessons = [
                {
                    id: 1,
                    title: 'Basic Greetings',
                    description: 'Learn common Spanish greetings',
                    duration: '30 min',
                    difficulty: 'Beginner',
                    progress: 100,
                    completed: true
                },
                {
                    id: 2,
                    title: 'Numbers 1-20',
                    description: 'Master counting in Spanish',
                    duration: '45 min',
                    difficulty: 'Beginner',
                    progress: 60,
                    completed: false
                },
                {
                    id: 3,
                    title: 'Present Tense Verbs',
                    description: 'Learn regular verb conjugations',
                    duration: '60 min',
                    difficulty: 'Intermediate',
                    progress: 0,
                    completed: false
                }
            ];

            this.displayLessons(lessons);
        } catch (error) {
            console.error('Error loading lessons:', error);
        }
    }

    displayLessons(lessons) {
        const container = document.querySelector('.lessons-container');
        if (!container) return;

        container.innerHTML = lessons.map(lesson => `
            <div class="lesson-card ${lesson.completed ? 'completed' : ''}" data-id="${lesson.id}">
                <div class="lesson-header">
                    <h3>${lesson.title}</h3>
                    <span class="difficulty ${lesson.difficulty.toLowerCase()}">${lesson.difficulty}</span>
                </div>
                <p class="lesson-description">${lesson.description}</p>
                <div class="lesson-meta">
                    <span class="duration"><i class="fas fa-clock"></i> ${lesson.duration}</span>
                </div>
                <div class="progress-bar">
                    <div class="progress" style="width: ${lesson.progress}%"></div>
                </div>
                <div class="lesson-actions">
                    <button class="start-btn">${lesson.progress > 0 ? 'Continue' : 'Start'}</button>
                </div>
            </div>
        `).join('');

        this.setupEventListeners();
    }

    showLessonDetails(lessonId) {
        // Implementation for showing lesson details in a modal
        console.log('Show lesson details:', lessonId);
    }

    filterLessons(filter) {
        // Implementation for filtering lessons by difficulty or completion status
        console.log('Filter lessons by:', filter);
    }

    updateProgress(lessonId, progress) {
        const lessonCard = document.querySelector(`[data-id="${lessonId}"]`);
        if (!lessonCard) return;

        const progressBar = lessonCard.querySelector('.progress');
        if (progressBar) {
            progressBar.style.width = `${progress}%`;

            if (progress >= 100) {
                lessonCard.classList.add('completed');
            }
        }
    }
}

// Initialize lessons when the module loads
const lessons = new Lessons();