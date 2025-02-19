const ACHIEVEMENTS = {
    // Study Time Achievements
    studyTime: [
        {
            id: 'first_hour',
            title: 'First Steps',
            description: 'Study for your first hour',
            icon: 'fa-clock',
            xp: 50
        },
        {
            id: 'study_marathon',
            title: 'Study Marathon',
            description: 'Study for 10 hours total',
            icon: 'fa-award',
            xp: 200
        },
        {
            id: 'dedication',
            title: 'Dedicated Learner',
            description: 'Study for 50 hours total',
            icon: 'fa-star',
            xp: 500
        }
    ],

    // Streak Achievements
    streaks: [
        {
            id: 'first_streak',
            title: 'Consistency is Key',
            description: 'Maintain a 3-day study streak',
            icon: 'fa-fire',
            xp: 100
        },
        {
            id: 'weekly_warrior',
            title: 'Weekly Warrior',
            description: 'Maintain a 7-day study streak',
            icon: 'fa-fire-flame-curved',
            xp: 250
        },
        {
            id: 'monthly_master',
            title: 'Monthly Master',
            description: 'Maintain a 30-day study streak',
            icon: 'fa-crown',
            xp: 1000
        }
    ],

    // Vocabulary Achievements
    vocabulary: [
        {
            id: 'word_collector',
            title: 'Word Collector',
            description: 'Learn your first 50 words',
            icon: 'fa-book',
            xp: 150
        },
        {
            id: 'vocabulary_virtuoso',
            title: 'Vocabulary Virtuoso',
            description: 'Master 200 words',
            icon: 'fa-graduation-cap',
            xp: 400
        },
        {
            id: 'perfect_recall',
            title: 'Perfect Recall',
            description: 'Get 100% on a vocabulary quiz',
            icon: 'fa-check-double',
            xp: 300
        }
    ],

    // Quiz Achievements
    quizzes: [
        {
            id: 'quiz_ace',
            title: 'Quiz Ace',
            description: 'Score 100% on any quiz',
            icon: 'fa-trophy',
            xp: 200
        },
        {
            id: 'quiz_master',
            title: 'Quiz Master',
            description: 'Complete 10 quizzes with 90%+ score',
            icon: 'fa-medal',
            xp: 500
        }
    ],

    // Social Achievements
    social: [
        {
            id: 'helpful_peer',
            title: 'Helpful Peer',
            description: 'Help 5 classmates in the community forum',
            icon: 'fa-hands-helping',
            xp: 300
        },
        {
            id: 'conversation_starter',
            title: 'Conversation Starter',
            description: 'Start 3 discussions in the community',
            icon: 'fa-comments',
            xp: 200
        }
    ],

    // Game Achievements
    games: [
        {
            id: 'game_enthusiast',
            title: 'Game Enthusiast',
            description: 'Play all available language games',
            icon: 'fa-gamepad',
            xp: 150
        },
        {
            id: 'high_scorer',
            title: 'High Scorer',
            description: 'Get a high score in any game',
            icon: 'fa-ranking-star',
            xp: 250
        }
    ],

    // Assignment Achievements
    assignments: [
        {
            id: 'assignment_ace',
            title: 'Assignment Ace',
            description: 'Complete 5 assignments with perfect scores',
            icon: 'fa-clipboard-check',
            xp: 400
        },
        {
            id: 'early_bird',
            title: 'Early Bird',
            description: 'Submit 3 assignments early',
            icon: 'fa-clock-rotate-left',
            xp: 200
        }
    ],

    // Skill Achievements
    skills: [
        {
            id: 'grammar_guru',
            title: 'Grammar Guru',
            description: 'Score 90%+ on 5 grammar exercises',
            icon: 'fa-pen-fancy',
            xp: 300
        },
        {
            id: 'pronunciation_pro',
            title: 'Pronunciation Pro',
            description: 'Complete 10 speaking exercises with high accuracy',
            icon: 'fa-microphone',
            xp: 350
        },
        {
            id: 'listening_legend',
            title: 'Listening Legend',
            description: 'Complete 10 listening exercises with 90%+ accuracy',
            icon: 'fa-headphones',
            xp: 350
        }
    ],

    // Special Achievements
    special: [
        {
            id: 'first_milestone',
            title: 'First Milestone',
            description: 'Reach level 10 in your language journey',
            icon: 'fa-flag-checkered',
            xp: 500
        },
        {
            id: 'perfect_month',
            title: 'Perfect Month',
            description: 'Complete all daily goals for an entire month',
            icon: 'fa-calendar-check',
            xp: 1000
        }
    ]
};

// Achievement trigger conditions and checks
const achievementChecks = {
    checkStudyTime: (totalMinutes) => {
        const hours = totalMinutes / 60;
        return ACHIEVEMENTS.studyTime.filter(achievement => {
            switch(achievement.id) {
                case 'first_hour': return hours >= 1;
                case 'study_marathon': return hours >= 10;
                case 'dedication': return hours >= 50;
                default: return false;
            }
        });
    },

    checkStreak: (days) => {
        return ACHIEVEMENTS.streaks.filter(achievement => {
            switch(achievement.id) {
                case 'first_streak': return days >= 3;
                case 'weekly_warrior': return days >= 7;
                case 'monthly_master': return days >= 30;
                default: return false;
            }
        });
    },

    checkVocabulary: (wordsLearned, quizScore) => {
        return ACHIEVEMENTS.vocabulary.filter(achievement => {
            switch(achievement.id) {
                case 'word_collector': return wordsLearned >= 50;
                case 'vocabulary_virtuoso': return wordsLearned >= 200;
                case 'perfect_recall': return quizScore === 100;
                default: return false;
            }
        });
    }
};

export { ACHIEVEMENTS, achievementChecks }; 