document.addEventListener('DOMContentLoaded', async () => {
    if (!await checkAuth()) {
        return;
    }

    initializeAssessments();
});

async function initializeAssessments() {
    try {
        await Promise.all([
            loadClasses(),
            loadAssessments()
        ]);
        
        setupEventListeners();
        showSuccess('Assessments loaded successfully');
    } catch (error) {
        console.error('Error initializing assessments:', error);
        showError('Failed to load assessments');
    }
}

async function loadClasses() {
    try {
        const classes = await window.teacherApiService.getClasses();
        const classSelects = [
            document.getElementById('class-filter'),
            document.querySelector('select[name="class"]')
        ];
        
        classSelects.forEach(select => {
            if (select) {
                classes.forEach(classItem => {
                    const option = document.createElement('option');
                    option.value = classItem.id;
                    option.textContent = classItem.name;
                    select.appendChild(option);
                });
            }
        });
    } catch (error) {
        console.error('Error loading classes:', error);
        showError('Failed to load classes');
    }
}

async function loadAssessments() {
    try {
        const filters = getActiveFilters();
        const assessments = await window.teacherApiService.getAssessments(filters);
        updateStats(assessments.stats);
        renderAssessmentsList(assessments.items);
    } catch (error) {
        console.error('Error loading assessments:', error);
        showError('Failed to load assessments');
    }
}

function getActiveFilters() {
    return {
        class: document.getElementById('class-filter').value,
        type: document.getElementById('type-filter').value,
        status: document.getElementById('status-filter').value,
        search: document.getElementById('assessment-search').value.trim()
    };
}

function updateStats(stats) {
    document.getElementById('total-assessments').textContent = stats.total;
    document.getElementById('active-assessments').textContent = stats.active;
    document.getElementById('avg-score').textContent = `${stats.averageScore}%`;
    document.getElementById('completion-rate').textContent = `${stats.completionRate}%`;
}

function renderAssessmentsList(assessments) {
    const assessmentsList = document.querySelector('.assessments-list');
    
    if (assessments.length === 0) {
        assessmentsList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-clipboard-check"></i>
                <h3>No Assessments Found</h3>
                <p>Create a new assessment to get started</p>
            </div>
        `;
        return;
    }
    
    assessmentsList.innerHTML = assessments.map(assessment => `
        <div class="assessment-card ${assessment.status.toLowerCase()}" onclick="viewAssessment('${assessment.id}')">
            <div class="assessment-header">
                <div class="assessment-info">
                    <span class="assessment-type ${assessment.type.toLowerCase()}">${formatType(assessment.type)}</span>
                    <h3>${assessment.title}</h3>
                </div>
                <span class="status-badge ${assessment.status.toLowerCase()}">${assessment.status}</span>
            </div>
            <div class="assessment-meta">
                <div class="meta-item">
                    <i class="fas fa-users"></i>
                    <span>${assessment.className}</span>
                </div>
                <div class="meta-item">
                    <i class="fas fa-clock"></i>
                    <span>${assessment.duration} min</span>
                </div>
                <div class="meta-item">
                    <i class="fas fa-star"></i>
                    <span>${assessment.totalPoints} points</span>
                </div>
            </div>
            <div class="assessment-stats">
                <div class="stat">
                    <span class="stat-label">Avg Score</span>
                    <span class="stat-value">${assessment.averageScore}%</span>
                </div>
                <div class="stat">
                    <span class="stat-label">Completed</span>
                    <span class="stat-value">${assessment.completionRate}%</span>
                </div>
            </div>
            <div class="assessment-footer">
                <button class="action-button" onclick="event.stopPropagation(); editAssessment('${assessment.id}')">
                    <i class="fas fa-edit"></i>
                    Edit
                </button>
                <button class="action-button" onclick="event.stopPropagation(); duplicateAssessment('${assessment.id}')">
                    <i class="fas fa-copy"></i>
                    Duplicate
                </button>
            </div>
        </div>
    `).join('');
}

function createAssessment() {
    const modal = document.getElementById('assessment-modal');
    modal.querySelector('h2').textContent = 'Create Assessment';
    document.getElementById('assessment-form').reset();
    
    // Clear questions list
    document.querySelector('.questions-list').innerHTML = '';
    addQuestion(); // Add first question by default
    
    modal.style.display = 'block';
}

function closeAssessmentModal() {
    document.getElementById('assessment-modal').style.display = 'none';
}

function addQuestion() {
    const questionsList = document.querySelector('.questions-list');
    const questionNumber = questionsList.children.length + 1;
    
    const questionDiv = document.createElement('div');
    questionDiv.className = 'question-item';
    questionDiv.innerHTML = `
        <div class="question-header">
            <h4>Question ${questionNumber}</h4>
            <button type="button" class="remove-question" onclick="removeQuestion(this)">
                <i class="fas fa-times"></i>
            </button>
        </div>
        <div class="form-group">
            <label class="form-label">Question Text</label>
            <textarea class="form-textarea" name="questions[${questionNumber}][text]" required></textarea>
        </div>
        <div class="form-group">
            <label class="form-label">Question Type</label>
            <select class="form-select" name="questions[${questionNumber}][type]" onchange="updateQuestionOptions(this)" required>
                <option value="multiple-choice">Multiple Choice</option>
                <option value="true-false">True/False</option>
                <option value="short-answer">Short Answer</option>
                <option value="essay">Essay</option>
            </select>
        </div>
        <div class="question-options">
            <!-- Options will be added based on question type -->
        </div>
        <div class="form-group">
            <label class="form-label">Points</label>
            <input type="number" class="form-input" name="questions[${questionNumber}][points]" required min="1">
        </div>
    `;
    
    questionsList.appendChild(questionDiv);
    updateQuestionOptions(questionDiv.querySelector('select'));
}

function removeQuestion(button) {
    const questionItem = button.closest('.question-item');
    questionItem.remove();
    
    // Update question numbers
    document.querySelectorAll('.question-item').forEach((item, index) => {
        item.querySelector('h4').textContent = `Question ${index + 1}`;
    });
}

function updateQuestionOptions(select) {
    const questionItem = select.closest('.question-item');
    const optionsContainer = questionItem.querySelector('.question-options');
    const questionType = select.value;
    
    switch (questionType) {
        case 'multiple-choice':
            optionsContainer.innerHTML = `
                <div class="form-group">
                    <label class="form-label">Options</label>
                    <div class="options-list">
                        <div class="option-item">
                            <input type="radio" name="questions[${questionItem.dataset.index}][correct]" value="0" required>
                            <input type="text" class="form-input" name="questions[${questionItem.dataset.index}][options][]" required>
                            <button type="button" class="remove-option" onclick="removeOption(this)">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                    </div>
                    <button type="button" class="add-option" onclick="addOption(this)">
                        <i class="fas fa-plus"></i>
                        Add Option
                    </button>
                </div>
            `;
            break;
            
        case 'true-false':
            optionsContainer.innerHTML = `
                <div class="form-group">
                    <label class="form-label">Correct Answer</label>
                    <div class="true-false-options">
                        <label>
                            <input type="radio" name="questions[${questionItem.dataset.index}][correct]" value="true" required>
                            True
                        </label>
                        <label>
                            <input type="radio" name="questions[${questionItem.dataset.index}][correct]" value="false" required>
                            False
                        </label>
                    </div>
                </div>
            `;
            break;
            
        case 'short-answer':
            optionsContainer.innerHTML = `
                <div class="form-group">
                    <label class="form-label">Correct Answer</label>
                    <input type="text" class="form-input" name="questions[${questionItem.dataset.index}][answer]" required>
                </div>
            `;
            break;
            
        case 'essay':
            optionsContainer.innerHTML = `
                <div class="form-group">
                    <label class="form-label">Scoring Rubric</label>
                    <textarea class="form-textarea" name="questions[${questionItem.dataset.index}][rubric]" required></textarea>
                </div>
            `;
            break;
    }
}

function addOption(button) {
    const optionsList = button.previousElementSibling;
    const optionItem = optionsList.querySelector('.option-item').cloneNode(true);
    optionItem.querySelector('input[type="text"]').value = '';
    optionsList.appendChild(optionItem);
}

function removeOption(button) {
    const optionsList = button.closest('.options-list');
    if (optionsList.children.length > 1) {
        button.closest('.option-item').remove();
    }
}

async function submitAssessment(event) {
    event.preventDefault();
    
    const form = event.target;
    const formData = new FormData(form);
    
    try {
        const assessmentData = {
            title: formData.get('title'),
            classId: formData.get('class'),
            type: formData.get('type'),
            duration: parseInt(formData.get('duration')),
            totalPoints: parseInt(formData.get('total-points')),
            instructions: formData.get('instructions'),
            questions: [], // Build questions array from form data
            settings: {
                randomize: formData.get('randomize') === 'on',
                showAnswers: formData.get('show-answers') === 'on',
                timeLimit: formData.get('time-limit') === 'on',
                preventBacktrack: formData.get('prevent-backtrack') === 'on'
            }
        };
        
        // Handle scheduling
        if (formData.get('schedule-type') === 'scheduled') {
            assessmentData.schedule = {
                startDate: formData.get('start-date'),
                startTime: formData.get('start-time'),
                endDate: formData.get('end-date'),
                endTime: formData.get('end-time')
            };
        }
        
        // Process questions
        document.querySelectorAll('.question-item').forEach((item, index) => {
            const questionData = {
                text: formData.get(`questions[${index + 1}][text]`),
                type: formData.get(`questions[${index + 1}][type]`),
                points: parseInt(formData.get(`questions[${index + 1}][points]`))
            };
            
            // Add type-specific data
            switch (questionData.type) {
                case 'multiple-choice':
                    questionData.options = Array.from(item.querySelectorAll('input[type="text"]')).map(input => input.value);
                    questionData.correctAnswer = parseInt(item.querySelector('input[type="radio"]:checked').value);
                    break;
                case 'true-false':
                    questionData.correctAnswer = formData.get(`questions[${index + 1}][correct]`) === 'true';
                    break;
                case 'short-answer':
                    questionData.correctAnswer = formData.get(`questions[${index + 1}][answer]`);
                    break;
                case 'essay':
                    questionData.rubric = formData.get(`questions[${index + 1}][rubric]`);
                    break;
            }
            
            assessmentData.questions.push(questionData);
        });
        
        await window.teacherApiService.createAssessment(assessmentData);
        showSuccess('Assessment created successfully');
        closeAssessmentModal();
        loadAssessments();
    } catch (error) {
        console.error('Error creating assessment:', error);
        showError('Failed to create assessment');
    }
}

function formatType(type) {
    return type.charAt(0).toUpperCase() + type.slice(1);
}

function setupEventListeners() {
    // Filter changes
    document.getElementById('class-filter').addEventListener('change', loadAssessments);
    document.getElementById('type-filter').addEventListener('change', loadAssessments);
    document.getElementById('status-filter').addEventListener('change', loadAssessments);
    
    // Schedule type change
    document.querySelectorAll('input[name="schedule-type"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            document.getElementById('schedule-fields').style.display = 
                e.target.value === 'scheduled' ? 'block' : 'none';
        });
    });
    
    // Assessment search
    let searchTimeout;
    document.getElementById('assessment-search').addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            loadAssessments();
        }, 300);
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