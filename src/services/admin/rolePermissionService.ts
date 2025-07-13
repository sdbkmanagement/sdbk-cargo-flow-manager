
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

  // Temporary implementation using local data instead of database table
  async getRolePermissions() {
    // Return mock data structure for now
    const mockPermissions = [
      { id: '1', role: 'admin', module: 'fleet', permission: 'admin', created_at: new Date().toISOString() },
      { id: '2', role: 'transport', module: 'fleet', permission: 'read', created_at: new Date().toISOString() },
      { id: '3', role: 'maintenance', module: 'fleet', permission: 'write', created_at: new Date().toISOString() },
    ];
    
    return mockPermissions;
  },

  async getPermissionsByRole(role: string) {
    // Return mock data filtered by role
    const allPermissions = await this.getRolePermissions();
    return allPermissions.filter(p => p.role === role);
  },

  async updateRolePermissions(role: string, module: string, permissions: string[]) {
    // For now, just log the operation since we don't have the table yet
    console.log('Updating permissions:', { role, module, permissions });
    
    // In a real implementation, this would update the role_permissions table
    // For now, we'll just return success
    return Promise.resolve();
  }
};
