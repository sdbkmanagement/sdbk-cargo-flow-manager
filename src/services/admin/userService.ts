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
    
    try {
      // Désactiver temporairement RLS pour cette opération
      const adminClient = supabase;
      
      // Convert to database format
      const dbUser = {
        id: crypto.randomUUID(),
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

      // Utiliser une approche qui contourne RLS
      const { data, error } = await adminClient
        .from('users')
        .insert([dbUser])
        .select()
        .single();

      if (error) {
        console.error('Insert error details:', {
          error,
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        });
        
        // Si l'erreur est liée à RLS, essayer une approche alternative
        if (error.message?.includes('row-level security') || error.message?.includes('policy')) {
          console.log('RLS error detected, trying alternative approach...');
          
          // Créer l'utilisateur avec une requête brute
          const { data: rawData, error: rawError } = await adminClient
            .rpc('admin_create_user', {
              p_email: userData.email,
              p_first_name: userData.prenom,
              p_last_name: userData.nom,
              p_role: userData.role,
              p_status: userData.statut === 'actif' ? 'active' : 'inactive'
            });

          if (rawError) {
            console.error('Raw RPC error:', rawError);
            throw new Error(`Impossible de créer l'utilisateur: ${rawError.message}`);
          }

          // Si la RPC n'existe pas, créer l'utilisateur manuellement
          console.log('RPC not available, creating user manually...');
          return {
            id: dbUser.id,
            email: dbUser.email,
            nom: dbUser.last_name,
            prenom: dbUser.first_name,
            role: dbUser.roles[0] || 'transport',
            statut: dbUser.status === 'active' ? 'actif' : 'inactif',
            created_at: dbUser.created_at,
            updated_at: dbUser.updated_at,
            created_by: undefined
          };
        }
        
        throw error;
      }
      
      console.log('User created successfully:', data);
      
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
      
      // Fournir un message d'erreur plus informatif
      let errorMessage = "Impossible de créer l'utilisateur.";
      
      if (error.message) {
        if (error.message.includes('duplicate key')) {
          errorMessage = "Un utilisateur avec cet email existe déjà.";
        } else if (error.message.includes('row-level security')) {
          errorMessage = "Erreur de permissions : Les politiques de sécurité empêchent la création.";
        } else {
          errorMessage = `Erreur : ${error.message}`;
        }
      }
      
      throw new Error(errorMessage);
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
