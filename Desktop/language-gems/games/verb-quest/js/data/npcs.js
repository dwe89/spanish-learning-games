export const NPCs = {
    forest_of_beginnings: [
        {
            id: 'elder_sage',
            name: 'Elder Sage',
            role: 'MENTOR',
            position: { x: 30, y: 40 },
            sprite: 'assets/npcs/elder_sage.png',
            dialogs: {
                greeting: {
                    text: "Welcome, young conjugator. I am the Elder Sage, guardian of the present tense.",
                    choices: [
                        { text: "Teach me about verbs", next: "lesson_1" },
                        { text: "What happened to the forest?", next: "story_1" },
                        { text: "Goodbye", next: null }
                    ]
                },
                lesson_1: {
                    text: "The present tense is the foundation of all conjugation. Let me teach you about regular verbs...",
                    choices: [
                        { text: "Tell me more", next: "lesson_2" },
                        { text: "I'm ready to practice", next: "practice_1" }
                    ]
                },
                story_1: {
                    text: "Our peaceful forest was once a sanctuary of perfect conjugation. But dark forces have corrupted the verbal harmony...",
                    choices: [
                        { text: "How can I help?", next: "quest_1" },
                        { text: "Tell me more", next: "story_2" }
                    ]
                }
            },
            quests: {
                forest_basics: {
                    title: "Forest Fundamentals",
                    description: "Master 5 regular present tense verbs",
                    reward: {
                        xp: 100,
                        items: ["basic_verb_potion"]
                    }
                }
            }
        },
        {
            id: 'forest_merchant',
            name: 'Forest Merchant',
            role: 'MERCHANT',
            position: { x: 60, y: 30 },
            sprite: 'assets/npcs/merchant.png',
            dialogs: {
                greeting: {
                    text: "¡Hola! Welcome to my humble shop. I have many items that might help you on your journey.",
                    choices: [
                        { text: "Show me your wares", next: "shop" },
                        { text: "Tell me about your items", next: "item_info" },
                        { text: "Goodbye", next: null }
                    ]
                }
            },
            inventory: [
                {
                    id: "verb_potion",
                    name: "Verb Potion",
                    price: 50,
                    description: "Shows conjugation hints during battle"
                },
                {
                    id: "time_crystal",
                    name: "Time Crystal",
                    price: 100,
                    description: "Freezes the battle timer for 10 seconds"
                }
            ]
        }
    ],
    temple_of_chaos: [
        {
            id: 'time_keeper',
            name: 'Time Keeper',
            role: 'MENTOR',
            position: { x: 45, y: 35 },
            sprite: 'assets/npcs/time_keeper.png',
            dialogs: {
                greeting: {
                    text: "The flow of time... it bends and twists here. Just like our irregular verbs.",
                    choices: [
                        { text: "Teach me about irregular verbs", next: "lesson_1" },
                        { text: "What is this place?", next: "story_1" },
                        { text: "Goodbye", next: null }
                    ]
                },
                lesson_1: {
                    text: "Irregular verbs follow their own rules, much like the chaos that flows through this temple...",
                    choices: [
                        { text: "Show me these rules", next: "lesson_2" },
                        { text: "I'm ready to practice", next: "practice_1" }
                    ]
                }
            },
            quests: {
                temple_trial: {
                    title: "Trial of Irregularity",
                    description: "Master the irregular verbs ser, estar, and ir",
                    reward: {
                        xp: 200,
                        items: ["advanced_verb_potion"]
                    }
                }
            }
        }
    ]
}; 