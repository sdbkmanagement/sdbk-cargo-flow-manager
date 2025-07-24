
import React, { createContext, useContext, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSecureAuth } from '@/hooks/useSecureAuth';
import { supabase } from '@/integrations/supabase/client';

interface SecureAuthContextType {
  logSecurityEvent: (eventType: string, details: any) => Promise<void>;
  validateSecureAction: (action: string) => Promise<boolean>;
  secureLogout: () => Promise<void>;
}

const SecureAuthContext = createContext<SecureAuthContextType | undefined>(undefined);

export const useSecureAuthContext = () => {
  const context = useContext(SecureAuthContext);
  if (context === undefined) {
    throw new Error('useSecureAuthContext must be used within a SecureAuthProvider');
  }
  return context;
};

export const SecureAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const { logSecurityEvent, validateSecureAction, secureLogout: baseSecureLogout } = useSecureAuth();

  useEffect(() => {
    // Log user session start
    if (user) {
      logSecurityEvent('session_start', {
        user_id: user.id,
        user_email: user.email,
        user_roles: user.roles
      });
    }

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          await logSecurityEvent('user_login', {
            user_id: session.user.id,
            user_email: session.user.email
          });
        }
        
        if (event === 'SIGNED_OUT') {
          await logSecurityEvent('user_logout', {
            user_id: user?.id,
            user_email: user?.email
          });
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [user, logSecurityEvent]);

  const secureLogout = async () => {
    await baseSecureLogout();
    await logout();
  };

  const value = {
    logSecurityEvent,
    validateSecureAction,
    secureLogout
  };

  return (
    <SecureAuthContext.Provider value={value}>
      {children}
    </SecureAuthContext.Provider>
  );
};
