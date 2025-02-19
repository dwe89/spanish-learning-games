const quests = {
    quest1: {
        id: 'quest1',
        name: 'Beginner\'s Journey',
        description: 'Complete 5 battles in the Forest of Beginnings.',
        region: 'forest_of_beginnings',
        requiredBattles: 5,
        completedBattles: 0,
        rewards: [
            { type: 'xp', amount: 200 },
            { type: 'item', name: 'Health Potion' }
        ],
        dialogue: [
            "Welcome to the Forest of Beginnings!",
            "Your first task is to complete 5 battles here.",
            "Good luck, adventurer!"
        ]
    },
    // Add more quests
};

function checkQuestProgress(player) {
    player.quests.forEach(quest => {
        if (quest.completedBattles >= quest.requiredBattles) {
            completeQuest(player, quest);
        }
    });
}

function completeQuest(player, quest) {
    player.quests = player.quests.filter(q => q.id !== quest.id);
    quest.rewards.forEach(reward => {
        grantQuestReward(player, reward);
    });
    player.completedQuests.push(quest.id);
    player.showMessage(`Quest Completed: ${quest.name}`);
}

function grantQuestReward(player, reward) {
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

function startQuest(player, questId) {
    const quest = quests[questId];
    if (quest) {
        player.quests.push(quest);
        player.showMessage(`Quest Started: ${quest.name}`);
        quest.dialogue.forEach(line => player.showMessage(line));
    }
}
