import { NPCs } from '../data/npcs.js';

export class DialogSystem {
    constructor(game) {
        this.game = game;
        this.currentNPC = null;
        this.currentDialog = null;
        this.dialogHistory = [];
        this.isVisible = false;
        this.setupUI();
    }

    setupUI() {
        // Create dialog container
        this.container = document.createElement('div');
        this.container.className = 'dialog-container';
        this.container.style.display = 'none';
        
        // Create dialog box
        this.dialogBox = document.createElement('div');
        this.dialogBox.className = 'dialog-box';
        
        // Create portrait area
        this.portrait = document.createElement('div');
        this.portrait.className = 'npc-portrait';
        
        // Create text area
        this.textArea = document.createElement('div');
        this.textArea.className = 'dialog-text';
        
        // Create choices area
        this.choicesArea = document.createElement('div');
        this.choicesArea.className = 'dialog-choices';
        
        // Assemble dialog box
        this.dialogBox.appendChild(this.portrait);
        this.dialogBox.appendChild(this.textArea);
        this.dialogBox.appendChild(this.choicesArea);
        this.container.appendChild(this.dialogBox);
        
        // Add to game
        document.body.appendChild(this.container);
    }

    startDialog(npcId, regionId) {
        const npc = NPCs[regionId][npcId];
        if (!npc) {
            console.error('NPC not found:', npcId);
            return;
        }

        this.currentNPC = npc;
        this.showDialog('greeting');
    }

    showDialog(dialogId) {
        if (!this.currentNPC || !this.currentNPC.dialogs[dialogId]) {
            console.error('Dialog not found:', dialogId);
            return;
        }

        const dialog = this.currentNPC.dialogs[dialogId];
        this.currentDialog = dialog;
        
        // Update portrait
        this.portrait.style.backgroundImage = `url('${this.currentNPC.sprite}')`;
        
        // Update text
        this.textArea.innerHTML = `
            <h3>${this.currentNPC.name}</h3>
            <p>${dialog.text}</p>
        `;
        
        // Update choices
        this.choicesArea.innerHTML = '';
        dialog.choices.forEach(choice => {
            const button = document.createElement('button');
            button.className = 'dialog-choice';
            button.textContent = choice.text;
            button.addEventListener('click', () => this.handleChoice(choice));
            this.choicesArea.appendChild(button);
        });
        
        // Show dialog
        this.container.style.display = 'flex';
        this.isVisible = true;
    }

    handleChoice(choice) {
        if (choice.next === null) {
            this.closeDialog();
        } else if (choice.next === 'shop') {
            this.openShop();
        } else {
            this.showDialog(choice.next);
        }
    }

    openShop() {
        if (this.currentNPC.role !== 'MERCHANT') return;
        
        // Clear dialog content
        this.textArea.innerHTML = '<h3>Shop</h3>';
        this.choicesArea.innerHTML = '';
        
        // Show inventory
        this.currentNPC.inventory.forEach(item => {
            const itemElement = document.createElement('div');
            itemElement.className = 'shop-item';
            itemElement.innerHTML = `
                <span>${item.name} - ${item.price} coins</span>
                <p>${item.description}</p>
                <button onclick="this.buyItem('${item.id}')">Buy</button>
            `;
            this.choicesArea.appendChild(itemElement);
        });
        
        // Add close button
        const closeBtn = document.createElement('button');
        closeBtn.textContent = 'Close Shop';
        closeBtn.addEventListener('click', () => this.showDialog('greeting'));
        this.choicesArea.appendChild(closeBtn);
    }

    buyItem(itemId) {
        // TODO: Implement buying logic
        console.log('Buying item:', itemId);
    }

    closeDialog() {
        this.container.style.display = 'none';
        this.isVisible = false;
        this.currentNPC = null;
        this.currentDialog = null;
    }
} 