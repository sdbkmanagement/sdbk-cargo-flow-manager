
import { supabase } from '@/integrations/supabase/client';

export const rolePermissionService = {
  async getUserRole(): Promise<string | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('users')
        .select('roles')
        .eq('email', user.email)
        .eq('status', 'active')
        .single();

      if (error || !data || !data.roles || data.roles.length === 0) return null;
      return data.roles[0]; // Return first role
    } catch (error) {
      console.error('Erreur lors de la récupération du rôle:', error);
      return null;
    }
  },

  async hasRole(requiredRole: string): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data, error } = await supabase
        .from('users')
        .select('roles')
        .eq('email', user.email)
        .eq('status', 'active')
        .single();

      if (error || !data || !data.roles) return false;
      
      return data.roles.includes(requiredRole as any) || data.roles.includes('admin' as any);
    } catch (error) {
      console.error('Erreur lors de la vérification du rôle:', error);
      return false;
    }
  },

  async getRolePermissions() {
    try {
      const { data, error } = await supabase
        .from('role_permissions')
        .select('*')
        .order('role', { ascending: true })
        .order('module', { ascending: true });

      if (error) {
        console.error('Erreur lors de la récupération des permissions:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Exception lors de la récupération des permissions:', error);
      throw error;
    }
  },

  async getPermissionsByRole(role: string) {
    try {
      const { data, error } = await supabase
        .from('role_permissions')
        .select('*')
        .eq('role', role)
        .order('module', { ascending: true });

      if (error) {
        console.error('Erreur lors de la récupération des permissions par rôle:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Exception lors de la récupération des permissions par rôle:', error);
      throw error;
    }
  },

  async updateRolePermissions(role: string, module: string, permissions: string[]) {
    try {
      // Supprimer les permissions existantes pour ce rôle et module
      const { error: deleteError } = await supabase
        .from('role_permissions')
        .delete()
        .eq('role', role)
        .eq('module', module);

      if (deleteError) {
        console.error('Erreur lors de la suppression des permissions:', deleteError);
        throw deleteError;
      }

      // Ajouter les nouvelles permissions
      if (permissions.length > 0) {
        const permissionsToInsert = permissions.map(permission => ({
          role,
          module,
          permission
        }));

        const { error: insertError } = await supabase
          .from('role_permissions')
          .insert(permissionsToInsert);

        if (insertError) {
          console.error('Erreur lors de l\'insertion des permissions:', insertError);
          throw insertError;
        }
      }

      console.log('Permissions mises à jour avec succès:', { role, module, permissions });
      return { success: true };
    } catch (error) {
      console.error('Exception lors de la mise à jour des permissions:', error);
      throw error;
    }
  },

  async hasPermission(role: string, module: string, permission: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('role_permissions')
        .select('id')
        .eq('role', role)
        .eq('module', module)
        .eq('permission', permission)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Erreur lors de la vérification de permission:', error);
        return false;
      }

      return !!data;
    } catch (error) {
      console.error('Exception lors de la vérification de permission:', error);
      return false;
    }
  }
};
