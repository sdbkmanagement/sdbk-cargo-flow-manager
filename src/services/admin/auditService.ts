
import { supabase } from '@/integrations/supabase/client';
import type { AdminAuditLog } from '@/types/admin';

export const auditService = {
  async getAuditLogs(limit: number = 100): Promise<AdminAuditLog[]> {
    const { data, error } = await supabase
      .from('admin_audit_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    return (data || []).map(log => ({
      ...log,
      ip_address: log.ip_address ? String(log.ip_address) : undefined
    }));
  },

  async getLoginAttempts(email?: string, limit: number = 50) {
    // Cette fonctionnalité n'est plus disponible car la table a été supprimée
    console.log('Login attempts table has been removed');
    return [];
  }
};
