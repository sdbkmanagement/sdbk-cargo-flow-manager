
import { supabase } from '@/integrations/supabase/client';
import type { RolePermission, AppRole, AppPermission } from '@/types/admin';

export const rolePermissionService = {
  async getRolePermissions(): Promise<RolePermission[]> {
    const { data, error } = await supabase
      .from('role_permissions')
      .select('*')
      .order('role', { ascending: true });
    
    if (error) throw error;
    return data || [];
  },

  async getPermissionsByRole(role: AppRole): Promise<RolePermission[]> {
    const { data, error } = await supabase
      .from('role_permissions')
      .select('*')
      .eq('role', role);
    
    if (error) throw error;
    return data || [];
  },

  async updateRolePermissions(
    role: AppRole, 
    module: string, 
    permissions: AppPermission[]
  ): Promise<void> {
    // Supprimer les permissions existantes pour ce rôle et module
    await supabase
      .from('role_permissions')
      .delete()
      .eq('role', role)
      .eq('module', module);

    // Insérer les nouvelles permissions
    if (permissions.length > 0) {
      const insertData = permissions.map(permission => ({
        role,
        module,
        permission
      }));

      const { error } = await supabase
        .from('role_permissions')
        .insert(insertData);
      
      if (error) throw error;
    }
  },

  async checkUserPermission(email: string, module: string, permission: AppPermission): Promise<boolean> {
    const { data, error } = await supabase
      .from('users')
      .select(`
        role,
        role_permissions!inner(permission)
      `)
      .eq('email', email)
      .eq('statut', 'actif')
      .eq('role_permissions.module', module)
      .eq('role_permissions.permission', permission);

    if (error) return false;
    return data && data.length > 0;
  }
};
