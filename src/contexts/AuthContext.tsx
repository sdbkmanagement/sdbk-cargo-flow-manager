
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

  // Fetch user profile data from our users table
  const fetchUserProfile = async (supabaseUser: SupabaseUser): Promise<User | null> => {
    try {
      console.log('Fetching user profile for:', supabaseUser.id);
      
      // D'abord chercher par ID
      let { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', supabaseUser.id)
        .single();

      // Si pas trouvé par ID, chercher par email
      if (error && error.code === 'PGRST116') {
        console.log('User not found by ID, searching by email:', supabaseUser.email);
        const { data: emailData, error: emailError } = await supabase
          .from('users')
          .select('*')
          .eq('email', supabaseUser.email)
          .single();
        
        if (emailError) {
          console.log('User not found by email, creating new user...');
          // Créer l'utilisateur s'il n'existe pas
          const roleToAssign = supabaseUser.email === 'sdbkmanagement@gmail.com' ? 'admin' : 'transport';
          
          const { data: newUser, error: createError } = await supabase
            .from('users')
            .insert({
              id: supabaseUser.id,
              email: supabaseUser.email,
              first_name: supabaseUser.user_metadata?.first_name || 'Admin',
              last_name: supabaseUser.user_metadata?.last_name || 'Système',
              roles: [roleToAssign],
              status: 'active'
            })
            .select()
            .single();
          
          if (createError) {
            console.error('Error creating user:', createError);
            return null;
          }
          
          data = newUser;
        } else {
          data = emailData;
          // Mettre à jour l'ID si nécessaire
          if (data.id !== supabaseUser.id) {
            await supabase
              .from('users')
              .update({ id: supabaseUser.id })
              .eq('email', supabaseUser.email);
            data.id = supabaseUser.id;
          }
        }
      } else if (error) {
        console.error('Error fetching user profile:', error);
        return null;
      }

      if (!data) {
        console.log('No user profile found');
        return null;
      }

      console.log('User profile fetched:', data);

      // S'assurer que sdbkmanagement@gmail.com a le rôle admin
      if (data.email === 'sdbkmanagement@gmail.com' && !data.roles?.includes('admin')) {
        console.log('Upgrading sdbkmanagement@gmail.com to admin role');
        const { data: updatedUser } = await supabase
          .from('users')
          .update({ 
            roles: ['admin'],
            first_name: 'Admin',
            last_name: 'Système',
            status: 'active'
          })
          .eq('email', 'sdbkmanagement@gmail.com')
          .select()
          .single();
        
        if (updatedUser) {
          data = updatedUser;
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

  // Initialize auth state
  useEffect(() => {
    console.log('Setting up auth state listener...');
    
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        setSession(session);
        
        if (session?.user) {
          // Fetch user profile
          const userProfile = await fetchUserProfile(session.user);
          setUser(userProfile);
        } else {
          setUser(null);
        }
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      console.log('Initial session check:', session?.user?.email);
      setSession(session);
      
      if (session?.user) {
        const userProfile = await fetchUserProfile(session.user);
        setUser(userProfile);
      }
      setLoading(false);
    });

    return () => {
      console.log('Cleaning up auth subscription');
      subscription.unsubscribe();
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
    // User profile will be fetched automatically by the auth state listener
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
    // L'admin a tous les droits
    if (user.role === 'admin' || user.permissions.includes('all')) {
      return true;
    }
    return user.permissions.includes(permission);
  };

  const hasRole = (role: UserRole) => {
    if (!user) return false;
    // L'admin peut accéder à tous les rôles
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
