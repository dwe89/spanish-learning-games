import { supabase } from '../authentication/supabase-client';

export const resourcesService = {
  async getResources(filters = {}) {
    try {
      let query = supabase
        .from('resources')
        .select('*');
      
      if (filters.category) {
        query = query.eq('category', filters.category);
      }
      
      if (filters.level) {
        query = query.eq('level', filters.level);
      }
      
      if (filters.language) {
        query = query.eq('language', filters.language);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching resources:', error);
      throw error;
    }
  },

  async addResource(resource) {
    try {
      const { data, error } = await supabase
        .from('resources')
        .insert(resource)
        .select();
      
      if (error) throw error;
      return data[0];
    } catch (error) {
      console.error('Error adding resource:', error);
      throw error;
    }
  },

  async updateResource(id, updates) {
    try {
      const { data, error } = await supabase
        .from('resources')
        .update(updates)
        .eq('id', id)
        .select();
      
      if (error) throw error;
      return data[0];
    } catch (error) {
      console.error('Error updating resource:', error);
      throw error;
    }
  },

  async deleteResource(id) {
    try {
      const { error } = await supabase
        .from('resources')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    } catch (error) {
      console.error('Error deleting resource:', error);
      throw error;
    }
  },

  async getResourcesByTeacher(teacherId) {
    try {
      const { data, error } = await supabase
        .from('resources')
        .select('*')
        .eq('teacher_id', teacherId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching teacher resources:', error);
      throw error;
    }
  },

  subscribeToResources(callback) {
    const subscription = supabase
      .channel('resources')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'resources'
        }, 
        payload => {
          callback(payload);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }
}; 