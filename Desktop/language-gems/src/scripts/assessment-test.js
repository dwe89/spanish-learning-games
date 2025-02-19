// Language Level Assessment Test functionality
class LanguageAssessment {
    constructor() {
        this.currentLanguage = 'spanish';
        this.currentQuestion = 0;
        this.questions = [];
        this.userAnswers = [];
        this.difficulty = 'intermediate'; // Starts at intermediate and adjusts
        this.initializeElements();
        this.loadQuestions();
        this.initializeEventListeners();
    }

    initializeElements() {
        this.container = document.getElementById('assessment-container');
        this.resultsContainer = document.getElementById('results-container');
        this.progressBar = document.querySelector('.progress');
        this.currentQuestionSpan = document.getElementById('current-question');
        this.totalQuestionsSpan = document.getElementById('total-questions');
        this.prevButton = document.getElementById('prev-btn');
        this.nextButton = document.getElementById('next-btn');
        this.questionContainer = document.querySelector('.question-container');
    }

    initializeEventListeners() {
        this.prevButton.addEventListener('click', () => this.previousQuestion());
        this.nextButton.addEventListener('click', () => this.nextQuestion());
        
        document.querySelectorAll('.language-btn').forEach(button => {
            button.addEventListener('click', () => {
                this.changeLanguage(button.dataset.language);
            });
        });
    }

    async loadQuestions() {
        try {
            // This would be replaced with actual API call
            this.questions = await this.fetchQuestions(this.currentLanguage, this.difficulty);
            this.totalQuestionsSpan.textContent = this.questions.length;
            this.displayQuestion();
        } catch (error) {
            console.error('Error loading questions:', error);
            this.showError('Failed to load questions. Please try again.');
        }
    }

    async fetchQuestions(language, difficulty) {
        // Simulated API response
        return [
            {
                id: 1,
                type: 'multiple-choice',
                category: 'grammar',
                question: 'Select the correct form of the verb "to be" in the sentence: "They ____ students."',
                options: ['is', 'are', 'am', 'be'],
                correctAnswer: 'are',
                difficulty: 'beginner'
            },
            {
                id: 2,
                type: 'multiple-choice',
                category: 'vocabulary',
                question: 'What is the meaning of "biblioteca"?',
                options: ['library', 'bookstore', 'school', 'office'],
                correctAnswer: 'library',
                difficulty: 'beginner'
            },
            // Add more questions...
        ];
    }

    displayQuestion() {
        const question = this.questions[this.currentQuestion];
        this.questionContainer.innerHTML = `
            <div class="question">
                <h2>Question ${this.currentQuestion + 1}</h2>
                <p class="question-text">${question.question}</p>
                <div class="options">
                    ${question.options.map((option, index) => `
                        <label class="option">
                            <input type="radio" name="q${question.id}" value="${option}" 
                                ${this.userAnswers[this.currentQuestion] === option ? 'checked' : ''}>
                            <span class="option-text">${option}</span>
                        </label>
                    `).join('')}
                </div>
            </div>
        `;

        this.updateProgress();
        this.updateNavigationButtons();
    }

    updateProgress() {
        const progress = ((this.currentQuestion + 1) / this.questions.length) * 100;
        this.progressBar.style.width = `${progress}%`;
        this.progressBar.textContent = `${Math.round(progress)}%`;
        this.currentQuestionSpan.textContent = this.currentQuestion + 1;
    }

    updateNavigationButtons() {
        this.prevButton.disabled = this.currentQuestion === 0;
        this.nextButton.textContent = 
            this.currentQuestion === this.questions.length - 1 ? 'Finish' : 'Next';
    }

    previousQuestion() {
        if (this.currentQuestion > 0) {
            this.currentQuestion--;
            this.displayQuestion();
        }
    }

    nextQuestion() {
        const selectedAnswer = document.querySelector(`input[name="q${this.questions[this.currentQuestion].id}"]:checked`);
        
        if (!selectedAnswer && this.currentQuestion !== this.questions.length - 1) {
            this.showError('Please select an answer before continuing.');
            return;
        }

        if (selectedAnswer) {
            this.userAnswers[this.currentQuestion] = selectedAnswer.value;
        }

        if (this.currentQuestion === this.questions.length - 1) {
            this.finishAssessment();
        } else {
            this.currentQuestion++;
            this.displayQuestion();
            this.adjustDifficulty();
        }
    }

    adjustDifficulty() {
        // Calculate success rate of last 3 questions
        const recentAnswers = this.userAnswers.slice(-3);
        const correctAnswers = recentAnswers.filter((answer, index) => 
            answer === this.questions[this.currentQuestion - 3 + index].correctAnswer
        );

        const successRate = correctAnswers.length / recentAnswers.length;

        if (successRate > 0.8) {
            this.difficulty = 'advanced';
        } else if (successRate < 0.4) {
            this.difficulty = 'beginner';
        } else {
            this.difficulty = 'intermediate';
        }
    }

    calculateResults() {
        const results = {
            totalScore: 0,
            categories: {
                grammar: { correct: 0, total: 0 },
                vocabulary: { correct: 0, total: 0 },
                comprehension: { correct: 0, total: 0 }
            },
            level: ''
        };

        this.userAnswers.forEach((answer, index) => {
            const question = this.questions[index];
            const category = question.category;
            
            results.categories[category].total++;
            if (answer === question.correctAnswer) {
                results.categories[category].correct++;
                results.totalScore++;
            }
        });

        // Calculate percentages
        Object.keys(results.categories).forEach(category => {
            const { correct, total } = results.categories[category];
            results.categories[category].percentage = (correct / total) * 100;
        });

        // Determine level
        const totalPercentage = (results.totalScore / this.questions.length) * 100;
        if (totalPercentage >= 80) {
            results.level = 'C1';
        } else if (totalPercentage >= 60) {
            results.level = 'B2';
        } else if (totalPercentage >= 40) {
            results.level = 'B1';
        } else {
            results.level = 'A2';
        }

        return results;
    }

    displayResults(results) {
        this.container.style.display = 'none';
        this.resultsContainer.style.display = 'block';

        const levelBadge = this.resultsContainer.querySelector('.level-badge');
        levelBadge.textContent = results.level;

        const scoreBreakdown = this.resultsContainer.querySelector('.score-breakdown');
        Object.entries(results.categories).forEach(([category, data]) => {
            const scoreBar = scoreBreakdown.querySelector(`[data-category="${category}"] .score`);
            if (scoreBar) {
                scoreBar.style.width = `${data.percentage}%`;
                scoreBar.textContent = `${Math.round(data.percentage)}%`;
            }
        });

        // Update recommendations based on results
        this.updateRecommendations(results);
    }

    updateRecommendations(results) {
        const recommendations = this.resultsContainer.querySelector('.recommendations');
        const weakestCategory = Object.entries(results.categories)
            .sort((a, b) => a[1].percentage - b[1].percentage)[0][0];

        const recommendationsList = {
            grammar: [
                'Grammar Fundamentals Course',
                'Verb Conjugation Practice',
                'Sentence Structure Exercises'
            ],
            vocabulary: [
                'Essential Vocabulary Course',
                'Word Association Games',
                'Contextual Learning Exercises'
            ],
            comprehension: [
                'Reading Comprehension Course',
                'Listening Practice Sessions',
                'Conversation Practice'
            ]
        };

        const focusAreas = recommendationsList[weakestCategory];
        const recommendationItems = recommendations.querySelector('.recommendation-items');
        recommendationItems.innerHTML = `
            <div class="recommendation-item">
                <h4>Focus Areas:</h4>
                <ul>
                    ${focusAreas.map(area => `<li>${area}</li>`).join('')}
                </ul>
            </div>
        `;
    }

    finishAssessment() {
        const results = this.calculateResults();
        this.displayResults(results);
        this.saveResults(results);
    }

    async saveResults(results) {
        try {
            // This would be replaced with actual API call
            await this.submitResults(results);
            console.log('Results saved successfully');
        } catch (error) {
            console.error('Error saving results:', error);
        }
    }

    async submitResults(results) {
        // Simulated API call
        return new Promise(resolve => {
            setTimeout(() => resolve(), 1000);
        });
    }

    changeLanguage(language) {
        this.currentLanguage = language;
        this.currentQuestion = 0;
        this.userAnswers = [];
        this.loadQuestions();
    }

    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        
        this.questionContainer.insertBefore(errorDiv, this.questionContainer.firstChild);
        
        setTimeout(() => {
            errorDiv.remove();
        }, 3000);
    }
}

// Initialize assessment when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new LanguageAssessment();
}); 