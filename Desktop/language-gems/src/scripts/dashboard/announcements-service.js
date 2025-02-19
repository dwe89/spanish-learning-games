import { BaseService } from './base-service.js';
import { supabase } from '../authentication/supabase-client.js';
import { authService } from './auth-service.js';

class AnnouncementsService extends BaseService {
    constructor() {
        super('announcements');
    }

    async createAnnouncement(announcementData) {
        if (!await this.requireTeacherAuth()) return null;

        try {
            const { data, error } = await supabase
                .from('announcements')
                .insert([{
                    ...announcementData,
                    createdAt: new Date().toISOString(),
                    readBy: [],
                    archived: false
                }])
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error creating announcement:', error);
            return null;
        }
    }

    async updateAnnouncement(id, announcementData) {
        if (!await this.requireTeacherAuth()) return false;

        try {
            const { error } = await supabase
                .from('announcements')
                .update(announcementData)
                .eq('id', id);

            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Error updating announcement:', error);
            return false;
        }
    }

    async getClassAnnouncements(classId) {
        try {
            const { data, error } = await supabase
                .from('announcements')
                .select('*')
                .eq('classId', classId)
                .eq('archived', false)
                .order('createdAt', { ascending: false });

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error getting class announcements:', error);
            return [];
        }
    }

    async markAsRead(announcementId) {
        const user = await authService.getCurrentUser();
        if (!user) return false;

        try {
            const { data: announcement, error: fetchError } = await supabase
                .from('announcements')
                .select('readBy')
                .eq('id', announcementId)
                .single();

            if (fetchError) throw fetchError;

            const readBy = announcement.readBy || [];
            if (!readBy.includes(user.id)) {
                const { error: updateError } = await supabase
                    .from('announcements')
                    .update({ readBy: [...readBy, user.id] })
                    .eq('id', announcementId);

                if (updateError) throw updateError;
            }
            return true;
        } catch (error) {
            console.error('Error marking announcement as read:', error);
            return false;
        }
    }

    async archiveAnnouncement(id) {
        if (!await this.requireTeacherAuth()) return false;

        try {
            const { error } = await supabase
                .from('announcements')
                .update({ archived: true })
                .eq('id', id);

            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Error archiving announcement:', error);
            return false;
        }
    }

    setupClassAnnouncementsListener(classId, callback) {
        const channel = supabase
            .channel(`class_announcements_${classId}`)
            .on('postgres_changes', 
                { 
                    event: '*', 
                    schema: 'public', 
                    table: 'announcements',
                    filter: `classId=eq.${classId}`
                }, 
                payload => {
                    this.getClassAnnouncements(classId).then(callback);
                }
            )
            .subscribe();

        return () => {
            channel.unsubscribe();
        };
    }

    async getUnreadCount(classId) {
        const user = await authService.getCurrentUser();
        if (!user) return 0;

        try {
            const { data, error } = await supabase
                .from('announcements')
                .select('*')
                .eq('classId', classId)
                .eq('archived', false)
                .not('readBy', 'cs', `{${user.id}}`);

            if (error) throw error;
            return data.length;
        } catch (error) {
            console.error('Error getting unread count:', error);
            return 0;
        }
    }

    setupUnreadCountListener(classId, callback) {
        const channel = supabase
            .channel(`unread_announcements_${classId}`)
            .on('postgres_changes', 
                { 
                    event: '*', 
                    schema: 'public', 
                    table: 'announcements',
                    filter: `classId=eq.${classId}`
                }, 
                payload => {
                    this.getUnreadCount(classId).then(callback);
                }
            )
            .subscribe();

        return () => {
            channel.unsubscribe();
        };
    }
}

export const announcementsService = new AnnouncementsService(); 