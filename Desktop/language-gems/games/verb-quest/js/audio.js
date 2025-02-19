const AudioManager = {
    sounds: {
        correct: new Audio('assets/sounds/correct.mp3'),
        wrong: new Audio('assets/sounds/wrong.mp3'),
        victory: new Audio('assets/sounds/victory.mp3'),
        defeat: new Audio('assets/sounds/defeat.mp3'),
        click: new Audio('assets/sounds/click.mp3'),
        levelUp: new Audio('assets/sounds/levelup.mp3'),
        damage: new Audio('assets/sounds/damage.mp3'),
        backgroundMusic: new Audio('assets/sounds/background-music.mp3')
    },

    play(soundName) {
        if (this.sounds[soundName] && window.game.soundEnabled) {
            this.sounds[soundName].currentTime = 0;
            this.sounds[soundName].play().catch(e => console.log('Audio play failed:', e));
        }
    },

    preloadSounds() {
        Object.values(this.sounds).forEach(sound => {
            sound.load();
        });
    }
};

// Preload sounds when game starts
document.addEventListener('DOMContentLoaded', () => AudioManager.preloadSounds());
