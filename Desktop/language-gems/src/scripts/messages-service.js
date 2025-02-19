import { supabase } from '../authentication/supabase-client';

export const messagesService = {
  async getMessages(classId) {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('class_id', classId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching messages:', error);
      throw error;
    }
  },

  async addMessage(message) {
    try {
      const { data, error } = await supabase
        .from('messages')
        .insert(message)
        .select();
      
      if (error) throw error;
      return data[0];
    } catch (error) {
      console.error('Error adding message:', error);
      throw error;
    }
  },

  subscribeToMessages(classId, callback) {
    const subscription = supabase
      .channel('messages')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'messages',
          filter: `class_id=eq.${classId}`
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