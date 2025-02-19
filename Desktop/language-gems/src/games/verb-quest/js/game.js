import { WorldMap } from './WorldMap.js';
import { QuestSystem } from './QuestSystem.js';
import { regions, isRegionAccessible, toggleDevMode, DEV_MODE } from './data/regions.js';
import { Battle } from './battle.js';
import { animations } from './animations.js'; // Ensure animation logic is implemented
import { VerbQuestMenu } from './menu.js';
import { Character } from './character.js';
import { Dialog } from './Dialog.js';
import { QuestManager } from './QuestManager.js';
import { NPCs } from './data/npcs.js';
import { IntroSequence } from './IntroSequence.js';
import { verbs } from './data/verbs.js';

// At the top of the file, after imports
window.DEV_MODE = false; // Initialize global DEV_MODE

document.addEventListener('keydown', (e) => {
    // Dev mode toggle with Alt+D (Option+D on Mac)
    if (e.key === 'd' && e.altKey) {
        window.DEV_MODE = !window.DEV_MODE;
        console.log('Dev mode:', window.DEV_MODE ? 'enabled' : 'disabled');
    }
});

// Game sound effects using Howler.js
const GAME_SOUNDS = {
    background: {
        src: 'assets/sounds/background.mp3',
        options: {
            loop: true,
            volume: 0.3,
            preload: false
        }
    },
    click: {
        src: 'assets/sounds/click.mp3',
        options: {
            volume: 0.4,
            preload: false
        }
    },
    levelUp: {
        src: 'assets/sounds/level-up.mp3',
        options: {
            volume: 0.5,
            preload: false
        }
    },
    questComplete: {
        src: 'assets/sounds/quest-complete.mp3',
        options: {
            volume: 0.5,
            preload: false
        }
    },
    notification: {
        src: 'assets/sounds/notification.mp3',
        options: {
            volume: 0.4,
            preload: false
        }
    }
};

export class Game {
    constructor() {
        // Basic initialization
        this.player = null;
        this.currentBattle = null;
        this.gameState = 'intro';
        this.soundEnabled = true;
        this.soundInitialized = false;
        this.questSystem = new QuestSystem(this);
        this.currentRegion = null;
        this.unlockedRegions = ['forest_of_beginnings'];
        this.defeatedEnemies = new Set();
        this.regions = regions;
        this.verbs = verbs;
        this.godMode = false;
        
        // Initialize sound system
        this.sounds = {};
        this.battleSoundInstances = {};
        
        // Make game instance globally available
        window.game = this;
        
        // Setup UI and event listeners
        this.setupUI();
        this.setupEventListeners();
        
        // Initialize menu
        this.menu = new VerbQuestMenu(this);
        
        // Wait for DOM to be fully loaded before starting
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }

        // Bind keyboard shortcuts
        this.handleKeyPress = this.handleKeyPress.bind(this);
        document.addEventListener('keydown', this.handleKeyPress);
        
        console.log('Game initialized');
    }

    handleKeyPress(e) {
        // Dev mode toggle with Alt+D (Option+D on Mac)
        if (e.key === 'd' && e.altKey) {
            e.preventDefault();
            console.log('Alt+D pressed'); // Debug log
            try {
                toggleDevMode();
                console.log('Dev mode toggled'); // Debug log
                
                // Update UI based on current game state
                if (this.gameState === 'world_map') {
                    console.log('Refreshing world map'); // Debug log
                    this.enterWorldMap();
                } else if (this.gameState === 'exploring') {
                    console.log('Refreshing exploration mode'); // Debug log
                    this.enterExplorationMode();
                } else if (this.gameState === 'character_creation') {
                    console.log('Still in character creation'); // Debug log
                }
                
                // Force UI update
                this.updateGameScreen();
            } catch (error) {
                console.error('Error in dev mode toggle:', error);
            }
        }
        
        // Other keyboard shortcuts
        if (e.key === 'Escape' && this.menu) this.menu.toggle();
        if (e.key === 'Space' && this.currentBattle) {
            this.player.useSpecialAbility();
        }
    }

    setupUI() {
        this.messageContainer = document.createElement('div');
        this.messageContainer.className = 'game-message';
        document.body.appendChild(this.messageContainer);
    }

    setupEventListeners() {
        console.log('Setting up event listeners...');
        
        // Initialize audio on first user interaction
        const initAudioOnInteraction = () => {
            if (!this.soundInitialized) {
                this.initializeAudio();
                document.removeEventListener('click', initAudioOnInteraction);
                document.removeEventListener('keydown', initAudioOnInteraction);
            }
        };
        
        document.addEventListener('click', initAudioOnInteraction);
        document.addEventListener('keydown', initAudioOnInteraction);

        // Menu button
        const menuBtn = document.getElementById('menuBtn');
        console.log('Menu button found:', menuBtn); // Debug log
        if (menuBtn) {
            menuBtn.addEventListener('click', () => {
                this.playSound('click');
                console.log('Menu button clicked'); // Debug log
                if (this.menu) {
                    this.menu.toggle();
                } else {
                    console.error('Menu not initialized');
                }
            });
        } else {
            console.error('Menu button not found');
        }

        // Map button
        const mapBtn = document.getElementById('mapBtn');
        if (mapBtn) {
            mapBtn.addEventListener('click', () => {
                this.playSound('click');
                this.enterWorldMap();
            });
        }

        // Fullscreen button
        const fullscreenBtn = document.getElementById('fullscreenBtn');
        if (fullscreenBtn) {
            fullscreenBtn.addEventListener('click', () => {
                this.playSound('click');
                this.toggleFullscreen();
            });
        }

        // Sound toggle button
        const soundToggleBtn = document.getElementById('soundToggleBtn');
        if (soundToggleBtn) {
            soundToggleBtn.addEventListener('click', () => {
                this.toggleSound();
            });
        }
    }

    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                console.error(`Error attempting to enable fullscreen: ${err.message}`);
            });
            document.getElementById('fullscreenBtn').textContent = '⛶';
        } else {
            document.exitFullscreen();
            document.getElementById('fullscreenBtn').textContent = '⛶';
        }
    }

    showMessage(message, type = 'info') {
        this.playSound('notification');
        const notification = document.createElement('div');
        notification.className = type === 'quest' ? 'quest-notification' : 'notification';
        
        if (type === 'quest') {
            const title = document.createElement('h4');
            title.textContent = 'Quest Update';
            notification.appendChild(title);
        }
        
        const text = document.createElement('p');
        text.textContent = message;
        notification.appendChild(text);
        
        document.body.appendChild(notification);
        
        // Remove notification after animation
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    init() {
        console.log('Running init...');
        
        // Check for saved game first
        const savedProgress = localStorage.getItem('gameProgress');
        if (savedProgress) {
            // If there's a saved game, show title screen
            const introSequence = new IntroSequence(this);
            introSequence.showTitleScreen();
        } else {
            // If no saved game, start with intro sequence
            const introSequence = new IntroSequence(this);
            introSequence.start();
        }

        // Setup event listeners for character creation
        const beginAdventureBtn = document.getElementById('beginAdventure');
        if (beginAdventureBtn) {
            beginAdventureBtn.addEventListener('click', (e) => {
                e.preventDefault();
                const name = document.getElementById('characterName').value;
                const characterClass = document.getElementById('characterClass').value;
                
                if (!name) {
                    alert('Please enter a character name');
                    return;
                }
                
                this.createCharacter(name, characterClass);
            });
        }

        // Setup answer submission
        const answerForm = document.getElementById('answerForm');
        if (answerForm) {
            answerForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const answerInput = document.getElementById('answerInput');
                if (answerInput) {
                    const answer = answerInput.value;
                    console.log('Answer submitted:', answer);
                    this.handleAnswer(answer);
                    answerInput.value = '';
                    answerInput.focus();
                }
            });
        }

        // Initialize NPCs
        this.initializeNPCs();
        
        // Setup event listeners
        this.setupEventListeners();
    }

    createCharacter(name, characterClass) {
        console.log('Creating character with:', { name, characterClass }); // Debug log
        
        try {
            this.player = new Character(name, characterClass);
            console.log('Player initialized:', this.player); // Debug log
            
            // Clean up intro sequence
            document.body.classList.remove('intro-active');
            
            // Show game UI elements
            const gameNav = document.querySelector('.game-nav');
            if (gameNav) {
                gameNav.style.display = 'flex';
            }
            
            // Hide character creation overlay
            const characterCreation = document.getElementById('characterCreation');
            if (characterCreation) {
                characterCreation.style.display = 'none';
            }

            // Start the game and show world map
            this.startGame();
        } catch (error) {
            console.error('Error creating character:', error);
        }
    }

    startGame() {
        console.log('Starting game...'); // Debug log
        this.gameState = 'world_map';
        this.currentRegion = null;
        
        // Clear any existing content and set world map background
        const gameScreen = document.getElementById('gameScreen');
        if (gameScreen) {
            gameScreen.innerHTML = '';
            gameScreen.style.backgroundImage = `url('assets/backgrounds/world_map.jpg')`;
        }
        
        this.updateGameScreen();
    }

    updateGameScreen() {
        const gameScreen = document.getElementById('gameScreen');
        if (!gameScreen) {
            console.error('Game screen element not found');
            return;
        }

        console.log('Current game state:', this.gameState);
        gameScreen.innerHTML = ''; // Clear the screen first

        switch (this.gameState) {
            case 'intro':
                // Don't clear the screen in intro state
                return;
            case 'world_map':
                console.log('Initializing world map...');
                const worldMap = new WorldMap(this);
                const mapElement = worldMap.initialize();
                if (mapElement) {
                    gameScreen.innerHTML = ''; // Ensure clean slate
                    gameScreen.appendChild(mapElement);
                    console.log('World map initialized successfully');
                } else {
                    console.error('Failed to initialize world map');
                }
                break;
            case 'exploring':
                // Show region-specific content
                const region = regions[this.currentRegion];
                if (!region) return;
                
                gameScreen.innerHTML = `
                    <div class="exploring-screen">
                        <h2>${region.name}</h2>
                        <p>${region.description}</p>
                        <div class="exploration-actions">
                            ${this.getExplorationButtons(region)}
                        </div>
                    </div>
                `;
                break;
        }
    }

    enterRegion(regionId) {
        console.log('Entering region:', regionId);
        
        if (!this.player) {
            console.error('Player not initialized');
            return;
        }

        const region = regions[regionId];
        if (!region) {
            console.error('Region not found:', regionId);
            return;
        }

        // Check if region is accessible based on player level
        if (!DEV_MODE && this.player.level < region.requiredLevel) {
            this.showMessage(`Requires Level ${region.requiredLevel}`);
            return;
        }

        // For temple_of_chaos, check if forest is completed
        if (!DEV_MODE && regionId === 'temple_of_chaos') {
            const forestEnemies = regions['forest_of_beginnings'].enemies;
            const allForestEnemiesDefeated = forestEnemies.every(
                enemy => this.defeatedEnemies.has(enemy.name)
            );
            
            if (!allForestEnemiesDefeated) {
                this.showMessage(`Complete the Forest of Beginnings first!`);
                return;
            }
        }

        // If we get here, the region is accessible
        this.unlockedRegions.push(regionId);
        console.log('Transitioning to region:', region.name);
        this.currentRegion = regionId;
        this.gameState = 'exploring';
        
        // Update background and game screen
        const gameScreen = document.getElementById('gameScreen');
        if (gameScreen && region.background) {
            gameScreen.style.backgroundImage = `url('${region.background}')`;
            gameScreen.innerHTML = `
                <div class="exploring-screen">
                    <h2>${region.name}</h2>
                    <p>${region.description}</p>
                    <div class="exploration-actions">
                        ${this.getExplorationButtons(region)}
                    </div>
                </div>
            `;
        }
    }

    checkRegionCompletion(regionId) {
        const region = regions[regionId];
        if (!region) {
            console.error('Region not found:', regionId);
            return false;
        }

        // Check if all enemies in the region are defeated
        const allEnemiesDefeated = region.enemies.every(enemy => 
            this.defeatedEnemies.has(enemy.name)
        );

        if (allEnemiesDefeated) {
            console.log(`Region ${regionId} completed!`);
            this.unlockNextRegion(region.requiredLevel);
            return true;
        }

        return false;
    }

    unlockNextRegion(currentLevel) {
        // Find the next region that requires currentLevel + 1
        const nextLevel = currentLevel + 1;
        const nextRegion = Object.entries(regions).find(([id, data]) => 
            data.requiredLevel === nextLevel && !this.unlockedRegions.has(id)
        );

        if (nextRegion) {
            const [regionId] = nextRegion;
            console.log(`Unlocking region ${regionId} for level ${nextLevel}`);
            this.unlockedRegions.add(regionId);
            this.saveProgress();
        }
    }

    updateBackground(areaName) {
        const gameScreen = document.getElementById('gameScreen');
        gameScreen.style.backgroundImage = `url('assets/backgrounds/${areaName.toLowerCase().replace(/\s+/g, '_')}.jpg')`;
    }

    startBattle(enemyId) {
        // Get the current region
        const region = regions[this.currentRegion];
        if (!region) {
            console.error('No region found:', this.currentRegion);
            return;
        }

        // Find the enemy to fight
        let enemy;
        if (enemyId) {
            enemy = region.enemies.find(e => e.id === enemyId);
        } else {
            // Get the first undefeated enemy
            enemy = region.enemies.find(e => !this.defeatedEnemies.has(e.name));
        }

        if (!enemy) {
            console.error('No enemy found to fight');
            return;
        }

        console.log('Starting battle with enemy:', enemy);

        // Create new battle instance
        this.currentBattle = new Battle(this.player, enemy, this);
        this.gameState = 'battle';
        
        // Clear game screen
        const gameScreen = document.getElementById('gameScreen');
        if (gameScreen) {
            gameScreen.innerHTML = '';
            gameScreen.style.backgroundImage = `url('${enemy.background || 'assets/backgrounds/battle.jpg'}')`;
            gameScreen.style.backgroundSize = 'cover';
            gameScreen.style.backgroundPosition = 'center';
        }
        
        // Start the battle
        this.currentBattle.startBattle();
    }

    handleAnswer(answer) {
        if (this.gameState === 'battle' && this.currentBattle) {
            console.log('Processing answer in battle...'); // Debug log
            try {
                const correct = this.currentBattle.checkAnswer(answer);
                console.log('Answer is correct:', correct); // Debug log
                
                // Only play sound and handle answer if battle is still active
                if (this.currentBattle.isActive) {
                    this.playSound(correct ? 'correct' : 'wrong');
                    if (correct) {
                        const enemySprite = document.querySelector('.enemy-sprite');
                        if (enemySprite) {
                            // Add damage animation
                            enemySprite.classList.add('damaged');
                            setTimeout(() => {
                                enemySprite.classList.remove('damaged');
                            }, 500);
                        }
                        this.currentBattle.handleCorrectAnswer();
                    } else {
                        this.currentBattle.handleWrongAnswer();
                    }
                }
            } catch (error) {
                console.error('Error handling answer:', error);
            }
        }
    }

    initializeAudio() {
        if (this.soundInitialized) return;
        
        try {
            // Initialize each sound with error handling
            Object.entries(GAME_SOUNDS).forEach(([key, config]) => {
                this.sounds[key] = new Howl({
                    src: [config.src],
                    ...config.options,
                    onloaderror: (id, error) => {
                        console.warn(`Failed to load sound ${key}:`, error);
                    }
                });
            });

            // Initialize battle sounds if they exist
            if (window.BATTLE_SOUNDS) {
                Object.entries(window.BATTLE_SOUNDS).forEach(([key, config]) => {
                    this.battleSoundInstances[key] = new Howl({
                        src: [config.src],
                        ...config.options,
                        onloaderror: (id, error) => {
                            console.warn(`Failed to load battle sound ${key}:`, error);
                        }
                    });
                });
            }

            this.soundInitialized = true;
            console.log('Audio system initialized');
        } catch (error) {
            console.error('Error initializing audio system:', error);
        }
    }

    playSound(soundName) {
        if (!this.soundEnabled || !this.soundInitialized) return;
        
        const sound = this.sounds[soundName];
        if (sound) {
            try {
                sound.play();
            } catch (error) {
                console.warn(`Error playing sound ${soundName}:`, error);
            }
        }
    }

    toggleSound() {
        this.soundEnabled = !this.soundEnabled;
        
        if (this.soundInitialized) {
            Howler.mute(!this.soundEnabled);
        }
        
        // Update UI
        const soundToggleBtn = document.getElementById('soundToggleBtn');
        if (soundToggleBtn) {
            soundToggleBtn.textContent = this.soundEnabled ? '🔊' : '🔇';
        }
    }

    setupBackgroundMusic() {
        const backgroundMusic = new Audio('assets/sounds/background-music.mp3');
        backgroundMusic.loop = true;
        backgroundMusic.volume = 0.5; // Adjust volume as needed

        const playMusic = () => {
            backgroundMusic.play().catch(error => {
                console.error('Background music play failed:', error);
            });
            document.removeEventListener('click', playMusic);
            document.removeEventListener('keydown', playMusic);
        };

        document.addEventListener('click', playMusic);
        document.addEventListener('keydown', playMusic);
    }

    setupSoundControls() {
        const soundToggleBtn = document.getElementById('soundToggleBtn');
        if (soundToggleBtn) {
            soundToggleBtn.addEventListener('click', () => {
                this.soundEnabled = !this.soundEnabled;
                soundToggleBtn.textContent = this.soundEnabled ? '🔊' : '🔇';
            });
        }
    }

    getRegionProgress(regionId) {
        try {
            const region = regions[regionId];
            if (!region) return 0;
            
            if (!this.player || !this.player.completedChallenges) return 0;
            
            const completedChallenges = this.player.completedChallenges.filter(
                challenge => challenge && challenge.region === regionId
            ).length;
            
            const totalChallenges = region.challenges?.length || 1;
            return Math.floor((completedChallenges / totalChallenges) * 100);
        } catch (error) {
            console.error('Error calculating region progress:', error);
            return 0;
        }
    }

    getExplorationButtons(region) {
        // Get the next undefeated enemy
        const nextEnemy = region.enemies.find(enemy => !this.defeatedEnemies.has(enemy.name));
        
        console.log('Next enemy check:', {
            region: region.name,
            defeatedEnemies: [...this.defeatedEnemies],
            nextEnemy: nextEnemy
        }); // Debug log
        
        if (nextEnemy) {
            return `
                <button onclick="window.game.startBattle('${nextEnemy.id}')" class="btn-progress">
                    Fight ${nextEnemy.name} (${nextEnemy.hp} HP)
                </button>
                <button onclick="window.game.enterWorldMap()">World Map</button>
            `;
        } else {
            return `
                <button onclick="window.game.enterWorldMap()" class="btn-progress">
                    Region Complete! Return to World Map
                </button>
            `;
        }
    }

    enterExplorationMode() {
        this.gameState = 'exploration';
        console.log('Exploration mode:', this.currentRegion);
        
        // Check for next enemy
        const nextEnemy = this.getNextEnemy();
        console.log('Next enemy check:', nextEnemy);

        const gameScreen = document.getElementById('gameScreen');
        if (!gameScreen) return;

        // Create exploration screen
        gameScreen.innerHTML = `
            <div class="exploration-screen">
                <div class="region-info">
                    <h2>${this.currentRegion.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</h2>
                </div>
                <div class="npc-container"></div>
                ${nextEnemy ? `
                    <div class="exploration-actions">
                        <button onclick="window.game.startBattle('${nextEnemy.id}')">Fight ${nextEnemy.name}</button>
                        <button onclick="window.game.enterWorldMap()">Return to World Map</button>
                    </div>
                ` : `
                    <div class="exploration-actions">
                        <button onclick="window.game.enterWorldMap()">Return to World Map</button>
                    </div>
                `}
            </div>
        `;

        // Show NPCs for current region
        this.showRegionNPCs();
    }

    getNextEnemy() {
        const region = regions[this.currentRegion];
        if (!region || !region.enemies) {
            console.warn('No enemies found for region:', this.currentRegion);
            return null;
        }
        
        // Find the first undefeated enemy in the region
        return region.enemies.find(enemy => !this.defeatedEnemies.has(enemy.name));
    }

    enterWorldMap() {
        console.log('Entering world map...'); // Debug log
        this.gameState = 'world_map';
        this.currentRegion = null;
        
        // Clear any existing content and set world map background
        const gameScreen = document.getElementById('gameScreen');
        if (gameScreen) {
            gameScreen.innerHTML = '';
            gameScreen.style.backgroundImage = `url('assets/backgrounds/world_map.jpg')`;
        }
        
        this.updateGameScreen();
    }

    unlockRegion(regionId) {
        console.log('Unlocking region:', regionId); // Debug log
        if (!this.unlockedRegions.includes(regionId)) {
            this.unlockedRegions.push(regionId);
            this.showMessage(`New region unlocked: ${regions[regionId].name}!`);
            
            // Save progress
            if (this.player) {
                this.player.saveProgress();
            }
            
            // Update world map if we're on it
            if (this.gameState === 'world_map') {
                this.updateGameScreen();
            }
        }
    }

    checkRegionUnlock(playerLevel) {
        // Check each region to see if it should be unlocked based on player level
        Object.entries(regions).forEach(([regionId, region]) => {
            if (region.requiredLevel <= playerLevel && !this.unlockedRegions.includes(regionId)) {
                this.unlockRegion(regionId);
            }
        });
    }

    startAutoSave() {
        // Auto-save every 5 minutes
        setInterval(() => {
            if (this.player) {
                this.player.saveProgress();
                console.log('Auto-saved game progress');
            }
        }, 5 * 60 * 1000);
    }

    initializeNPCs() {
        Object.entries(NPCs).forEach(([regionId, regionNPCs]) => {
            regionNPCs.forEach(npc => {
                const npcWithRegion = {
                    ...npc,
                    region: regionId
                };
                this.npcs.set(npc.id, npcWithRegion);
            });
        });
        console.log('NPCs initialized:', this.npcs); // Debug log
    }

    startDialog(npcId) {
        const npc = this.npcs.get(npcId);
        if (npc) {
            this.dialog.startDialog(npc);
        }
    }

    startQuest(questData) {
        return this.questManager.startQuest(questData);
    }

    updateQuestProgress(type, data) {
        this.questManager.updateProgress(type, data);
    }

    showRegionNPCs() {
        const npcContainer = document.querySelector('.npc-container');
        if (!npcContainer) {
            console.warn('NPC container not found');
            return;
        }
        
        // Clear existing NPCs
        npcContainer.innerHTML = '';
        
        // Get NPCs for current region
        const regionData = regions[this.currentRegion];
        if (!regionData || !regionData.npcs) {
            console.warn('No NPCs found for region:', this.currentRegion);
            return;
        }
        
        regionData.npcs.forEach(npc => {
            const npcElement = document.createElement('div');
            npcElement.className = 'npc';
            npcElement.innerHTML = `
                <div class="npc-sprite" style="background-image: url('${npc.sprite}')"></div>
                <div class="npc-name">${npc.name}</div>
            `;
            npcContainer.appendChild(npcElement);
            
            // Add click listener for NPC interaction
            npcElement.addEventListener('click', () => this.startNPCDialog(npc));
        });
    }

    getCurrentRegion() {
        return this.regions[this.currentRegion];
    }

    saveProgress() {
        const progress = {
            // ... existing save data ...
            quests: this.questManager.getAllQuestProgress()
        };
        
        localStorage.setItem('gameProgress', JSON.stringify(progress));
        this.showMessage('Game progress saved!');
    }

    loadProgress() {
        const savedProgress = localStorage.getItem('gameProgress');
        if (savedProgress) {
            const progress = JSON.parse(savedProgress);
            
            // ... existing load code ...
            
            if (progress.quests) {
                this.questManager.loadProgress(progress.quests);
            }
            
            this.showMessage('Game progress loaded!');
            return true;
        }
        return false;
    }

    loadGame() {
        const savedProgress = localStorage.getItem('gameProgress');
        if (savedProgress) {
            const progress = JSON.parse(savedProgress);
            this.player = new Character(progress.name, progress.class);
            this.player.loadProgress(progress);
            this.gameState = 'world_map';
            this.updateGameScreen();
            return true;
        }
        return false;
    }

    showMenu() {
        const menuOverlay = document.createElement('div');
        menuOverlay.className = 'menu-overlay';
        menuOverlay.innerHTML = `
            <div class="menu-content">
                <button class="menu-btn" id="saveGameBtn">Save Game</button>
                <button class="menu-btn" id="loadGameBtn">Load Game</button>
                <button class="menu-btn" id="toggleDevModeBtn">Toggle Dev Mode</button>
                <button class="menu-btn" id="closeMenuBtn">Close</button>
            </div>
        `;
        document.body.appendChild(menuOverlay);
        
        // Add event listeners
        menuOverlay.querySelector('#saveGameBtn').addEventListener('click', () => this.saveGame());
        menuOverlay.querySelector('#loadGameBtn').addEventListener('click', () => this.loadGame());
        menuOverlay.querySelector('#toggleDevModeBtn').addEventListener('click', () => this.toggleDevMode());
        menuOverlay.querySelector('#closeMenuBtn').addEventListener('click', () => this.hideMenu());
        
        // Close menu when clicking outside
        menuOverlay.addEventListener('click', (e) => {
            if (e.target === menuOverlay) this.hideMenu();
        });
    }

    hideMenu() {
        const menuOverlay = document.querySelector('.menu-overlay');
        if (menuOverlay) {
            menuOverlay.remove();
        }
    }

    toggleQuestLog() {
        let questLog = document.querySelector('.quest-log');
        if (!questLog) {
            questLog = document.createElement('div');
            questLog.className = 'quest-log';
            questLog.innerHTML = `
                <div class="quest-log-content">
                    <h2>Quest Log</h2>
                    <div class="quest-list">
                        <p>No active quests.</p>
                    </div>
                </div>
                <button class="close-button">×</button>
            `;
            document.body.appendChild(questLog);
            questLog.querySelector('.close-button').addEventListener('click', () => this.toggleQuestLog());
        }
        questLog.style.display = questLog.style.display === 'none' ? 'block' : 'none';
    }

    toggleInventory() {
        let inventory = document.querySelector('.inventory');
        if (!inventory) {
            inventory = document.createElement('div');
            inventory.className = 'inventory';
            inventory.innerHTML = `
                <div class="inventory-content">
                    <h2>Inventory</h2>
                    <div class="inventory-grid">
                        <p>No items yet.</p>
                    </div>
                </div>
                <button class="close-button">×</button>
            `;
            document.body.appendChild(inventory);
            inventory.querySelector('.close-button').addEventListener('click', () => this.toggleInventory());
        }
        inventory.style.display = inventory.style.display === 'none' ? 'block' : 'none';
    }

    toggleSettings() {
        let settings = document.querySelector('.settings-menu');
        if (!settings) {
            settings = document.createElement('div');
            settings.className = 'settings-menu';
            settings.innerHTML = `
                <div class="settings-content">
                    <h2>Settings</h2>
                    <div class="settings-options">
                        <div class="setting-item">
                            <label>Sound Effects</label>
                            <button id="sfxToggle" class="toggle-btn">ON</button>
                        </div>
                        <div class="setting-item">
                            <label>Music</label>
                            <button id="musicToggle" class="toggle-btn">ON</button>
                        </div>
                        <div class="setting-item">
                            <label>Difficulty</label>
                            <select id="difficultySelect">
                                <option value="normal">Normal</option>
                                <option value="hard">Hard</option>
                            </select>
                        </div>
                        <div class="setting-item">
                            <label>Dev Tools</label>
                            <button id="devToolsBtn" class="toggle-btn">Open Dev Tools</button>
                        </div>
                    </div>
                </div>
                <button class="close-button">×</button>
            `;
            document.body.appendChild(settings);
            
            // Add event listeners
            settings.querySelector('.close-button').addEventListener('click', () => this.toggleSettings());
            settings.querySelector('#sfxToggle').addEventListener('click', (e) => this.toggleSFX(e));
            settings.querySelector('#musicToggle').addEventListener('click', (e) => this.toggleMusic(e));
            settings.querySelector('#devToolsBtn').addEventListener('click', () => this.showDevTools());
        }
        settings.style.display = settings.style.display === 'none' ? 'block' : 'none';
    }

    showDevTools() {
        let devTools = document.querySelector('.dev-tools');
        if (!devTools) {
            devTools = document.createElement('div');
            devTools.className = 'dev-tools';
            devTools.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: rgba(0, 0, 0, 0.9); padding: 20px; border-radius: 10px; z-index: 1000; color: white; min-width: 300px;';
            devTools.innerHTML = `
                <div class="dev-tools-content">
                    <h2 style="margin-top: 0;">Developer Tools</h2>
                    <div class="dev-options" style="display: flex; flex-direction: column; gap: 10px;">
                        <button onclick="game.player.levelUp()">Level Up</button>
                        <button onclick="game.player.gainXP(50)">Add 50 XP</button>
                        <button onclick="game.unlockAllRegions()">Unlock All Regions</button>
                        <button onclick="game.player.health = game.player.maxHealth; game.player.updateUI()">Full Heal</button>
                        <button onclick="game.toggleGodMode()">Toggle God Mode</button>
                    </div>
                </div>
                <button class="close-button" style="position: absolute; top: 10px; right: 10px; background: none; border: none; color: white; font-size: 20px; cursor: pointer;">×</button>
            `;
            document.body.appendChild(devTools);
            
            // Add event listener for close button
            devTools.querySelector('.close-button').addEventListener('click', () => {
                devTools.style.display = 'none';
            });
        }
        devTools.style.display = devTools.style.display === 'none' ? 'block' : 'none';
        console.log('Dev tools toggled:', devTools.style.display); // Debug log
    }

    unlockAllRegions() {
        Object.keys(regions).forEach(regionId => {
            if (!this.unlockedRegions.includes(regionId)) {
                this.unlockedRegions.push(regionId);
            }
        });
        this.showMessage('All regions unlocked!');
        if (this.gameState === 'world_map') {
            this.updateGameScreen();
        }
    }

    toggleGodMode() {
        this.godMode = !this.godMode;
        this.showMessage(`God Mode ${this.godMode ? 'Enabled' : 'Disabled'}`);
        if (this.godMode) {
            this.player.oldMaxHealth = this.player.maxHealth;
            this.player.maxHealth = 99999;
            this.player.health = 99999;
        } else {
            this.player.maxHealth = this.player.oldMaxHealth;
            this.player.health = this.player.maxHealth;
        }
        this.player.updateUI();
    }
}