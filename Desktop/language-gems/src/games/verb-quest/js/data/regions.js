import { ENEMY_TYPES } from './enemies.js';

// Development mode flag
export let DEV_MODE = false;

export const regions = {
    forest_of_beginnings: {
        id: 'forest_of_beginnings',
        name: 'Forest of Beginnings',
        description: 'A peaceful forest where your journey begins. Master the present tense here.',
        difficulty: 1,
        position: { x: 20, y: 20 },
        number: 1,
        connections: ['temple_of_chaos'],
        enemies: [
            {
                id: 'moss_goblin',
                name: 'Moss Goblin',
                description: 'A small creature covered in moss',
                hp: 100,
                tenses: ['present.regular'],
                challenges: ['yo', 'tú', 'él/ella', 'nosotros', 'ellos/ellas'],
                questionsRequired: 5,
                xpReward: 20,
                damage: 20,
                sprite: 'assets/enemies/moss_goblin.png'
            },
            {
                id: 'leaf_sprite',
                name: 'Leaf Sprite',
                description: 'A playful forest spirit',
                hp: 200,
                tenses: ['present.regular', 'present.irregular'],
                challenges: ['yo', 'tú', 'él/ella', 'nosotros', 'ellos/ellas'],
                questionsRequired: 10,
                xpReward: 40,
                damage: 20,
                sprite: 'assets/enemies/leaf_sprite.png'
            },
            {
                id: 'forest_guardian',
                name: 'Forest Guardian',
                description: 'The ancient protector of the forest',
                hp: 300,
                tenses: ['present.regular', 'present.irregular'],
                challenges: ['yo', 'tú', 'él/ella', 'nosotros', 'ellos/ellas'],
                questionsRequired: 15,
                xpReward: 100,
                damage: 20,
                isBoss: true,
                sprite: 'assets/enemies/forest_guardian.png'
            }
        ],
        requiredLevel: 1,
        nextRegion: 'temple_of_chaos',
        background: 'assets/backgrounds/forest.jpg'
    },
    temple_of_chaos: {
        id: 'temple_of_chaos',
        name: "Temple of Chaos",
        description: "Master irregular present tense verbs in this mystical temple.",
        difficulty: 2,
        position: { x: 45, y: 25 },
        number: 2,
        connections: ['forest_of_beginnings', 'cave_of_memories'],
        enemies: [
            {
                id: 'chaos_acolyte',
                name: 'Chaos Acolyte',
                description: 'A mysterious follower of the temple',
                hp: 150,
                tenses: ['present.irregular'],
                challenges: ['yo', 'tú', 'él/ella', 'nosotros', 'ellos/ellas'],
                questionsRequired: 8,
                xpReward: 30,
                damage: 25,
                sprite: 'assets/enemies/chaos_acolyte.png'
            },
            {
                id: 'time_weaver',
                name: 'Time Weaver',
                description: 'A being that manipulates temporal energy',
                hp: 250,
                tenses: ['present.irregular'],
                challenges: ['yo', 'tú', 'él/ella', 'nosotros', 'ellos/ellas'],
                questionsRequired: 12,
                xpReward: 50,
                damage: 25,
                sprite: 'assets/enemies/time_weaver.png'
            },
            {
                id: 'chaos_lord',
                name: 'Chaos Lord',
                description: 'The powerful ruler of the temple',
                hp: 400,
                tenses: ['present.irregular'],
                challenges: ['yo', 'tú', 'él/ella', 'nosotros', 'ellos/ellas'],
                questionsRequired: 15,
                xpReward: 120,
                damage: 30,
                isBoss: true,
                sprite: 'assets/enemies/chaos_lord.png'
            }
        ],
        requiredLevel: 2,
        nextRegion: 'cave_of_memories',
        background: 'assets/backgrounds/temple_of_chaos.jpg'
    },
    cave_of_memories: {
        id: 'cave_of_memories',
        name: "Cave of Memories",
        description: "A dark, echoing cave representing the past, where players face challenges based on regular verbs in the preterite tense.",
        position: { x: 70, y: 30 },
        number: 3,
        connections: ['temple_of_chaos', 'lair_of_legends'],
        requiredLevel: 3,
        background: 'assets/backgrounds/cave.jpg',
        enemies: [
            {
                id: 'shadow_wraith',
                name: 'Shadow Wraith',
                description: 'A mysterious wraith from the shadows',
                hp: 300,
                tenses: ['preterite.regular'],
                challenges: ['yo', 'tú', 'él/ella', 'nosotros', 'ellos/ellas'],
                questionsRequired: 8,
                xpReward: 60,
                damage: 30,
                sprite: 'assets/enemies/shadow_wraith.png'
            },
            {
                id: 'memory_specter',
                name: 'Memory Specter',
                description: 'A specter that haunts memories',
                hp: 350,
                tenses: ['preterite.regular'],
                challenges: ['yo', 'tú', 'él/ella', 'nosotros', 'ellos/ellas'],
                questionsRequired: 10,
                xpReward: 80,
                damage: 35,
                sprite: 'assets/enemies/memory_specter.png'
            },
            {
                id: 'temporal_guardian',
                name: 'Temporal Guardian',
                description: 'The guardian of time itself',
                hp: 400,
                tenses: ['present.regular', 'present.irregular', 'preterite.regular'],
                challenges: ['yo', 'tú', 'él/ella', 'nosotros', 'ellos/ellas'],
                questionsRequired: 15,
                xpReward: 150,
                damage: 40,
                isBoss: true,
                sprite: 'assets/enemies/temporal_guardian.png'
            }
        ],
        difficulty: 3
    },
    lair_of_legends: {
        id: 'lair_of_legends',
        name: "Lair of Legends",
        description: "An ancient labyrinth testing mastery of irregular preterite tense verbs.",
        position: { x: 85, y: 35 },
        number: 4,
        connections: ['cave_of_memories', 'swamp_of_habits'],
        requiredLevel: 4,
        background: 'assets/backgrounds/forest.jpg',
        enemies: [
            {
                id: 'legendary_beast',
                name: 'Legendary Beast',
                description: 'A fearsome beast of legend',
                hp: 400,
                tenses: ['preterite.irregular'],
                challenges: ['yo', 'tú', 'él/ella', 'nosotros', 'ellos/ellas'],
                questionsRequired: 10,
                xpReward: 100,
                damage: 40,
                sprite: 'assets/enemies/legendary_beast.png'
            },
            {
                id: 'mythical_guardian',
                name: 'Mythical Guardian',
                description: 'The ancient guardian of legends',
                hp: 500,
                tenses: ['present.regular', 'present.irregular', 'preterite.regular', 'preterite.irregular'],
                challenges: ['yo', 'tú', 'él/ella', 'nosotros', 'ellos/ellas'],
                questionsRequired: 20,
                xpReward: 200,
                damage: 50,
                isBoss: true,
                sprite: 'assets/enemies/mythical_guardian.png'
            }
        ],
        difficulty: 4
    },
    swamp_of_habits: {
        id: 'swamp_of_habits',
        name: "Swamp of Habits",
        description: "A foggy swamp reflecting repetitive actions in the past, with challenges around regular verbs in the imperfect tense.",
        position: { x: 65, y: 45 },
        number: 5,
        connections: ['lair_of_legends', 'skyward_spire'],
        requiredLevel: 5,
        background: 'assets/backgrounds/forest.jpg',
        enemies: [
            {
                id: 'swamp_hag',
                name: 'Swamp Hag',
                description: 'A mysterious creature of the swamp',
                hp: 500,
                tenses: ['preterite.regular', 'preterite.irregular'],
                challenges: ['yo', 'tú', 'él/ella', 'nosotros', 'ellos/ellas'],
                questionsRequired: 12,
                xpReward: 120,
                damage: 45,
                sprite: 'assets/enemies/swamp_hag.png'
            },
            {
                id: 'habitual_phantom',
                name: 'Habitual Phantom',
                description: 'A phantom that haunts with repetitive actions',
                hp: 600,
                tenses: ['present.regular', 'present.irregular', 'preterite.regular', 'preterite.irregular'],
                challenges: ['yo', 'tú', 'él/ella', 'nosotros', 'ellos/ellas'],
                questionsRequired: 25,
                xpReward: 250,
                damage: 55,
                isBoss: true,
                sprite: 'assets/enemies/habitual_phantom.png'
            }
        ],
        difficulty: 5
    },
    skyward_spire: {
        id: 'skyward_spire',
        name: "Skyward Spire",
        description: "A gleaming tower rising into the clouds, where players tackle regular future tense verbs.",
        position: { x: 45, y: 50 },
        number: 6,
        connections: ['swamp_of_habits', 'palace_of_possibilities'],
        requiredLevel: 6,
        background: 'assets/backgrounds/forest.jpg',
        enemies: [
            {
                id: 'sky_guardian',
                name: 'Sky Guardian',
                description: 'The majestic guardian of the skies',
                hp: 700,
                tenses: ['present.regular', 'present.irregular', 'preterite.regular', 'preterite.irregular'],
                challenges: ['yo', 'tú', 'él/ella', 'nosotros', 'ellos/ellas'],
                questionsRequired: 30,
                xpReward: 300,
                damage: 60,
                isBoss: true,
                sprite: 'assets/enemies/sky_guardian.png'
            }
        ],
        difficulty: 6
    },
    palace_of_possibilities: {
        id: 'palace_of_possibilities',
        name: "Palace of Possibilities",
        description: "A grand palace embodying hypothetical scenarios, where players work with conditional tense verbs.",
        position: { x: 25, y: 55 },
        number: 7,
        connections: ['skyward_spire', 'dungeon_of_commands'],
        requiredLevel: 7,
        background: 'assets/backgrounds/forest.jpg',
        enemies: [
            {
                id: 'possibility_wraith',
                name: 'Possibility Wraith',
                description: 'A wraith of infinite possibilities',
                hp: 800,
                tenses: ['present.regular', 'present.irregular', 'preterite.regular', 'preterite.irregular'],
                challenges: ['yo', 'tú', 'él/ella', 'nosotros', 'ellos/ellas'],
                questionsRequired: 15,
                xpReward: 150,
                damage: 65,
                sprite: 'assets/enemies/possibility_wraith.png'
            },
            {
                id: 'conditional_specter',
                name: 'Conditional Specter',
                description: 'A specter of hypothetical scenarios',
                hp: 900,
                tenses: ['present.regular', 'present.irregular', 'preterite.regular', 'preterite.irregular'],
                challenges: ['yo', 'tú', 'él/ella', 'nosotros', 'ellos/ellas'],
                questionsRequired: 35,
                xpReward: 350,
                damage: 70,
                isBoss: true,
                sprite: 'assets/enemies/conditional_specter.png'
            }
        ],
        difficulty: 7
    },
    dungeon_of_commands: {
        id: 'dungeon_of_commands',
        name: "Dungeon of Commands",
        description: "A grim, intimidating dungeon where quick responses are needed for both affirmative and negative commands in the imperative mood.",
        position: { x: 40, y: 65 },
        number: 8,
        connections: ['palace_of_possibilities', 'shrine_of_perfection'],
        requiredLevel: 8,
        background: 'assets/backgrounds/forest.jpg',
        enemies: [
            {
                id: 'commander_specter',
                name: 'Commander Specter',
                sprite: 'assets/enemies/commander_specter.png'
            },
            {
                id: 'imperative_phantom',
                name: 'Imperative Phantom',
                sprite: 'assets/enemies/imperative_phantom.png'
            }
        ],
        difficulty: 8
    },
    shrine_of_perfection: {
        id: 'shrine_of_perfection',
        name: "Shrine of Perfection",
        description: "A serene sanctuary focused on compound tenses, offering perfect tense challenges.",
        position: { x: 60, y: 70 },
        number: 9,
        connections: ['dungeon_of_commands', 'castle_of_conjugations'],
        requiredLevel: 9,
        background: 'assets/backgrounds/forest.jpg',
        enemies: [
            {
                id: 'perfection_guardian',
                name: 'Perfection Guardian',
                sprite: 'assets/enemies/perfection_guardian.png'
            },
            {
                id: 'compound_wraith',
                name: 'Compound Wraith',
                sprite: 'assets/enemies/compound_wraith.png'
            }
        ],
        difficulty: 9
    },
    castle_of_conjugations: {
        id: 'castle_of_conjugations',
        name: "Castle of Conjugations",
        description: "The final and most challenging region, featuring complex subjunctive mood conjugations.",
        position: { x: 80, y: 75 },
        number: 10,
        connections: ['shrine_of_perfection'],
        requiredLevel: 10,
        background: 'assets/backgrounds/forest.jpg',
        enemies: [
            {
                id: 'subjunctive_lord',
                name: 'Subjunctive Lord',
                sprite: 'assets/enemies/subjunctive_lord.png'
            },
            {
                id: 'conjugation_master',
                name: 'Conjugation Master',
                sprite: 'assets/enemies/conjugation_master.png'
            }
        ],
        difficulty: 10
    }
};

// Toggle development mode
export const toggleDevMode = () => {
    DEV_MODE = !DEV_MODE;
    console.log(`Developer mode ${DEV_MODE ? 'enabled' : 'disabled'}`);
};

// Helper function to check if a region is accessible
export const isRegionAccessible = (regionId, playerLevel) => {
    if (DEV_MODE) return true;
    return playerLevel >= regions[regionId].requiredLevel;
};
