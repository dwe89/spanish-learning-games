import { supabase } from '../authentication/supabase-client';

export const assignmentsService = {
  async getAssignments(classId) {
    try {
      const { data, error } = await supabase
        .from('assignments')
        .select('*')
        .eq('class_id', classId)
        .order('due_date', { ascending: true });
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching assignments:', error);
      throw error;
    }
  },

  async createAssignment(assignment) {
    try {
      const { data, error } = await supabase
        .from('assignments')
        .insert(assignment)
        .select();
      
      if (error) throw error;
      return data[0];
    } catch (error) {
      console.error('Error creating assignment:', error);
      throw error;
    }
  },

  async updateAssignment(id, updates) {
    try {
      const { data, error } = await supabase
        .from('assignments')
        .update(updates)
        .eq('id', id)
        .select();
      
      if (error) throw error;
      return data[0];
    } catch (error) {
      console.error('Error updating assignment:', error);
      throw error;
    }
  },

  async deleteAssignment(id) {
    try {
      const { error } = await supabase
        .from('assignments')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    } catch (error) {
      console.error('Error deleting assignment:', error);
      throw error;
    }
  },

  async getStudentAssignments(studentId) {
    try {
      const { data, error } = await supabase
        .from('assignments')
        .select(`
          *,
          submissions!inner(*)
        `)
        .eq('submissions.student_id', studentId)
        .order('due_date', { ascending: true });
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching student assignments:', error);
      throw error;
    }
  },

  async submitAssignment(submission) {
    try {
      const { data, error } = await supabase
        .from('submissions')
        .insert(submission)
        .select();
      
      if (error) throw error;
      return data[0];
    } catch (error) {
      console.error('Error submitting assignment:', error);
      throw error;
    }
  }
}; 