import { Quest } from './Quest.js';

export class QuestManager {
    constructor(game) {
        this.game = game;
        this.activeQuests = new Map();
        this.completedQuests = new Set();
        this.questLog = document.createElement('div');
        this.setupQuestLog();
    }

    setupQuestLog() {
        this.questLog.className = 'quest-log';
        this.questLog.style.display = 'none';
        document.body.appendChild(this.questLog);

        const toggleBtn = document.createElement('button');
        toggleBtn.className = 'quest-log-toggle';
        toggleBtn.textContent = 'Quest Log';
        toggleBtn.onclick = () => this.toggleQuestLog();
        document.body.appendChild(toggleBtn);
    }

    toggleQuestLog() {
        const isVisible = this.questLog.style.display === 'block';
        this.questLog.style.display = isVisible ? 'none' : 'block';
    }

    startQuest(questData) {
        if (this.activeQuests.has(questData.id) || this.completedQuests.has(questData.id)) {
            this.game.showMessage('You have already started or completed this quest!');
            return false;
        }

        const quest = new Quest(this.game, questData);
        this.activeQuests.set(questData.id, quest);
        this.game.showMessage(`Started new quest: ${quest.title}`);
        this.updateQuestLog();
        return true;
    }

    updateProgress(type, data) {
        this.activeQuests.forEach(quest => {
            quest.updateProgress(type, data);
            if (quest.completed) {
                this.completeQuest(quest);
            }
        });
        this.updateQuestLog();
    }

    completeQuest(quest) {
        this.activeQuests.delete(quest.id);
        this.completedQuests.add(quest.id);
        this.updateQuestLog();
    }

    updateQuestLog() {
        this.questLog.innerHTML = '';

        const header = document.createElement('h2');
        header.textContent = 'Quest Log';
        this.questLog.appendChild(header);

        if (this.activeQuests.size === 0) {
            const noQuests = document.createElement('p');
            noQuests.textContent = 'No active quests';
            this.questLog.appendChild(noQuests);
            return;
        }

        this.activeQuests.forEach(quest => {
            const questDiv = document.createElement('div');
            questDiv.className = 'quest-entry';

            const title = document.createElement('h3');
            title.textContent = quest.title;

            const description = document.createElement('p');
            description.textContent = quest.description;

            const objectives = document.createElement('ul');
            quest.objectives.forEach(obj => {
                const li = document.createElement('li');
                li.className = obj.completed ? 'completed' : '';
                li.textContent = `${obj.description} (${obj.progress}/${obj.required})`;
                objectives.appendChild(li);
            });

            questDiv.appendChild(title);
            questDiv.appendChild(description);
            questDiv.appendChild(objectives);

            this.questLog.appendChild(questDiv);
        });
    }

    getQuestProgress(questId) {
        const quest = this.activeQuests.get(questId);
        return quest ? quest.getProgress() : null;
    }

    getAllQuestProgress() {
        const progress = {
            active: Array.from(this.activeQuests.values()).map(quest => quest.getProgress()),
            completed: Array.from(this.completedQuests)
        };
        return progress;
    }

    loadProgress(progress) {
        this.activeQuests.clear();
        this.completedQuests.clear();

        if (progress.active) {
            progress.active.forEach(questData => {
                const quest = new Quest(this.game, questData);
                quest.objectives = questData.objectives;
                quest.completed = questData.completed;
                this.activeQuests.set(quest.id, quest);
            });
        }

        if (progress.completed) {
            progress.completed.forEach(questId => {
                this.completedQuests.add(questId);
            });
        }

        this.updateQuestLog();
    }

    hasCompletedQuest(questId) {
        return this.completedQuests.has(questId);
    }

    abandonQuest(questId) {
        if (this.activeQuests.has(questId)) {
            this.activeQuests.delete(questId);
            this.game.showMessage(`Abandoned quest: ${questId}`);
            this.updateQuestLog();
            return true;
        }
        return false;
    }
} 