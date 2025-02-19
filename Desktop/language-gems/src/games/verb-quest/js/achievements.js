const achievements = {
    perfectBattle: {
        id: 'perfect_battle',
        name: 'Perfect Conjugator',
        condition: (battle) => battle.wrongAnswers === 0,
        reward: { type: 'xp', amount: 100 }
    },
    comboMaster: {
        id: 'combo_master',
        name: '10x Combo Master',
        condition: (battle) => battle.maxCombo >= 10,
        reward: { type: 'item', name: 'Combo Potion' }
    }
};

function checkAchievements(battle) {
    for (const key in achievements) {
        if (achievements[key].condition(battle)) {
            alert(`Achievement Unlocked: ${achievements[key].name}`);
            battle.player.achievements.push(achievements[key].id);
            grantAchievementReward(battle.player, achievements[key].reward);
        }
    }
}

function grantAchievementReward(player, reward) {
    switch (reward.type) {
        case 'xp':
            player.gainXP(reward.amount);
            break;
        case 'item':
            if (!player.items[reward.name]) {
                player.items[reward.name] = 0;
            }
            player.items[reward.name]++;
            break;
    }
}

function saveAchievements(player) {
    localStorage.setItem('achievements', JSON.stringify(player.achievements));
}

function loadAchievements(player) {
    const savedAchievements = JSON.parse(localStorage.getItem('achievements'));
    if (savedAchievements) {
        player.achievements = savedAchievements;
    }
}
