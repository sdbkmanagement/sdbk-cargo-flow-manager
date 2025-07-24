
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
      id: log.id,
      user_id: log.user_id || '',
      action: log.action,
      target_type: log.target_type,
      target_id: log.target_id || '',
      details: typeof log.details === 'object' && log.details !== null 
        ? log.details as Record<string, any>
        : {},
      created_at: log.created_at,
      ip_address: log.ip_address ? String(log.ip_address) : undefined
    }));
  },

  async getLoginAttempts(email?: string, limit: number = 50): Promise<LoginAttempt[]> {
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
    
    return (data || []).map(attempt => ({
      id: attempt.id,
      email: attempt.email,
      success: attempt.success,
      ip_address: attempt.ip_address ? String(attempt.ip_address) : undefined,
      error_message: attempt.error_message || undefined,
      created_at: attempt.created_at
    }));
  }
};
