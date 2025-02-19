export class Quest {
    constructor(game, questData) {
        this.game = game;
        this.id = questData.id;
        this.title = questData.title;
        this.description = questData.description;
        this.objectives = questData.objectives.map(obj => ({
            ...obj,
            progress: 0,
            completed: false
        }));
        this.rewards = questData.rewards;
        this.completed = false;
        this.active = true;
    }

    updateProgress(type, data) {
        if (!this.active || this.completed) return;

        this.objectives.forEach(objective => {
            if (objective.completed) return;

            switch (type) {
                case 'defeat_enemy':
                    if (objective.type === 'defeat_enemy' && objective.enemyId === data.enemyId) {
                        objective.progress++;
                        if (objective.progress >= objective.required) {
                            objective.completed = true;
                            this.game.showMessage(`Quest objective completed: ${objective.description}`);
                        }
                    }
                    break;

                case 'conjugate_verb':
                    if (objective.type === 'conjugate_verb' && 
                        objective.verb === data.verb &&
                        objective.tense === data.tense) {
                        objective.progress++;
                        if (objective.progress >= objective.required) {
                            objective.completed = true;
                            this.game.showMessage(`Quest objective completed: ${objective.description}`);
                        }
                    }
                    break;

                case 'visit_region':
                    if (objective.type === 'visit_region' && objective.regionId === data.regionId) {
                        objective.progress = 1;
                        objective.completed = true;
                        this.game.showMessage(`Quest objective completed: ${objective.description}`);
                    }
                    break;

                case 'collect_item':
                    if (objective.type === 'collect_item' && objective.itemId === data.itemId) {
                        objective.progress++;
                        if (objective.progress >= objective.required) {
                            objective.completed = true;
                            this.game.showMessage(`Quest objective completed: ${objective.description}`);
                        }
                    }
                    break;
            }
        });

        this.checkCompletion();
    }

    checkCompletion() {
        if (this.objectives.every(obj => obj.completed)) {
            this.completed = true;
            this.active = false;
            this.giveRewards();
            this.game.showMessage(`Quest completed: ${this.title}!`);
            this.game.updateUI();
        }
    }

    giveRewards() {
        if (this.rewards.xp) {
            this.game.player.gainXP(this.rewards.xp);
        }

        if (this.rewards.items) {
            this.rewards.items.forEach(item => {
                this.game.player.inventory.push(item);
                this.game.showMessage(`Received ${item.name}!`);
            });
        }

        if (this.rewards.unlockRegion) {
            this.game.unlockRegion(this.rewards.unlockRegion);
        }

        if (this.rewards.unlockAbility) {
            this.game.player.unlockAbility(this.rewards.unlockAbility);
            this.game.showMessage(`Unlocked new ability: ${this.rewards.unlockAbility}!`);
        }
    }

    getProgress() {
        return {
            title: this.title,
            description: this.description,
            objectives: this.objectives.map(obj => ({
                description: obj.description,
                progress: obj.progress,
                required: obj.required,
                completed: obj.completed
            })),
            completed: this.completed
        };
    }
} 