import { regions } from './data/regions.js';

export class Character {
    constructor(name, characterClass) {
        console.log('Creating character:', { name, characterClass }); // Debug log
        this.name = name;
        this.characterClass = characterClass;
        this.level = 1;
        this.health = 100;
        this.maxHealth = 100;
        this.xp = 0;
        this.xpToNextLevel = 100; // This will be dynamically set based on region
        this.unlockedTenses = ['present.regular'];
        this.skillPoints = 0;
        this.skills = {
            verbMastery: 1,
            criticalThinking: 1,
            timeManagement: 1
        };
        
        // Initialize class-specific stats
        switch (characterClass) {
            case 'warrior':
                this.health = 120;
                this.maxHealth = 120;
                this.damageMultiplier = 1.2;
                break;
            case 'mage':
                this.timeLimit = 35; // 5 extra seconds
                this.damageMultiplier = 1.0;
                break;
            case 'rogue':
                this.comboMultiplier = 1.5;
                this.damageMultiplier = 1.1;
                break;
            default:
                console.warn('Unknown character class:', characterClass);
                break;
        }

        // Initialize empty sets for tracking progress
        this.achievements = new Set();
        this.defeatedEnemies = new Set(); // Start with no defeated enemies
        this.masteredTenses = new Set(['present.regular']);
        
        // Load saved data if exists
        const savedData = localStorage.getItem('verbQuestSave');
        if (savedData) {
            this.loadProgress();
        } else {
            // This is a new character, initialize with empty sets
            console.log('New character created with no defeated enemies'); // Debug log
        }
        
        console.log('Character created:', this); // Debug log
    }

    gainXP(amount, region = null) {
        this.xp += amount;
        
        // Check if first region is completed
        const firstRegionCompleted = window.game.defeatedEnemies.size >= 3; // Assuming 3 enemies in first region
        
        // Only allow leveling up if first region is completed or we're already past level 1
        if ((firstRegionCompleted || this.level > 1) && this.xp >= this.xpToNextLevel) {
            this.levelUp();
        }
        
        // Check for region completion and unlock
        if (region) {
            window.game.checkRegionUnlock(this.level);
        }
        
        this.saveProgress();
        this.updateUI();
    }

    levelUp() {
        this.level++;
        this.xp = this.xp - this.xpToNextLevel;
        this.xpToNextLevel = this.level * 160;
        
        // Increase stats
        this.maxHealth += 20;
        this.health = this.maxHealth; // Heal to full on level up
        
        // Show level up message
        if (window.game) {
            window.game.showMessage(`Level Up! You are now level ${this.level}!`);
            window.game.playSound('levelUp');
        }
    }

    showLevelUpNotification() {
        const notification = document.createElement('div');
        notification.className = 'level-up-notification';
        notification.innerHTML = `
            <h3>Region Complete!</h3>
            <p>You've advanced to Level ${this.level}!</p>
            <p>Max HP increased by 20</p>
            <p>Gained 1 skill point</p>
            <p>Next region unlocked!</p>
        `;
        
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 3000);
    }

    updateUI() {
        // Update player stats in navigation bar
        const statsElements = {
            'playerLevel': this.level,
            'playerHealth': `${this.health}/${this.maxHealth}`,
            'playerXP': `${this.xp}/${this.xpToNextLevel}`,
            'skillPoints': this.skillPoints
        };

        for (const [id, value] of Object.entries(statsElements)) {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value;
            }
        }

        // Update health bar if it exists
        const healthBar = document.querySelector('.player-health .health-fill');
        if (healthBar) {
            const healthPercent = (this.health / this.maxHealth) * 100;
            healthBar.style.width = `${healthPercent}%`;
        }
        
        // Update XP bar if it exists
        const xpBar = document.querySelector('.xp-bar-fill');
        if (xpBar) {
            const xpPercent = (this.xp / this.xpToNextLevel) * 100;
            xpBar.style.width = `${xpPercent}%`;
        }
    }

    saveProgress() {
        // Make sure defeatedEnemies is properly initialized
        if (!this.defeatedEnemies) {
            this.defeatedEnemies = new Set();
        }

        const saveData = {
            name: this.name,
            characterClass: this.characterClass,
            level: this.level,
            health: this.health,
            maxHealth: this.maxHealth,
            xp: this.xp,
            xpToNextLevel: this.xpToNextLevel,
            skillPoints: this.skillPoints,
            skills: this.skills,
            achievements: Array.from(this.achievements),
            defeatedEnemies: Array.from(this.defeatedEnemies),
            masteredTenses: Array.from(this.masteredTenses),
            unlockedTenses: this.unlockedTenses
        };

        localStorage.setItem('verbQuestSave', JSON.stringify(saveData));
        console.log('Progress saved:', saveData); // Debug log
    }

    loadProgress() {
        const savedData = localStorage.getItem('verbQuestSave');
        if (savedData) {
            const data = JSON.parse(savedData);
            
            // Initialize Sets before loading data
            this.achievements = new Set();
            this.defeatedEnemies = new Set();
            this.masteredTenses = new Set(['present.regular']);
            
            // Load the data
            Object.assign(this, data);
            
            // Convert arrays back to Sets
            if (data.achievements) this.achievements = new Set(data.achievements);
            if (data.defeatedEnemies) this.defeatedEnemies = new Set(data.defeatedEnemies);
            if (data.masteredTenses) this.masteredTenses = new Set(data.masteredTenses);
            
            console.log('Progress loaded:', this); // Debug log
        }
    }

    heal(amount) {
        this.health = Math.min(this.maxHealth, this.health + amount);
        this.updateUI();
    }

    takeDamage(amount) {
        this.health = Math.max(0, this.health - amount);
        this.updateUI();
        return this.health > 0;
    }

    upgradeSkill(skillName) {
        if (this.skillPoints > 0 && this.skills[skillName]) {
            this.skills[skillName]++;
            this.skillPoints--;
            this.saveProgress();
            this.updateUI();
            return true;
        }
        return false;
    }
}
