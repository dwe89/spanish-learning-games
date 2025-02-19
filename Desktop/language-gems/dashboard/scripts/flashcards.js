
class Flashcards {
    static REVIEW_INTERVALS = [1, 3, 7, 14, 30]; // Days between reviews
    static BASE_EASE_FACTOR = 2.5;
    static MINIMUM_EASE_FACTOR = 1.3;

    constructor() {
        this.decks = [];
        this.currentDeck = null;
        this.currentCardIndex = 0;
        this.isStudyMode = false;
        this.initialize();
    }

    async initialize() {
        if (!auth.currentUser) return;
        await this.loadDecks();
        this.setupEventListeners();
        this.renderDecks();
    }

    async loadDecks() {
        try {
            const decksRef = collection(this.db, 'flashcardDecks');
            const q = query(decksRef, where('userId', '==', auth.currentUser.uid));
            const snapshot = await getDocs(q);
            
            this.decks = await Promise.all(snapshot.docs.map(async doc => {
                const deck = { id: doc.id, ...doc.data() };
                const cards = await this.loadDeckCards(deck.id);
                return { ...deck, cards };
            }));
        } catch (error) {
            console.error('Failed to load decks:', error);
            this.loadSampleDecks();
        }
    }

    async loadDeckCards(deckId) {
        const cardsRef = collection(this.db, 'flashcards');
        const q = query(cardsRef, 
            where('deckId', '==', deckId),
            where('userId', '==', auth.currentUser.uid)
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            nextReview: doc.data().nextReview?.toDate()
        }));
    }

    loadSampleDecks() {
        this.decks = [
            {
                id: 'sample-1',
                name: 'Spanish Basics',
                description: 'Essential Spanish words and phrases for beginners',
                cards: [
                    { front: 'Hello', back: 'Hola' },
                    { front: 'Goodbye', back: 'Adiós' },
                    { front: 'Please', back: 'Por favor' },
                    { front: 'Thank you', back: 'Gracias' },
                    { front: 'You\'re welcome', back: 'De nada' }
                ]
            }
        ];
        this.saveDeckToFirebase(this.decks[0]);
    }

    async saveDeckToFirebase(deck) {
        try {
            const deckRef = await addDoc(collection(this.db, 'flashcardDecks'), {
                name: deck.name,
                description: deck.description,
                userId: auth.currentUser.uid,
                createdAt: Timestamp.now(),
                lastStudied: null
            });

            await Promise.all(deck.cards.map(card =>
                addDoc(collection(this.db, 'flashcards'), {
                    deckId: deckRef.id,
                    userId: auth.currentUser.uid,
                    front: card.front,
                    back: card.back,
                    easeFactor: Flashcards.BASE_EASE_FACTOR,
                    interval: 0,
                    repetitions: 0,
                    nextReview: Timestamp.now(),
                    createdAt: Timestamp.now()
                })
            ));
        } catch (error) {
            console.error('Error saving deck to Firebase:', error);
        }
    }

    setupEventListeners() {
        document.getElementById('createDeckBtn')?.addEventListener('click', () => this.showCreateDeckModal());
        document.getElementById('flipBtn')?.addEventListener('click', () => this.flipCard());
        document.getElementById('wrongBtn')?.addEventListener('click', () => this.handleAnswer(false));
        document.getElementById('rightBtn')?.addEventListener('click', () => this.handleAnswer(true));
        document.getElementById('exitStudyBtn')?.addEventListener('click', () => this.exitStudyMode());
        document.getElementById('shuffleBtn')?.addEventListener('click', () => this.shuffleCards());
        document.getElementById('deckSelect')?.addEventListener('change', () => this.filterDecks());
    }

    renderDecks() {
        const container = document.getElementById('decksList');
        if (!container) return;

        container.innerHTML = this.decks.map(deck => `
            <div class="deck-card" data-deck-id="${deck.id}">
                <div class="deck-header">
                    <h3 class="deck-title">${deck.name}</h3>
                    <span class="deck-stats">${deck.cards.length} cards</span>
                </div>
                <p class="deck-description">${deck.description}</p>
                <div class="deck-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${this.calculateDeckProgress(deck)}%"></div>
                    </div>
                </div>
                ${deck.lastStudied ? `
                    <div class="deck-meta">
                        <span>Last studied: ${this.formatLastStudied(deck.lastStudied)}</span>
                    </div>
                ` : ''}
                <div class="deck-actions">
                    <button class="btn btn-primary" onclick="window.flashcards.startStudyMode('${deck.id}')">Study Now</button>
                </div>
            </div>
        `).join('');
    }

    calculateDeckProgress(deck) {
        if (!deck.cards.length) return 0;
        const masteredCards = deck.cards.filter(card => card.repetitions >= 5).length;
        return (masteredCards / deck.cards.length) * 100;
    }

    formatLastStudied(timestamp) {
        if (!timestamp) return 'Never';
        const date = timestamp instanceof Date ? timestamp : timestamp.toDate();
        return date.toLocaleDateString();
    }

    async startStudyMode(deckId) {
        const deck = this.decks.find(d => d.id === deckId);
        if (!deck) return;

        this.currentDeck = deck;
        this.currentCardIndex = 0;
        this.isStudyMode = true;

        document.querySelector('.decks-grid').style.display = 'none';
        document.querySelector('.study-mode').classList.remove('hidden');

        document.getElementById('deckTitle').textContent = deck.name;
        this.updateStudyProgress();
        this.showCurrentCard();
    }

    async handleAnswer(correct) {
        const card = this.currentDeck.cards[this.currentCardIndex];
        const cardRef = doc(this.db, 'flashcards', card.id);

        // Implement SuperMemo 2 algorithm
        let { easeFactor = Flashcards.BASE_EASE_FACTOR, interval = 0, repetitions = 0 } = card;
        
        if (correct) {
            repetitions++;
            if (repetitions === 1) {
                interval = 1;
            } else if (repetitions === 2) {
                interval = 6;
            } else {
                interval = Math.round(interval * easeFactor);
            }
            easeFactor = Math.max(
                Flashcards.MINIMUM_EASE_FACTOR,
                easeFactor + 0.1
            );
        } else {
            repetitions = 0;
            interval = 0;
            easeFactor = Math.max(
                Flashcards.MINIMUM_EASE_FACTOR,
                easeFactor - 0.2
            );
        }

        const nextReview = new Date();
        nextReview.setDate(nextReview.getDate() + interval);

        await updateDoc(cardRef, {
            easeFactor,
            interval,
            repetitions,
            nextReview: Timestamp.fromDate(nextReview),
            lastReviewed: Timestamp.now()
        });

        this.moveToNextCard();
    }

    moveToNextCard() {
        if (this.currentCardIndex < this.currentDeck.cards.length - 1) {
            this.currentCardIndex++;
            this.showCurrentCard();
            this.updateStudyProgress();
        } else {
            this.finishStudySession();
        }
    }

    async finishStudySession() {
        const deckRef = doc(this.db, 'flashcardDecks', this.currentDeck.id);
        await updateDoc(deckRef, {
            lastStudied: Timestamp.now()
        });

        alert('Congratulations! You\'ve completed this deck!');
        this.exitStudyMode();
        this.loadDecks(); // Refresh decks to update progress
    }

    showCurrentCard() {
        const card = this.currentDeck.cards[this.currentCardIndex];
        const cardElement = document.getElementById('currentCard');
        
        cardElement.classList.remove('flipped');
        cardElement.querySelector('.flashcard-front').innerHTML = `
            <div class="card-content">${card.front}</div>
        `;
        cardElement.querySelector('.flashcard-back').innerHTML = `
            <div class="card-content">${card.back}</div>
        `;
    }

    flipCard() {
        const cardElement = document.getElementById('currentCard');
        cardElement.classList.toggle('flipped');
    }

    updateStudyProgress() {
        const progressText = document.querySelector('.progress-text');
        if (progressText) {
            progressText.textContent = `Card ${this.currentCardIndex + 1} of ${this.currentDeck.cards.length}`;
        }
    }

    exitStudyMode() {
        this.studyMode = false;
        document.querySelector('.study-mode').classList.add('hidden');
        document.querySelector('.decks-grid').style.display = 'grid';
        this.currentDeck = null;
        this.currentCardIndex = 0;
    }

    filterDecks() {
        const category = document.getElementById('deckSelect').value;
        const cards = document.querySelectorAll('.deck-card');
        
        cards.forEach(card => {
            if (category === 'all' || card.dataset.category === category) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
    }
}

// Initialize Flashcards when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.flashcards = new Flashcards();
});