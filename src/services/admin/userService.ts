
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
  async createUser(userData: CreateUserData): Promise<SystemUser> {
    console.log('🔧 Creating user with data:', userData);
    
    // 1. Créer l'utilisateur dans Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: userData.email,
      password: userData.password || 'TempPassword123!',
      email_confirm: true,
      user_metadata: {
        first_name: userData.prenom,
        last_name: userData.nom
      }
    });

    if (authError) {
      console.error('Auth creation error:', authError);
      throw new Error(`Erreur lors de la création du compte: ${authError.message}`);
    }

    console.log('✅ Auth user created:', authData.user?.id);

    // 2. Créer l'enregistrement dans la table users
    const { data: dbUser, error: dbError } = await supabase
      .from('users')
      .insert({
        id: authData.user!.id,
        email: userData.email,
        first_name: userData.prenom,
        last_name: userData.nom,
        roles: userData.roles,
        module_permissions: userData.module_permissions,
        status: userData.statut === 'actif' ? 'active' : userData.statut
      })
      .select()
      .single();

    if (dbError) {
      console.error('DB creation error:', dbError);
      // Nettoyer l'utilisateur auth si la création DB échoue
      await supabase.auth.admin.deleteUser(authData.user!.id);
      throw new Error(`Erreur lors de la création en base: ${dbError.message}`);
    }

    console.log('✅ DB user created:', dbUser);

    return {
      id: dbUser.id,
      email: dbUser.email,
      nom: dbUser.last_name,
      prenom: dbUser.first_name,
      role: dbUser.roles[0] || 'transport',
      roles: dbUser.roles,
      module_permissions: dbUser.module_permissions,
      statut: dbUser.status === 'active' ? 'actif' : dbUser.status,
      created_at: dbUser.created_at,
      updated_at: dbUser.updated_at
    };
  },

  async updateUser(userId: string, userData: UpdateUserData): Promise<SystemUser> {
    console.log('🔧 Updating user:', { userId, userData });
    
    const { data: dbUser, error: dbError } = await supabase
      .from('users')
      .update({
        first_name: userData.prenom,
        last_name: userData.nom,
        roles: userData.roles,
        module_permissions: userData.module_permissions,
        status: userData.statut === 'actif' ? 'active' : userData.statut,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();

    if (dbError) {
      console.error('Update error:', dbError);
      throw new Error(`Erreur lors de la mise à jour: ${dbError.message}`);
    }

    return {
      id: dbUser.id,
      email: dbUser.email,
      nom: dbUser.last_name,
      prenom: dbUser.first_name,
      role: dbUser.roles[0] || 'transport',
      roles: dbUser.roles,
      module_permissions: dbUser.module_permissions,
      statut: dbUser.status === 'active' ? 'actif' : dbUser.status,
      created_at: dbUser.created_at,
      updated_at: dbUser.updated_at
    };
  },

  async deleteUser(userId: string): Promise<void> {
    console.log('🔧 Deleting user:', userId);
    
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);

    if (error) {
      console.error('Delete error:', error);
      throw new Error(`Erreur lors de la suppression: ${error.message}`);
    }

    // Supprimer aussi de Supabase Auth
    const { error: authError } = await supabase.auth.admin.deleteUser(userId);
    if (authError) {
      console.warn('Auth delete warning:', authError);
    }
  },

  async toggleUserStatus(userId: string, status: SystemUser['statut']): Promise<void> {
    console.log('🔧 Toggling user status:', { userId, status });
    
    const { error } = await supabase
      .from('users')
      .update({ 
        status: status === 'actif' ? 'active' : status,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (error) {
      console.error('Status toggle error:', error);
      throw new Error(`Erreur lors du changement de statut: ${error.message}`);
    }
  },

  async resetPassword(userId: string): Promise<void> {
    console.log('🔧 Resetting password for user:', userId);
    
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
      console.error('Password reset error:', error);
      throw new Error(`Erreur lors de la réinitialisation: ${error.message}`);
    }
  }
};
