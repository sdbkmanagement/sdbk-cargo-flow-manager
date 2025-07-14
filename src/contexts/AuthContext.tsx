
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { UserRole, UserWithRole } from '@/types';

interface AuthContextType {
  user: UserWithRole | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
  hasRole: (role: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserWithRole | null>(null);
  const [loading, setLoading] = useState(true);

  const loadUser = async (authUser: User) => {
    try {
      console.log('🔄 Loading user data for:', authUser.email);
      
      // Récupérer les données depuis la table users avec retry
      let retryCount = 0;
      let userData = null;
      
      while (retryCount < 3 && !userData) {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('email', authUser.email)
          .single();

        if (data && !error) {
          userData = data;
          break;
        }
        
        console.log(`Retry ${retryCount + 1} for user data:`, { error });
        retryCount++;
        
        if (retryCount < 3) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      console.log('📊 User data from database:', userData);

      if (userData) {
        const userWithRole: UserWithRole = {
          id: userData.id,
          nom: userData.last_name || 'Utilisateur',
          prenom: userData.first_name || 'Nouveau',
          email: authUser.email || userData.email,
          role: userData.roles?.[0] || 'transport',
          roles: userData.roles || ['transport'],
          module_permissions: userData.module_permissions || [],
          permissions: userData.roles?.includes('admin') ? ['all'] : userData.module_permissions || []
        };
        
        console.log('✅ User loaded from database:', userWithRole);
        setUser(userWithRole);
      } else {
        console.log('⚠️ No user data found, creating default user');
        const defaultUser = await createDefaultUser(authUser);
        setUser(defaultUser);
      }
      
    } catch (error) {
      console.error('💥 Error in loadUser:', error);
      const defaultUser = await createDefaultUser(authUser);
      setUser(defaultUser);
    }
  };

  const createDefaultUser = async (authUser: User): Promise<UserWithRole> => {
    // Vérifier si c'est l'admin par défaut
    if (authUser.email === 'sdbkmanagement@gmail.com') {
      const adminUser = {
        id: authUser.id,
        nom: 'Système',
        prenom: 'Admin',
        email: authUser.email,
        role: 'admin' as UserRole,
        roles: ['admin'] as UserRole[],
        module_permissions: ['fleet', 'drivers', 'rh', 'cargo', 'missions', 'billing', 'dashboard'],
        permissions: ['all']
      };

      // Créer l'utilisateur admin dans la base si nécessaire
      try {
        await supabase
          .from('users')
          .upsert({
            id: authUser.id,
            email: authUser.email,
            first_name: 'Admin',
            last_name: 'Système',
            roles: ['admin'],
            status: 'active',
            module_permissions: ['fleet', 'drivers', 'rh', 'cargo', 'missions', 'billing', 'dashboard']
          });
      } catch (error) {
        console.error('Error creating admin user:', error);
      }

      return adminUser;
    }

    // Utilisateur par défaut
    const defaultUser = {
      id: authUser.id,
      nom: 'Utilisateur',
      prenom: 'Nouveau',
      email: authUser.email || '',
      role: 'transport' as UserRole,
      roles: ['transport'] as UserRole[],
      module_permissions: ['fleet', 'drivers', 'missions'],
      permissions: []
    };

    // Créer l'utilisateur par défaut dans la base si nécessaire
    try {
      await supabase
        .from('users')
        .upsert({
          id: authUser.id,
          email: authUser.email,
          first_name: 'Nouveau',
          last_name: 'Utilisateur',
          roles: ['transport'],
          status: 'active',
          module_permissions: ['fleet', 'drivers', 'missions']
        });
    } catch (error) {
      console.error('Error creating default user:', error);
    }

    return defaultUser;
  };

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        console.log('🚀 Initializing auth...');
        setLoading(true);
        
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user && mounted) {
          await loadUser(session.user);
        } else if (mounted) {
          console.log('🚫 No active session found');
          setUser(null);
        }
      } catch (error) {
        console.error('💥 Error during auth initialization:', error);
        if (mounted) {
          setUser(null);
        }
      } finally {
        if (mounted) {
          console.log('✅ Auth initialization completed');
          setLoading(false);
        }
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Auth state changed:', event);
        
        if (!mounted) return;

        setLoading(true);

        try {
          if (event === 'SIGNED_IN' && session?.user) {
            await loadUser(session.user);
          } else if (event === 'SIGNED_OUT') {
            setUser(null);
          }
        } catch (error) {
          console.error('Error handling auth state change:', error);
          setUser(null);
        } finally {
          if (mounted) {
            setLoading(false);
          }
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    console.log('🔑 Attempting sign in for:', email);
    setLoading(true);
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        console.error('💥 Sign in error:', error);
        throw error;
      }
    } finally {
      // Le loading sera géré par onAuthStateChange
    }
  };

  const signOut = async () => {
    console.log('👋 Signing out...');
    setLoading(true);
    
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('💥 Sign out error:', error);
        throw error;
      }
    } finally {
      // Le loading sera géré par onAuthStateChange
    }
  };

  // Alias pour la compatibilité
  const login = signIn;
  const logout = signOut;

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    const userRoles = user.roles || [user.role];
    if (userRoles.includes('admin')) return true;
    return user.permissions.includes(permission) || user.permissions.includes('all');
  };

  const hasRole = (role: string): boolean => {
    if (!user) return false;
    const userRoles = user.roles || [user.role];
    return userRoles.includes(role as UserRole) || userRoles.includes('admin');
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      signIn, 
      signOut, 
      login, 
      logout, 
      hasPermission, 
      hasRole 
    }}>
      {children}
    </AuthContext.Provider>
  );
};
