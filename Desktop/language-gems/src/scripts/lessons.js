class LessonsManager {
    constructor() {
        this.lessons = [];
        this.currentFilter = 'all';
        this.searchQuery = '';
        this.initializeEventListeners();
        this.loadLessons();
    }

    initializeEventListeners() {
        // Filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelector('.filter-btn.active').classList.remove('active');
                btn.classList.add('active');
                this.currentFilter = btn.dataset.filter;
                this.renderLessons();
            });
        });

        // Search input
        const searchInput = document.querySelector('.search-box input');
        searchInput.addEventListener('input', (e) => {
            this.searchQuery = e.target.value.toLowerCase();
            this.renderLessons();
        });

        // Modal close button
        document.querySelector('.close-btn').addEventListener('click', () => {
            this.hideModal();
        });

        // Close modal when clicking outside
        document.getElementById('lessonModal').addEventListener('click', (e) => {
            if (e.target.id === 'lessonModal') {
                this.hideModal();
            }
        });
    }

    async loadLessons() {
        try {
            this.lessons = await this.fetchLessons();
            this.updateProgress();
            this.renderLessons();
        } catch (error) {
            console.error('Error loading lessons:', error);
            // Show error message to user
            this.lessons = this.getSampleLessons();
            this.updateProgress();
            this.renderLessons();
        }
    }

    async fetchLessons() {
        // TODO: Replace with actual API call
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(this.getSampleLessons());
            }, 1000);
        });
    }

    getSampleLessons() {
        return [
            {
                id: 1,
                title: 'Introduction to Spanish',
                category: 'Basics',
                duration: '15 minutes',
                status: 'completed',
                progress: 100,
                description: 'Learn the basics of Spanish pronunciation and greetings.',
                objectives: [
                    'Understand basic Spanish pronunciation rules',
                    'Learn common greetings and farewells',
                    'Practice basic conversation starters'
                ],
                requirements: ['None']
            },
            {
                id: 2,
                title: 'Common Greetings',
                category: 'Greetings',
                duration: '20 minutes',
                status: 'available',
                progress: 0,
                description: 'Master everyday Spanish greetings and introductions.',
                objectives: [
                    'Learn formal and informal greetings',
                    'Practice introducing yourself',
                    'Understand cultural context of greetings'
                ],
                requirements: ['Introduction to Spanish']
            },
            {
                id: 3,
                title: 'Numbers 1-20',
                category: 'Numbers',
                duration: '25 minutes',
                status: 'locked',
                progress: 0,
                description: 'Learn to count and use numbers in Spanish.',
                objectives: [
                    'Count from 1 to 20 in Spanish',
                    'Use numbers in basic sentences',
                    'Practice number pronunciation'
                ],
                requirements: ['Common Greetings']
            }
        ];
    }

    updateProgress() {
        const totalLessons = this.lessons.length;
        const completedLessons = this.lessons.filter(lesson => lesson.status === 'completed').length;
        const progressPercentage = Math.round((completedLessons / totalLessons) * 100);

        // Update circular progress
        const circularChart = document.querySelector('.circular-chart path');
        circularChart.setAttribute('stroke-dasharray', `${progressPercentage}, 100`);

        // Update progress percentage
        document.querySelector('.progress-percentage').textContent = `${progressPercentage}%`;

        // Update lesson count
        document.querySelector('.stat-value').textContent = `${completedLessons}/${totalLessons}`;

        // Update XP (sample calculation)
        const xp = completedLessons * 100;
        document.querySelectorAll('.stat-value')[1].textContent = xp;
    }

    renderLessons() {
        const lessonsGrid = document.getElementById('lessonsGrid');
        lessonsGrid.innerHTML = '';

        const filteredLessons = this.lessons.filter(lesson => {
            const matchesFilter = this.currentFilter === 'all' || lesson.status === this.currentFilter;
            const matchesSearch = lesson.title.toLowerCase().includes(this.searchQuery) ||
                                lesson.category.toLowerCase().includes(this.searchQuery);
            return matchesFilter && matchesSearch;
        });

        filteredLessons.forEach(lesson => {
            const lessonCard = this.createLessonCard(lesson);
            lessonsGrid.appendChild(lessonCard);
        });
    }

    createLessonCard(lesson) {
        const card = document.createElement('div');
        card.className = `lesson-card ${lesson.status}`;
        
        let statusIcon, statusText;
        switch (lesson.status) {
            case 'completed':
                statusIcon = 'fa-check-circle';
                statusText = 'Completed';
                break;
            case 'available':
                statusIcon = 'fa-play-circle';
                statusText = 'Start';
                break;
            case 'locked':
                statusIcon = 'fa-lock';
                statusText = 'Locked';
                break;
        }

        card.innerHTML = `
            <div class="lesson-card-content">
                <div class="lesson-status">
                    <i class="fas ${statusIcon}"></i>
                    <span>${statusText}</span>
                </div>
                <h4>${lesson.title}</h4>
                <div class="lesson-meta">
                    <span class="category">${lesson.category}</span>
                    <span class="duration">
                        <i class="fas fa-clock"></i>
                        ${lesson.duration}
                    </span>
                </div>
                ${lesson.status === 'completed' ? `
                    <div class="progress-bar">
                        <div class="progress" style="width: ${lesson.progress}%"></div>
                    </div>
                ` : ''}
            </div>
        `;

        if (lesson.status !== 'locked') {
            card.addEventListener('click', () => this.showLessonDetails(lesson));
        }

        return card;
    }

    showLessonDetails(lesson) {
        const modal = document.getElementById('lessonModal');
        const title = modal.querySelector('.lesson-title h4');
        const duration = modal.querySelector('.lesson-duration');
        const description = modal.querySelector('.lesson-description p');
        const objectives = modal.querySelector('.lesson-objectives ul');
        const requirements = modal.querySelector('.lesson-requirements ul');
        const startButton = modal.querySelector('.btn-primary');

        title.textContent = lesson.title;
        duration.innerHTML = `<i class="fas fa-clock"></i> ${lesson.duration}`;
        description.textContent = lesson.description;

        objectives.innerHTML = lesson.objectives.map(obj => `<li>${obj}</li>`).join('');
        requirements.innerHTML = lesson.requirements.map(req => `<li>${req}</li>`).join('');

        startButton.textContent = lesson.status === 'completed' ? 'Review Lesson' : 'Start Lesson';
        startButton.onclick = () => this.startLesson(lesson);

        modal.style.display = 'block';
    }

    hideModal() {
        document.getElementById('lessonModal').style.display = 'none';
    }

    startLesson(lesson) {
        // TODO: Implement lesson start functionality
        console.log(`Starting lesson: ${lesson.title}`);
        this.hideModal();
    }
}

// Initialize lessons manager when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.lessonsManager = new LessonsManager();
}); 