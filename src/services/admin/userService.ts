
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
    console.log('Creating user with Supabase Auth:', userData);
    
    try {
      if (!userData.password) {
        throw new Error('Le mot de passe est requis');
      }

      // Mapper le rôle vers le type correct
      const mappedRole = this.mapRoleToDbType(userData.role);

      // 1. Créer l'utilisateur via Supabase Auth
      console.log('Step 1: Creating Auth user...');
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        user_metadata: {
          first_name: userData.prenom,
          last_name: userData.nom
        },
        email_confirm: true
      });

      if (authError) {
        console.error('Auth user creation error:', authError);
        throw new Error(`Impossible de créer le compte: ${authError.message}`);
      }

      if (!authData.user) {
        throw new Error('Aucun utilisateur créé');
      }

      console.log('Auth user created successfully:', authData.user.id);

      // 2. Attendre un peu pour que le trigger fonctionne
      console.log('Step 2: Waiting for trigger...');
      await new Promise(resolve => setTimeout(resolve, 2000));

      // 3. Vérifier si l'utilisateur existe dans la table users
      console.log('Step 3: Checking if user exists in users table...');
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authData.user.id)
        .maybeSingle();

      if (checkError) {
        console.error('Error checking existing user:', checkError);
      }

      if (!existingUser) {
        console.log('User not found in users table, creating manually...');
        // Créer manuellement si le trigger n'a pas fonctionné
        const { data: createdUser, error: createError } = await supabase
          .from('users')
          .insert({
            id: authData.user.id,
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
          console.error('Manual user creation error:', createError);
          // Nettoyer l'utilisateur auth
          await supabase.auth.admin.deleteUser(authData.user.id);
          throw new Error(`Impossible de créer le profil utilisateur: ${createError.message}`);
        }

        console.log('User created manually:', createdUser);
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
      }

      // 4. Mettre à jour le rôle si l'utilisateur existe déjà
      console.log('Step 4: Updating user role...');
      const { data: updatedUser, error: updateError } = await supabase
        .from('users')
        .update({
          roles: [mappedRole],
          first_name: userData.prenom,
          last_name: userData.nom,
          status: userData.statut === 'actif' ? 'active' : 'inactive',
          updated_at: new Date().toISOString()
        })
        .eq('id', authData.user.id)
        .select()
        .single();

      if (updateError) {
        console.error('User profile update error:', updateError);
        // Essayer de nettoyer l'utilisateur auth créé
        await supabase.auth.admin.deleteUser(authData.user.id);
        throw new Error(`Impossible de configurer le profil utilisateur: ${updateError.message}`);
      }

      console.log('User profile updated successfully:', updatedUser);

      return {
        id: updatedUser.id,
        email: updatedUser.email,
        nom: updatedUser.last_name || '',
        prenom: updatedUser.first_name || '',
        role: updatedUser.roles?.[0] || 'transport',
        statut: updatedUser.status === 'active' ? 'actif' : 'inactif',
        created_at: updatedUser.created_at || '',
        updated_at: updatedUser.updated_at || '',
        created_by: updatedUser.created_by || undefined
      };

    } catch (error: any) {
      console.error('Complete error in createUser:', error);
      
      // Fournir un message d'erreur plus informatif
      let errorMessage = "Impossible de créer l'utilisateur.";
      
      if (error.message) {
        if (error.message.includes('User already registered')) {
          errorMessage = "Un utilisateur avec cet email existe déjà.";
        } else if (error.message.includes('Invalid email')) {
          errorMessage = "Format d'email invalide.";
        } else if (error.message.includes('Password should be')) {
          errorMessage = "Le mot de passe doit contenir au moins 6 caractères.";
        } else {
          errorMessage = `Erreur : ${error.message}`;
        }
      }
      
      throw new Error(errorMessage);
    }
  },

  // Fonction helper pour mapper les rôles vers les types de base de données
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
      'transitaire': 'transport', // Fallback vers transport
      'directeur_exploitation': 'direction' // Fallback vers direction
    };
    
    return roleMapping[role] || 'transport';
  },

  async updateUser(id: string, userData: Partial<SystemUser>): Promise<SystemUser> {
    // Convert to database format
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
    // Supprimer d'abord de Supabase Auth
    try {
      const { error: authError } = await supabase.auth.admin.deleteUser(id);
      if (authError) {
        console.warn('Could not delete auth user:', authError.message);
      }
    } catch (error) {
      console.warn('Could not delete auth user:', error);
    }

    // Supprimer de la table users (ce qui devrait se faire automatiquement avec le cascade)
    const { error: profileError } = await supabase
      .from('users')
      .delete()
      .eq('id', id);

    if (profileError) throw profileError;
  },

  async resetPassword(userId: string): Promise<{ tempPassword: string }> {
    // Générer un mot de passe temporaire
    const tempPassword = 'TempPass' + Math.random().toString(36).substring(2, 8) + '!';
    
    try {
      // Mettre à jour le mot de passe via Supabase Auth Admin
      const { error } = await supabase.auth.admin.updateUserById(userId, {
        password: tempPassword
      });

      if (error) {
        throw new Error(`Impossible de réinitialiser le mot de passe: ${error.message}`);
      }

      return { tempPassword };
    } catch (error: any) {
      throw new Error(`Erreur lors de la réinitialisation: ${error.message}`);
    }
  }
};
