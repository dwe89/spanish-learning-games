document.addEventListener('DOMContentLoaded', async () => {
    if (!await checkAuth()) {
        return;
    }

    initializeLessonPlans();
});

async function initializeLessonPlans() {
    try {
        await Promise.all([
            loadClasses(),
            loadLessonPlans()
        ]);
        
        setupEventListeners();
        showSuccess('Lesson plans loaded successfully');
    } catch (error) {
        console.error('Error initializing lesson plans:', error);
        showError('Failed to load lesson plans');
    }
}

async function loadClasses() {
    try {
        const classes = await window.teacherApiService.getClasses();
        const classFilters = [
            document.getElementById('class-filter'),
            document.getElementById('lesson-class')
        ];
        
        classFilters.forEach(select => {
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

async function loadLessonPlans() {
    try {
        const classId = document.getElementById('class-filter').value;
        const level = document.getElementById('level-filter').value;
        const status = document.getElementById('status-filter').value;
        
        const lessonPlans = await window.teacherApiService.getLessonPlans(classId, level, status);
        renderLessonPlansGrid(lessonPlans);
    } catch (error) {
        console.error('Error loading lesson plans:', error);
        showError('Failed to load lesson plans');
    }
}

function renderLessonPlansGrid(lessonPlans) {
    const lessonPlansGrid = document.querySelector('.lesson-plans-grid');
    
    if (lessonPlans.length === 0) {
        lessonPlansGrid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-book"></i>
                <h3>No Lesson Plans Found</h3>
                <p>Create a new lesson plan to get started</p>
            </div>
        `;
        return;
    }
    
    lessonPlansGrid.innerHTML = lessonPlans.map(plan => `
        <div class="lesson-plan-card ${plan.status.toLowerCase()}" onclick="viewLessonDetails('${plan.id}')">
            <div class="plan-header">
                <h3>${plan.title}</h3>
                <span class="status-badge ${plan.status.toLowerCase()}">${plan.status}</span>
            </div>
            <div class="plan-meta">
                <div class="meta-item">
                    <i class="fas fa-users"></i>
                    <span>${plan.className}</span>
                </div>
                <div class="meta-item">
                    <i class="fas fa-calendar"></i>
                    <span>${formatDate(plan.date)}</span>
                </div>
                <div class="meta-item">
                    <i class="fas fa-clock"></i>
                    <span>${plan.duration} min</span>
                </div>
            </div>
            <div class="plan-objectives">
                <h4>Learning Objectives:</h4>
                <p>${plan.objectives}</p>
            </div>
            <div class="plan-footer">
                <button class="action-button" onclick="event.stopPropagation(); editLessonPlan('${plan.id}')">
                    <i class="fas fa-edit"></i>
                    Edit
                </button>
                <button class="action-button" onclick="event.stopPropagation(); duplicateLessonPlan('${plan.id}')">
                    <i class="fas fa-copy"></i>
                    Duplicate
                </button>
            </div>
        </div>
    `).join('');
}

function createLessonPlan() {
    const modal = document.getElementById('lesson-plan-modal');
    modal.querySelector('h2').textContent = 'Create Lesson Plan';
    document.getElementById('lesson-plan-form').reset();
    
    // Set default date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    document.getElementById('lesson-date').value = tomorrow.toISOString().split('T')[0];
    
    modal.style.display = 'block';
}

async function editLessonPlan(planId) {
    try {
        const plan = await window.teacherApiService.getLessonPlanDetails(planId);
        const modal = document.getElementById('lesson-plan-modal');
        modal.querySelector('h2').textContent = 'Edit Lesson Plan';
        
        // Populate form
        const form = document.getElementById('lesson-plan-form');
        form.dataset.planId = planId;
        
        document.getElementById('lesson-title').value = plan.title;
        document.getElementById('lesson-class').value = plan.classId;
        document.getElementById('lesson-date').value = plan.date.split('T')[0];
        document.getElementById('lesson-duration').value = plan.duration;
        document.getElementById('lesson-objectives').value = plan.objectives;
        document.getElementById('lesson-materials').value = plan.materials;
        document.getElementById('lesson-homework').value = plan.homework;
        document.getElementById('lesson-notes').value = plan.notes;
        
        // Populate lesson sections
        const sectionsContainer = document.getElementById('lesson-sections');
        sectionsContainer.innerHTML = plan.sections.map(section => `
            <div class="lesson-section">
                <div class="section-header">
                    <h4>${section.title}</h4>
                    <textarea>${section.content}</textarea>
                </div>
            </div>
        `).join('');
        
        modal.style.display = 'block';
    } catch (error) {
        console.error('Error loading lesson plan details:', error);
        showError('Failed to load lesson plan details');
    }
}

async function submitLessonPlan(event) {
    event.preventDefault();
    
    const form = event.target;
    const planId = form.dataset.planId;
    
    const sections = Array.from(document.querySelectorAll('.lesson-section')).map(section => ({
        title: section.querySelector('h4').textContent,
        content: section.querySelector('textarea').value
    }));
    
    const planData = {
        title: form['lesson-title'].value,
        classId: form['lesson-class'].value,
        date: form['lesson-date'].value,
        duration: parseInt(form['lesson-duration'].value),
        objectives: form['lesson-objectives'].value,
        materials: form['lesson-materials'].value,
        sections: sections,
        homework: form['lesson-homework'].value,
        notes: form['lesson-notes'].value
    };
    
    try {
        if (planId) {
            await window.teacherApiService.updateLessonPlan(planId, planData);
            showSuccess('Lesson plan updated successfully');
        } else {
            await window.teacherApiService.createLessonPlan(planData);
            showSuccess('Lesson plan created successfully');
        }
        
        closeLessonPlanModal();
        loadLessonPlans();
    } catch (error) {
        console.error('Error saving lesson plan:', error);
        showError('Failed to save lesson plan');
    }
}

function closeLessonPlanModal() {
    const modal = document.getElementById('lesson-plan-modal');
    modal.style.display = 'none';
    document.getElementById('lesson-plan-form').reset();
    delete document.getElementById('lesson-plan-form').dataset.planId;
}

async function viewLessonDetails(planId) {
    try {
        const plan = await window.teacherApiService.getLessonPlanDetails(planId);
        const modal = document.getElementById('lesson-details-modal');
        
        // Update plan info
        modal.querySelector('.lesson-title').textContent = plan.title;
        modal.querySelector('.lesson-meta').textContent = `${plan.className} • ${formatDate(plan.date)} • ${plan.duration} min`;
        
        // Update details content
        const detailsContent = modal.querySelector('.details-content');
        detailsContent.innerHTML = `
            <div class="details-section">
                <h4>Learning Objectives</h4>
                <p>${plan.objectives}</p>
            </div>
            
            <div class="details-section">
                <h4>Materials Needed</h4>
                <p>${plan.materials || 'No materials specified'}</p>
            </div>
            
            <div class="details-section">
                <h4>Lesson Structure</h4>
                ${plan.sections.map(section => `
                    <div class="lesson-section">
                        <h5>${section.title}</h5>
                        <p>${section.content}</p>
                    </div>
                `).join('')}
            </div>
            
            <div class="details-section">
                <h4>Homework/Follow-up</h4>
                <p>${plan.homework || 'No homework assigned'}</p>
            </div>
            
            <div class="details-section">
                <h4>Additional Notes</h4>
                <p>${plan.notes || 'No additional notes'}</p>
            </div>
        `;
        
        modal.style.display = 'block';
        modal.dataset.planId = planId;
    } catch (error) {
        console.error('Error loading lesson plan details:', error);
        showError('Failed to load lesson plan details');
    }
}

function closeLessonDetails() {
    const modal = document.getElementById('lesson-details-modal');
    modal.style.display = 'none';
    delete modal.dataset.planId;
}

async function duplicateLessonPlan(planId) {
    try {
        await window.teacherApiService.duplicateLessonPlan(planId);
        showSuccess('Lesson plan duplicated successfully');
        loadLessonPlans();
    } catch (error) {
        console.error('Error duplicating lesson plan:', error);
        showError('Failed to duplicate lesson plan');
    }
}

async function downloadLessonPlan() {
    const planId = document.getElementById('lesson-details-modal').dataset.planId;
    
    try {
        const downloadUrl = await window.teacherApiService.getLessonPlanDownloadUrl(planId);
        window.location.href = downloadUrl;
    } catch (error) {
        console.error('Error downloading lesson plan:', error);
        showError('Failed to download lesson plan');
    }
}

function addLessonSection() {
    const sectionsContainer = document.getElementById('lesson-sections');
    const newSection = document.createElement('div');
    newSection.className = 'lesson-section';
    newSection.innerHTML = `
        <div class="section-header">
            <h4>New Section</h4>
            <textarea placeholder="Describe activities..."></textarea>
            <button type="button" class="remove-section" onclick="this.closest('.lesson-section').remove()">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    sectionsContainer.appendChild(newSection);
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
    });
}

function setupEventListeners() {
    // Class filter change
    document.getElementById('class-filter').addEventListener('change', loadLessonPlans);
    
    // Level filter change
    document.getElementById('level-filter').addEventListener('change', loadLessonPlans);
    
    // Status filter change
    document.getElementById('status-filter').addEventListener('change', loadLessonPlans);
    
    // Lesson plan search
    let searchTimeout;
    document.getElementById('lesson-search').addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            const searchTerm = e.target.value.toLowerCase();
            const planCards = document.querySelectorAll('.lesson-plan-card');
            
            planCards.forEach(card => {
                const title = card.querySelector('h3').textContent.toLowerCase();
                const objectives = card.querySelector('.plan-objectives').textContent.toLowerCase();
                const meta = card.querySelector('.plan-meta').textContent.toLowerCase();
                
                if (title.includes(searchTerm) || objectives.includes(searchTerm) || meta.includes(searchTerm)) {
                    card.style.display = 'block';
                } else {
                    card.style.display = 'none';
                }
            });
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