
// Progress Tracker for Emoji Game
export class ProgressTracker {
    constructor() {
        this.isInitialized = false;
        this.db = db;
    }

    async init() {
        if (this.isInitialized) return;
        this.isInitialized = true;

        try {
            // Test Firestore connection
            const testRef = doc(this.db, 'test/connection');
            await setDoc(testRef, { timestamp: new Date() });
            console.log('Firestore test successful');
        } catch (error) {
            console.error('Firestore test failed:', error);
        }

        // Watch for game completion
        const originalShowWinAnimation = window.showWinAnimation;
        window.showWinAnimation = async () => {
            // Call original function first
            originalShowWinAnimation();

            // Calculate score and time
            const totalQuestions = window.gameMode === 'custom' ? 
                window.customWords.length : 
                window.CATEGORIES[window.currentCategory].length;
            const timeSpent = window.timeLeft || 0;

            try {
                // Get auth token from localStorage
                const token = localStorage.getItem('auth_token');
                if (!token) {
                    console.log('User not logged in, progress not tracked');
                    return;
                }

                // Send progress to the server
                const response = await fetch('/api/progress/emoji-game', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        gameType: 'emoji',
                        score: window.correctMatches,
                        timeSpent: timeSpent,
                        category: window.currentCategory,
                        mode: window.gameMode
                    })
                });

                if (!response.ok) {
                    throw new Error('Failed to update progress');
                }

                console.log('Progress tracked successfully');
            } catch (error) {
                console.error('Failed to track progress:', error);
            }
        };
    }

    async saveProgress(gameData) {
        if (!auth.currentUser) {
            console.warn('No authenticated user');
            return;
        }

        try {
            const progressRef = collection(this.db, 'gameProgress');
            const q = query(progressRef, 
                where('userId', '==', auth.currentUser.uid),
                where('gameId', '==', 'emoji-game')
            );
            const snapshot = await getDocs(q);

            if (snapshot.empty) {
                // Create new progress document
                await addDoc(progressRef, {
                    userId: auth.currentUser.uid,
                    gameId: 'emoji-game',
                    progress: gameData,
                    lastUpdated: new Date()
                });
            } else {
                // Update existing progress
                const docRef = snapshot.docs[0].ref;
                await updateDoc(docRef, {
                    progress: gameData,
                    lastUpdated: new Date()
                });
            }

            console.log('Progress saved successfully');
        } catch (error) {
            console.error('Error saving progress:', error);
        }
    }

    async loadProgress() {
        if (!auth.currentUser) {
            console.warn('No authenticated user');
            return null;
        }

        try {
            const progressRef = collection(this.db, 'gameProgress');
            const q = query(progressRef, 
                where('userId', '==', auth.currentUser.uid),
                where('gameId', '==', 'emoji-game')
            );
            const snapshot = await getDocs(q);

            if (snapshot.empty) {
                return null;
            }

            const data = snapshot.docs[0].data();
            return data.progress;
        } catch (error) {
            console.error('Error loading progress:', error);
            return null;
        }
    }
}

// Export the tracker
export default ProgressTracker;
