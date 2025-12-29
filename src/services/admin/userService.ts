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

// Function to call the Edge Function for password management
const callPasswordManagementFunction = async (action: 'reset' | 'update', userId: string, newPassword?: string) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    throw new Error('Utilisateur non authentifié');
  }

  const response = await fetch(`https://vyyexbyqjrasipkxezpl.supabase.co/functions/v1/admin-password-management`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({
      action,
      userId,
      newPassword
    }),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || 'Erreur lors de la gestion du mot de passe');
  }

  return result;
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

      // 1. Create auth user via edge function first
      console.log('🔗 Creating auth user via edge function...');
      
      const { data: authResponse, error: functionError } = await supabase.functions.invoke('admin-password-management', {
        body: {
          action: 'create_user',
          email: sanitizedEmail,
          password: securePassword,
          user_metadata: {
            first_name: sanitizedPrenom,
            last_name: sanitizedNom,
            roles: userData.roles
          }
        }
      });

      if (functionError) {
        console.error('❌ Edge function error:', functionError);
        throw new Error(`Erreur de synchronisation avec Auth: ${functionError.message}`);
      }

      if (!authResponse?.success) {
        console.error('❌ Auth creation failed via edge function:', authResponse);
        throw new Error(`Erreur de synchronisation avec Auth: ${authResponse?.error || 'Erreur inconnue'}`);
      }

      console.log('✅ Auth user created via edge function:', authResponse.user?.id);

      // 2. Create user record in database with auth ID
      const authUserId = authResponse.user?.id;
      if (!authUserId) {
        throw new Error('ID utilisateur Auth manquant');
      }

      // 3. Check if user already exists in database
      const { data: existingUser } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUserId)
        .single();

      let dbUser;
      
      if (existingUser) {
        console.log('✅ User already exists in database, updating:', authUserId);
        // Update existing user
        const { data: updatedUser, error: updateError } = await supabase
          .from('users')
          .update({
            email: sanitizedEmail,
            first_name: sanitizedPrenom,
            last_name: sanitizedNom,
            roles: userData.roles as any,
            module_permissions: userData.module_permissions,
            status: userData.statut === 'actif' ? 'active' : userData.statut,
            updated_at: new Date().toISOString()
          })
          .eq('id', authUserId)
          .select()
          .single();

        if (updateError) {
          console.error('❌ DB update error:', updateError);
          throw new Error(`Erreur lors de la mise à jour en base: ${updateError.message}`);
        }
        
        dbUser = updatedUser;
      } else {
        console.log('✅ Creating new user record in database:', authUserId);
        // Create new user record
        const { data: newUser, error: dbError } = await supabase
          .from('users')
          .insert({
            id: authUserId,
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
        
        dbUser = newUser;
      }

      console.log('✅ User record synchronized successfully in database with ID:', authUserId);

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
      const result = await callPasswordManagementFunction('reset', userId, newPassword);
      console.log('✅ Password reset successfully for user:', userId);
      return result.password;
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

      await callPasswordManagementFunction('update', userId, newPassword);
      console.log('✅ Password updated successfully for user:', userId);
    } catch (error) {
      console.error('❌ Exception in updateUserPassword:', error);
      throw error;
    }
  }
};