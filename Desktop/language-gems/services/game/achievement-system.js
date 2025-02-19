import { BaseService } from '../core/base-service.js';
import { authService } from '../auth/auth-service.js';
import { ACHIEVEMENTS } from './achievements-data.js';

class AchievementSystem extends BaseService {
    constructor() {
        super('achievements');
        this.achievementDefinitions = ACHIEVEMENTS;
    }

    async initialize() {
        const user = await authService.getCurrentUser();
        if (!user) throw new Error('User must be authenticated');

        try {
            // Load user's achievements
            const { data: achievements, error } = await this.supabase
                .from(this.tableName)
                .select('*')
                .eq('user_id', user.id);

            if (error) throw error;
            
            // Store unlocked achievements
            this.unlockedAchievements = new Set(
                achievements.map(a => a.achievement_id)
            );

            return achievements;
        } catch (error) {
            console.error('Error initializing achievements:', error);
            throw error;
        }
    }

    async checkAndAwardAchievements(context) {
        const user = await authService.getCurrentUser();
        if (!user) return;

        const newAchievements = [];

        // Check each achievement category
        for (const [category, achievements] of Object.entries(this.achievementDefinitions)) {
            for (const achievement of achievements) {
                if (this.unlockedAchievements.has(achievement.id)) continue;

                if (await this.checkAchievementCondition(achievement, context)) {
                    newAchievements.push({
                        user_id: user.id,
                        achievement_id: achievement.id,
                        category,
                        title: achievement.title,
                        description: achievement.description,
                        icon: achievement.icon,
                        xp: achievement.xp,
                        unlocked_at: new Date().toISOString()
                    });
                }
            }
        }

        if (newAchievements.length > 0) {
            try {
                // Save new achievements
                const { data, error } = await this.supabase
                    .from(this.tableName)
                    .insert(newAchievements)
                    .select();

                if (error) throw error;

                // Update local set of unlocked achievements
                newAchievements.forEach(achievement => {
                    this.unlockedAchievements.add(achievement.achievement_id);
                });

                // Broadcast achievement notifications
                newAchievements.forEach(achievement => {
                    this.broadcastAchievement(achievement);
                });

                return data;
            } catch (error) {
                console.error('Error saving achievements:', error);
                throw error;
            }
        }

        return [];
    }

    async checkAchievementCondition(achievement, context) {
        const user = await authService.getCurrentUser();
        if (!user) return false;

        try {
            switch (achievement.id) {
                case 'first_game':
                    return await this.checkFirstGame(context.gameType);
                
                case 'game_master':
                    return await this.checkGameMaster(context.gameType);
                
                case 'perfect_score':
                    return context.score === 100;
                
                case 'speed_demon':
                    return context.timeSpent < achievement.timeLimit;
                
                case 'daily_streak':
                    return await this.checkDailyStreak(achievement.days);
                
                case 'vocabulary_master':
                    return await this.checkVocabularyProgress(achievement.wordsLearned);
                
                default:
                    return false;
            }
        } catch (error) {
            console.error('Error checking achievement condition:', error);
            return false;
        }
    }

    async checkFirstGame(gameType) {
        const { data } = await this.supabase
            .from('game_progress')
            .select('count')
            .eq('user_id', await this.getUserId())
            .eq('game_type', gameType)
            .single();

        return data?.count === 0;
    }

    async checkGameMaster(gameType) {
        const { data } = await this.supabase
            .from('game_progress')
            .select('score')
            .eq('user_id', await this.getUserId())
            .eq('game_type', gameType)
            .gte('score', 90)
            .order('completed_at', { ascending: false })
            .limit(10);

        return data?.length >= 10;
    }

    async checkDailyStreak(requiredDays) {
        const { data: progress } = await this.supabase
            .from('user_progress')
            .select('streak_days')
            .eq('user_id', await this.getUserId())
            .single();

        return progress?.streak_days >= requiredDays;
    }

    async checkVocabularyProgress(requiredWords) {
        const { data: progress } = await this.supabase
            .from('vocabulary_progress')
            .select('words_learned')
            .eq('user_id', await this.getUserId())
            .single();

        return progress?.words_learned >= requiredWords;
    }

    broadcastAchievement(achievement) {
        window.dispatchEvent(new CustomEvent('achievementUnlocked', {
            detail: {
                title: achievement.title,
                description: achievement.description,
                icon: achievement.icon,
                xp: achievement.xp
            }
        }));
    }

    async getUserId() {
        const user = await authService.getCurrentUser();
        if (!user) throw new Error('User must be authenticated');
        return user.id;
    }

    async getProgress() {
        try {
            const { data, error } = await this.supabase
                .from(this.tableName)
                .select(`
                    category,
                    count(*),
                    sum(xp) as total_xp
                `)
                .eq('user_id', await this.getUserId())
                .groupBy('category');

            if (error) throw error;

            const totalAchievements = Object.values(this.achievementDefinitions)
                .reduce((sum, achievements) => sum + achievements.length, 0);

            return {
                unlockedCount: this.unlockedAchievements.size,
                totalCount: totalAchievements,
                totalXP: data.reduce((sum, cat) => sum + cat.total_xp, 0),
                categoryProgress: data.reduce((acc, cat) => {
                    acc[cat.category] = {
                        count: cat.count,
                        total: this.achievementDefinitions[cat.category]?.length || 0,
                        xp: cat.total_xp
                    };
                    return acc;
                }, {})
            };
        } catch (error) {
            console.error('Error getting achievement progress:', error);
            throw error;
        }
    }
}

export const achievementSystem = new AchievementSystem(); 