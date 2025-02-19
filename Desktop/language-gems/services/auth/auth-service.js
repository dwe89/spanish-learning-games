import { supabase } from '../core/base-service.js';

class AuthService {
    constructor() {
        this.currentUser = null;
        this.authStateChange = null;
    }

    async initialize() {
        // Set up auth state listener
        this.authStateChange = supabase.auth.onAuthStateChange((event, session) => {
            this.currentUser = session?.user || null;
            this.broadcastAuthChange(event, session);
        });

        // Get initial session
        const { data: { session } } = await supabase.auth.getSession();
        this.currentUser = session?.user || null;
    }

    broadcastAuthChange(event, session) {
        window.dispatchEvent(new CustomEvent('authStateChange', {
            detail: { event, session }
        }));
    }

    async signUp(email, password, userData = {}) {
        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        ...userData,
                        created_at: new Date().toISOString()
                    }
                }
            });

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Sign up error:', error);
            throw error;
        }
    }

    async signIn(email, password) {
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password
            });

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Sign in error:', error);
            throw error;
        }
    }

    async signOut() {
        try {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;
        } catch (error) {
            console.error('Sign out error:', error);
            throw error;
        }
    }

    async resetPassword(email) {
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset-password`
            });
            if (error) throw error;
        } catch (error) {
            console.error('Password reset error:', error);
            throw error;
        }
    }

    async updatePassword(newPassword) {
        try {
            const { error } = await supabase.auth.updateUser({
                password: newPassword
            });
            if (error) throw error;
        } catch (error) {
            console.error('Password update error:', error);
            throw error;
        }
    }

    async getCurrentUser() {
        if (this.currentUser) return this.currentUser;

        try {
            const { data: { user }, error } = await supabase.auth.getUser();
            if (error) throw error;
            this.currentUser = user;
            return user;
        } catch (error) {
            console.error('Get current user error:', error);
            return null;
        }
    }

    async updateUserProfile(updates) {
        try {
            const { data, error } = await supabase.auth.updateUser({
                data: updates
            });

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Profile update error:', error);
            throw error;
        }
    }

    isAuthenticated() {
        return !!this.currentUser;
    }

    cleanup() {
        if (this.authStateChange) {
            this.authStateChange.unsubscribe();
        }
    }
}

export const authService = new AuthService(); 