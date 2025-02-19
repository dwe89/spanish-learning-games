class NotesManager {
    constructor() {
        this.notes = [];
        this.currentNote = null;
        this.init();
    }

    init() {
        this.loadNotes();
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        const newNoteBtn = document.getElementById('newNoteBtn');
        const searchInput = document.querySelector('.notes-search input');

        if (newNoteBtn) {
            newNoteBtn.addEventListener('click', () => this.createNewNote());
        }

        if (searchInput) {
            searchInput.addEventListener('input', (e) => this.searchNotes(e.target.value));
        }
    }

    async loadNotes() {
        try {
            // Mock notes data for now
            this.notes = [
                {
                    id: 1,
                    title: 'Spanish Verbs',
                    content: 'Common irregular verbs:\n- Ser\n- Estar\n- Ir\n- Tener',
                    created: '2024-01-20T10:00:00Z',
                    updated: '2024-01-20T10:00:00Z'
                },
                {
                    id: 2,
                    title: 'Vocabulary - Food',
                    content: 'Essential food vocabulary:\n- Manzana (apple)\n- Pan (bread)\n- Leche (milk)',
                    created: '2024-01-21T15:30:00Z',
                    updated: '2024-01-21T15:30:00Z'
                }
            ];

            this.renderNotesList();
        } catch (error) {
            console.error('Error loading notes:', error);
        }
    }

    renderNotesList() {
        const notesList = document.querySelector('.notes-list');
        if (!notesList) return;

        notesList.innerHTML = this.notes.map(note => `
            <div class="note-item" data-id="${note.id}">
                <h4>${note.title}</h4>
                <p>${this.truncateContent(note.content)}</p>
                <span class="note-date">${this.formatDate(note.updated)}</span>
            </div>
        `).join('');

        // Add click handlers
        notesList.querySelectorAll('.note-item').forEach(item => {
            item.addEventListener('click', () => {
                this.openNote(parseInt(item.dataset.id));
            });
        });
    }

    truncateContent(content) {
        return content.length > 50 ? content.substring(0, 50) + '...' : content;
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString();
    }

    openNote(noteId) {
        const note = this.notes.find(n => n.id === noteId);
        if (!note) return;

        this.currentNote = note;
        
        const editor = document.querySelector('.note-editor');
        if (!editor) return;

        editor.innerHTML = `
            <div class="note-toolbar">
                <input type="text" class="note-title" value="${note.title}">
                <div class="note-actions">
                    <button class="btn btn-danger delete-note">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            <textarea class="note-content">${note.content}</textarea>
        `;

        // Add event listeners
        const titleInput = editor.querySelector('.note-title');
        const contentArea = editor.querySelector('.note-content');
        const deleteBtn = editor.querySelector('.delete-note');

        titleInput.addEventListener('input', () => {
            this.updateNote(noteId, { title: titleInput.value });
        });

        contentArea.addEventListener('input', () => {
            this.updateNote(noteId, { content: contentArea.value });
        });

        deleteBtn.addEventListener('click', () => {
            this.deleteNote(noteId);
        });

        // Update active state
        document.querySelectorAll('.note-item').forEach(item => {
            item.classList.toggle('active', parseInt(item.dataset.id) === noteId);
        });
    }

    createNewNote() {
        const newNote = {
            id: Date.now(),
            title: 'New Note',
            content: '',
            created: new Date().toISOString(),
            updated: new Date().toISOString()
        };

        this.notes.unshift(newNote);
        this.renderNotesList();
        this.openNote(newNote.id);
    }

    updateNote(noteId, updates) {
        const noteIndex = this.notes.findIndex(n => n.id === noteId);
        if (noteIndex === -1) return;

        this.notes[noteIndex] = {
            ...this.notes[noteIndex],
            ...updates,
            updated: new Date().toISOString()
        };

        this.renderNotesList();
    }

    deleteNote(noteId) {
        if (!confirm('Are you sure you want to delete this note?')) return;

        const noteIndex = this.notes.findIndex(n => n.id === noteId);
        if (noteIndex === -1) return;

        this.notes.splice(noteIndex, 1);
        this.renderNotesList();

        // Clear editor
        const editor = document.querySelector('.note-editor');
        if (editor) {
            editor.innerHTML = `
                <div class="note-editor-placeholder">
                    <i class="fas fa-book"></i>
                    <p>Select a note to view or edit</p>
                </div>
            `;
        }
    }

    searchNotes(query) {
        const noteItems = document.querySelectorAll('.note-item');
        const searchTerm = query.toLowerCase();

        noteItems.forEach(item => {
            const noteId = parseInt(item.dataset.id);
            const note = this.notes.find(n => n.id === noteId);
            if (!note) return;

            const matchesSearch = note.title.toLowerCase().includes(searchTerm) ||
                                note.content.toLowerCase().includes(searchTerm);
            
            item.style.display = matchesSearch ? 'block' : 'none';
        });
    }
}

// Initialize notes manager when page loads
window.addEventListener('DOMContentLoaded', () => {
    window.notesManager = new NotesManager();
}); 