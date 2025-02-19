
class DashboardDataService {
    constructor() {
    }

    async getAuthHeaders() {
        const token = await auth.currentUser?.getIdToken();
        return {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };
    }

    async fetchUserData() {
        if (!auth.currentUser) {
            throw new Error('No authenticated user');
        }

        const userRef = collection(this.db, 'users');
        const q = query(userRef, where('uid', '==', auth.currentUser.uid));
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            return null;
        }

        return snapshot.docs[0].data();
    }

    async updateUserProgress(progressData) {
        if (!auth.currentUser) {
            throw new Error('No authenticated user');
        }

        const userRef = collection(this.db, 'users');
        const q = query(userRef, where('uid', '==', auth.currentUser.uid));
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            // Create new user document
            await addDoc(userRef, {
                uid: auth.currentUser.uid,
                email: auth.currentUser.email,
                displayName: auth.currentUser.displayName,
                progress: progressData
            });
        } else {
            // Update existing user document
            const docRef = snapshot.docs[0].ref;
            await updateDoc(docRef, { progress: progressData });
        }
    }

    async getLeaderboard() {
        const leaderboardRef = collection(this.db, 'leaderboard');
        const snapshot = await getDocs(leaderboardRef);
        return snapshot.docs.map(doc => doc.data());
    }

    async updateLeaderboard(score) {
        if (!auth.currentUser) {
            throw new Error('No authenticated user');
        }

        const leaderboardRef = collection(this.db, 'leaderboard');
        await addDoc(leaderboardRef, {
            uid: auth.currentUser.uid,
            displayName: auth.currentUser.displayName || auth.currentUser.email,
            score: score,
            timestamp: new Date()
        });
    }

    // Progress and Statistics
    async getUserProgress() {
        return this._authenticatedFetch('/progress');
    }

    async getAchievements() {
        return this._authenticatedFetch('/achievements');
    }

    // Learning Materials
    async getAssignments() {
        return this._authenticatedFetch('/assignments');
    }

    async getFlashcardDecks() {
        return this._authenticatedFetch('/flashcards/decks');
    }

    async getVocabularyLists() {
        return this._authenticatedFetch('/vocabulary/lists');
    }

    async getGames() {
        return this._authenticatedFetch('/games');
    }

    // Social Features
    async getLeaderboard() {
        return this._authenticatedFetch('/leaderboard');
    }

    // Study Tools
    async getNotes() {
        return this._authenticatedFetch('/notes');
    }

    async saveNote(note) {
        return this._authenticatedFetch('/notes', {
            method: 'POST',
            body: JSON.stringify(note)
        });
    }

    // Resources
    async getResources() {
        return this._authenticatedFetch('/resources');
    }

    // Helper Methods
    async _authenticatedFetch(endpoint, options = {}) {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('Not authenticated');
        }

        const defaultOptions = {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        };

        try {
            const response = await fetch(this.API_BASE_URL + endpoint, {
                ...defaultOptions,
                ...options,
                headers: {
                    ...defaultOptions.headers,
                    ...(options.headers || {})
                }
            });

            if (!response.ok) {
                throw new Error('API request failed');
            }

            return await response.json();
        } catch (error) {
            console.error('API request error:', error);
            // Return mock data for development
            return this._getMockData(endpoint);
        }
    }

    // Mock data for development
    _getMockData(endpoint) {
        const mockData = {
            '/progress': {
                completedLessons: 15,
                totalLessons: 30,
                streak: 7,
                xp: 1250,
                level: 5,
                recentActivity: [
                    { type: 'lesson', name: 'Present Tense', score: 90, date: '2024-01-26' },
                    { type: 'game', name: 'Verb Quest', score: 85, date: '2024-01-25' }
                ]
            },
            '/achievements': {
                unlocked: [
                    { id: 1, name: 'First Steps', description: 'Complete your first lesson', date: '2024-01-20' },
                    { id: 2, name: 'Perfect Score', description: 'Get 100% on a quiz', date: '2024-01-22' }
                ],
                locked: [
                    { id: 3, name: 'Vocabulary Master', description: 'Learn 100 words' },
                    { id: 4, name: 'Grammar Expert', description: 'Complete all grammar lessons' }
                ]
            },
            '/assignments': {
                current: [
                    { id: 1, title: 'Present Tense Practice', dueDate: '2024-02-01', status: 'in-progress' },
                    { id: 2, title: 'Vocabulary Quiz', dueDate: '2024-02-03', status: 'not-started' }
                ],
                completed: [
                    { id: 3, title: 'Basic Greetings', completedDate: '2024-01-25', score: 95 }
                ]
            },
            '/flashcards/decks': [
                { id: 1, name: 'Common Verbs', cards: 20, mastered: 15 },
                { id: 2, name: 'Food Vocabulary', cards: 30, mastered: 10 }
            ],
            '/vocabulary/lists': [
                { id: 1, name: 'Basic Phrases', words: 50, progress: 80 },
                { id: 2, name: 'Numbers', words: 30, progress: 60 }
            ],
            '/games': [
                { id: 1, name: 'Verb Quest', description: 'Practice verb conjugations', highScore: 850 },
                { id: 2, name: 'Word Match', description: 'Match Spanish to English', highScore: 920 }
            ],
            '/leaderboard': {
                weekly: [
                    { rank: 1, username: 'maria_spanish', xp: 2500 },
                    { rank: 2, username: 'language_master', xp: 2300 }
                ],
                monthly: [
                    { rank: 1, username: 'spanish_pro', xp: 10500 },
                    { rank: 2, username: 'vocab_king', xp: 9800 }
                ]
            },
            '/notes': [
                { id: 1, title: 'Verb Conjugation Rules', content: 'Regular -ar verbs...', date: '2024-01-24' },
                { id: 2, title: 'Common Phrases', content: 'Greetings and farewells...', date: '2024-01-23' }
            ],
            '/resources': [
                { id: 1, type: 'video', title: 'Spanish Pronunciation Guide', url: '#' },
                { id: 2, type: 'pdf', title: 'Grammar Cheat Sheet', url: '#' }
            ]
        };

        return mockData[endpoint] || { error: 'No mock data available' };
    }
}

export const dashboardService = new DashboardDataService(); 