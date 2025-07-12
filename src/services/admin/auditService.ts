
import { supabase } from '@/integrations/supabase/client';

export const auditService = {
  async getUserAuditLogs(limit: number = 100) {
    const { data, error } = await supabase
      .from('user_audit_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    return data || [];
  },

  async getUserSessions(limit: number = 50) {
    const { data, error } = await supabase
      .from('user_sessions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }
};
