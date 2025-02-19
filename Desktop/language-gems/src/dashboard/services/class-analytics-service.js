import { supabase } from '../authentication/supabase-client';

export const classAnalyticsService = {
    async getClassAnalytics(classId) {
        try {
            const { data, error } = await supabase
                .from('class_analytics')
                .select('*')
                .eq('class_id', classId)
                .order('created_at', { ascending: false });
            
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error fetching class analytics:', error);
            throw error;
        }
    },

    async addAnalyticsEvent(event) {
        try {
            const { data, error } = await supabase
                .from('class_analytics')
                .insert(event)
                .select();
            
            if (error) throw error;
            return data[0];
        } catch (error) {
            console.error('Error adding analytics event:', error);
            throw error;
        }
    },

    async getStudentAnalytics(studentId, classId) {
        try {
            const { data, error } = await supabase
                .from('class_analytics')
                .select('*')
                .eq('student_id', studentId)
                .eq('class_id', classId)
                .order('created_at', { ascending: false });
            
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error fetching student analytics:', error);
            throw error;
        }
    },

    async getClassPerformance(classId) {
        try {
            const { data, error } = await supabase
                .from('class_analytics')
                .select(`
                    *,
                    students:profiles!inner(*),
                    assignments(*)
                `)
                .eq('class_id', classId)
                .order('created_at', { ascending: false });
            
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error fetching class performance:', error);
            throw error;
        }
    }
}; 