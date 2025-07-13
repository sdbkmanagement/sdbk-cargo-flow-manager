
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User as SupabaseUser, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { User, UserRole } from '@/types';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
  hasRole: (role: UserRole) => boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Simplified user profile fetching
  const fetchUserProfile = async (supabaseUser: SupabaseUser): Promise<User | null> => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', supabaseUser.email)
        .maybeSingle();

      if (error) {
        console.error('Error fetching user profile:', error);
        return null;
      }

      if (!data) {
        console.log('No user profile found');
        return null;
      }

      // Ensure admin role for sdbkmanagement@gmail.com
      if (data.email === 'sdbkmanagement@gmail.com' && !data.roles?.includes('admin')) {
        const { data: updatedUser } = await supabase
          .from('users')
          .update({ 
            roles: ['admin'],
            status: 'active'
          })
          .eq('email', 'sdbkmanagement@gmail.com')
          .select()
          .single();
        
        if (updatedUser) {
          data.roles = updatedUser.roles;
        }
      }

      return {
        id: data.id,
        nom: data.last_name || '',
        prenom: data.first_name || '',
        email: data.email,
        role: data.roles?.[0] || 'transport',
        permissions: data.roles?.includes('admin') ? ['all'] : getPermissionsForRole(data.roles?.[0] || 'transport')
      };
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
      return null;
    }
  };

  const getPermissionsForRole = (role: string): string[] => {
    const rolePermissions: Record<string, string[]> = {
      admin: ['all'],
      maintenance: ['fleet_read', 'fleet_write', 'validation_maintenance'],
      transport: ['missions_read', 'missions_write', 'drivers_read', 'drivers_write'],
      rh: ['drivers_read', 'drivers_write', 'hr_read', 'hr_write'],
      administratif: ['validations_read', 'validations_write'],
      hsecq: ['validations_read', 'validations_write'],
      obc: ['validations_read', 'validations_write'],
      facturation: ['billing_read', 'billing_write'],
      direction: ['all'],
      transitaire: ['cargo_read', 'cargo_write'],
      directeur_exploitation: ['all']
    };
    return rolePermissions[role] || ['read'];
  };

  // Simplified auth state setup
  useEffect(() => {
    let mounted = true;

    const setupAuth = async () => {
      try {
        // Get initial session
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        
        if (!mounted) return;

        if (initialSession?.user) {
          const userProfile = await fetchUserProfile(initialSession.user);
          if (mounted) {
            setSession(initialSession);
            setUser(userProfile);
          }
        }

        // Set up auth listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, newSession) => {
            if (!mounted) return;

            setSession(newSession);
            
            if (newSession?.user) {
              const userProfile = await fetchUserProfile(newSession.user);
              if (mounted) {
                setUser(userProfile);
              }
            } else {
              setUser(null);
            }
          }
        );

        if (mounted) {
          setLoading(false);
        }

        return () => {
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error('Auth setup error:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    setupAuth();

    return () => {
      mounted = false;
    };
  }, []);

  const login = async (email: string, password: string) => {
    console.log('Attempting login for:', email);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('Login error:', error.message);
      throw new Error(error.message);
    }

    console.log('Login successful for:', data.user?.email);
  };

  const logout = async () => {
    console.log('Logging out...');
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Logout error:', error);
    }
    setUser(null);
    setSession(null);
  };

  const hasPermission = (permission: string) => {
    if (!user) return false;
    if (user.role === 'admin' || user.permissions.includes('all')) {
      return true;
    }
    return user.permissions.includes(permission);
  };

  const hasRole = (role: UserRole) => {
    if (!user) return false;
    return user.role === role || user.role === 'admin';
  };

  return (
    <AuthContext.Provider value={{ user, session, login, logout, hasPermission, hasRole, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
