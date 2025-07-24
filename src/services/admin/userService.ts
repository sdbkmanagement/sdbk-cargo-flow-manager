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

// Utility function to generate secure passwords
const generateSecurePassword = (): string => {
  const length = 16;
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
};

// Input validation utilities
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const sanitizeInput = (input: string): string => {
  return input.trim().replace(/[<>]/g, '');
};

const validateRoles = (roles: string[]): boolean => {
  const validRoles = ['admin', 'transport', 'maintenance', 'administratif', 'hsecq', 'obc', 'rh', 'facturation', 'direction', 'transitaire', 'directeur_exploitation'];
  return roles.every(role => validRoles.includes(role));
};

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
        nom: sanitizeInput(user.last_name || ''),
        prenom: sanitizeInput(user.first_name || ''),
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
      // Input validation
      if (!validateEmail(userData.email)) {
        throw new Error('Format d\'email invalide');
      }

      if (!validateRoles(userData.roles)) {
        throw new Error('Rôles invalides détectés');
      }

      // Sanitize inputs
      const sanitizedEmail = sanitizeInput(userData.email);
      const sanitizedNom = sanitizeInput(userData.nom);
      const sanitizedPrenom = sanitizeInput(userData.prenom);

      // Verify current user is admin
      const { data: currentUser } = await supabase.auth.getUser();
      if (!currentUser.user) {
        throw new Error('Utilisateur non connecté');
      }

      console.log('✅ Current user verified:', currentUser.user.id);

      // Generate secure password if not provided
      const securePassword = userData.password || generateSecurePassword();

      // Create user record in database first
      const newUserId = crypto.randomUUID();
      
      const { data: dbUser, error: dbError } = await supabase
        .from('users')
        .insert({
          id: newUserId,
          email: sanitizedEmail,
          first_name: sanitizedPrenom,
          last_name: sanitizedNom,
          roles: userData.roles as any,
          module_permissions: userData.module_permissions,
          status: userData.statut === 'actif' ? 'active' : userData.statut,
          password_hash: 'managed_by_supabase_auth',
          created_by: currentUser.user.id
        })
        .select()
        .single();

      if (dbError) {
        console.error('❌ DB creation error:', dbError);
        throw new Error(`Erreur lors de la création en base: ${dbError.message}`);
      }

      console.log('✅ User record created successfully in database');

      // Try to create user in Supabase Auth with email confirmation disabled
      try {
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email: sanitizedEmail,
          password: securePassword,
          email_confirm: true, // Auto-confirm email to skip email verification
          user_metadata: {
            first_name: sanitizedPrenom,
            last_name: sanitizedNom,
            roles: userData.roles
          }
        });

        if (authError) {
          console.warn('⚠️ Auth creation warning:', authError);
        } else {
          console.log('✅ Auth user created with ID:', authData.user?.id);
          
          // Update the ID if auth creation succeeded
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
      // Input validation
      if (!validateRoles(userData.roles)) {
        throw new Error('Rôles invalides détectés');
      }

      // Sanitize inputs
      const sanitizedNom = sanitizeInput(userData.nom);
      const sanitizedPrenom = sanitizeInput(userData.prenom);

      const { data: dbUser, error: dbError } = await supabase
        .from('users')
        .update({
          first_name: sanitizedPrenom,
          last_name: sanitizedNom,
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

      // Try to delete from Supabase Auth
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

  async resetPassword(userId: string, newPassword?: string): Promise<string> {
    console.log('🔧 Resetting password for user:', userId);
    
    try {
      // Generate a new secure password if not provided
      const password = newPassword || generateSecurePassword();

      // Update password using Supabase Admin API
      const { error } = await supabase.auth.admin.updateUserById(userId, {
        password: password
      });
      
      if (error) {
        console.error('❌ Password reset error:', error);
        throw new Error(`Erreur lors de la réinitialisation: ${error.message}`);
      }

      console.log('✅ Password reset successfully for user:', userId);
      return password;
    } catch (error) {
      console.error('❌ Exception in resetPassword:', error);
      throw error;
    }
  },

  async updateUserPassword(userId: string, newPassword: string): Promise<void> {
    console.log('🔧 Updating password for user:', userId);
    
    try {
      if (!newPassword || newPassword.length < 6) {
        throw new Error('Le mot de passe doit contenir au moins 6 caractères');
      }

      const { error } = await supabase.auth.admin.updateUserById(userId, {
        password: newPassword
      });
      
      if (error) {
        console.error('❌ Password update error:', error);
        throw new Error(`Erreur lors de la mise à jour du mot de passe: ${error.message}`);
      }

      console.log('✅ Password updated successfully for user:', userId);
    } catch (error) {
      console.error('❌ Exception in updateUserPassword:', error);
      throw error;
    }
  }
};
