class NotesManager {
    constructor() {
        this.notes = [];
        this.currentCategory = 'all';
        this.currentView = 'grid';
        this.searchQuery = '';
        this.activeTags = new Set();
        this.editor = null;
        
        this.initializeEventListeners();
        this.loadNotes();
    }

    async initializeEventListeners() {
        // New note button
        document.getElementById('newNoteBtn').addEventListener('click', () => this.showNoteModal());

        // Modal close buttons
        document.getElementById('closeNoteModal').addEventListener('click', () => this.hideNoteModal());
        document.getElementById('cancelNoteBtn').addEventListener('click', () => this.hideNoteModal());
        document.getElementById('closeDetailsModal').addEventListener('click', () => this.hideDetailsModal());

        // Save note button
        document.getElementById('saveNoteBtn').addEventListener('click', () => this.saveNote());

        // Category buttons
        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.currentCategory = btn.dataset.category;
                document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.renderNotes();
            });
        });

        // View options
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.currentView = btn.dataset.view;
                document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.renderNotes();
            });
        });

        // Sort options
        document.getElementById('sortNotes').addEventListener('change', (e) => {
            this.sortNotes(e.target.value);
        });

        // Search input
        const searchInput = document.querySelector('.search-box input');
        searchInput.addEventListener('input', (e) => {
            this.searchQuery = e.target.value;
            this.renderNotes();
        });

        // Tags
        document.querySelectorAll('.tag').forEach(tag => {
            tag.addEventListener('click', () => {
                tag.classList.toggle('active');
                const tagText = tag.textContent.trim();
                if (tag.classList.contains('active')) {
                    this.activeTags.add(tagText);
                } else {
                    this.activeTags.delete(tagText);
                }
                this.renderNotes();
            });
        });

        // Note tags input
        const tagsInput = document.getElementById('noteTags');
        tagsInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ',') {
                e.preventDefault();
                const tag = tagsInput.value.trim();
                if (tag) {
                    this.addTagToPreview(tag);
                    tagsInput.value = '';
                }
            }
        });

        // Editor toolbar buttons
        document.querySelectorAll('.editor-toolbar button').forEach(btn => {
            btn.addEventListener('click', () => {
                const format = btn.dataset.format;
                this.formatText(format);
            });
        });

        // Note details modal buttons
        document.getElementById('editNoteBtn').addEventListener('click', () => this.editNote());
        document.getElementById('deleteNoteBtn').addEventListener('click', () => this.deleteNote());
        document.getElementById('shareNoteBtn').addEventListener('click', () => this.shareNote());
        document.getElementById('downloadNoteBtn').addEventListener('click', () => this.downloadNote());
    }

    async loadNotes() {
        try {
            // In a real application, this would be an API call
            const response = await this.fetchNotes();
            this.notes = response;
            this.updateCategoryCounts();
            this.renderNotes();
        } catch (error) {
            console.error('Error loading notes:', error);
        }
    }

    async fetchNotes() {
        // This is a mock response. In a real application, this would be an API call
        return [
            {
                id: 1,
                title: 'Spanish Past Tense Conjugation',
                category: 'grammar',
                content: '<h2>Regular Verbs in Past Tense</h2><p>To form the past tense (preterite) of regular -ar verbs:</p><ul><li>Remove the -ar ending</li><li>Add the appropriate ending: -é, -aste, -ó, -amos, -asteis, -aron</li></ul>',
                tags: ['verbs', 'past-tense', 'conjugation'],
                createdAt: new Date(2024, 2, 15, 10, 0),
                updatedAt: new Date(2024, 2, 15, 10, 0)
            },
            {
                id: 2,
                title: 'Common Food Vocabulary',
                category: 'vocabulary',
                content: '<h2>Essential Food Words</h2><p>Here are some common food items in Spanish:</p><ul><li>el pan - bread</li><li>la leche - milk</li><li>el huevo - egg</li><li>la manzana - apple</li></ul>',
                tags: ['food', 'basics'],
                createdAt: new Date(2024, 2, 14, 15, 30),
                updatedAt: new Date(2024, 2, 14, 15, 30)
            }
        ];
    }

    updateCategoryCounts() {
        const counts = {
            all: this.notes.length,
            grammar: this.notes.filter(note => note.category === 'grammar').length,
            vocabulary: this.notes.filter(note => note.category === 'vocabulary').length,
            phrases: this.notes.filter(note => note.category === 'phrases').length,
            culture: this.notes.filter(note => note.category === 'culture').length
        };

        document.querySelectorAll('.category-btn').forEach(btn => {
            const category = btn.dataset.category;
            const countEl = btn.querySelector('.note-count');
            if (countEl) {
                countEl.textContent = counts[category] || 0;
            }
        });
    }

    renderNotes() {
        const container = document.getElementById('notesContainer');
        container.className = this.currentView === 'grid' ? 'notes-grid' : 'notes-list';

        // Filter notes
        let filteredNotes = this.notes.filter(note => {
            const matchesCategory = this.currentCategory === 'all' || note.category === this.currentCategory;
            const matchesSearch = note.title.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
                                note.content.toLowerCase().includes(this.searchQuery.toLowerCase());
            const matchesTags = this.activeTags.size === 0 || 
                              note.tags.some(tag => this.activeTags.has(tag));
            return matchesCategory && matchesSearch && matchesTags;
        });

        // Sort notes
        const sortValue = document.getElementById('sortNotes').value;
        this.sortNotes(sortValue, filteredNotes);

        // Render notes
        container.innerHTML = filteredNotes.map(note => 
            this.currentView === 'grid' ? this.createNoteCard(note) : this.createNoteListItem(note)
        ).join('');

        // Add click events
        container.querySelectorAll('.note-card, .note-list-item').forEach(noteEl => {
            noteEl.addEventListener('click', () => {
                const noteId = parseInt(noteEl.dataset.noteId);
                const note = this.notes.find(n => n.id === noteId);
                if (note) {
                    this.showNoteDetails(note);
                }
            });
        });
    }

    createNoteCard(note) {
        return `
            <div class="note-card" data-note-id="${note.id}">
                <h3 class="note-title">${note.title}</h3>
                <div class="note-preview">${this.stripHtml(note.content)}</div>
                <div class="note-metadata">
                    <span class="note-category">${note.category}</span>
                    <span class="note-date">${this.formatDate(note.updatedAt)}</span>
                </div>
            </div>
        `;
    }

    createNoteListItem(note) {
        return `
            <div class="note-list-item" data-note-id="${note.id}">
                <div class="note-info">
                    <h3 class="note-title">${note.title}</h3>
                    <p class="note-preview">${this.stripHtml(note.content)}</p>
                </div>
                <span class="note-category">${note.category}</span>
                <span class="note-date">${this.formatDate(note.updatedAt)}</span>
            </div>
        `;
    }

    sortNotes(sortValue, notes = this.notes) {
        switch (sortValue) {
            case 'date-desc':
                notes.sort((a, b) => b.updatedAt - a.updatedAt);
                break;
            case 'date-asc':
                notes.sort((a, b) => a.updatedAt - b.updatedAt);
                break;
            case 'title-asc':
                notes.sort((a, b) => a.title.localeCompare(b.title));
                break;
            case 'title-desc':
                notes.sort((a, b) => b.title.localeCompare(a.title));
                break;
        }
    }

    showNoteModal(note = null) {
        const modal = document.getElementById('noteModal');
        const form = document.getElementById('noteForm');
        const titleEl = modal.querySelector('.modal-header h3');
        
        if (note) {
            // Edit mode
            titleEl.textContent = 'Edit Note';
            form.elements.noteTitle.value = note.title;
            form.elements.noteCategory.value = note.category;
            document.getElementById('noteContent').innerHTML = note.content;
            
            // Add tags
            const tagsPreview = document.querySelector('.tags-preview');
            tagsPreview.innerHTML = '';
            note.tags.forEach(tag => this.addTagToPreview(tag));
            
            form.dataset.noteId = note.id;
        } else {
            // New note mode
            titleEl.textContent = 'New Note';
            form.reset();
            document.getElementById('noteContent').innerHTML = '';
            document.querySelector('.tags-preview').innerHTML = '';
            delete form.dataset.noteId;
        }

        modal.classList.add('active');
    }

    hideNoteModal() {
        document.getElementById('noteModal').classList.remove('active');
    }

    showNoteDetails(note) {
        const modal = document.getElementById('noteDetailsModal');
        
        document.getElementById('detailsTitle').textContent = note.title;
        modal.querySelector('.note-category').textContent = note.category;
        modal.querySelector('.note-date').textContent = this.formatDate(note.updatedAt);
        
        const tagsContainer = modal.querySelector('.note-tags');
        tagsContainer.innerHTML = note.tags.map(tag => `<span class="tag">${tag}</span>`).join('');
        
        modal.querySelector('.note-content').innerHTML = note.content;
        modal.dataset.noteId = note.id;
        
        modal.classList.add('active');
    }

    hideDetailsModal() {
        document.getElementById('noteDetailsModal').classList.remove('active');
    }

    async saveNote() {
        const form = document.getElementById('noteForm');
        const content = document.getElementById('noteContent').innerHTML;
        const tags = Array.from(document.querySelectorAll('.tags-preview .tag'))
            .map(tag => tag.textContent.trim());

        const noteData = {
            title: form.elements.noteTitle.value,
            category: form.elements.noteCategory.value,
            content,
            tags,
            updatedAt: new Date()
        };

        if (form.dataset.noteId) {
            // Edit existing note
            noteData.id = parseInt(form.dataset.noteId);
            noteData.createdAt = this.notes.find(n => n.id === noteData.id).createdAt;
            const index = this.notes.findIndex(n => n.id === noteData.id);
            if (index !== -1) {
                this.notes[index] = noteData;
            }
        } else {
            // Create new note
            noteData.id = Date.now();
            noteData.createdAt = new Date();
            this.notes.unshift(noteData);
        }

        this.hideNoteModal();
        this.updateCategoryCounts();
        this.renderNotes();
    }

    async deleteNote() {
        const modal = document.getElementById('noteDetailsModal');
        const noteId = parseInt(modal.dataset.noteId);
        
        this.notes = this.notes.filter(note => note.id !== noteId);
        this.hideDetailsModal();
        this.updateCategoryCounts();
        this.renderNotes();
    }

    editNote() {
        const modal = document.getElementById('noteDetailsModal');
        const noteId = parseInt(modal.dataset.noteId);
        const note = this.notes.find(n => n.id === noteId);
        
        if (note) {
            this.hideDetailsModal();
            this.showNoteModal(note);
        }
    }

    shareNote() {
        const modal = document.getElementById('noteDetailsModal');
        const noteId = parseInt(modal.dataset.noteId);
        const note = this.notes.find(n => n.id === noteId);
        
        if (note) {
            // Implement sharing functionality
            console.log('Sharing note:', note);
        }
    }

    downloadNote() {
        const modal = document.getElementById('noteDetailsModal');
        const noteId = parseInt(modal.dataset.noteId);
        const note = this.notes.find(n => n.id === noteId);
        
        if (note) {
            const content = `# ${note.title}\n\n${this.stripHtml(note.content)}`;
            const blob = new Blob([content], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${note.title.toLowerCase().replace(/\s+/g, '-')}.txt`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }
    }

    addTagToPreview(tag) {
        const tagsPreview = document.querySelector('.tags-preview');
        const tagEl = document.createElement('span');
        tagEl.className = 'tag';
        tagEl.innerHTML = `
            ${tag}
            <button type="button" onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;
        tagsPreview.appendChild(tagEl);
    }

    formatText(format) {
        const editor = document.getElementById('noteContent');
        
        switch (format) {
            case 'bold':
            case 'italic':
            case 'underline':
                document.execCommand(format, false);
                break;
            case 'heading':
                document.execCommand('formatBlock', false, '<h2>');
                break;
            case 'list-ul':
                document.execCommand('insertUnorderedList', false);
                break;
            case 'list-ol':
                document.execCommand('insertOrderedList', false);
                break;
            case 'link':
                const url = prompt('Enter URL:');
                if (url) {
                    document.execCommand('createLink', false, url);
                }
                break;
            case 'image':
                const imageUrl = prompt('Enter image URL:');
                if (imageUrl) {
                    document.execCommand('insertImage', false, imageUrl);
                }
                break;
        }

        editor.focus();
    }

    stripHtml(html) {
        const tmp = document.createElement('div');
        tmp.innerHTML = html;
        return tmp.textContent || tmp.innerText || '';
    }

    formatDate(date) {
        const now = new Date();
        const diff = now - date;
        
        if (diff < 1000 * 60) { // Less than 1 minute
            return 'Just now';
        } else if (diff < 1000 * 60 * 60) { // Less than 1 hour
            const minutes = Math.floor(diff / (1000 * 60));
            return `${minutes}m ago`;
        } else if (diff < 1000 * 60 * 60 * 24) { // Less than 24 hours
            const hours = Math.floor(diff / (1000 * 60 * 60));
            return `${hours}h ago`;
        } else if (diff < 1000 * 60 * 60 * 24 * 7) { // Less than 7 days
            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            return `${days}d ago`;
        } else {
            return date.toLocaleDateString();
        }
    }
}

// Initialize notes manager when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.notesManager = new NotesManager();
}); 