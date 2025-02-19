import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);

export class BaseService {
    constructor(tableName) {
        this.tableName = tableName;
    }

    async getAll(query = {}) {
        try {
            let queryBuilder = supabase
                .from(this.tableName)
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
            console.error(`Error getting ${this.tableName}:`, error);
            throw error;
        }
    }

    async getById(id) {
        try {
            const { data, error } = await supabase
                .from(this.tableName)
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error(`Error getting ${this.tableName} by id:`, error);
            throw error;
        }
    }

    async create(data) {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            const { data: result, error } = await supabase
                .from(this.tableName)
                .insert([{
                    ...data,
                    created_at: new Date().toISOString(),
                    created_by: user?.id
                }])
                .select()
                .single();

            if (error) throw error;
            return result;
        } catch (error) {
            console.error(`Error creating ${this.tableName}:`, error);
            throw error;
        }
    }

    async update(id, data) {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            const { data: result, error } = await supabase
                .from(this.tableName)
                .update({
                    ...data,
                    updated_at: new Date().toISOString(),
                    updated_by: user?.id
                })
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return result;
        } catch (error) {
            console.error(`Error updating ${this.tableName}:`, error);
            throw error;
        }
    }

    async delete(id) {
        try {
            const { error } = await supabase
                .from(this.tableName)
                .delete()
                .eq('id', id);

            if (error) throw error;
            return true;
        } catch (error) {
            console.error(`Error deleting ${this.tableName}:`, error);
            throw error;
        }
    }
} 