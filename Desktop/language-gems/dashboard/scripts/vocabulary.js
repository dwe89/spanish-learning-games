class VocabularyManager {
    constructor() {
        this.words = [];
        this.currentFilter = 'all';
        this.currentCategory = 'all';
        this.initializeEventListeners();
        this.loadVocabulary();
    }

    initializeEventListeners() {
        // Category select
        const categorySelect = document.getElementById('categorySelect');
        if (categorySelect) {
            categorySelect.addEventListener('change', (e) => {
                this.currentCategory = e.target.value;
                this.filterAndRenderWords();
            });
        }

        // Filter buttons
        const filterButtons = document.querySelectorAll('.filter-btn');
        filterButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                filterButtons.forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.currentFilter = e.target.dataset.filter;
                this.filterAndRenderWords();
            });
        });

        // Add word button
        const addWordBtn = document.getElementById('addWordBtn');
        if (addWordBtn) {
            addWordBtn.addEventListener('click', () => this.showAddWordModal());
        }

        // Add word form
        const addWordForm = document.getElementById('addWordForm');
        if (addWordForm) {
            addWordForm.addEventListener('submit', (e) => this.handleAddWord(e));
        }

        // Modal close button
        const closeWordModal = document.getElementById('closeWordModal');
        if (closeWordModal) {
            closeWordModal.addEventListener('click', () => this.hideAddWordModal());
        }

        // Cancel button in modal
        const cancelWordBtn = document.getElementById('cancelWordBtn');
        if (cancelWordBtn) {
            cancelWordBtn.addEventListener('click', () => this.hideAddWordModal());
        }
    }

    async loadVocabulary() {
        try {
            // In a real application, this would be an API call
            const response = await fetch('/api/vocabulary');
            if (!response.ok) throw new Error('Failed to load vocabulary');
            
            this.words = await response.json();
            this.updateStats();
            this.filterAndRenderWords();
        } catch (error) {
            console.error('Error loading vocabulary:', error);
            // Use sample data for demonstration
            this.words = [
                {
                    id: 1,
                    spanish: 'hola',
                    english: 'hello',
                    category: 'basics',
                    status: 'mastered',
                    notes: 'Basic greeting'
                },
                {
                    id: 2,
                    spanish: 'gracias',
                    english: 'thank you',
                    category: 'basics',
                    status: 'mastered',
                    notes: 'Common courtesy'
                },
                {
                    id: 3,
                    spanish: 'biblioteca',
                    english: 'library',
                    category: 'places',
                    status: 'learning',
                    notes: 'Public place'
                }
            ];
            this.updateStats();
            this.filterAndRenderWords();
        }
    }

    updateStats() {
        const totalWords = this.words.length;
        const masteredWords = this.words.filter(word => word.status === 'mastered').length;
        const learningWords = this.words.filter(word => word.status === 'learning').length;

        // Update stats in the UI
        document.querySelectorAll('.stat-number').forEach(stat => {
            const statParent = stat.closest('.stat-card');
            if (statParent.querySelector('h3').textContent === 'Total Words') {
                stat.textContent = totalWords;
            } else if (statParent.querySelector('h3').textContent === 'Mastered') {
                stat.textContent = masteredWords;
            } else if (statParent.querySelector('h3').textContent === 'Learning') {
                stat.textContent = learningWords;
            }
        });
    }

    filterAndRenderWords() {
        let filteredWords = this.words;

        // Apply category filter
        if (this.currentCategory !== 'all') {
            filteredWords = filteredWords.filter(word => word.category === this.currentCategory);
        }

        // Apply status filter
        if (this.currentFilter !== 'all') {
            filteredWords = filteredWords.filter(word => word.status === this.currentFilter);
        }

        this.renderWords(filteredWords);
    }

    renderWords(words) {
        const vocabList = document.getElementById('vocabList');
        if (!vocabList) return;

        vocabList.innerHTML = words.map(word => `
            <div class="vocab-card" data-id="${word.id}">
                <div class="vocab-card-header">
                    <div class="word-info">
                        <h3>${word.spanish}</h3>
                        <p>${word.english}</p>
                    </div>
                    <span class="word-status status-${word.status}">${word.status}</span>
                </div>
                ${word.notes ? `
                    <div class="word-meta">
                        <p>${word.notes}</p>
                    </div>
                ` : ''}
            </div>
        `).join('');

        // Add click handlers for cards
        document.querySelectorAll('.vocab-card').forEach(card => {
            card.addEventListener('click', () => this.showWordDetails(card.dataset.id));
        });
    }

    showAddWordModal() {
        const modal = document.getElementById('addWordModal');
        if (modal) {
            modal.classList.add('active');
        }
    }

    hideAddWordModal() {
        const modal = document.getElementById('addWordModal');
        if (modal) {
            modal.classList.remove('active');
            document.getElementById('addWordForm').reset();
        }
    }

    async handleAddWord(event) {
        event.preventDefault();

        const formData = {
            spanish: document.getElementById('wordSpanish').value,
            english: document.getElementById('wordEnglish').value,
            category: document.getElementById('wordCategory').value,
            notes: document.getElementById('wordNotes').value,
            status: 'learning',
            id: Date.now() // Temporary ID generation
        };

        try {
            // In a real application, this would be an API call
            // const response = await fetch('/api/vocabulary', {
            //     method: 'POST',
            //     headers: { 'Content-Type': 'application/json' },
            //     body: JSON.stringify(formData)
            // });
            // if (!response.ok) throw new Error('Failed to add word');
            // const newWord = await response.json();

            // For demonstration, directly add to local array
            this.words.push(formData);
            this.updateStats();
            this.filterAndRenderWords();
            this.hideAddWordModal();
        } catch (error) {
            console.error('Error adding word:', error);
            alert('Failed to add word. Please try again.');
        }
    }

    showWordDetails(wordId) {
        const word = this.words.find(w => w.id === parseInt(wordId));
        if (!word) return;

        // In a real application, you would show a modal with word details
        // and options to edit, delete, or change status
        console.log('Word details:', word);
    }
}

// Initialize vocabulary manager when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.vocabularyManager = new VocabularyManager();
});
