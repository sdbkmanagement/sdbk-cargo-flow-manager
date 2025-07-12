
import { supabase } from '@/integrations/supabase/client';
import type { SystemUser } from '@/types/admin';

export const userService = {
  async getUsers(): Promise<SystemUser[]> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return (data || []).map(user => ({
      ...user,
      statut: user.statut as 'actif' | 'inactif' | 'suspendu'
    }));
  },

  async getUserById(id: string): Promise<SystemUser | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data ? {
      ...data,
      statut: data.statut as 'actif' | 'inactif' | 'suspendu'
    } : null;
  },

  async createUser(user: Omit<SystemUser, 'id' | 'created_at' | 'updated_at' | 'created_by'> & { password: string }): Promise<SystemUser> {
    try {
      console.log('Début de la création utilisateur:', user);
      
      // Créer d'abord l'utilisateur dans Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: user.email,
        password: user.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`
        }
      });

      if (authError) {
        console.error('Erreur lors de la création dans Auth:', authError);
        throw authError;
      }

      if (!authData.user) {
        throw new Error('Erreur lors de la création du compte utilisateur');
      }

      // Insérer les informations supplémentaires dans la table users
      const userData = {
        id: authData.user.id,
        nom: user.nom,
        prenom: user.prenom,
        email: user.email,
        role: user.role,
        statut: user.statut
      };

      console.log('Données à insérer dans users:', userData);

      const { data, error } = await supabase
        .from('users')
        .insert([userData])
        .select()
        .single();
      
      if (error) {
        console.error('Erreur lors de l\'insertion dans users:', error);
        // Nettoyer l'utilisateur Auth si l'insertion échoue
        await supabase.auth.admin.deleteUser(authData.user.id);
        throw error;
      }

      console.log('Utilisateur créé avec succès:', data);
      
      return {
        ...data,
        statut: data.statut as 'actif' | 'inactif' | 'suspendu'
      };
    } catch (error) {
      console.error('Erreur complète lors de la création:', error);
      throw error;
    }
  },

  async updateUser(id: string, updates: Partial<SystemUser>): Promise<SystemUser> {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return {
      ...data,
      statut: data.statut as 'actif' | 'inactif' | 'suspendu'
    };
  },

  async deleteUser(id: string): Promise<void> {
    // Supprimer d'abord de la table users
    const { error: userError } = await supabase
      .from('users')
      .delete()
      .eq('id', id);
    
    if (userError) throw userError;

    // Puis supprimer de Auth
    const { error: authError } = await supabase.auth.admin.deleteUser(id);
    if (authError) throw authError;
  },

  async toggleUserStatus(id: string, statut: 'actif' | 'inactif' | 'suspendu'): Promise<SystemUser> {
    return this.updateUser(id, { statut });
  },

  async resetPassword(userId: string): Promise<void> {
    // Récupérer l'email de l'utilisateur
    const { data: user } = await supabase
      .from('users')
      .select('email')
      .eq('id', userId)
      .single();

    if (!user) throw new Error('Utilisateur non trouvé');

    const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
      redirectTo: `${window.location.origin}/reset-password`
    });

    if (error) throw error;
  }
};
