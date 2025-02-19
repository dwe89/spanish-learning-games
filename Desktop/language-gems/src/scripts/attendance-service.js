import { BaseService } from './base-service.js';
import { supabase } from '../authentication/supabase-client.js';

class AttendanceService extends BaseService {
    constructor() {
        super('attendance');
    }

    async createAttendanceRecord(classId, date, presentStudentIds, notes = '') {
        if (!await this.requireTeacherAuth()) return null;

        try {
            // Check if record already exists
            const { data: existingRecord } = await supabase
                .from(this.tableName)
                .select('*')
                .eq('class_id', classId)
                .eq('date', date)
                .single();

            if (existingRecord) {
                throw new Error('Attendance record already exists for this date');
            }

            // Get class details to validate student IDs
            const { data: classData, error: classError } = await supabase
                .from('classes')
                .select('student_ids')
                .eq('id', classId)
                .single();

            if (classError || !classData) {
                throw new Error('Class not found');
            }

            const validStudentIds = classData.student_ids || [];

            // Validate that all present students are in the class
            const invalidStudents = presentStudentIds.filter(id => !validStudentIds.includes(id));
            if (invalidStudents.length > 0) {
                throw new Error('Some students are not enrolled in this class');
            }

            const { data: { user } } = await supabase.auth.getUser();
            const { data: result, error } = await supabase
                .from(this.tableName)
                .insert([{
                    class_id: classId,
                    date,
                    present: presentStudentIds,
                    absent: validStudentIds.filter(id => !presentStudentIds.includes(id)),
                    notes,
                    created_at: new Date().toISOString(),
                    created_by: user.id
                }])
                .select()
                .single();

            if (error) throw error;
            return result.id;
        } catch (error) {
            console.error('Error creating attendance record:', error);
            throw error;
        }
    }

    async updateAttendanceRecord(recordId, presentStudentIds, notes = '') {
        if (!await this.requireTeacherAuth()) return null;

        try {
            const { data: record } = await supabase
                .from(this.tableName)
                .select('class_id')
                .eq('id', recordId)
                .single();

            if (!record) {
                throw new Error('Attendance record not found');
            }

            // Get class details to validate student IDs
            const { data: classData, error: classError } = await supabase
                .from('classes')
                .select('student_ids')
                .eq('id', record.class_id)
                .single();

            if (classError || !classData) {
                throw new Error('Class not found');
            }

            const validStudentIds = classData.student_ids || [];

            // Validate that all present students are in the class
            const invalidStudents = presentStudentIds.filter(id => !validStudentIds.includes(id));
            if (invalidStudents.length > 0) {
                throw new Error('Some students are not enrolled in this class');
            }

            const { data: { user } } = await supabase.auth.getUser();
            const { error } = await supabase
                .from(this.tableName)
                .update({
                    present: presentStudentIds,
                    absent: validStudentIds.filter(id => !presentStudentIds.includes(id)),
                    notes,
                    updated_at: new Date().toISOString(),
                    updated_by: user.id
                })
                .eq('id', recordId);

            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Error updating attendance record:', error);
            throw error;
        }
    }

    async getClassAttendance(classId, startDate = null, endDate = null) {
        if (!await this.requireTeacherAuth()) return [];

        try {
            let query = supabase
                .from(this.tableName)
                .select('*')
                .eq('class_id', classId)
                .order('date', { ascending: false });

            if (startDate) {
                query = query.gte('date', startDate);
            }
            if (endDate) {
                query = query.lte('date', endDate);
            }

            const { data, error } = await query;
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error getting class attendance:', error);
            throw error;
        }
    }

    async getStudentAttendance(studentId, classId = null) {
        if (!await this.requireTeacherAuth()) return [];

        try {
            if (classId) {
                // Get attendance for specific class
                const { data, error } = await supabase
                    .from(this.tableName)
                    .select('*')
                    .eq('class_id', classId)
                    .order('date', { ascending: false });

                if (error) throw error;
                return data.map(record => ({
                    ...record,
                    status: record.present.includes(studentId) ? 'present' : 'absent'
                }));
            } else {
                // Get attendance for all classes
                const { data: classes, error: classError } = await supabase
                    .from('classes')
                    .select('id')
                    .contains('student_ids', [studentId]);

                if (classError) throw classError;
                const classIds = classes.map(c => c.id);

                const { data, error } = await supabase
                    .from(this.tableName)
                    .select('*')
                    .in('class_id', classIds)
                    .order('date', { ascending: false });

                if (error) throw error;
                return data.map(record => ({
                    ...record,
                    status: record.present.includes(studentId) ? 'present' : 'absent'
                }));
            }
        } catch (error) {
            console.error('Error getting student attendance:', error);
            throw error;
        }
    }

    async getAttendanceStats(classId, startDate = null, endDate = null) {
        if (!await this.requireTeacherAuth()) return null;

        try {
            const records = await this.getClassAttendance(classId, startDate, endDate);
            
            // Get class details for total student count
            const { data: classData, error: classError } = await supabase
                .from('classes')
                .select('student_ids')
                .eq('id', classId)
                .single();

            if (classError || !classData) {
                throw new Error('Class not found');
            }

            const totalStudents = classData.student_ids?.length || 0;

            const stats = {
                totalSessions: records.length,
                averageAttendance: 0,
                byStudent: {},
                byDate: {}
            };

            let totalPresent = 0;

            records.forEach(record => {
                const presentCount = record.present?.length || 0;
                totalPresent += presentCount;

                // Track attendance by date
                stats.byDate[record.date] = {
                    present: presentCount,
                    absent: totalStudents - presentCount,
                    rate: (presentCount / totalStudents) * 100
                };

                // Track attendance by student
                record.present?.forEach(studentId => {
                    stats.byStudent[studentId] = (stats.byStudent[studentId] || 0) + 1;
                });
            });

            // Calculate average attendance rate
            if (records.length > 0) {
                stats.averageAttendance = (totalPresent / (records.length * totalStudents)) * 100;
            }

            // Convert student attendance to percentage
            Object.keys(stats.byStudent).forEach(studentId => {
                stats.byStudent[studentId] = (stats.byStudent[studentId] / records.length) * 100;
            });

            return stats;
        } catch (error) {
            console.error('Error getting attendance stats:', error);
            throw error;
        }
    }
}

export const attendanceService = new AttendanceService(); 