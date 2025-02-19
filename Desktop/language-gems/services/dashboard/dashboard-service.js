import { BaseService } from './base-service.js';
import { supabase } from '../authentication/supabase-client.js';
import { authService } from './auth-service.js';

class DashboardService extends BaseService {
    constructor() {
        super('dashboard');
    }

    async getDashboardData() {
        if (!await this.requireTeacherAuth()) return null;

        try {
            const user = await authService.getCurrentUser();
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            // Get active classes
            const { data: classes, error: classesError } = await supabase
                .from('classes')
                .select('*')
                .eq('teacherId', user.id)
                .eq('archived', false);

            if (classesError) throw classesError;

            // Get recent assignments
            const { data: assignments, error: assignmentsError } = await supabase
                .from('assignments')
                .select('*')
                .eq('teacherId', user.id)
                .eq('archived', false)
                .order('dueDate', { ascending: true })
                .limit(5);

            if (assignmentsError) throw assignmentsError;

            // Get recent announcements
            const { data: announcements, error: announcementsError } = await supabase
                .from('announcements')
                .select('*')
                .eq('teacherId', user.id)
                .eq('archived', false)
                .order('createdAt', { ascending: false })
                .limit(5);

            if (announcementsError) throw announcementsError;

            // Get student progress
            const { data: progress, error: progressError } = await supabase
                .from('progress')
                .select('*')
                .in('classId', classes.map(c => c.id))
                .gte('date', today.toISOString())
                .order('date', { ascending: true });

            if (progressError) throw progressError;

            // Get attendance records
            const { data: attendance, error: attendanceError } = await supabase
                .from('attendance')
                .select('*')
                .in('classId', classes.map(c => c.id))
                .gte('date', today.toISOString())
                .order('date', { ascending: true });

            if (attendanceError) throw attendanceError;

            return {
                classes,
                recentAssignments: assignments,
                recentAnnouncements: announcements,
                studentProgress: progress,
                attendance
            };
        } catch (error) {
            console.error('Error getting dashboard data:', error);
            return null;
        }
    }

    async getUpcomingEvents() {
        const user = await authService.getCurrentUser();
        if (!user) return [];

        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            // Get upcoming assignments
            const { data: assignments, error: assignmentsError } = await supabase
                .from('assignments')
                .select('*')
                .eq('archived', false)
                .gte('dueDate', today.toISOString())
                .order('dueDate', { ascending: true })
                .limit(5);

            if (assignmentsError) throw assignmentsError;

            // Get upcoming classes
            const { data: classes, error: classesError } = await supabase
                .from('classes')
                .select('*')
                .eq('archived', false)
                .gte('nextSession', today.toISOString())
                .order('nextSession', { ascending: true })
                .limit(5);

            if (classesError) throw classesError;

            // Combine and sort events
            const events = [
                ...assignments.map(a => ({
                    type: 'assignment',
                    date: new Date(a.dueDate),
                    title: a.title,
                    description: a.description,
                    id: a.id
                })),
                ...classes.map(c => ({
                    type: 'class',
                    date: new Date(c.nextSession),
                    title: c.name,
                    description: c.description,
                    id: c.id
                }))
            ].sort((a, b) => a.date - b.date);

            return events;
        } catch (error) {
            console.error('Error getting upcoming events:', error);
            return [];
        }
    }
}

export const dashboardService = new DashboardService(); 