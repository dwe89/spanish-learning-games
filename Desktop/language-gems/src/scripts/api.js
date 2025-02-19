import { auth } from '../firebase/config';

export const api = {
  async getAuthHeaders() {
    const token = await auth.currentUser?.getIdToken();
    return {
      'Authorization': token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json',
    };
  },

  async fetchWithAuth(url, options = {}) {
    const headers = await this.getAuthHeaders();
    const response = await fetch(url, {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
    });
    
    if (!response.ok) {
      throw new Error('API request failed');
    }
    
    return response.json();
  }
}; 