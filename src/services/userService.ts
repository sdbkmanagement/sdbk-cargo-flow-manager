
import { supabase } from '@/integrations/supabase/client';
import bcrypt from 'bcryptjs';
import type { User, CreateUserData, UpdateUserData } from '@/types/user';

class UserService {
  /**
   * Récupérer tous les utilisateurs
   */
  async getUsers(): Promise<User[]> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return (data || []).map(user => ({
      ...user,
      status: user.status as 'active' | 'inactive'
    }));
  }

  /**
   * Récupérer un utilisateur par ID
   */
  async getUserById(id: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data ? {
      ...data,
      status: data.status as 'active' | 'inactive'
    } : null;
  }

  /**
   * Créer un utilisateur
   */
  async createUser(userData: CreateUserData): Promise<User> {
    try {
      // Hasher le mot de passe
      const saltRounds = 10;
      const password_hash = await bcrypt.hash(userData.password, saltRounds);

      const { data, error } = await supabase
        .from('users')
        .insert({
          first_name: userData.first_name,
          last_name: userData.last_name,
          email: userData.email,
          password_hash,
          roles: userData.roles,
          status: userData.status || 'active'
        })
        .select()
        .single();

      if (error) throw error;
      return {
        ...data,
        status: data.status as 'active' | 'inactive'
      };
    } catch (error) {
      console.error('Erreur lors de la création utilisateur:', error);
      throw error;
    }
  }

  /**
   * Mettre à jour un utilisateur
   */
  async updateUser(id: string, updates: UpdateUserData): Promise<User> {
    try {
      const updateData: any = { ...updates };
      
      // Si un nouveau mot de passe est fourni, le hasher
      if (updates.password) {
        const saltRounds = 10;
        updateData.password_hash = await bcrypt.hash(updates.password, saltRounds);
        delete updateData.password;
      }

      const { data, error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return {
        ...data,
        status: data.status as 'active' | 'inactive'
      };
    } catch (error) {
      console.error('Erreur lors de la mise à jour utilisateur:', error);
      throw error;
    }
  }

  /**
   * Supprimer un utilisateur
   */
  async deleteUser(id: string): Promise<void> {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }

  /**
   * Activer/Désactiver un utilisateur
   */
  async toggleUserStatus(id: string, status: 'active' | 'inactive'): Promise<User> {
    return this.updateUser(id, { status });
  }

  /**
   * Réinitialiser le mot de passe d'un utilisateur
   */
  async resetPassword(id: string, newPassword: string): Promise<User> {
    return this.updateUser(id, { password: newPassword });
  }

  /**
   * Obtenir les statistiques des utilisateurs
   */
  async getUserStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    by_role: Record<string, number>;
  }> {
    const users = await this.getUsers();
    
    const stats = {
      total: users.length,
      active: users.filter(u => u.status === 'active').length,
      inactive: users.filter(u => u.status === 'inactive').length,
      by_role: {} as Record<string, number>
    };

    // Compter par rôle
    users.forEach(user => {
      user.roles.forEach(role => {
        stats.by_role[role] = (stats.by_role[role] || 0) + 1;
      });
    });

    return stats;
  }
}

export const userService = new UserService();
