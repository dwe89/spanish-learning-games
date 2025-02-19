export const ENEMY_TYPES = {
    // Forest of Beginnings (Level 1)
    MOSS_GOBLIN: {
        name: 'Moss Goblin',
        type: 'basic',
        level: 1,
        hp: 100,
        maxHp: 100,
        tenses: ['present.regular'],
        challenges: ['yo', 'tú', 'él/ella', 'nosotros', 'ellos/ellas'],
        questionsRequired: 5,
        xpReward: 20,
        damage: 20,
        sprite: 'assets/enemies/moss_goblin.png',
        background: 'assets/backgrounds/forest.jpg'
    },
    LEAF_SPRITE: {
        name: 'Leaf Sprite',
        type: 'agile',
        level: 1,
        hp: 150,
        maxHp: 150,
        tenses: ['present.regular'],
        challenges: ['yo', 'tú', 'él/ella', 'nosotros', 'ellos/ellas'],
        questionsRequired: 7,
        xpReward: 40,
        damage: 25,
        sprite: 'assets/enemies/leaf_sprite.png',
        background: 'assets/backgrounds/forest.jpg'
    },
    FOREST_GUARDIAN: {
        name: 'Forest Guardian',
        type: 'boss',
        level: 1,
        hp: 200,
        maxHp: 200,
        tenses: ['present.regular'],
        challenges: ['yo', 'tú', 'él/ella', 'nosotros', 'ellos/ellas'],
        questionsRequired: 10,
        xpReward: 100,
        damage: 30,
        sprite: 'assets/enemies/forest_guardian.png',
        background: 'assets/backgrounds/forest.jpg',
        isBoss: true
    },

    // Temple of Chaos (Level 2)
    CHAOS_ACOLYTE: {
        name: 'Chaos Acolyte',
        type: 'basic',
        level: 2,
        hp: 200,
        maxHp: 200,
        tenses: ['present.irregular'],
        challenges: ['yo', 'tú', 'él/ella', 'nosotros', 'ellos/ellas'],
        questionsRequired: 7,
        xpReward: 40,
        damage: 30,
        sprite: 'assets/enemies/chaos_acolyte.png',
        background: 'assets/backgrounds/temple_of_chaos.jpg'
    },
    TIME_WEAVER: {
        name: 'Time Weaver',
        type: 'agile',
        level: 2,
        hp: 250,
        maxHp: 250,
        tenses: ['present.irregular'],
        challenges: ['yo', 'tú', 'él/ella', 'nosotros', 'ellos/ellas'],
        questionsRequired: 8,
        xpReward: 60,
        damage: 35,
        sprite: 'assets/enemies/time_weaver.png',
        background: 'assets/backgrounds/temple_of_chaos.jpg'
    },
    CHAOS_LORD: {
        name: 'Chaos Lord',
        type: 'boss',
        level: 2,
        hp: 300,
        maxHp: 300,
        tenses: ['present.regular', 'present.irregular'],
        challenges: ['yo', 'tú', 'él/ella', 'nosotros', 'ellos/ellas'],
        questionsRequired: 12,
        xpReward: 120,
        damage: 40,
        sprite: 'assets/enemies/chaos_lord.png',
        background: 'assets/backgrounds/temple_of_chaos.jpg',
        isBoss: true
    },

    // Cave of Memories (Level 3)
    SHADOW_WRAITH: {
        name: 'Shadow Wraith',
        type: 'basic',
        level: 3,
        hp: 300,
        maxHp: 300,
        tenses: ['preterite.regular'],
        challenges: ['yo', 'tú', 'él/ella', 'nosotros', 'ellos/ellas'],
        questionsRequired: 8,
        xpReward: 60,
        sprite: 'assets/enemies/shadow_wraith.png'
    },
    MEMORY_SPECTER: {
        name: 'Memory Specter',
        type: 'agile',
        level: 3,
        hp: 350,
        maxHp: 350,
        tenses: ['preterite.regular'],
        challenges: ['yo', 'tú', 'él/ella', 'nosotros', 'ellos/ellas'],
        questionsRequired: 10,
        xpReward: 80,
        sprite: 'assets/enemies/memory_specter.png'
    },
    TEMPORAL_GUARDIAN: {
        name: 'Temporal Guardian',
        type: 'boss',
        level: 3,
        hp: 400,
        maxHp: 400,
        tenses: ['present.regular', 'present.irregular', 'preterite.regular'],
        challenges: ['yo', 'tú', 'él/ella', 'nosotros', 'ellos/ellas'],
        questionsRequired: 15,
        xpReward: 150,
        sprite: 'assets/enemies/temporal_guardian.png',
        isBoss: true
    },

    // Lair of Legends (Level 4)
    LEGENDARY_BEAST: {
        name: 'Legendary Beast',
        type: 'basic',
        level: 4,
        hp: 400,
        maxHp: 400,
        tenses: ['preterite.irregular'],
        challenges: ['yo', 'tú', 'él/ella', 'nosotros', 'ellos/ellas'],
        questionsRequired: 10,
        xpReward: 100,
        sprite: 'assets/enemies/legendary_beast.png'
    },
    MYTHICAL_GUARDIAN: {
        name: 'Mythical Guardian',
        type: 'boss',
        level: 4,
        hp: 500,
        maxHp: 500,
        tenses: ['present.regular', 'present.irregular', 'preterite.regular', 'preterite.irregular'],
        challenges: ['yo', 'tú', 'él/ella', 'nosotros', 'ellos/ellas'],
        questionsRequired: 20,
        xpReward: 200,
        sprite: 'assets/enemies/mythical_guardian.png',
        isBoss: true
    },

    // Swamp of Habits (Level 5)
    SWAMP_HAG: {
        name: 'Swamp Hag',
        type: 'basic',
        level: 5,
        hp: 500,
        maxHp: 500,
        tenses: ['preterite.regular', 'preterite.irregular'],
        challenges: ['yo', 'tú', 'él/ella', 'nosotros', 'ellos/ellas'],
        questionsRequired: 12,
        xpReward: 120,
        sprite: 'assets/enemies/swamp_hag.png'
    },
    HABITUAL_PHANTOM: {
        name: 'Habitual Phantom',
        type: 'boss',
        level: 5,
        hp: 600,
        maxHp: 600,
        tenses: ['present.regular', 'present.irregular', 'preterite.regular', 'preterite.irregular'],
        challenges: ['yo', 'tú', 'él/ella', 'nosotros', 'ellos/ellas'],
        questionsRequired: 25,
        xpReward: 250,
        sprite: 'assets/enemies/habitual_phantom.png',
        isBoss: true
    },

    // Skyward Spire (Level 6)
    SKY_GUARDIAN: {
        name: 'Sky Guardian',
        type: 'boss',
        level: 6,
        hp: 700,
        maxHp: 700,
        tenses: ['present.regular', 'present.irregular', 'preterite.regular', 'preterite.irregular'],
        challenges: ['yo', 'tú', 'él/ella', 'nosotros', 'ellos/ellas'],
        questionsRequired: 30,
        xpReward: 300,
        sprite: 'assets/enemies/sky_guardian.png',
        isBoss: true
    },

    // Palace of Possibilities (Level 7)
    POSSIBILITY_WRAITH: {
        name: 'Possibility Wraith',
        type: 'basic',
        level: 7,
        hp: 800,
        maxHp: 800,
        tenses: ['present.regular', 'present.irregular', 'preterite.regular', 'preterite.irregular'],
        challenges: ['yo', 'tú', 'él/ella', 'nosotros', 'ellos/ellas'],
        questionsRequired: 15,
        xpReward: 150,
        sprite: 'assets/enemies/possibility_wraith.png'
    },
    CONDITIONAL_SPECTER: {
        name: 'Conditional Specter',
        type: 'boss',
        level: 7,
        hp: 900,
        maxHp: 900,
        tenses: ['present.regular', 'present.irregular', 'preterite.regular', 'preterite.irregular'],
        challenges: ['yo', 'tú', 'él/ella', 'nosotros', 'ellos/ellas'],
        questionsRequired: 35,
        xpReward: 350,
        sprite: 'assets/enemies/conditional_specter.png',
        isBoss: true
    },

    // Dungeon of Commands (Level 8)
    COMMANDER_SPECTER: {
        name: 'Commander Specter',
        type: 'basic',
        level: 8,
        hp: 1000,
        maxHp: 1000,
        tenses: ['present.regular', 'present.irregular', 'preterite.regular', 'preterite.irregular'],
        challenges: ['yo', 'tú', 'él/ella', 'nosotros', 'ellos/ellas'],
        questionsRequired: 20,
        xpReward: 200,
        sprite: 'assets/enemies/commander_specter.png'
    },
    IMPERATIVE_PHANTOM: {
        name: 'Imperative Phantom',
        type: 'boss',
        level: 8,
        hp: 1200,
        maxHp: 1200,
        tenses: ['present.regular', 'present.irregular', 'preterite.regular', 'preterite.irregular'],
        challenges: ['yo', 'tú', 'él/ella', 'nosotros', 'ellos/ellas'],
        questionsRequired: 40,
        xpReward: 400,
        sprite: 'assets/enemies/imperative_phantom.png',
        isBoss: true
    }
};

// Helper function to get enemy by ID
export function getEnemyById(id) {
    return ENEMY_TYPES[id.toUpperCase()];
}

// Helper function to get enemies for a region
export function getEnemiesForRegion(regionId) {
    return Object.values(ENEMY_TYPES).filter(enemy => 
        enemy.level === regions[regionId]?.requiredLevel
    );
}

// Helper function to get next enemy in progression
export function getNextEnemy(currentEnemyId, defeatedEnemies) {
    const currentEnemy = ENEMY_TYPES[currentEnemyId.toUpperCase()];
    if (!currentEnemy) return null;

    const levelEnemies = Object.values(ENEMY_TYPES)
        .filter(enemy => enemy.level === currentEnemy.level)
        .sort((a, b) => {
            if (a.isBoss && !b.isBoss) return 1;
            if (!a.isBoss && b.isBoss) return -1;
            return 0;
        });

    const currentIndex = levelEnemies.findIndex(e => e.name === currentEnemy.name);
    if (currentIndex === -1) return null;

    // Return next undefeated enemy
    for (let i = currentIndex + 1; i < levelEnemies.length; i++) {
        if (!defeatedEnemies.has(levelEnemies[i].name)) {
            return levelEnemies[i];
        }
    }

    return null;
}

// Add enemy effects
const enemyEffects = {
    ghostly_conjugation: {
        duration: 2,
        apply: (battle) => {
            battle.verbDisplay.style.opacity = '0.3';
        },
        remove: (battle) => {
            battle.verbDisplay.style.opacity = '1';
        }
    },
    time_distortion: {
        duration: 3,
        apply: (battle) => {
            battle.timeLimit *= 0.7;
        },
        remove: (battle) => {
            battle.timeLimit /= 0.7;
        }
    }
};

// Enhanced enemy selection
function getEnemyForArea(area, difficulty) {
    const areaEnemies = Object.values(ENEMY_TYPES).filter(enemy => enemy.region === area);
    if (!areaEnemies) return null;
    
    // Filter by difficulty
    const availableEnemies = areaEnemies.filter(e => {
        if (difficulty === 'easy') return e.level <= 2;
        if (difficulty === 'medium') return e.level > 2 && e.level <= 4;
        return e.level > 4;
    });
    
    if (availableEnemies.length === 0) return null;
    
    // Return random enemy from filtered list
    return {...availableEnemies[Math.floor(Math.random() * availableEnemies.length)]};
}

function applyEnemySpecialAbility(enemy, player) {
    switch (enemy.specialAbility) {
        case 'scrambleLetters':
            alert(`${enemy.name} used Scramble Letters!`);
            // Implement scramble letters logic
            break;
        case 'switchTense':
            alert(`${enemy.name} used Switch Tense!`);
            // Implement switch tense logic
            break;
        case 'timeWarp':
            alert(`${enemy.name} used Time Warp!`);
            // Implement time warp logic
            break;
        case 'fireBreath':
            alert(`${enemy.name} used Fire Breath!`);
            // Implement fire breath logic
            break;
        case 'royalChallenge':
            alert(`${enemy.name} used Royal Challenge!`);
            // Implement royal challenge logic
            break;
        case 'fearStrike':
            alert(`${enemy.name} used Fear Strike!`);
            // Implement fear strike logic
            break;
        case 'ghostlyConjugation':
            alert(`${enemy.name} used Ghostly Conjugation!`);
            // Implement ghostly conjugation logic
            break;
    }
}
