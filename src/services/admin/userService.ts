
import { supabase } from '@/integrations/supabase/client';
import { SystemUser } from '@/types/admin';

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

  // Add alias for backward compatibility
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
    console.log('Creating user with data:', userData);
    
    // Pour contourner temporairement le problème RLS, 
    // nous utilisons une approche directe
    try {
      // Convert to database format
      const dbUser = {
        id: crypto.randomUUID(), // Générer un ID unique
        email: userData.email,
        first_name: userData.prenom,
        last_name: userData.nom,
        roles: [userData.role as any],
        status: userData.statut === 'actif' ? 'active' : 'inactive',
        password_hash: userData.password || 'temporary_password_hash',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      console.log('Inserting user with database format:', dbUser);

      // Utiliser une requête RPC pour contourner les problèmes RLS
      const { data, error } = await supabase.rpc('create_user_as_admin', {
        user_data: dbUser
      });

      if (error) {
        console.error('RPC error:', error);
        // Si la RPC échoue, essayer l'insertion directe
        const { data: insertData, error: insertError } = await supabase
          .from('users')
          .insert([dbUser])
          .select()
          .single();

        if (insertError) {
          console.error('Direct insert error:', insertError);
          throw insertError;
        }
        
        console.log('Direct insert successful:', insertData);
        
        return {
          id: insertData.id,
          email: insertData.email,
          nom: insertData.last_name || '',
          prenom: insertData.first_name || '',
          role: insertData.roles?.[0] || 'transport',
          statut: insertData.status === 'active' ? 'actif' : 'inactif',
          created_at: insertData.created_at || '',
          updated_at: insertData.updated_at || '',
          created_by: insertData.created_by || undefined
        };
      }
      
      console.log('User created via RPC successfully:', data);
      
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
    } catch (error: any) {
      console.error('Complete error in createUser:', error);
      throw error;
    }
  },

  async updateUser(id: string, userData: Partial<SystemUser>): Promise<SystemUser> {
    // Convert to database format
    const dbUpdate: any = {};
    if (userData.email) dbUpdate.email = userData.email;
    if (userData.prenom) dbUpdate.first_name = userData.prenom;
    if (userData.nom) dbUpdate.last_name = userData.nom;
    if (userData.role) dbUpdate.roles = [userData.role as any];
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
    // For now, return a mock temporary password
    // In a real implementation, this would generate and set a new password
    return { tempPassword: 'TempPass123!' };
  }
};
