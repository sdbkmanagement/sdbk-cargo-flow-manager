import { supabase } from '@/integrations/supabase/client';
import { SystemUser } from '@/types/admin';

interface CreateUserData {
  email: string;
  nom: string;
  prenom: string;
  password?: string;
  role: string;
  roles: string[];
  module_permissions: string[];
  statut: 'actif' | 'inactif' | 'suspendu';
}

interface UpdateUserData {
  nom: string;
  prenom: string;
  role: string;
  roles: string[];
  module_permissions: string[];
  statut: 'actif' | 'inactif' | 'suspendu';
}

export const userService = {
  async getUsers(): Promise<SystemUser[]> {
    console.log('🔧 Fetching all users from database');
    
    try {
      const { data: users, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Database error fetching users:', error);
        throw new Error(`Erreur lors de la récupération des utilisateurs: ${error.message}`);
      }

      console.log('✅ Users fetched from database:', users?.length || 0, 'users');

      if (!users || users.length === 0) {
        console.log('ℹ️ No users found in database');
        return [];
      }

      return users.map(user => ({
        id: user.id,
        email: user.email,
        nom: user.last_name || '',
        prenom: user.first_name || '',
        role: user.roles?.[0] || 'transport',
        roles: user.roles || ['transport'],
        module_permissions: user.module_permissions || [],
        statut: user.status === 'active' ? 'actif' as const : 
                user.status === 'inactive' ? 'inactif' as const : 'suspendu' as const,
        created_at: user.created_at,
        updated_at: user.updated_at
      }));
    } catch (error) {
      console.error('❌ Exception in getUsers:', error);
      throw error;
    }
  },

  async createUser(userData: CreateUserData): Promise<SystemUser> {
    console.log('🔧 Creating new user:', { email: userData.email, roles: userData.roles });
    
    try {
      // 1. Vérifier que l'utilisateur connecté est admin
      const { data: currentUser } = await supabase.auth.getUser();
      if (!currentUser.user) {
        throw new Error('Utilisateur non connecté');
      }

      console.log('✅ Current user verified:', currentUser.user.id);

      // 2. Créer directement l'enregistrement dans la table users avec un ID généré
      const newUserId = crypto.randomUUID();
      
      const { data: dbUser, error: dbError } = await supabase
        .from('users')
        .insert({
          id: newUserId,
          email: userData.email,
          first_name: userData.prenom,
          last_name: userData.nom,
          roles: userData.roles as any,
          module_permissions: userData.module_permissions,
          status: userData.statut === 'actif' ? 'active' : userData.statut,
          password_hash: 'to_be_set_by_user',
          created_by: currentUser.user.id
        })
        .select()
        .single();

      if (dbError) {
        console.error('❌ DB creation error:', dbError);
        throw new Error(`Erreur lors de la création en base: ${dbError.message}`);
      }

      console.log('✅ User record created successfully in database');

      // 3. Essayer de créer l'utilisateur dans Supabase Auth (optionnel)
      try {
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email: userData.email,
          password: userData.password || 'TempPassword123!',
          email_confirm: true,
          user_metadata: {
            first_name: userData.prenom,
            last_name: userData.nom,
            roles: userData.roles
          }
        });

        if (authError) {
          console.warn('⚠️ Auth creation warning (user can still login via reset):', authError);
        } else {
          console.log('✅ Auth user created with ID:', authData.user?.id);
          
          // Mettre à jour l'ID si la création auth a réussi
          if (authData.user?.id) {
            await supabase
              .from('users')
              .update({ id: authData.user.id })
              .eq('id', newUserId);
          }
        }
      } catch (authError) {
        console.warn('⚠️ Auth creation failed, but user record exists:', authError);
      }

      return {
        id: dbUser.id,
        email: dbUser.email,
        nom: dbUser.last_name,
        prenom: dbUser.first_name,
        role: dbUser.roles[0] || 'transport',
        roles: dbUser.roles,
        module_permissions: dbUser.module_permissions,
        statut: dbUser.status === 'active' ? 'actif' as const : 
                dbUser.status === 'inactive' ? 'inactif' as const : 'suspendu' as const,
        created_at: dbUser.created_at,
        updated_at: dbUser.updated_at
      };
    } catch (error) {
      console.error('❌ Exception in createUser:', error);
      throw error;
    }
  },

  async updateUser(userId: string, userData: UpdateUserData): Promise<SystemUser> {
    console.log('🔧 Updating user:', { userId, userData });
    
    try {
      const { data: dbUser, error: dbError } = await supabase
        .from('users')
        .update({
          first_name: userData.prenom,
          last_name: userData.nom,
          roles: userData.roles as any,
          module_permissions: userData.module_permissions,
          status: userData.statut === 'actif' ? 'active' : userData.statut,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single();

      if (dbError) {
        console.error('❌ Update error:', dbError);
        throw new Error(`Erreur lors de la mise à jour: ${dbError.message}`);
      }

      console.log('✅ User updated successfully');

      return {
        id: dbUser.id,
        email: dbUser.email,
        nom: dbUser.last_name,
        prenom: dbUser.first_name,
        role: dbUser.roles[0] || 'transport',
        roles: dbUser.roles,
        module_permissions: dbUser.module_permissions,
        statut: dbUser.status === 'active' ? 'actif' as const :
                dbUser.status === 'inactive' ? 'inactif' as const : 'suspendu' as const,
        created_at: dbUser.created_at,
        updated_at: dbUser.updated_at
      };
    } catch (error) {
      console.error('❌ Exception in updateUser:', error);
      throw error;
    }
  },

  async deleteUser(userId: string): Promise<void> {
    console.log('🔧 Deleting user:', userId);
    
    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);

      if (error) {
        console.error('❌ Delete error:', error);
        throw new Error(`Erreur lors de la suppression: ${error.message}`);
      }

      // Essayer de supprimer aussi de Supabase Auth
      try {
        const { error: authError } = await supabase.auth.admin.deleteUser(userId);
        if (authError) {
          console.warn('⚠️ Auth delete warning:', authError);
        }
      } catch (authError) {
        console.warn('⚠️ Auth delete failed:', authError);
      }

      console.log('✅ User deleted successfully');
    } catch (error) {
      console.error('❌ Exception in deleteUser:', error);
      throw error;
    }
  },

  async toggleUserStatus(userId: string, status: SystemUser['statut']): Promise<void> {
    console.log('🔧 Toggling user status:', { userId, status });
    
    try {
      const { error } = await supabase
        .from('users')
        .update({ 
          status: status === 'actif' ? 'active' : status,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) {
        console.error('❌ Status toggle error:', error);
        throw new Error(`Erreur lors du changement de statut: ${error.message}`);
      }

      console.log('✅ User status toggled successfully');
    } catch (error) {
      console.error('❌ Exception in toggleUserStatus:', error);
      throw error;
    }
  },

  async resetPassword(userId: string): Promise<void> {
    console.log('🔧 Resetting password for user:', userId);
    
    try {
      // Récupérer l'email de l'utilisateur
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('email')
        .eq('id', userId)
        .single();

      if (userError || !user) {
        throw new Error('Utilisateur non trouvé');
      }

      // Envoyer un email de réinitialisation
      const { error } = await supabase.auth.resetPasswordForEmail(user.email);
      
      if (error) {
        console.error('❌ Password reset error:', error);
        throw new Error(`Erreur lors de la réinitialisation: ${error.message}`);
      }

      console.log('✅ Password reset email sent successfully');
    } catch (error) {
      console.error('❌ Exception in resetPassword:', error);
      throw error;
    }
  }
};
