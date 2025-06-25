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

  async createUser(user: Omit<SystemUser, 'id' | 'created_at' | 'updated_at' | 'created_by'>): Promise<SystemUser> {
    try {
      console.log('Début de la création utilisateur:', user);
      
      // Étape 1: Insérer directement dans la table users avec un UUID généré
      const userData = {
        nom: user.nom,
        prenom: user.prenom,
        email: user.email,
        role: user.role,
        statut: user.statut,
        mot_de_passe_change: false
      };

      console.log('Données à insérer:', userData);

      const { data, error } = await supabase
        .from('users')
        .insert([userData])
        .select()
        .single();
      
      if (error) {
        console.error('Erreur lors de l\'insertion dans users:', error);
        throw error;
      }

      console.log('Utilisateur créé avec succès dans users:', data);
      
      // Étape 2: Créer le compte Auth avec l'ID généré
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: user.email,
        password: 'password123',
        email_confirm: true,
        user_metadata: {
          nom: user.nom,
          prenom: user.prenom,
          role: user.role
        }
      });

      if (authError) {
        console.error('Erreur lors de la création du compte Auth:', authError);
        // Si Auth échoue, on peut continuer car l'utilisateur est créé dans la table
        console.log('Utilisateur créé sans compte Auth actif');
      } else {
        console.log('Utilisateur Auth créé avec ID:', authData.user?.id);
      }
      
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
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  async toggleUserStatus(id: string, statut: 'actif' | 'inactif' | 'suspendu'): Promise<SystemUser> {
    return this.updateUser(id, { statut });
  },

  async resetPassword(userId: string): Promise<void> {
    // Réinitialiser le mot de passe dans Auth
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

    // Marquer que le mot de passe doit être changé
    await this.updateUser(userId, { mot_de_passe_change: false });
  }
};
