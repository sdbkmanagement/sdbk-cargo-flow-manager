
import { supabase } from '@/integrations/supabase/client';
import type { SystemUser, UserRole } from '@/types/admin';

export const userService = {
  async getUsers(): Promise<SystemUser[]> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  async getUserById(id: string): Promise<SystemUser | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },

  async createUser(user: {
    first_name: string;
    last_name: string;
    email: string;
    roles: UserRole[];
    status: 'active' | 'inactive';
  }): Promise<SystemUser> {
    try {
      console.log('Début de la création utilisateur:', user);
      
      const userData = {
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        roles: user.roles,
        status: user.status,
        password_hash: 'temp_hash' // Will be updated when user sets password
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
      return data;
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
    return data;
  },

  async deleteUser(id: string): Promise<void> {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  async toggleUserStatus(id: string, status: 'active' | 'inactive'): Promise<SystemUser> {
    return this.updateUser(id, { status });
  },

  async resetPassword(userId: string): Promise<void> {
    // Get user email
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
