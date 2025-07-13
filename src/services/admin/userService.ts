
import { supabase } from '@/integrations/supabase/client';
import { SystemUser } from '@/types/admin';
import type { Database } from '@/integrations/supabase/types';

type UserRole = Database['public']['Enums']['user_role'];

export const userService = {
  async getAllUsers(): Promise<SystemUser[]> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('status', 'active');

    if (error) throw error;
    
    return data.map(user => ({
      id: user.id,
      email: user.email,
      nom: user.last_name || '',
      prenom: user.first_name || '',
      role: user.roles?.[0] || 'transport',
      statut: user.status === 'active' ? 'actif' : 'inactif',
      created_at: user.created_at || '',
      updated_at: user.updated_at || '',
      created_by: user.created_by || undefined
    }));
  },

  async getUsers(): Promise<SystemUser[]> {
    return this.getAllUsers();
  },

  async getUserById(id: string): Promise<SystemUser | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return null;
    
    return {
      id: data.id,
      email: data.email,
      nom: data.last_name || '',
      prenom: data.first_name || '',
      role: data.roles?.[0] || 'transport',
      statut: data.status === 'active' ? 'actif' : 'inactif',
      created_at: data.created_at || '',
      updated_at: data.updated_at || '',
      created_by: data.created_by || undefined
    };
  },

  async createUser(userData: {
    email: string;
    nom: string;
    prenom: string;
    role: string;
    statut: 'actif' | 'inactif' | 'suspendu';
    password?: string;
  }): Promise<SystemUser> {
    console.log('Creating user with manual approach:', userData);
    
    try {
      if (!userData.password) {
        throw new Error('Le mot de passe est requis');
      }

      const mappedRole = this.mapRoleToDbType(userData.role);
      const userId = crypto.randomUUID();

      // Create user directly in users table first
      const { data: createdUser, error: createError } = await supabase
        .from('users')
        .insert({
          id: userId,
          email: userData.email,
          first_name: userData.prenom,
          last_name: userData.nom,
          roles: [mappedRole],
          status: userData.statut === 'actif' ? 'active' : 'inactive',
          password_hash: 'managed_by_supabase_auth',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (createError) {
        console.error('User creation error:', createError);
        throw new Error(`Impossible de créer l'utilisateur: ${createError.message}`);
      }

      // Then create auth user
      try {
        const { error: authError } = await supabase.auth.signUp({
          email: userData.email,
          password: userData.password,
          options: {
            data: {
              first_name: userData.prenom,
              last_name: userData.nom
            }
          }
        });

        if (authError) {
          console.warn('Auth user creation failed, but profile exists:', authError.message);
        }
      } catch (authErr) {
        console.warn('Auth creation failed, but continuing with profile:', authErr);
      }

      console.log('User created successfully:', createdUser);

      return {
        id: createdUser.id,
        email: createdUser.email,
        nom: createdUser.last_name || '',
        prenom: createdUser.first_name || '',
        role: createdUser.roles?.[0] || 'transport',
        statut: createdUser.status === 'active' ? 'actif' : 'inactif',
        created_at: createdUser.created_at || '',
        updated_at: createdUser.updated_at || '',
        created_by: createdUser.created_by || undefined
      };

    } catch (error: any) {
      console.error('Complete error in createUser:', error);
      
      let errorMessage = "Impossible de créer l'utilisateur.";
      
      if (error.message) {
        if (error.message.includes('duplicate key')) {
          errorMessage = "Un utilisateur avec cet email existe déjà.";
        } else {
          errorMessage = `Erreur : ${error.message}`;
        }
      }
      
      throw new Error(errorMessage);
    }
  },

  mapRoleToDbType(role: string): UserRole {
    const roleMapping: Record<string, UserRole> = {
      'maintenance': 'maintenance',
      'administratif': 'administratif',
      'hsecq': 'hsecq',
      'obc': 'obc',
      'transport': 'transport',
      'rh': 'rh',
      'facturation': 'facturation',
      'direction': 'direction',
      'admin': 'admin',
      'transitaire': 'transport',
      'directeur_exploitation': 'direction'
    };
    
    return roleMapping[role] || 'transport';
  },

  async updateUser(id: string, userData: Partial<SystemUser>): Promise<SystemUser> {
    const dbUpdate: any = {};
    if (userData.email) dbUpdate.email = userData.email;
    if (userData.prenom) dbUpdate.first_name = userData.prenom;
    if (userData.nom) dbUpdate.last_name = userData.nom;
    if (userData.role) dbUpdate.roles = [this.mapRoleToDbType(userData.role)];
    if (userData.statut) dbUpdate.status = userData.statut === 'actif' ? 'active' : 'inactive';

    const { data, error } = await supabase
      .from('users')
      .update(dbUpdate)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    
    return {
      id: data.id,
      email: data.email,
      nom: data.last_name || '',
      prenom: data.first_name || '',
      role: data.roles?.[0] || 'transport',
      statut: data.status === 'active' ? 'actif' : 'inactif',
      created_at: data.created_at || '',
      updated_at: data.updated_at || '',
      created_by: data.created_by || undefined
    };
  },

  async toggleUserStatus(userId: string, status: SystemUser['statut']): Promise<void> {
    const dbStatus = status === 'actif' ? 'active' : 'inactive';
    
    const { error } = await supabase
      .from('users')
      .update({ status: dbStatus })
      .eq('id', userId);

    if (error) throw error;
  },

  async deleteUser(id: string): Promise<void> {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async resetPassword(userId: string): Promise<{ tempPassword: string }> {
    // Générer un mot de passe temporaire
    const tempPassword = 'TempPass' + Math.random().toString(36).substring(2, 8) + '!';
    
    try {
      // Pour l'instant, on retourne juste le mot de passe temporaire
      // L'utilisateur devra le configurer manuellement
      return { tempPassword };
    } catch (error: any) {
      throw new Error(`Erreur lors de la réinitialisation: ${error.message}`);
    }
  }
};
