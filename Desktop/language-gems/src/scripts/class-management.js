// Class Management functionality
class ClassManager {
    constructor() {
        this.modal = document.getElementById('classModal');
        this.form = document.getElementById('classForm');
        this.addButton = document.querySelector('.add-class-btn');
        this.cancelButton = document.querySelector('.cancel-btn');
        this.classesGrid = document.querySelector('.classes-grid');
        this.classes = JSON.parse(localStorage.getItem('teacherClasses')) || [];
        this.initialize();
    }

    initialize() {
        this.addButton.addEventListener('click', () => this.openModal());
        this.cancelButton.addEventListener('click', () => this.closeModal());
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
        this.renderClasses();
    }

    openModal() {
        this.modal.style.display = 'block';
    }

    closeModal() {
        this.modal.style.display = 'none';
        this.form.reset();
    }

    handleSubmit(e) {
        e.preventDefault();
        const className = document.getElementById('className').value;
        const description = document.getElementById('classDescription').value;
        const level = document.getElementById('classLevel').value;

        const newClass = {
            id: Date.now(),
            name: className,
            description,
            level,
            students: [],
            createdAt: new Date().toISOString()
        };

        this.classes.push(newClass);
        this.saveClasses();
        this.renderClasses();
        this.closeModal();
    }

    saveClasses() {
        localStorage.setItem('teacherClasses', JSON.stringify(this.classes));
    }

    renderClasses() {
        this.classesGrid.innerHTML = this.classes.map(cls => `
            <div class="class-card" data-id="${cls.id}">
                <h3>${cls.name}</h3>
                <p>${cls.description}</p>
                <div class="class-info">
                    <span class="level">${cls.level}</span>
                    <span class="students">${cls.students.length} students</span>
                </div>
                <div class="class-actions">
                    <button onclick="classManager.editClass(${cls.id})" class="edit-btn">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button onclick="classManager.deleteClass(${cls.id})" class="delete-btn">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        `).join('');
    }

    editClass(id) {
        const cls = this.classes.find(c => c.id === id);
        if (cls) {
            // Implement edit functionality
            console.log('Editing class:', cls);
        }
    }

    deleteClass(id) {
        if (confirm('Are you sure you want to delete this class?')) {
            this.classes = this.classes.filter(c => c.id !== id);
            this.saveClasses();
            this.renderClasses();
        }
    }
}

// Initialize class manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.classManager = new ClassManager();
});