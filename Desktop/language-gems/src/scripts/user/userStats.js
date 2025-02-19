class UserStats {
    constructor() {
        this.stats = JSON.parse(localStorage.getItem('userStats') || '{}');
        this.initializeStats();
    }

    initializeStats() {
        if (!this.stats.xp) this.stats.xp = 0;
        if (!this.stats.vocabulary) this.stats.vocabulary = [];
        if (!this.stats.studyTime) this.stats.studyTime = 0;
        if (!this.stats.lessonsCompleted) this.stats.lessonsCompleted = 0;
        this.saveStats();
    }

    addXP(amount) {
        this.stats.xp += amount;
        this.saveStats();
        window.dashboard?.addActivity('xp', `Earned ${amount} XP!`);
        this.updateUI();
    }

    addVocabularyWord(word, status) {
        const existingWord = this.stats.vocabulary.find(w => w.word === word);
        if (existingWord) {
            existingWord.status = status;
        } else {
            this.stats.vocabulary.push({ word, status, timestamp: new Date().toISOString() });
        }
        this.saveStats();
        window.dashboard?.addActivity('vocabulary', `New word added: ${word}`);
        this.updateUI();
    }

    addStudyTime(minutes) {
        this.stats.studyTime += minutes;
        this.saveStats();
        window.dashboard?.addActivity('study', `Studied for ${minutes} minutes`);
        this.updateUI();
    }

    completeLesson() {
        this.stats.lessonsCompleted++;
        this.saveStats();
        window.dashboard?.addActivity('lesson', 'Completed a lesson!');
        this.updateUI();
    }

    saveStats() {
        localStorage.setItem('userStats', JSON.stringify(this.stats));
    }

    updateUI() {
        // Update XP display
        const xpDisplay = document.querySelector('#xp-display');
        if (xpDisplay) {
            xpDisplay.textContent = `XP: ${this.stats.xp}`;
        }

        // Update vocabulary count
        const vocabDisplay = document.querySelector('#vocab-count');
        if (vocabDisplay) {
            vocabDisplay.textContent = `Words: ${this.stats.vocabulary.length}`;
        }

        // Update study time
        const timeDisplay = document.querySelector('#study-time');
        if (timeDisplay) {
            timeDisplay.textContent = `Study Time: ${this.stats.studyTime} min`;
        }
    }
}

// Initialize user stats
window.userStats = new UserStats(); 