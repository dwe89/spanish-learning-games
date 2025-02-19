class DatabaseService {
    constructor(db) {
        this.db = db;
    }

    // User Progress Methods
    async getUserProgress(userId) {
        return await this.db
            .prepare('SELECT * FROM user_progress WHERE user_id = ?')
            .bind(userId)
            .first();
    }

    async updateUserXP(userId, xpToAdd) {
        const user = await this.getUserProgress(userId);
        if (!user) {
            // Create new user progress entry
            return await this.db
                .prepare('INSERT INTO user_progress (user_id, xp) VALUES (?, ?)')
                .bind(userId, xpToAdd)
                .run();
        }

        // Update existing user progress
        return await this.db
            .prepare('UPDATE user_progress SET xp = xp + ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?')
            .bind(xpToAdd, userId)
            .run();
    }

    async updateUserStreak(userId) {
        const user = await this.getUserProgress(userId);
        if (!user) {
            return await this.db
                .prepare('INSERT INTO user_progress (user_id, streak_days, last_login) VALUES (?, 1, CURRENT_DATE)')
                .bind(userId)
                .run();
        }

        // Check if last login was yesterday
        const lastLogin = new Date(user.last_login);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        const streakDays = lastLogin.toDateString() === yesterday.toDateString() 
            ? user.streak_days + 1 
            : 1;

        return await this.db
            .prepare('UPDATE user_progress SET streak_days = ?, last_login = CURRENT_DATE, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?')
            .bind(streakDays, userId)
            .run();
    }

    // Custom Games Methods
    async createCustomGame(userId, title, gameType, content) {
        const id = crypto.randomUUID();
        return await this.db
            .prepare('INSERT INTO custom_games (id, user_id, title, game_type, content) VALUES (?, ?, ?, ?, ?)')
            .bind(id, userId, title, gameType, JSON.stringify(content))
            .run();
    }

    async getUserCustomGames(userId) {
        return await this.db
            .prepare('SELECT * FROM custom_games WHERE user_id = ? ORDER BY created_at DESC')
            .bind(userId)
            .all();
    }

    async getPublicCustomGames() {
        return await this.db
            .prepare('SELECT * FROM custom_games WHERE is_public = TRUE ORDER BY created_at DESC')
            .all();
    }

    async updateCustomGame(gameId, userId, updates) {
        const setStatements = [];
        const bindValues = [];
        
        if (updates.title) {
            setStatements.push('title = ?');
            bindValues.push(updates.title);
        }
        if (updates.content) {
            setStatements.push('content = ?');
            bindValues.push(JSON.stringify(updates.content));
        }
        if (typeof updates.is_public !== 'undefined') {
            setStatements.push('is_public = ?');
            bindValues.push(updates.is_public);
        }
        
        setStatements.push('updated_at = CURRENT_TIMESTAMP');
        bindValues.push(gameId, userId);

        return await this.db
            .prepare(`UPDATE custom_games SET ${setStatements.join(', ')} WHERE id = ? AND user_id = ?`)
            .bind(...bindValues)
            .run();
    }

    // Game History Methods
    async addGameHistory(userId, gameType, score, timeSpent) {
        const id = crypto.randomUUID();
        return await this.db
            .prepare('INSERT INTO game_history (id, user_id, game_type, score, time_spent) VALUES (?, ?, ?, ?, ?)')
            .bind(id, userId, gameType, score, timeSpent)
            .run();
    }

    async getUserGameHistory(userId, limit = 10) {
        return await this.db
            .prepare('SELECT * FROM game_history WHERE user_id = ? ORDER BY completed_at DESC LIMIT ?')
            .bind(userId, limit)
            .all();
    }

    async getLeaderboard(gameType, limit = 10) {
        return await this.db
            .prepare(`
                SELECT 
                    user_id,
                    MAX(score) as best_score,
                    COUNT(*) as games_played,
                    AVG(score) as average_score
                FROM game_history 
                WHERE game_type = ?
                GROUP BY user_id
                ORDER BY best_score DESC
                LIMIT ?
            `)
            .bind(gameType, limit)
            .all();
    }
}

// Export the service
export default DatabaseService; 