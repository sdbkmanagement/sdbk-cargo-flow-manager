
import { supabase } from '@/integrations/supabase/client';

export const rolePermissionService = {
  async getUserRole(): Promise<string | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('users')
        .select('role')
        .eq('email', user.email)
        .eq('statut', 'actif')
        .single();

      if (error || !data) return null;
      return data.role;
    } catch (error) {
      console.error('Erreur lors de la récupération du rôle:', error);
      return null;
    }
  },

  async hasRole(requiredRole: string): Promise<boolean> {
    try {
      const userRole = await this.getUserRole();
      return userRole === requiredRole || userRole === 'admin';
    } catch (error) {
      console.error('Erreur lors de la vérification du rôle:', error);
      return false;
    }
  },

  async getRolePermissions() {
    const { data, error } = await supabase
      .from('role_permissions')
      .select('*')
      .order('role', { ascending: true });
    
    if (error) throw error;
    return data || [];
  },

  async getPermissionsByRole(role: string) {
    const { data, error } = await supabase
      .from('role_permissions')
      .select('*')
      .eq('role', role)
      .order('module', { ascending: true });
    
    if (error) throw error;
    return data || [];
  },

  async updateRolePermissions(role: string, module: string, permissions: string[]) {
    // Supprimer les permissions existantes pour ce rôle et module
    await supabase
      .from('role_permissions')
      .delete()
      .eq('role', role)
      .eq('module', module);

    // Insérer les nouvelles permissions
    if (permissions.length > 0) {
      const permissionsData = permissions.map(permission => ({
        role,
        module,
        permission
      }));

      const { error } = await supabase
        .from('role_permissions')
        .insert(permissionsData);

      if (error) throw error;
    }
  }
};
