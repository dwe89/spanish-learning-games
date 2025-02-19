import { supabase } from '../authentication/supabase-client';

export const analyticsService = {
    async trackEvent(event) {
        try {
            const { data, error } = await supabase
                .from('analytics_events')
                .insert({
                    ...event,
                    timestamp: new Date().toISOString()
                })
                .select();
            
            if (error) throw error;
            return data[0];
        } catch (error) {
            console.error('Error tracking event:', error);
            throw error;
        }
    },

    async getStudentProgress(studentId) {
        try {
            const { data, error } = await supabase
                .from('analytics_events')
                .select('*')
                .eq('user_id', studentId)
                .order('timestamp', { ascending: false });
            
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error fetching student progress:', error);
            throw error;
        }
    },

    async getClassProgress(classId) {
        try {
            const { data, error } = await supabase
                .from('analytics_events')
                .select(`
                    *,
                    users!inner(*)
                `)
                .eq('class_id', classId)
                .order('timestamp', { ascending: false });
            
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error fetching class progress:', error);
            throw error;
        }
    },

    async getActivitySummary(userId, startDate, endDate) {
        try {
            const { data, error } = await supabase
                .from('analytics_events')
                .select('*')
                .eq('user_id', userId)
                .gte('timestamp', startDate)
                .lte('timestamp', endDate)
                .order('timestamp', { ascending: true });
            
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error fetching activity summary:', error);
            throw error;
        }
    }
}; 