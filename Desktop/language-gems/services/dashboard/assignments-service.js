import { BaseService } from '../core/base-service.js';
import { authService } from '../auth/auth-service.js';

class AssignmentsService extends BaseService {
    constructor() {
        super('assignments');
    }

    async getAssignmentsByClass(classId) {
        try {
            const { data, error } = await this.supabase
                .from(this.tableName)
                .select(`
                    *,
                    class:class_id (
                        name,
                        teacher:teacher_id (
                            id,
                            name,
                            email
                        )
                    ),
                    submissions:assignment_submissions (
                        id,
                        student_id,
                        status,
                        score,
                        submitted_at
                    )
                `)
                .eq('class_id', classId)
                .order('due_date', { ascending: true });

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error getting assignments by class:', error);
            throw error;
        }
    }

    async getByTeacher(teacherId) {
        try {
            const { data, error } = await this.supabase
                .from(this.tableName)
                .select(`
                    *,
                    class:class_id (
                        name
                    ),
                    submissions:assignment_submissions (
                        id,
                        student_id,
                        status,
                        score,
                        submitted_at
                    )
                `)
                .eq('teacher_id', teacherId)
                .order('due_date', { ascending: true });

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error getting assignments by teacher:', error);
            throw error;
        }
    }

    async getByStudent(studentId) {
        try {
            const { data, error } = await this.supabase
                .from(this.tableName)
                .select(`
                    *,
                    class:class_id (
                        name,
                        teacher:teacher_id (
                            id,
                            name
                        )
                    ),
                    submissions:assignment_submissions (
                        id,
                        status,
                        score,
                        submitted_at
                    )
                `)
                .eq('submissions.student_id', studentId)
                .order('due_date', { ascending: true });

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error getting assignments by student:', error);
            throw error;
        }
    }

    async createAssignment(assignmentData) {
        const user = await authService.getCurrentUser();
        if (!user) throw new Error('User must be authenticated');

        try {
            const { data, error } = await this.supabase
                .from(this.tableName)
                .insert([{
                    ...assignmentData,
                    teacher_id: user.id,
                    created_at: new Date().toISOString()
                }])
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error creating assignment:', error);
            throw error;
        }
    }

    async submitAssignment(assignmentId, submission) {
        const user = await authService.getCurrentUser();
        if (!user) throw new Error('User must be authenticated');

        try {
            const { data, error } = await this.supabase
                .from('assignment_submissions')
                .insert([{
                    assignment_id: assignmentId,
                    student_id: user.id,
                    ...submission,
                    submitted_at: new Date().toISOString()
                }])
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error submitting assignment:', error);
            throw error;
        }
    }

    async gradeAssignment(submissionId, grade) {
        const user = await authService.getCurrentUser();
        if (!user) throw new Error('User must be authenticated');

        try {
            const { data, error } = await this.supabase
                .from('assignment_submissions')
                .update({
                    score: grade.score,
                    feedback: grade.feedback,
                    graded_by: user.id,
                    graded_at: new Date().toISOString()
                })
                .eq('id', submissionId)
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error grading assignment:', error);
            throw error;
        }
    }

    async getSubmissionStats(assignmentId) {
        try {
            const { data, error } = await this.supabase
                .from('assignment_submissions')
                .select(`
                    status,
                    count(*),
                    avg(score) as average_score
                `)
                .eq('assignment_id', assignmentId)
                .groupBy('status');

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error getting submission stats:', error);
            throw error;
        }
    }
}

export const assignmentsService = new AssignmentsService(); 