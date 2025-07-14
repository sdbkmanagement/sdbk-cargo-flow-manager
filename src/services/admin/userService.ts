
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
    console.log('🔧 userService.getUsers - Début');
    
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('🔧 userService.getUsers - Erreur:', error);
      throw new Error(`Erreur lors de la récupération des utilisateurs: ${error.message}`);
    }

    console.log('🔧 userService.getUsers - Utilisateurs récupérés:', users?.length || 0);

    return (users || []).map(user => ({
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
  },

  async createUser(userData: CreateUserData): Promise<SystemUser> {
    console.log('🔧 userService.createUser - Début avec données:', userData);
    
    try {
      // 1. Créer l'utilisateur dans Supabase Auth
      console.log('🔧 Création utilisateur Auth avec email:', userData.email);
      
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
        console.error('🔧 Erreur création Auth:', authError);
        throw new Error(`Erreur lors de la création du compte: ${authError.message}`);
      }

      if (!authData.user) {
        throw new Error('Aucun utilisateur créé par Supabase Auth');
      }

      console.log('✅ Utilisateur Auth créé avec ID:', authData.user.id);

      // 2. Créer l'enregistrement dans la table users
      const { data: dbUser, error: dbError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email: userData.email,
          first_name: userData.prenom,
          last_name: userData.nom,
          roles: userData.roles as any,
          module_permissions: userData.module_permissions,
          status: userData.statut === 'actif' ? 'active' : userData.statut
        })
        .select()
        .single();

      if (dbError) {
        console.error('🔧 Erreur création DB:', dbError);
        // Nettoyer l'utilisateur auth si la création DB échoue
        try {
          await supabase.auth.admin.deleteUser(authData.user.id);
        } catch (cleanupError) {
          console.error('🔧 Erreur nettoyage Auth:', cleanupError);
        }
        throw new Error(`Erreur lors de la création en base: ${dbError.message}`);
      }

      console.log('✅ Utilisateur DB créé:', dbUser.id);

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
      console.error('🔧 userService.createUser - Erreur complète:', error);
      throw error;
    }
  },

  async updateUser(userId: string, userData: UpdateUserData): Promise<SystemUser> {
    console.log('🔧 userService.updateUser - Début:', { userId, userData });
    
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
      console.error('🔧 userService.updateUser - Erreur:', dbError);
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
      statut: dbUser.status === 'active' ? 'actif' as const :
              dbUser.status === 'inactive' ? 'inactif' as const : 'suspendu' as const,
      created_at: dbUser.created_at,
      updated_at: dbUser.updated_at
    };
  },

  async deleteUser(userId: string): Promise<void> {
    console.log('🔧 userService.deleteUser - Début:', userId);
    
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);

    if (error) {
      console.error('🔧 userService.deleteUser - Erreur:', error);
      throw new Error(`Erreur lors de la suppression: ${error.message}`);
    }

    // Supprimer aussi de Supabase Auth
    const { error: authError } = await supabase.auth.admin.deleteUser(userId);
    if (authError) {
      console.warn('🔧 Avertissement suppression Auth:', authError);
    }
  },

  async toggleUserStatus(userId: string, status: SystemUser['statut']): Promise<void> {
    console.log('🔧 userService.toggleUserStatus - Début:', { userId, status });
    
    const { error } = await supabase
      .from('users')
      .update({ 
        status: status === 'actif' ? 'active' : status,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (error) {
      console.error('🔧 userService.toggleUserStatus - Erreur:', error);
      throw new Error(`Erreur lors du changement de statut: ${error.message}`);
    }
  },

  async resetPassword(userId: string): Promise<void> {
    console.log('🔧 userService.resetPassword - Début:', userId);
    
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
      console.error('🔧 userService.resetPassword - Erreur:', error);
      throw new Error(`Erreur lors de la réinitialisation: ${error.message}`);
    }
  }
};
