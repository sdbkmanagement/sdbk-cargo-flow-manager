
import { supabase } from '@/integrations/supabase/client';
import type { AdminAuditLog, LoginAttempt } from '@/types/admin';

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
    
    // Fix the ip_address type conversion
    return (data || []).map(attempt => ({
      ...attempt,
      ip_address: attempt.ip_address ? String(attempt.ip_address) : undefined
    }));
  }
};
