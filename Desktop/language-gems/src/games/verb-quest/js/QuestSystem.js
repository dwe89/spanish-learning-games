export class QuestSystem {
    constructor(game) {
        this.game = game;
        this.quests = [];
        this.loadQuests();
    }

    loadQuests() {
        // Load quests from local storage or initialize default quests
        const savedQuests = JSON.parse(localStorage.getItem('quests'));
        if (savedQuests) {
            this.quests = savedQuests;
        } else {
            this.initializeDefaultQuests();
        }
    }

    initializeDefaultQuests() {
        this.quests = [
            {
                id: 1,
                name: 'First Steps',
                description: 'Complete your first battle.',
                completed: false,
                progress: 0,
                goal: 1
            },
            {
                id: 2,
                name: 'Novice Explorer',
                description: 'Unlock a new region.',
                completed: false,
                progress: 0,
                goal: 1
            }
            // Add more quests as needed
        ];
    }

    saveQuests() {
        localStorage.setItem('quests', JSON.stringify(this.quests));
    }

    startQuest(questId) {
        const quest = this.quests.find(q => q.id === questId);
        if (quest) {
            quest.progress = 0;
            quest.completed = false;
            this.saveQuests();
        }
    }

    completeQuest(questId) {
        const quest = this.quests.find(q => q.id === questId);
        if (quest) {
            quest.completed = true;
            this.saveQuests();
            this.game.showMessage(`Quest completed: ${quest.name}`);
        }
    }

    updateQuestProgress(questId, progress) {
        const quest = this.quests.find(q => q.id === questId);
        if (quest) {
            quest.progress = progress;
            if (quest.progress >= quest.goal) {
                this.completeQuest(questId);
            } else {
                this.saveQuests();
            }
        }
    }

    checkQuestProgress() {
        this.quests.forEach(quest => {
            if (!quest.completed && quest.progress >= quest.goal) {
                this.completeQuest(quest.id);
            }
        });
    }
}