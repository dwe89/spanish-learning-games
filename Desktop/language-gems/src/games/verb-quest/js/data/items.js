// Item Categories and Effects System
export const ITEM_CATEGORIES = {
    CONSUMABLE: 'consumable',
    EQUIPMENT: 'equipment',
    QUEST: 'quest',
    SPECIAL: 'special'
};

export const ITEM_SLOTS = {
    HEAD: 'head',
    BODY: 'body',
    HANDS: 'hands',
    FEET: 'feet',
    ACCESSORY: 'accessory'
};

// Battle Items (Consumables)
export const battleItems = {
    healthPotion: {
        id: 'healthPotion',
        name: 'Health Potion',
        category: ITEM_CATEGORIES.CONSUMABLE,
        description: 'Restores 50 HP',
        price: 100,
        sprite: 'assets/items/health_potion.png',
        effect: (battle) => {
            const healAmount = 50;
            battle.player.hp = Math.min(battle.player.maxHp, battle.player.hp + healAmount);
            battle.showFloatingText(`+${healAmount} HP`, battle.player.x, battle.player.y, 'heal');
            battle.playSound('heal');
        }
    },
    manaPotion: {
        id: 'manaPotion',
        name: 'Mana Potion',
        category: ITEM_CATEGORIES.CONSUMABLE,
        description: 'Restores 50 MP',
        price: 150,
        sprite: 'assets/items/mana_potion.png',
        effect: (battle) => {
            const manaAmount = 50;
            battle.player.mana = Math.min(battle.player.maxMana, battle.player.mana + manaAmount);
            battle.showFloatingText(`+${manaAmount} MP`, battle.player.x, battle.player.y, 'mana');
            battle.playSound('mana');
        }
    },
    timeFreeze: {
        id: 'timeFreeze',
        name: 'Time Freeze Crystal',
        category: ITEM_CATEGORIES.CONSUMABLE,
        description: 'Freezes battle timer for 10 seconds',
        price: 300,
        sprite: 'assets/items/time_crystal.png',
        effect: (battle) => {
            battle.pauseTimer(10);
            battle.showFloatingText('Time Frozen!', battle.player.x, battle.player.y, 'special');
            battle.playSound('timeFreeze');
        }
    },
    verbHint: {
        id: 'verbHint',
        name: 'Verb Hint Scroll',
        category: ITEM_CATEGORIES.CONSUMABLE,
        description: 'Shows conjugation hint for current verb',
        price: 200,
        sprite: 'assets/items/hint_scroll.png',
        effect: (battle) => {
            battle.showHint();
            battle.playSound('scroll');
        }
    },
    comboBooster: {
        id: 'comboBooster',
        name: 'Combo Booster',
        category: ITEM_CATEGORIES.CONSUMABLE,
        description: 'Doubles combo points for 3 turns',
        price: 400,
        sprite: 'assets/items/combo_booster.png',
        effect: (battle) => {
            battle.comboMultiplier = 2;
            battle.comboBoostTurns = 3;
            battle.showFloatingText('Combo Boost x2!', battle.player.x, battle.player.y, 'buff');
            battle.playSound('powerup');
        }
    }
};

// Equipment Items
export const equipmentItems = {
    scholarHat: {
        id: 'scholarHat',
        name: "Scholar's Hat",
        category: ITEM_CATEGORIES.EQUIPMENT,
        slot: ITEM_SLOTS.HEAD,
        description: '+10% XP gain',
        price: 1000,
        sprite: 'assets/items/scholar_hat.png',
        stats: {
            xpBonus: 0.1
        }
    },
    verbMasterRobe: {
        id: 'verbMasterRobe',
        name: 'Verb Master Robe',
        category: ITEM_CATEGORIES.EQUIPMENT,
        slot: ITEM_SLOTS.BODY,
        description: '+20% damage with regular verbs',
        price: 2000,
        sprite: 'assets/items/master_robe.png',
        stats: {
            regularVerbDamage: 0.2
        }
    },
    timeKeeperGloves: {
        id: 'timeKeeperGloves',
        name: 'Time Keeper Gloves',
        category: ITEM_CATEGORIES.EQUIPMENT,
        slot: ITEM_SLOTS.HANDS,
        description: '+5 seconds to answer time',
        price: 1500,
        sprite: 'assets/items/keeper_gloves.png',
        stats: {
            timeBonus: 5
        }
    },
    swiftLearnerBoots: {
        id: 'swiftLearnerBoots',
        name: 'Swift Learner Boots',
        category: ITEM_CATEGORIES.EQUIPMENT,
        slot: ITEM_SLOTS.FEET,
        description: '+15% movement speed, +2 seconds to answer time',
        price: 1200,
        sprite: 'assets/items/swift_boots.png',
        stats: {
            moveSpeed: 0.15,
            timeBonus: 2
        }
    },
    conjugationAmulet: {
        id: 'conjugationAmulet',
        name: 'Conjugation Amulet',
        category: ITEM_CATEGORIES.EQUIPMENT,
        slot: ITEM_SLOTS.ACCESSORY,
        description: '10% chance to get a free hint',
        price: 3000,
        sprite: 'assets/items/conj_amulet.png',
        stats: {
            hintChance: 0.1
        }
    }
};

// Quest Items
export const questItems = {
    ancientGrammarTome: {
        id: 'ancientGrammarTome',
        name: 'Ancient Grammar Tome',
        category: ITEM_CATEGORIES.QUEST,
        description: 'A mysterious book containing ancient conjugation wisdom',
        sprite: 'assets/items/ancient_tome.png',
        quest: 'elderSageQuest'
    },
    irregularVerbCrystal: {
        id: 'irregularVerbCrystal',
        name: 'Irregular Verb Crystal',
        category: ITEM_CATEGORIES.QUEST,
        description: 'Pulsing with chaotic verbal energy',
        sprite: 'assets/items/verb_crystal.png',
        quest: 'timeKeeperQuest'
    }
};

// Special Items
export const specialItems = {
    regionKey: {
        id: 'regionKey',
        name: 'Region Key',
        category: ITEM_CATEGORIES.SPECIAL,
        description: 'Unlocks new regions on the map',
        sprite: 'assets/items/region_key.png'
    },
    verbMasteryToken: {
        id: 'verbMasteryToken',
        name: 'Verb Mastery Token',
        category: ITEM_CATEGORIES.SPECIAL,
        description: 'Proof of mastering a verb tense',
        sprite: 'assets/items/mastery_token.png'
    }
};

// Export all items in a single object
export const allItems = {
    ...battleItems,
    ...equipmentItems,
    ...questItems,
    ...specialItems
};
