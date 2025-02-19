import { BaseService, supabase } from '../core/base-service.js';
import { authService } from '../auth/auth-service.js';

class GameService extends BaseService {
    constructor() {
        super('game_progress');
    }

    async saveGameProgress(gameType, score, timeSpent, metadata = {}) {
        const user = await authService.getCurrentUser();
        if (!user) throw new Error('User must be authenticated');

        try {
            const { data, error } = await supabase
                .from('game_progress')
                .insert([{
                    user_id: user.id,
                    game_type: gameType,
                    score,
                    time_spent: timeSpent,
                    metadata,
                    completed_at: new Date().toISOString()
                }])
                .select()
                .single();

            if (error) throw error;

            // Check for achievements
            await this.checkGameAchievements(gameType, score, timeSpent);
            
            return data;
        } catch (error) {
            console.error('Error saving game progress:', error);
            throw error;
        }
    }

    async getGameHistory(gameType = null) {
        const user = await authService.getCurrentUser();
        if (!user) throw new Error('User must be authenticated');

        try {
            let query = supabase
                .from('game_progress')
                .select(`
                    *,
                    users:user_id (
                        username,
                        avatar_url
                    )
                `)
                .eq('user_id', user.id)
                .order('completed_at', { ascending: false });

            if (gameType) {
                query = query.eq('game_type', gameType);
            }

            const { data, error } = await query.limit(10);
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error getting game history:', error);
            throw error;
        }
    }

    async getLeaderboard(gameType, timeFrame = 'all') {
        try {
            let query = supabase
                .from('game_progress')
                .select(`
                    *,
                    users:user_id (
                        username,
                        avatar_url
                    )
                `)
                .eq('game_type', gameType)
                .order('score', { ascending: false });

            if (timeFrame === 'today') {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                query = query.gte('completed_at', today.toISOString());
            } else if (timeFrame === 'week') {
                const weekAgo = new Date();
                weekAgo.setDate(weekAgo.getDate() - 7);
                query = query.gte('completed_at', weekAgo.toISOString());
            } else if (timeFrame === 'month') {
                const monthAgo = new Date();
                monthAgo.setMonth(monthAgo.getMonth() - 1);
                query = query.gte('completed_at', monthAgo.toISOString());
            }

            const { data, error } = await query.limit(10);
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error getting leaderboard:', error);
            throw error;
        }
    }

    async getUserStats(gameType = null) {
        const user = await authService.getCurrentUser();
        if (!user) throw new Error('User must be authenticated');

        try {
            let query = supabase
                .from('game_progress')
                .select(`
                    game_type,
                    count(*),
                    avg(score) as average_score,
                    max(score) as high_score,
                    sum(time_spent) as total_time
                `)
                .eq('user_id', user.id);

            if (gameType) {
                query = query.eq('game_type', gameType);
            } else {
                query = query.groupBy('game_type');
            }

            const { data, error } = await query;
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error getting user stats:', error);
            throw error;
        }
    }

    async checkGameAchievements(gameType, score, timeSpent) {
        const user = await authService.getCurrentUser();
        if (!user) return;

        try {
            // Get user's game history for achievement checks
            const { data: gameHistory } = await supabase
                .from('game_progress')
                .select('*')
                .eq('user_id', user.id)
                .eq('game_type', gameType);

            const achievements = [];

            // Check for high score achievement
            const isHighScore = gameHistory.every(game => game.score <= score);
            if (isHighScore) {
                achievements.push({
                    user_id: user.id,
                    achievement_type: 'high_score',
                    game_type: gameType,
                    metadata: { score }
                });
            }

            // Check for game completion achievements
            const gamesCompleted = gameHistory.length + 1;
            if (gamesCompleted === 1) {
                achievements.push({
                    user_id: user.id,
                    achievement_type: 'first_game',
                    game_type: gameType
                });
            } else if (gamesCompleted === 10) {
                achievements.push({
                    user_id: user.id,
                    achievement_type: 'ten_games',
                    game_type: gameType
                });
            }

            // Save new achievements
            if (achievements.length > 0) {
                const { error } = await supabase
                    .from('achievements')
                    .insert(achievements);

                if (error) throw error;

                // Broadcast achievement notifications
                achievements.forEach(achievement => {
                    window.dispatchEvent(new CustomEvent('achievementUnlocked', {
                        detail: achievement
                    }));
                });
            }
        } catch (error) {
            console.error('Error checking achievements:', error);
            // Don't throw here to prevent interrupting game flow
        }
    }
}

export const gameService = new GameService(); 