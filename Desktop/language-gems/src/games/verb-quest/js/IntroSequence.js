export class IntroSequence {
    constructor(game) {
        this.game = game;
        this.currentScene = 0;
        this.sceneTimeouts = [];
        this.isTransitioning = false;
        this.scenes = [
            {
                text: "Long ago, the kingdom of Conjugaria flourished under the perfect harmony of language...",
                background: "assets/backgrounds/peaceful_kingdom.jpg",
                duration: 4000
            },
            {
                text: "But darkness fell when the King of Misconjugation unleashed his corrupting magic...",
                background: "assets/backgrounds/dark_kingdom.jpg",
                duration: 4000
            },
            {
                text: "Now, verbs are twisted, tenses confused, and chaos reigns throughout the land...",
                background: "assets/backgrounds/chaos_kingdom.jpg",
                duration: 4000
            },
            {
                text: "Only a chosen hero, gifted with the power of proper conjugation, can restore order...",
                background: "assets/backgrounds/hero_rise.jpg",
                duration: 4000
            }
        ];
        
        // Hide game UI at start
        const gameNav = document.querySelector('.game-nav');
        if (gameNav) gameNav.style.display = 'none';
    }

    hideGameUI() {
        const gameNav = document.querySelector('.game-nav');
        if (gameNav) gameNav.style.display = 'none';
    }

    start() {
        if (this.isTransitioning) return;
        this.showLoadingScreen();
    }

    showLoadingScreen() {
        if (this.isTransitioning) return;
        const gameScreen = document.getElementById('gameScreen');
        if (!gameScreen) return;

        this.isTransitioning = true;
        this.hideGameUI();
        this.clearAllTimeouts();

        gameScreen.innerHTML = `
            <div class="loading-screen">
                <div class="loading-content">
                    <h1>Verb Quest</h1>
                    <div class="loading-bar">
                        <div class="loading-progress"></div>
                    </div>
                    <p class="loading-tip">Tip: Regular verbs follow consistent patterns in conjugation.</p>
                </div>
            </div>
        `;

        // Simulate loading with tips
        const tips = [
            "Tip: The present tense describes current actions.",
            "Tip: Practice makes perfect in conjugation!",
            "Tip: Watch for irregular verbs in Spanish.",
            "Tip: Each region teaches new verb tenses."
        ];
        
        let progress = 0;
        const progressBar = gameScreen.querySelector('.loading-progress');
        const tipElement = gameScreen.querySelector('.loading-tip');
        
        const loadingInterval = setInterval(() => {
            progress += 2;
            if (progressBar) progressBar.style.width = `${progress}%`;
            
            if (progress % 25 === 0 && tipElement) {
                tipElement.textContent = tips[Math.floor(progress / 25)];
            }
            
            if (progress >= 100) {
                clearInterval(loadingInterval);
                setTimeout(() => {
                    this.isTransitioning = false;
                    this.showTitleScreen();
                }, 500);
            }
        }, 50);
    }

    showTitleScreen() {
        if (this.isTransitioning) return;
        const gameScreen = document.getElementById('gameScreen');
        if (!gameScreen) return;

        this.isTransitioning = true;
        this.hideGameUI();
        this.clearAllTimeouts();

        gameScreen.innerHTML = `
            <div class="title-screen">
                <div class="title-content">
                    <h1>Verb</h1>
                    <div class="title-buttons">
                        <button id="newGameBtn" class="title-btn">New Game</button>
                        ${localStorage.getItem('gameProgress') ? '<button id="continueBtn" class="title-btn">Continue</button>' : ''}
                        <button id="settingsBtn" class="title-btn">Settings</button>
                        <button id="creditsBtn" class="title-btn">Credits</button>
                    </div>
                </div>
            </div>
        `;

        // Event listeners
        const newGameBtn = gameScreen.querySelector('#newGameBtn');
        if (newGameBtn) {
            newGameBtn.addEventListener('click', () => {
                if (!this.isTransitioning) {
                    this.currentScene = 0;
                    this.showScene(0);
                }
            });
        }

        const continueBtn = gameScreen.querySelector('#continueBtn');
        if (continueBtn) {
            continueBtn.addEventListener('click', () => {
                if (!this.isTransitioning) {
                    this.game.loadGame();
                }
            });
        }

        const settingsBtn = gameScreen.querySelector('#settingsBtn');
        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => {
                if (!this.isTransitioning) {
                    this.showSettings();
                }
            });
        }

        const creditsBtn = gameScreen.querySelector('#creditsBtn');
        if (creditsBtn) {
            creditsBtn.addEventListener('click', () => {
                if (!this.isTransitioning) {
                    this.showCredits();
                }
            });
        }

        this.isTransitioning = false;
    }

    showSettings() {
        const gameScreen = document.getElementById('gameScreen');
        if (!gameScreen) return;

        gameScreen.innerHTML = `
            <div class="menu-overlay">
                <div class="menu-content">
                    <h2>Settings</h2>
                    <div class="menu-buttons">
                        <button class="menu-btn" id="soundToggle">Sound: ${this.game.settings.soundEnabled ? 'On' : 'Off'}</button>
                        <button class="menu-btn" id="musicToggle">Music: ${this.game.settings.musicEnabled ? 'On' : 'Off'}</button>
                        <button class="menu-btn" id="backBtn">Back</button>
                    </div>
                </div>
            </div>
        `;

        // Add event listeners
        const soundToggle = gameScreen.querySelector('#soundToggle');
        const musicToggle = gameScreen.querySelector('#musicToggle');
        const backBtn = gameScreen.querySelector('#backBtn');

        if (soundToggle) {
            soundToggle.addEventListener('click', () => {
                this.game.settings.soundEnabled = !this.game.settings.soundEnabled;
                soundToggle.textContent = `Sound: ${this.game.settings.soundEnabled ? 'On' : 'Off'}`;
                this.game.saveSettings();
            });
        }

        if (musicToggle) {
            musicToggle.addEventListener('click', () => {
                this.game.settings.musicEnabled = !this.game.settings.musicEnabled;
                musicToggle.textContent = `Music: ${this.game.settings.musicEnabled ? 'On' : 'Off'}`;
                this.game.saveSettings();
            });
        }

        if (backBtn) {
            backBtn.addEventListener('click', () => {
                this.showTitleScreen();
            });
        }
    }

    showCredits() {
        const gameScreen = document.getElementById('gameScreen');
        if (!gameScreen) return;

        gameScreen.innerHTML = `
            <div class="menu-overlay">
                <div class="menu-content">
                    <h2>Credits</h2>
                    <div class="credits-content">
                        <p>Game Design & Development</p>
                        <p>Art & Animations</p>
                        <p>Music & Sound Effects</p>
                        <p>Special Thanks</p>
                    </div>
                    <div class="menu-buttons">
                        <button class="menu-btn" id="backBtn">Back</button>
                    </div>
                </div>
            </div>
        `;

        // Add back button event listener
        const backBtn = gameScreen.querySelector('#backBtn');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                this.showTitleScreen();
            });
        }
    }

    clearAllTimeouts() {
        this.sceneTimeouts.forEach(timeout => clearTimeout(timeout));
        this.sceneTimeouts = [];
    }

    showScene(index) {
        if (this.isTransitioning) return;
        this.isTransitioning = true;
        
        const gameScreen = document.getElementById('gameScreen');
        if (!gameScreen) return;
        
        // Clear any existing timeouts
        this.clearAllTimeouts();
        
        // Hide game UI during cutscenes
        this.hideGameUI();
        
        if (index >= this.scenes.length) {
            this.showCharacterCreation();
            return;
        }
        
        const scene = this.scenes[index];
        gameScreen.innerHTML = `
            <div class="cutscene" style="background-image: url('${scene.background}')">
                <p class="cutscene-text">${scene.text}</p>
                <button class="skip-btn" id="skipBtn">Skip</button>
            </div>
        `;
        
        // Add skip button functionality
        const skipBtn = gameScreen.querySelector('#skipBtn');
        if (skipBtn) {
            skipBtn.addEventListener('click', () => {
                this.clearAllTimeouts();
                this.showCharacterCreation();
            });
        }
        
        // Auto advance to next scene
        const timeout = setTimeout(() => {
            this.isTransitioning = false;
            this.showScene(index + 1);
        }, scene.duration);
        
        this.sceneTimeouts.push(timeout);
    }
    
    showCharacterCreation() {
        this.isTransitioning = false;
        const gameScreen = document.getElementById('gameScreen');
        if (!gameScreen) return;
        
        // Clear any existing timeouts
        this.clearAllTimeouts();
        
        // Show character creation screen
        gameScreen.innerHTML = `
            <div class="character-creation" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; display: flex; justify-content: center; align-items: center; background: rgba(0, 0, 0, 0.8);">
                <div class="character-creation-content">
                    <h2>Create Your Character</h2>
                    <form id="characterForm" class="character-form">
                        <div class="form-group">
                            <label for="characterName">Character Name:</label>
                            <input type="text" id="characterName" class="character-name-input" required>
                        </div>
                        <div class="class-selection">
                            <div class="class-option" data-class="warrior">
                                <h3>Warrior</h3>
                                <p>Masters of physical combat</p>
                            </div>
                            <div class="class-option" data-class="mage">
                                <h3>Mage</h3>
                                <p>Wielders of magical knowledge</p>
                            </div>
                            <div class="class-option" data-class="rogue">
                                <h3>Rogue</h3>
                                <p>Swift and cunning adventurers</p>
                            </div>
                        </div>
                        <input type="hidden" id="characterClass" value="">
                        <button type="submit" id="beginAdventure">Begin Adventure</button>
                    </form>
                </div>
            </div>
        `;
        
        // Setup character creation event listeners
        this.setupCharacterCreation();
    }

    setupCharacterCreation() {
        const characterForm = document.getElementById('characterForm');
        const classOptions = document.querySelectorAll('.class-option');
        const characterClassInput = document.getElementById('characterClass');
        
        // Setup class selection
        classOptions.forEach(option => {
            option.addEventListener('click', () => {
                // Remove selected class from all options
                classOptions.forEach(opt => opt.classList.remove('selected'));
                // Add selected class to clicked option
                option.classList.add('selected');
                // Update hidden input
                characterClassInput.value = option.dataset.class;
            });
        });
        
        // Handle form submission
        if (characterForm) {
            characterForm.addEventListener('submit', (e) => {
                e.preventDefault();
                
                const characterName = document.getElementById('characterName').value.trim();
                const characterClass = characterClassInput.value;
                
                if (!characterName || !characterClass) {
                    alert('Please enter a name and select a class!');
                    return;
                }
                
                // Create character and start game
                this.game.createCharacter(characterName, characterClass);
                this.cleanup();
                this.game.startGame();
            });
        }
    }

    cleanup() {
        this.clearAllTimeouts();
        this.isTransitioning = false;
        // Show only game nav, not quest log
        const gameNav = document.querySelector('.game-nav');
        if (gameNav) gameNav.style.display = 'flex';
    }
}