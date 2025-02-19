
class FlashcardsManager {
    constructor() {
        this.db = getFirestore();
        this.currentDeck = null;
        this.currentCard = null;
    }

    async getDecks() {
        if (!auth.currentUser) {
            throw new Error('No authenticated user');
        }

        try {
            const decksRef = collection(this.db, 'flashcardDecks');
            const q = query(decksRef, where('userId', '==', auth.currentUser.uid));
            const snapshot = await getDocs(q);

            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Error fetching decks:', error);
            throw error;
        }
    }

    async createDeck(deckData) {
        if (!auth.currentUser) {
            throw new Error('No authenticated user');
        }

        try {
            const decksRef = collection(this.db, 'flashcardDecks');
            const newDeck = {
                ...deckData,
                userId: auth.currentUser.uid,
                createdAt: new Date(),
                lastModified: new Date(),
                cardCount: 0
            };

            const docRef = await addDoc(decksRef, newDeck);
            return {
                id: docRef.id,
                ...newDeck
            };
        } catch (error) {
            console.error('Error creating deck:', error);
            throw error;
        }
    }

    async getDeckCards(deckId) {
        if (!auth.currentUser) {
            throw new Error('No authenticated user');
        }

        try {
            const cardsRef = collection(this.db, 'flashcards');
            const q = query(cardsRef, 
                where('userId', '==', auth.currentUser.uid),
                where('deckId', '==', deckId)
            );
            const snapshot = await getDocs(q);

            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Error fetching cards:', error);
            throw error;
        }
    }

    async addCard(deckId, cardData) {
        if (!auth.currentUser) {
            throw new Error('No authenticated user');
        }

        try {
            // Add card
            const cardsRef = collection(this.db, 'flashcards');
            const newCard = {
                ...cardData,
                deckId,
                userId: auth.currentUser.uid,
                createdAt: new Date(),
                lastReviewed: null,
                reviewCount: 0
            };

            const cardRef = await addDoc(cardsRef, newCard);

            // Update deck card count
            const deckRef = doc(this.db, 'flashcardDecks', deckId);
            await updateDoc(deckRef, {
                cardCount: increment(1),
                lastModified: new Date()
            });

            return {
                id: cardRef.id,
                ...newCard
            };
        } catch (error) {
            console.error('Error adding card:', error);
            throw error;
        }
    }

    async updateCard(cardId, updates) {
        if (!auth.currentUser) {
            throw new Error('No authenticated user');
        }

        try {
            const cardRef = doc(this.db, 'flashcards', cardId);
            await updateDoc(cardRef, {
                ...updates,
                lastModified: new Date()
            });
        } catch (error) {
            console.error('Error updating card:', error);
            throw error;
        }
    }

    async deleteCard(cardId, deckId) {
        if (!auth.currentUser) {
            throw new Error('No authenticated user');
        }

        try {
            // Delete card
            const cardRef = doc(this.db, 'flashcards', cardId);
            await deleteDoc(cardRef);

            // Update deck card count
            const deckRef = doc(this.db, 'flashcardDecks', deckId);
            await updateDoc(deckRef, {
                cardCount: increment(-1),
                lastModified: new Date()
            });
        } catch (error) {
            console.error('Error deleting card:', error);
            throw error;
        }
    }

    async updateReviewStatus(cardId, isCorrect) {
        if (!auth.currentUser) {
            throw new Error('No authenticated user');
        }

        try {
            const cardRef = doc(this.db, 'flashcards', cardId);
            await updateDoc(cardRef, {
                lastReviewed: new Date(),
                reviewCount: increment(1),
                correctCount: isCorrect ? increment(1) : increment(0)
            });
        } catch (error) {
            console.error('Error updating review status:', error);
            throw error;
        }
    }
}

export const flashcardsManager = new FlashcardsManager();

// Initialize flashcards when the page loads
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Wait for auth state to be determined
        await new Promise((resolve) => {
            const unsubscribe = auth.onAuthStateChanged((user) => {
                unsubscribe();
                resolve(user);
            });
        });

        if (!auth.currentUser) {
            console.warn('User not authenticated');
            return;
        }

        const decks = await flashcardsManager.getDecks();
        displayDecks(decks);
    } catch (error) {
        console.error('Error initializing flashcards:', error);
    }
});

// Add auth state change listener
auth.onAuthStateChanged((user) => {
    if (user) {
        flashcardsManager.getDecks()
            .then(decks => displayDecks(decks))
            .catch(error => console.error('Error loading flashcard decks:', error));
    } else {
        // Clear flashcards display when user logs out
        const flashcardsContainer = document.getElementById('flashcards-container');
        if (flashcardsContainer) {
            flashcardsContainer.innerHTML = '<p>Please log in to view flashcards</p>';
        }
    }
}); 