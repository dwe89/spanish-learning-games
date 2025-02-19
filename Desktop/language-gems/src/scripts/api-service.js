// API Service for Language Gems

export class APIService {
    static BASE_URL = 'https://api.languagegems.com/v1';

    static async get(endpoint) {
        try {
            const response = await fetch(`${this.BASE_URL}${endpoint}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                }
            });
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error('API Get Error:', error);
            throw error;
        }
    }

    static async post(endpoint, data) {
        try {
            const response = await fetch(`${this.BASE_URL}${endpoint}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error('API Post Error:', error);
            throw error;
        }
    }

    // Assignments related methods
    static async getAssignments(filters = {}) {
        const queryParams = new URLSearchParams(filters).toString();
        return await this.get(`/assignments?${queryParams}`);
    }

    static async submitAssignment(assignmentId, data) {
        return await this.post(`/assignments/${assignmentId}/submit`, data);
    }

    static async updateAssignmentStatus(assignmentId, status) {
        return await this.post(`/assignments/${assignmentId}/status`, { status });
    }
}