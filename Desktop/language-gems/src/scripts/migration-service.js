import supabase from './supabase-client.js';

export const migrationService = {
    async migrateUser(firebaseUser) {
        try {
            // Create or update user in Supabase auth
            const { data: authData, error: authError } = await supabase.auth.admin.createUser({
                email: firebaseUser.email,
                email_verified: firebaseUser.emailVerified,
                password: 'temporary-password', // User will need to reset
                user_metadata: {
                    role: firebaseUser.role || 'student',
                    display_name: firebaseUser.displayName
                }
            });

            if (authError) throw authError;

            // Create user profile
            const { error: profileError } = await supabase
                .from('users')
                .upsert({
                    id: authData.user.id,
                    email: firebaseUser.email,
                    role: firebaseUser.role || 'student',
                    created_at: new Date(firebaseUser.metadata.creationTime).toISOString()
                });

            if (profileError) throw profileError;

            return authData;
        } catch (error) {
            console.error('Migration error:', error);
            throw error;
        }
    },

    async migrateData(collection, data) {
        try {
            const { error } = await supabase
                .from(collection)
                .insert(data);

            if (error) throw error;
        } catch (error) {
            console.error(`Error migrating ${collection}:`, error);
            throw error;
        }
    }
};

export default migrationService; 