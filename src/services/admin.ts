
import { supabase } from '@/integrations/supabase/client';
import type { SystemUser, RolePermission, AdminAuditLog, AppRole, AppPermission } from '@/types/admin';

export const adminService = {
  // Gestion des utilisateurs
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

  async createUser(user: Omit<SystemUser, 'id' | 'created_at' | 'updated_at' | 'created_by'>): Promise<SystemUser> {
    const { data, error } = await supabase
      .from('users')
      .insert([user])
      .select()
      .single();
    
    if (error) throw error;
    return data;
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

  async toggleUserStatus(id: string, statut: 'actif' | 'inactif' | 'suspendu'): Promise<SystemUser> {
    return this.updateUser(id, { statut });
  },

  // Gestion des rôles et permissions
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

  // Audit et logs
  async getAuditLogs(limit: number = 100): Promise<AdminAuditLog[]> {
    const { data, error } = await supabase
      .from('admin_audit_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    return data || [];
  },

  async getLoginAttempts(email?: string, limit: number = 50) {
    let query = supabase
      .from('login_attempts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (email) {
      query = query.eq('email', email);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  // Statistiques
  async getUserStats() {
    const { data: users, error } = await supabase
      .from('users')
      .select('statut, role');
    
    if (error) throw error;

    const stats = {
      total: users.length,
      actifs: users.filter(u => u.statut === 'actif').length,
      inactifs: users.filter(u => u.statut === 'inactif').length,
      suspendus: users.filter(u => u.statut === 'suspendu').length,
      byRole: {} as Record<string, number>
    };

    users.forEach(user => {
      stats.byRole[user.role] = (stats.byRole[user.role] || 0) + 1;
    });

    return stats;
  },

  // Vérification des permissions
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
