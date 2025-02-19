import { supabase } from '../authentication/supabase-client.js';
import { authService } from '../authentication/auth-service.js';

export class BaseService {
    constructor(tableName) {
        this.tableName = tableName;
    }

    async requireTeacherAuth() {
        return await authService.requireTeacherAuth();
    }

    async getAll() {
        if (!await this.requireTeacherAuth()) return [];
        
        try {
            const { data, error } = await supabase
                .from(this.tableName)
                .select('*');
            
            if (error) throw error;
            return data;
        } catch (error) {
            console.error(`Error getting ${this.tableName}:`, error);
            throw error;
        }
    }

    async getById(id) {
        if (!await this.requireTeacherAuth()) return null;

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
        if (!await this.requireTeacherAuth()) return null;

        try {
            const { data: { user } } = await supabase.auth.getUser();
            const { data: result, error } = await supabase
                .from(this.tableName)
                .insert([{
                    ...data,
                    created_at: new Date().toISOString(),
                    created_by: user.id
                }])
                .select()
                .single();
            
            if (error) throw error;
            return result.id;
        } catch (error) {
            console.error(`Error creating ${this.tableName}:`, error);
            throw error;
        }
    }

    async update(id, data) {
        if (!await this.requireTeacherAuth()) return false;

        try {
            const { data: { user } } = await supabase.auth.getUser();
            const { error } = await supabase
                .from(this.tableName)
                .update({
                    ...data,
                    updated_at: new Date().toISOString(),
                    updated_by: user.id
                })
                .eq('id', id);
            
            if (error) throw error;
            return true;
        } catch (error) {
            console.error(`Error updating ${this.tableName}:`, error);
            throw error;
        }
    }

    async delete(id) {
        if (!await this.requireTeacherAuth()) return false;

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

    async getByTeacher(teacherId) {
        if (!await this.requireTeacherAuth()) return [];

        try {
            const { data, error } = await supabase
                .from(this.tableName)
                .select('*')
                .eq('created_by', teacherId);
            
            if (error) throw error;
            return data;
        } catch (error) {
            console.error(`Error getting ${this.tableName} by teacher:`, error);
            throw error;
        }
    }
} 