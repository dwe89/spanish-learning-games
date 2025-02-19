const game = {}; // Define the game object here

export class Tutorial {
    constructor(gameInstance) {
        this.game = gameInstance;
        this.steps = [
            {
                message: "Welcome to Verb Quest! Let's start by creating your character.",
                action: () => this.showCharacterCreation()
            },
            {
                message: "Great! Now let's explore the Forest of Beginnings.",
                action: () => this.showRegionSelection()
            },
            {
                message: "Click on the Forest of Beginnings to enter.",
                action: () => this.highlightRegion('forest_of_beginnings')
            },
            {
                message: "Now, let's start a battle. Choose an easy challenge to begin.",
                action: () => this.showBattleOptions()
            },
            {
                message: "Type the correct conjugation and press Submit.",
                action: () => this.showAnswerForm()
            },
            {
                message: "Well done! You've completed the tutorial.",
                action: () => this.endTutorial()
            }
        ];
        this.currentStep = 0;
        this.init();
    }

    init() {
        this.showMessage(this.steps[this.currentStep].message);
        this.steps[this.currentStep].action();
    }

    nextStep() {
        this.currentStep++;
        if (this.currentStep < this.steps.length) {
            this.showMessage(this.steps[this.currentStep].message);
            this.steps[this.currentStep].action();
        } else {
            this.endTutorial();
        }
    }

    showMessage(message) {
        const tutorialMessage = document.createElement('div');
        tutorialMessage.className = 'tutorial-message';
        tutorialMessage.textContent = message;
        document.body.appendChild(tutorialMessage);
        setTimeout(() => tutorialMessage.remove(), 5000);
    }

    showCharacterCreation() {
        const characterModal = document.getElementById('characterModal');
        characterModal.style.display = 'flex';
        characterModal.querySelector('form').addEventListener('submit', () => this.nextStep());
    }

    showRegionSelection() {
        this.game.updateGameScreen();
        this.nextStep();
    }

    highlightRegion(regionId) {
        const regionCard = document.querySelector(`.region-card[onclick*="${regionId}"]`);
        if (regionCard) {
            regionCard.classList.add('highlight');
            regionCard.addEventListener('click', () => this.nextStep(), { once: true });
        }
    }

    showBattleOptions() {
        this.game.updateGameScreen();
        const easyButton = document.querySelector('.area-buttons button[onclick*="easy"]');
        if (easyButton) {
            easyButton.classList.add('highlight');
            easyButton.addEventListener('click', () => this.nextStep(), { once: true });
        }
    }

    showAnswerForm() {
        const answerForm = document.getElementById('answerForm');
        if (answerForm) {
            answerForm.classList.add('highlight');
            answerForm.addEventListener('submit', () => this.nextStep(), { once: true });
        }
    }

    endTutorial() {
        this.showMessage("Tutorial completed! Enjoy the game.");
        localStorage.setItem('tutorialCompleted', 'true');
    }

    skipTutorial() {
        this.currentStep = this.steps.length;
        this.endTutorial();
    }
}

// Initialize tutorial if not completed
document.addEventListener('DOMContentLoaded', () => {
    if (!localStorage.getItem('tutorialCompleted') && window.game) {
        const tutorial = new Tutorial(window.game);
        const skipButton = document.createElement('button');
        skipButton.textContent = 'Skip Tutorial';
        skipButton.className = 'skip-tutorial';
        skipButton.addEventListener('click', () => tutorial.skipTutorial());
        document.body.appendChild(skipButton);
    }
});
