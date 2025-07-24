
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export const useSecureAuth = () => {
  const { user } = useAuth();

  const logSecurityEvent = async (eventType: string, details: any) => {
    try {
      await supabase
        .from('security_audit_log')
        .insert({
          user_id: user?.id,
          event_type: eventType,
          event_details: details,
          ip_address: await getClientIP(),
          user_agent: navigator.userAgent,
          created_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  };

  const getClientIP = async (): Promise<string | null> => {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch (error) {
      console.error('Failed to get client IP:', error);
      return null;
    }
  };

  const validateSecureAction = async (action: string): Promise<boolean> => {
    if (!user) {
      await logSecurityEvent('unauthorized_access_attempt', {
        action,
        reason: 'no_user'
      });
      return false;
    }

    if (user.roles?.includes('admin')) {
      await logSecurityEvent('admin_action', {
        action,
        user_id: user.id,
        user_email: user.email
      });
      return true;
    }

    await logSecurityEvent('unauthorized_access_attempt', {
      action,
      user_id: user.id,
      user_email: user.email,
      reason: 'insufficient_permissions'
    });
    return false;
  };

  const secureLogout = async () => {
    await logSecurityEvent('user_logout', {
      user_id: user?.id,
      user_email: user?.email
    });
  };

  return {
    logSecurityEvent,
    validateSecureAction,
    secureLogout
  };
};
