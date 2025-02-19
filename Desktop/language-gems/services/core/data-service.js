import { supabase } from '../authentication/supabase-client.js';

export const dataService = {
  async getCollection(tableName, query = {}) {
    try {
      let queryBuilder = supabase.from(tableName).select();
      
      if (query.where) {
        Object.entries(query.where).forEach(([field, value]) => {
          queryBuilder = queryBuilder.eq(field, value);
        });
      }
      
      if (query.orderBy) {
        queryBuilder = queryBuilder.order(query.orderBy.field, {
          ascending: query.orderBy.direction === 'asc'
        });
      }
      
      if (query.limit) {
        queryBuilder = queryBuilder.limit(query.limit);
      }
      
      const { data, error } = await queryBuilder;
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching data:', error);
      throw error;
    }
  },

  async addDocument(tableName, data) {
    try {
      const { data: result, error } = await supabase
        .from(tableName)
        .insert(data)
        .select();
      
      if (error) throw error;
      return result[0];
    } catch (error) {
      console.error('Error adding document:', error);
      throw error;
    }
  },

  async updateDocument(tableName, id, data) {
    try {
      const { data: result, error } = await supabase
        .from(tableName)
        .update(data)
        .eq('id', id)
        .select();
      
      if (error) throw error;
      return result[0];
    } catch (error) {
      console.error('Error updating document:', error);
      throw error;
    }
  },

  async deleteDocument(tableName, id) {
    try {
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    } catch (error) {
      console.error('Error deleting document:', error);
      throw error;
    }
  },

  async getDocument(tableName, id) {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select()
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching document:', error);
      throw error;
    }
  }
}; 