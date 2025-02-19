import { BaseService } from './base-service.js';
import { supabase } from '../authentication/supabase-client.js';
import { authService } from './auth-service.js';

class ClassesService extends BaseService {
    constructor() {
        super('classes');
    }

    async getTeacherClasses(teacherId) {
        if (!await this.requireTeacherAuth()) return [];

        try {
            const { data, error } = await supabase
                .from('classes')
                .select('*')
                .eq('teacherId', teacherId)
                .order('createdAt', { ascending: false });

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error getting teacher classes:', error);
            return [];
        }
    }

    async createClass(classData) {
        if (!await this.requireTeacherAuth()) return null;

        try {
            const { data, error } = await supabase
                .from('classes')
                .insert([{
                    ...classData,
                    createdAt: new Date().toISOString(),
                    students: [],
                    archived: false
                }])
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error creating class:', error);
            return null;
        }
    }

    async updateClass(classId, classData) {
        if (!await this.requireTeacherAuth()) return false;

        try {
            const { error } = await supabase
                .from('classes')
                .update(classData)
                .eq('id', classId);

            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Error updating class:', error);
            return false;
        }
    }

    async addStudent(classId, studentId) {
        if (!await this.requireTeacherAuth()) return false;

        try {
            const { data: currentClass, error: fetchError } = await supabase
                .from('classes')
                .select('students')
                .eq('id', classId)
                .single();

            if (fetchError) throw fetchError;

            const students = currentClass.students || [];
            if (!students.includes(studentId)) {
                const { error: updateError } = await supabase
                    .from('classes')
                    .update({ students: [...students, studentId] })
                    .eq('id', classId);

                if (updateError) throw updateError;
            }
            return true;
        } catch (error) {
            console.error('Error adding student to class:', error);
            return false;
        }
    }

    async removeStudent(classId, studentId) {
        if (!await this.requireTeacherAuth()) return false;

        try {
            const { data: currentClass, error: fetchError } = await supabase
                .from('classes')
                .select('students')
                .eq('id', classId)
                .single();

            if (fetchError) throw fetchError;

            const students = currentClass.students || [];
            const { error: updateError } = await supabase
                .from('classes')
                .update({ 
                    students: students.filter(id => id !== studentId)
                })
                .eq('id', classId);

            if (updateError) throw updateError;
            return true;
        } catch (error) {
            console.error('Error removing student from class:', error);
            return false;
        }
    }

    async getStudentClasses(studentId) {
        try {
            const { data, error } = await supabase
                .from('classes')
                .select('*')
                .contains('students', [studentId])
                .eq('archived', false)
                .order('createdAt', { ascending: false });

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error getting student classes:', error);
            return [];
        }
    }

    async archiveClass(classId) {
        if (!await this.requireTeacherAuth()) return false;

        try {
            const { error } = await supabase
                .from('classes')
                .update({ archived: true })
                .eq('id', classId);

            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Error archiving class:', error);
            return false;
        }
    }

    setupClassListener(classId, callback) {
        const channel = supabase
            .channel(`class_${classId}`)
            .on('postgres_changes', 
                { 
                    event: '*', 
                    schema: 'public', 
                    table: 'classes',
                    filter: `id=eq.${classId}`
                }, 
                payload => {
                    callback(payload.new);
                }
            )
            .subscribe();

        return () => {
            channel.unsubscribe();
        };
    }

    setupTeacherClassesListener(teacherId, callback) {
        const channel = supabase
            .channel(`teacher_classes_${teacherId}`)
            .on('postgres_changes', 
                { 
                    event: '*', 
                    schema: 'public', 
                    table: 'classes',
                    filter: `teacherId=eq.${teacherId}`
                }, 
                payload => {
                    this.getTeacherClasses(teacherId).then(callback);
                }
            )
            .subscribe();

        return () => {
            channel.unsubscribe();
        };
    }
}

export const classesService = new ClassesService(); 