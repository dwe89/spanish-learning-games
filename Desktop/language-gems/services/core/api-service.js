// API Service for Language Gems

import { supabase } from './base-service.js';

export class APIService {
    static async get(table, query = {}) {
        try {
            let queryBuilder = supabase
                .from(table)
                .select(query.select || '*');

            if (query.where) {
                Object.entries(query.where).forEach(([field, value]) => {
                    queryBuilder = queryBuilder.eq(field, value);
                });
            }

            if (query.orderBy) {
                queryBuilder = queryBuilder.order(query.orderBy.field, {
                    ascending: query.orderBy.direction === 'asc'
                });
            }

            if (query.limit) {
                queryBuilder = queryBuilder.limit(query.limit);
            }

            const { data, error } = await queryBuilder;
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('API Get Error:', error);
            throw error;
        }
    }

    static async post(table, data) {
        try {
            const { data: result, error } = await supabase
                .from(table)
                .insert([data])
                .select()
                .single();

            if (error) throw error;
            return result;
        } catch (error) {
            console.error('API Post Error:', error);
            throw error;
        }
    }

    static async update(table, id, data) {
        try {
            const { data: result, error } = await supabase
                .from(table)
                .update(data)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return result;
        } catch (error) {
            console.error('API Update Error:', error);
            throw error;
        }
    }

    static async delete(table, id) {
        try {
            const { error } = await supabase
                .from(table)
                .delete()
                .eq('id', id);

            if (error) throw error;
            return true;
        } catch (error) {
            console.error('API Delete Error:', error);
            throw error;
        }
    }

    // Assignments related methods
    static async getAssignments(filters = {}) {
        return await this.get('assignments', filters);
    }

    static async submitAssignment(assignmentId, data) {
        return await this.post('assignment_submissions', {
            assignment_id: assignmentId,
            ...data
        });
    }

    static async updateAssignmentStatus(assignmentId, status) {
        return await this.update('assignments', assignmentId, { status });
    }

    // Achievement related methods
    static async getAchievements(userId) {
        return await this.get('achievements', {
            where: { user_id: userId },
            orderBy: { field: 'created_at', direction: 'desc' }
        });
    }

    static async unlockAchievement(userId, achievementData) {
        return await this.post('achievements', {
            user_id: userId,
            ...achievementData,
            unlocked_at: new Date().toISOString()
        });
    }

    // Game progress methods
    static async saveGameProgress(userId, gameData) {
        return await this.post('game_progress', {
            user_id: userId,
            ...gameData,
            completed_at: new Date().toISOString()
        });
    }

    static async getGameHistory(userId, gameType = null) {
        const query = {
            where: { user_id: userId },
            orderBy: { field: 'completed_at', direction: 'desc' },
            limit: 10
        };

        if (gameType) {
            query.where.game_type = gameType;
        }

        return await this.get('game_progress', query);
    }
}