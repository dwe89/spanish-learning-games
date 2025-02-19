import { verbs } from './data/verbs.js';
import { battleItems } from './data/items.js';
import { animations } from './animations.js';
import { regions } from './data/regions.js';
import { DevMode } from './devMode.js';

// Sound effects using Howler.js
const BATTLE_SOUNDS = {
    attack: {
        src: 'assets/sounds/attack.mp3',
        options: {
            volume: 0.5,
            preload: false
        }
    },
    damage: {
        src: 'assets/sounds/damage.mp3',
        options: {
            volume: 0.4,
            preload: false
        }
    },
    victory: {
        src: 'assets/sounds/victory.mp3',
        options: {
            volume: 0.6,
            preload: false
        }
    },
    defeat: {
        src: 'assets/sounds/defeat.mp3',
        options: {
            volume: 0.5,
            preload: false
        }
    },
    correct: {
        src: 'assets/sounds/correct.mp3',
        options: {
            volume: 0.4,
            preload: false
        }
    },
    wrong: {
        src: 'assets/sounds/wrong.mp3',
        options: {
            volume: 0.4,
            preload: false
        }
    },
    critical: {
        src: 'assets/sounds/critical.mp3',
        options: {
            volume: 0.5,
            preload: false
        }
    },
    levelUp: {
        src: 'assets/sounds/level-up.mp3',
        options: {
            volume: 0.6,
            preload: false
        }
    }
};

// Initialize battle sounds object
const battleSoundInstances = {};

// Make battle sounds available globally for initialization
window.BATTLE_SOUNDS = BATTLE_SOUNDS;
window.battleSoundInstances = battleSoundInstances;

export class Battle {
    constructor(player, enemy, game) {
        DevMode.log('Initializing battle', 2);
        DevMode.log('Enemy details:', 3);
        DevMode.log(JSON.stringify(enemy, null, 2), 3);
        
        this.player = player;
        this.enemy = enemy;
        this.game = game;
        
        // Ensure enemy has required properties and properly initialize HP
        this.enemy.maxHp = this.enemy.hp;
        this.enemy.health = this.enemy.hp;
        this.enemy.tenses = this.enemy.tenses || ['present.regular'];
        this.enemy.challenges = this.enemy.challenges || ['yo', 'tú', 'él/ella', 'nosotros', 'ellos/ellas'];
        this.enemy.questionsRequired = this.enemy.questionsRequired || 5;
        this.enemy.xpReward = this.enemy.xpReward || 20;

        // Initialize battle state
        this.currentVerb = null;
        this.currentPronoun = null;
        this.currentTense = null;
        this.timeLimit = 30;
        this.timer = null;
        this.isActive = true;
        this.comboCount = 0;
        this.maxCombo = 0;
        this.questionsAnswered = 0;
        
        DevMode.log('Battle state initialized', 2);
        this.selectNewChallenge();
        this.startBattle();
        this.initializeBattleSounds();
    }

    initializeBattleSounds() {
        try {
            // Initialize each battle sound with error handling
            Object.entries(BATTLE_SOUNDS).forEach(([key, config]) => {
                if (!battleSoundInstances[key]) {
                    battleSoundInstances[key] = new Howl({
                        src: [config.src],
                        ...config.options,
                        onloaderror: (id, error) => {
                            console.warn(`Failed to load battle sound ${key}:`, error);
                        }
                    });
                }
            });
        } catch (error) {
            console.error('Error initializing battle sounds:', error);
        }
    }

    playSound(soundName) {
        if (!this.game.soundEnabled || !this.game.soundInitialized) return;
        
        const sound = battleSoundInstances[soundName];
        if (sound) {
            try {
                sound.play();
            } catch (error) {
                console.warn(`Error playing battle sound ${soundName}:`, error);
            }
        }
    }

    startBattle() {
        DevMode.log('Starting battle', 2);
        DevMode.log(`Current verb: ${this.currentVerb}, pronoun: ${this.currentPronoun}, tense: ${this.currentTense}`, 3);
        
        const gameScreen = document.getElementById('gameScreen');
        if (!gameScreen) {
            DevMode.error('Game screen element not found');
            return;
        }

        // Set battle background based on region
        const backgroundMap = {
            'forest_of_beginnings': 'assets/backgrounds/forest_of_beginnings.jpg',
            'temple_of_chaos': 'assets/backgrounds/temple_of_chaos.jpg',
            'castle_of_conjugations': 'assets/backgrounds/castle_of_conjugations.png',
            'shrine_of_perfection': 'assets/backgrounds/shrine_of_perfection.png',
            'dungeon_of_commands': 'assets/backgrounds/dungeon_of_commands.png',
            'palace_of_possibilities': 'assets/backgrounds/palace_of_possibilities.png',
            'swamp_of_habits': 'assets/backgrounds/swamp_of_habits.png',
            'skyward_spire': 'assets/backgrounds/skyward_spire.png',
            'cave_of_memories': 'assets/backgrounds/cave_of_memories.jpg'
        };

        const currentRegion = this.game.currentRegion;
        const background = backgroundMap[currentRegion] || 'assets/backgrounds/forest_of_beginnings.jpg';
        gameScreen.style.backgroundImage = `url('${background}')`;
        gameScreen.style.backgroundSize = 'cover';
        gameScreen.style.backgroundPosition = 'center';
        
        // Create battle screen HTML
        gameScreen.innerHTML = `
            <div class="battle-screen">
                <div class="health-bars">
                    <div class="player-health">
                        <div class="health-bar">
                            <div class="health-fill" style="width: 100%"></div>
                        </div>
                        <p>${this.player.health}/${this.player.maxHealth}</p>
                    </div>
                    <div class="battle-timer">Time: <span id="timeLeft">${this.timeLimit}</span>s</div>
                    <div class="enemy-health">
                        <div class="health-bar">
                            <div class="health-fill" style="width: 100%"></div>
                        </div>
                        <p>${this.enemy.health}/${this.enemy.maxHp}</p>
                    </div>
                </div>
                <div class="enemy-container">
                    <div class="enemy-sprite" style="background-image: url('${this.enemy.sprite}')"></div>
                </div>
                <div class="conjugation-box">
                    <div class="verb-challenge">
                        <h3>Conjugate the Verb</h3>
                        <p class="verb-text">${this.currentVerb}</p>
                        <p class="pronoun-text">Pronoun: <strong>${this.currentPronoun}</strong></p>
                        <p class="tense-text">Tense: <strong>${this.currentTense.split('.')[0]}</strong></p>
                    </div>
                    <form id="answerForm" class="answer-form">
                        <input type="text" id="answerInput" autocomplete="off" placeholder="Enter conjugation...">
                        <button type="submit">Submit</button>
                    </form>
                </div>
            </div>
        `;
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Start timer
        this.startTimer();
    }

    setupEventListeners() {
        const answerForm = document.getElementById('answerForm');
        if (!answerForm) {
            DevMode.error('Answer form not found');
            return;
        }

        answerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const answerInput = document.getElementById('answerInput');
            if (answerInput) {
                const answer = answerInput.value.trim();
                if (answer) {
                    this.checkAnswer(answer);
                    answerInput.value = '';
                    answerInput.focus();
                }
            }
        });

        // Focus input field
        const answerInput = document.getElementById('answerInput');
        if (answerInput) {
            answerInput.focus();
        } else {
            DevMode.error('Answer input not found');
        }
    }

    nextQuestion() {
        if (!this.isActive) return;
        
        // Get random tense from enemy's available tenses
        const tense = this.enemy.tenses[Math.floor(Math.random() * this.enemy.tenses.length)];
        const [tenseType, subType] = tense.split('.');
        
        // Get available verbs for this tense
        const availableVerbs = Object.keys(window.game.verbs[tenseType][subType]);
        
        // Select random verb and pronoun
        this.currentVerb = availableVerbs[Math.floor(Math.random() * availableVerbs.length)];
        this.currentPronoun = this.enemy.challenges[Math.floor(Math.random() * this.enemy.challenges.length)];
        this.currentTense = tense;
        
        // Update UI
        const verbDisplay = document.querySelector('.verb-infinitive');
        const pronounDisplay = document.querySelector('.verb-pronoun');
        
        if (verbDisplay && pronounDisplay) {
            verbDisplay.textContent = this.currentVerb;
            pronounDisplay.textContent = this.currentPronoun;
        }
        
        // Focus input
        const answerInput = document.getElementById('answerInput');
        if (answerInput) {
            answerInput.focus();
        }
        
        // Start timer
        this.startTimer();
    }

    startTimer() {
        if (this.timer) clearInterval(this.timer);
        
        let timeLeft = this.timeLimit;
        const timerDisplay = document.getElementById('timeLeft');
        
        this.timer = setInterval(() => {
            timeLeft--;
            if (timerDisplay) {
                timerDisplay.textContent = timeLeft;
            }
            
            if (timeLeft <= 0) {
                clearInterval(this.timer);
                this.handleWrongAnswer();
            }
        }, 1000);
    }

    checkAnswer(answer) {
        if (!this.isActive) return;
        
        const [tenseType, subType] = this.currentTense.split('.');
        const correctAnswer = window.game.verbs[tenseType][subType][this.currentVerb][this.currentPronoun];
        
        if (answer.toLowerCase().trim() === correctAnswer.toLowerCase()) {
            this.handleCorrectAnswer();
        } else {
            this.handleWrongAnswer();
        }
    }

    handleCorrectAnswer() {
        this.comboCount++;
        if (this.comboCount > this.maxCombo) {
            this.maxCombo = this.comboCount;
        }
        
        // Calculate damage with combo bonus
        let damage = 20 * (1 + (this.comboCount * 0.1));
        if (this.player.class === 'warrior' && this.comboCount >= 3) {
            damage *= 1.5; // Warrior bonus
        }
        
        // Play attack sound and show damage animation
        this.playSound('attack');
        
        const enemySprite = document.querySelector('.enemy-sprite');
        if (enemySprite) {
            // Add damage animation
            enemySprite.classList.add('damaged');
            
            // Create damage number
            const damageNumber = document.createElement('div');
            damageNumber.className = 'damage-number';
            damageNumber.textContent = Math.round(damage);
            enemySprite.appendChild(damageNumber);
            
            // Remove damage animation and number after animation
            setTimeout(() => {
                enemySprite.classList.remove('damaged');
                damageNumber.remove();
            }, 500);
        }
        
        // Update enemy health
        this.enemy.health = Math.max(0, this.enemy.health - damage);
        const enemyHealthBar = document.querySelector('.enemy-health .health-fill');
        if (enemyHealthBar) {
            const healthPercent = (this.enemy.health / this.enemy.maxHp) * 100;
            enemyHealthBar.style.width = `${Math.max(0, healthPercent)}%`;
        }
        
        // Update questions answered
        this.questionsAnswered++;
        
        // Check for victory
        if (this.enemy.health <= 0) {
            this.victory();
        } else {
            this.selectNewChallenge();
            this.updateBattleUI();
        }
    }

    handleWrongAnswer() {
        this.comboCount = 0;
        
        // Play damage sound
        this.playSound('damage');
        
        // Take damage
        const damage = this.enemy.damage || 20;
        this.player.health = Math.max(0, this.player.health - damage);
        
        // Show player damage effect
        const gameScreen = document.querySelector('.battle-screen');
        if (gameScreen) {
            gameScreen.classList.add('screen-shake');
            setTimeout(() => {
                gameScreen.classList.remove('screen-shake');
            }, 500);
        }
        
        const playerHealthBar = document.querySelector('.player-health .health-fill');
        if (playerHealthBar) {
            const healthPercent = (this.player.health / this.player.maxHealth) * 100;
            playerHealthBar.style.width = `${Math.max(0, healthPercent)}%`;
            
            // Create damage number for player
            const damageNumber = document.createElement('div');
            damageNumber.className = 'damage-number player-damage';
            damageNumber.textContent = damage;
            playerHealthBar.parentElement.appendChild(damageNumber);
            
            setTimeout(() => {
                damageNumber.remove();
            }, 1000);
        }
        
        if (this.player.health <= 0) {
            this.defeat();
        } else {
            this.selectNewChallenge();
            this.updateBattleUI();
        }
    }

    victory() {
        this.isActive = false;
        clearInterval(this.timer);
        
        // Add enemy to defeated list
        this.game.defeatedEnemies.add(this.enemy.name);
        
        // Award XP with combo bonus
        const baseXP = this.enemy.xpReward;
        const comboBonus = Math.floor(baseXP * (this.maxCombo * 0.1));
        const totalXP = baseXP + comboBonus;
        
        this.player.gainXP(totalXP);
        
        // Show victory screen
        const gameScreen = document.getElementById('gameScreen');
        if (gameScreen) {
            gameScreen.innerHTML = `
                <div class="victory-screen" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center; padding: 20px; background: rgba(0, 0, 0, 0.8); border-radius: 10px; color: white; width: 80%; max-width: 500px;">
                    <h2>¡Victoria!</h2>
                    <p>You defeated ${this.enemy.name}!</p>
                    <p>Base XP: ${baseXP}</p>
                    <p>Combo Bonus: ${comboBonus}</p>
                    <p>Total XP: ${totalXP}</p>
                    <p>Max Combo: ${this.maxCombo}x</p>
                    <button onclick="window.game.enterExplorationMode()">Continue</button>
                </div>
            `;
        }
        
        // Play victory sound
        this.playSound('victory');
    }

    defeat() {
        this.isActive = false;
        clearInterval(this.timer);
        
        // Show defeat screen
        const gameScreen = document.getElementById('gameScreen');
        if (gameScreen) {
            gameScreen.innerHTML = `
                <div class="defeat-screen">
                    <h2>Derrota</h2>
                    <p>You were defeated by ${this.enemy.name}!</p>
                    <button onclick="window.game.startBattle('${this.enemy.id}')">Try Again</button>
                </div>
            `;
        }
        
        // Restore player HP
        this.player.health = this.player.maxHealth;
        this.player.updateUI();
        
        // Play defeat sound
        this.playSound('defeat');
    }

    selectNewChallenge() {
        // Get random tense from enemy's available tenses
        const tense = this.enemy.tenses[Math.floor(Math.random() * this.enemy.tenses.length)];
        const [tenseType, subType] = tense.split('.');
        
        // Get available verbs for this tense
        const availableVerbs = Object.keys(window.game.verbs[tenseType][subType]);
        
        // Select random verb and pronoun
        this.currentVerb = availableVerbs[Math.floor(Math.random() * availableVerbs.length)];
        this.currentPronoun = this.enemy.challenges[Math.floor(Math.random() * this.enemy.challenges.length)];
        this.currentTense = tense;
    }

    updateBattleUI() {
        if (!this.isActive) return;

        const verbChallenge = document.querySelector('.verb-challenge');
        if (verbChallenge) {
            verbChallenge.innerHTML = `
                <h3>Conjugate the Verb</h3>
                <p class="verb-text">${this.currentVerb}</p>
                <p class="pronoun-text">Pronoun: <strong>${this.currentPronoun}</strong></p>
                <p class="tense-text">Tense: <strong>${this.currentTense.split('.')[0]}</strong></p>
            `;
        }

        // Update health displays
        const playerHealthText = document.querySelector('.player-health p');
        const enemyHealthText = document.querySelector('.enemy-health p');
        
        if (playerHealthText) {
            playerHealthText.textContent = `${Math.max(0, this.player.health)}/${this.player.maxHealth}`;
        }
        
        if (enemyHealthText) {
            enemyHealthText.textContent = `${Math.max(0, this.enemy.health)}/${this.enemy.maxHp}`;
        }

        // Focus input
        const answerInput = document.getElementById('answerInput');
        if (answerInput) {
            answerInput.value = '';
            answerInput.focus();
        }
    }

    endBattle(victory) {
        this.isActive = false;
        clearInterval(this.timer);
        
        if (victory) {
            // Add enemy to defeated list before awarding XP
            this.game.defeatedEnemies.add(this.enemy.name);
            console.log('Added enemy to defeated list:', this.enemy.name); // Debug log
            console.log('Current defeated enemies:', [...this.game.defeatedEnemies]); // Debug log

            // Award XP
            this.game.player.gainXP(this.enemy.xpReward, this.game.currentRegion);

            // Get the current region and find next enemy
            const region = regions[this.game.currentRegion];
            if (!region) {
                console.error('Region not found:', this.game.currentRegion);
                return;
            }

            // Find the next undefeated enemy
            const nextEnemy = region.enemies.find(e => !this.game.defeatedEnemies.has(e.name));

            // Update game screen with appropriate victory screen
            const gameScreen = document.getElementById('gameScreen');
            if (nextEnemy) {
                gameScreen.innerHTML = `
                    <div class="victory-screen" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center; padding: 20px; background: rgba(0, 0, 0, 0.8); border-radius: 10px; color: white; width: 80%; max-width: 500px;">
                        <h2>Victory!</h2>
                        <p>You defeated ${this.enemy.name}!</p>
                        <p>XP Gained: ${this.enemy.xpReward}</p>
                        <div class="victory-buttons" style="display: flex; flex-direction: column; align-items: center; gap: 10px; margin-top: 20px;">
                            <button onclick="game.startBattle('${nextEnemy.id}')">Fight ${nextEnemy.name}</button>
                            <button onclick="game.enterExplorationMode()">Return to Map</button>
                        </div>
                    </div>
                `;
            } else {
                // Region completed
                gameScreen.innerHTML = `
                    <div class="victory-screen" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center; padding: 20px; background: rgba(0, 0, 0, 0.8); border-radius: 10px; color: white; width: 80%; max-width: 500px;">
                        <h2>Region Completed!</h2>
                        <p>Congratulations! You've mastered the ${this.game.currentRegion.replace(/_/g, ' ')}!</p>
                        <p>XP Gained: ${this.enemy.xpReward}</p>
                        <div class="victory-buttons" style="display: flex; flex-direction: column; align-items: center; gap: 10px; margin-top: 20px;">
                            <button onclick="game.enterWorldMap()">Return to World Map</button>
                        </div>
                    </div>
                `;
            }

            // Play victory sound and animation
            this.playSound('victory');
            animations.victory(gameScreen);
        } else {
            // Handle defeat
            const gameScreen = document.getElementById('gameScreen');
            gameScreen.innerHTML = `
                <div class="defeat-screen">
                    <h2>Defeat...</h2>
                    <p>You were defeated by ${this.enemy.name}.</p>
                    <div class="defeat-buttons">
                        <button onclick="game.startBattle('${this.enemy.id}')">Try Again</button>
                        <button onclick="game.enterExplorationMode()">Return to Map</button>
                    </div>
                </div>
            `;

            // Play defeat sound and animation
            this.playSound('defeat');
            animations.defeat(gameScreen);
            
            // Restore player HP
            this.player.health = this.player.maxHealth;
            this.player.updateUI();
        }
    }

    grantRewards() {
        const baseRewards = this.enemy.xpReward;
        const bonusRewards = this.isBossBattle ? baseRewards * 2 : baseRewards;
        this.rewards.push({ type: 'xp', amount: bonusRewards });
        this.player.gainXP(bonusRewards);
        this.showMessage(`You earned ${bonusRewards} XP!`);
        // Add more reward types as needed
    }

    changeTense(newTense) {
        this.currentTense = newTense;
        this.selectNewChallenge();
        this.updateBattleUI();
    }

    addTime(seconds) {
        this.timeLimit += seconds;
        this.updateBattleUI();
    }

    processEnemyTurn() {
        const ability = this.enemy.useSpecialAbility();
        if (ability) {
            this.applyEnemyAbility(ability);
        }
    }

    applyEnemyAbility(ability) {
        switch(ability.effect) {
            case 'reducesTimeBy':
                this.timeLimit -= ability.value;
                break;
            case 'shuffleLetters':
                this.shufflePrompt = true;
                break;
            case 'requiresPerfectAnswer':
                this.requirePerfect = true;
                break;
            case 'doubleHealth':
                this.enemy.health = Math.min(this.enemy.health * 2, this.enemy.maxHp);
                break;
        }
    }

    handleBossMechanics() {
        if (this.isBossBattle) {
            // Implement boss-specific mechanics
            if (this.enemy.health < this.enemy.maxHp * 0.5 && !this.enemy.enraged) {
                this.enemy.enraged = true;
                this.enemy.damageMultiplier *= 2;
                this.showMessage(`${this.enemy.name} is enraged!`);
            }
        }
    }

    handleBossPhases() {
        if (!this.enemy.isBoss) return;

        const healthPercent = this.enemy.health / this.enemy.maxHp;
        
        // Phase transitions
        if (healthPercent <= 0.6 && this.currentPhase === 1) {
            this.transitionToBossPhase(2);
        } else if (healthPercent <= 0.3 && this.currentPhase === 2) {
            this.transitionToBossPhase(3);
        }
    }

    transitionToBossPhase(phase) {
        this.currentPhase = phase;
        this.game.showMessage(`${this.enemy.name} enters phase ${phase}!`);
        
        // Phase-specific effects
        switch(phase) {
            case 2:
                this.timeLimit *= 0.8; // Reduce time by 20%
                this.enemy.damageMultiplier = 1.5;
                break;
            case 3:
                this.timeLimit *= 0.7; // Reduce time further
                this.enemy.damageMultiplier = 2;
                this.requirePerfectAnswer = true;
                break;
        }
        
        // Visual feedback
        animations.bossPhaseTransition(document.querySelector('.enemy-sprite'));
    }

    updateComboEffects() {
        let bonuses = { xpBonus: 1, damageBonus: 1 };
        
        for (const [threshold, rewards] of Object.entries(this.comboThresholds)) {
            if (this.comboCount >= parseInt(threshold)) {
                bonuses = rewards;
            }
        }

        // Apply combo bonuses
        this.currentDamageMultiplier = bonuses.damageBonus;
        this.currentXPMultiplier = bonuses.xpBonus;

        // Update UI
        const comboCounter = document.querySelector('.combo-counter');
        if (comboCounter) {
            comboCounter.innerHTML = `
                <span class="combo-number">${this.comboCount}x</span>
                <span class="combo-bonus">+${Math.round((bonuses.damageBonus - 1) * 100)}% DMG</span>
            `;
        }
    }

    handleVictory() {
        this.isActive = false;
        this.game.defeatedEnemies.add(this.enemy.name);
        
        // Award XP
        this.game.player.gainXP(this.enemy.xpReward, this.game.currentRegion);
        
        // Show victory screen
        const gameScreen = document.getElementById('gameScreen');
        if (gameScreen) {
            gameScreen.innerHTML = `
                <div class="victory-screen" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center; padding: 20px; background: rgba(0, 0, 0, 0.8); border-radius: 10px; color: white; width: 80%; max-width: 500px;">
                    <h2>Victory!</h2>
                    <p>You defeated the ${this.enemy.name}!</p>
                    <p>Gained ${this.enemy.xpReward} XP</p>
                    <div class="victory-buttons">
                        <button onclick="window.game.enterExplorationMode()">Continue</button>
                        <button onclick="window.game.enterWorldMap()">World Map</button>
                    </div>
                </div>
            `;
        }
        
        // Play victory sound
        this.playSound('victory');
    }
}
