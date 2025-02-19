import { DevMode } from './devMode.js';

export class VerbQuestMenu {
    constructor(game) {
        this.game = game;
        this.isOpen = false;
        this.setupMenu();
    }
    
    setupMenu() {
        // Remove any existing menu first
        const existingMenu = document.querySelector('.game-menu');
        if (existingMenu) {
            existingMenu.remove();
        }

        // Create menu element
        this.menuElement = document.createElement('div');
        this.menuElement.className = 'game-menu';
        this.menuElement.style.display = 'none';
        
        // Create menu content
        const content = document.createElement('div');
        content.className = 'menu-content';
        
        content.innerHTML = `
            <h2>Menu</h2>
            <button id="saveGameBtn">Save Game</button>
            <button id="loadGameBtn">Load Game</button>
            <button id="toggleDevModeBtn">Toggle Dev Mode</button>
            <button id="closeMenuBtn">Close</button>
        `;
        
        this.menuElement.appendChild(content);
        document.body.appendChild(this.menuElement);

        // Add event listeners
        content.querySelector('#saveGameBtn').addEventListener('click', () => {
            console.log('Save game clicked');
            this.saveGame();
        });
        
        content.querySelector('#loadGameBtn').addEventListener('click', () => {
            console.log('Load game clicked');
            this.loadGame();
        });
        
        content.querySelector('#toggleDevModeBtn').addEventListener('click', () => {
            console.log('Toggle dev mode clicked');
            this.toggleDevMode();
        });
        
        content.querySelector('#closeMenuBtn').addEventListener('click', () => {
            console.log('Close menu clicked');
            this.toggle();
        });
    }

    toggle() {
        console.log('Toggling menu...'); // Debug log
        this.isOpen = !this.isOpen;
        if (this.menuElement) {
            this.menuElement.style.display = this.isOpen ? 'block' : 'none';
        } else {
            console.error('Menu element not found');
        }
    }

    toggleDevMode() {
        console.log('Toggling dev mode...'); // Debug log
        const password = prompt('Enter developer mode password:');
        if (password === 'Devmode1!') {
            if (DevMode.isEnabled) {
                DevMode.disable();
                // Remove dev panel if it exists
                const devPanel = document.getElementById('devPanel');
                if (devPanel) {
                    devPanel.remove();
                }
            } else {
                DevMode.enable();
                // Force the dev panel to be visible
                const devPanel = document.getElementById('devPanel');
                if (devPanel) {
                    devPanel.classList.add('visible');
                    devPanel.style.display = 'block';
                }
            }
            // Update UI based on current game state
            if (this.game.gameState === 'world_map') {
                console.log('Refreshing world map...'); // Debug log
                this.game.enterWorldMap();
            } else if (this.game.gameState === 'exploring') {
                console.log('Refreshing exploration mode...'); // Debug log
                this.game.enterExplorationMode();
            }
            this.game.updateGameScreen();
            this.toggle(); // Close menu after toggling
        } else {
            alert('Incorrect password!');
        }
    }

    saveGame() {
        console.log('Saving game...'); // Debug log
        const gameState = {
            player: this.game.player,
            currentRegion: this.game.currentRegion,
            unlockedRegions: this.game.unlockedRegions,
            defeatedEnemies: Array.from(this.game.defeatedEnemies)
        };
        localStorage.setItem('verbQuestSave', JSON.stringify(gameState));
        this.game.showMessage('Game Saved!');
        this.toggle(); // Close menu after saving
    }

    loadGame() {
        console.log('Loading game...'); // Debug log
        const savedState = localStorage.getItem('verbQuestSave');
        if (savedState) {
            const gameState = JSON.parse(savedState);
            this.game.player = gameState.player;
            this.game.currentRegion = gameState.currentRegion;
            this.game.unlockedRegions = gameState.unlockedRegions;
            this.game.defeatedEnemies = new Set(gameState.defeatedEnemies);
            this.game.enterExplorationMode();
            this.game.showMessage('Game Loaded!');
        } else {
            this.game.showMessage('No saved game found!');
        }
        this.toggle(); // Close menu after loading
    }
}
