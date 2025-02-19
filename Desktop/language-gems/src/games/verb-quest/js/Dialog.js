export class Dialog {
    constructor(game) {
        this.game = game;
        this.currentNPC = null;
        this.currentDialog = null;
        this.container = null;
        this.setupDialogContainer();
    }

    setupDialogContainer() {
        this.container = document.createElement('div');
        this.container.className = 'dialog-container';
        document.body.appendChild(this.container);
        this.hide();
    }

    show() {
        this.container.style.display = 'flex';
    }

    hide() {
        this.container.style.display = 'none';
    }

    startDialog(npc) {
        this.currentNPC = npc;
        this.currentDialog = npc.dialogs.greeting;
        this.showDialog();
    }

    showDialog() {
        if (!this.currentDialog) return;

        const dialogBox = document.createElement('div');
        dialogBox.className = 'dialog-box';

        const portrait = document.createElement('div');
        portrait.className = 'npc-portrait';
        portrait.style.backgroundImage = `url(${this.currentNPC.sprite})`;

        const textContent = document.createElement('div');
        textContent.className = 'dialog-text';

        const name = document.createElement('h3');
        name.textContent = this.currentNPC.name;

        const text = document.createElement('p');
        text.textContent = this.currentDialog.text;

        textContent.appendChild(name);
        textContent.appendChild(text);

        dialogBox.appendChild(portrait);
        dialogBox.appendChild(textContent);

        if (this.currentDialog.choices) {
            const choices = document.createElement('div');
            choices.className = 'dialog-choices';

            this.currentDialog.choices.forEach(choice => {
                const button = document.createElement('button');
                button.className = 'dialog-choice';
                button.textContent = choice.text;
                button.onclick = () => this.handleChoice(choice);
                choices.appendChild(button);
            });

            dialogBox.appendChild(choices);
        } else {
            const continueBtn = document.createElement('button');
            continueBtn.className = 'dialog-choice';
            continueBtn.textContent = 'Continue';
            continueBtn.onclick = () => this.endDialog();
            
            const choices = document.createElement('div');
            choices.className = 'dialog-choices';
            choices.appendChild(continueBtn);
            dialogBox.appendChild(choices);
        }

        this.container.innerHTML = '';
        this.container.appendChild(dialogBox);
        this.show();
    }

    handleChoice(choice) {
        if (choice.quest) {
            this.game.startQuest(choice.quest);
            this.endDialog();
        } else if (choice.nextDialog) {
            this.currentDialog = this.currentNPC.dialogs[choice.nextDialog];
            this.showDialog();
        } else if (choice.shop) {
            this.showShop();
        } else {
            this.endDialog();
        }
    }

    showShop() {
        const shopBox = document.createElement('div');
        shopBox.className = 'dialog-box';

        const portrait = document.createElement('div');
        portrait.className = 'npc-portrait';
        portrait.style.backgroundImage = `url(${this.currentNPC.sprite})`;

        const textContent = document.createElement('div');
        textContent.className = 'dialog-text';

        const name = document.createElement('h3');
        name.textContent = this.currentNPC.name;

        const text = document.createElement('p');
        text.textContent = "What would you like to buy?";

        textContent.appendChild(name);
        textContent.appendChild(text);

        const itemsContainer = document.createElement('div');
        itemsContainer.className = 'dialog-choices';

        this.currentNPC.items.forEach(item => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'shop-item';
            
            const itemName = document.createElement('span');
            itemName.textContent = `${item.name} - ${item.cost} XP`;
            
            const itemDesc = document.createElement('p');
            itemDesc.textContent = item.description;
            
            const buyBtn = document.createElement('button');
            buyBtn.textContent = 'Buy';
            buyBtn.onclick = () => this.handlePurchase(item);
            
            itemDiv.appendChild(itemName);
            itemDiv.appendChild(itemDesc);
            itemDiv.appendChild(buyBtn);
            itemsContainer.appendChild(itemDiv);
        });

        const closeBtn = document.createElement('button');
        closeBtn.className = 'dialog-choice';
        closeBtn.textContent = 'Close Shop';
        closeBtn.onclick = () => this.endDialog();
        itemsContainer.appendChild(closeBtn);

        shopBox.appendChild(portrait);
        shopBox.appendChild(textContent);
        shopBox.appendChild(itemsContainer);

        this.container.innerHTML = '';
        this.container.appendChild(shopBox);
    }

    handlePurchase(item) {
        if (this.game.player.xp >= item.cost) {
            this.game.player.xp -= item.cost;
            this.game.player.inventory.push(item);
            this.game.showMessage(`Purchased ${item.name}!`);
            this.game.updateUI();
        } else {
            this.game.showMessage("Not enough XP!");
        }
    }

    endDialog() {
        this.currentNPC = null;
        this.currentDialog = null;
        this.hide();
        this.game.enterExplorationMode();
    }
} 