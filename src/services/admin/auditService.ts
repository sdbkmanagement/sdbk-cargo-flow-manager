
import { supabase } from '@/integrations/supabase/client';
import type { AdminAuditLog, LoginAttempt } from '@/types/admin';

export const auditService = {
  async getAuditLogs(limit: number = 100): Promise<AdminAuditLog[]> {
    console.log('🔧 auditService.getAuditLogs - Début');
    
    const { data, error } = await supabase
      .from('admin_audit_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) {
      console.error('🔧 auditService.getAuditLogs - Erreur:', error);
      throw error;
    }
    
    console.log('🔧 auditService.getAuditLogs - Logs récupérés:', data?.length || 0);
    
    return (data || []).map(log => ({
      ...log,
      ip_address: log.ip_address ? String(log.ip_address) : undefined
    }));
  },

  async getLoginAttempts(email?: string, limit: number = 50): Promise<LoginAttempt[]> {
    console.log('🔧 auditService.getLoginAttempts - Début', { email, limit });
    
    let query = supabase
      .from('login_attempts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (email) {
      query = query.eq('email', email);
    }

    const { data, error } = await query;
    
    if (error) {
      console.error('🔧 auditService.getLoginAttempts - Erreur:', error);
      throw error;
    }
    
    console.log('🔧 auditService.getLoginAttempts - Tentatives récupérées:', data?.length || 0);
    
    return (data || []).map(attempt => ({
      ...attempt,
      ip_address: attempt.ip_address ? String(attempt.ip_address) : undefined
    }));
  }
};
