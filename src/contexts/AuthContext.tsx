
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
      
      // Récupérer les données depuis la table users
      const { data: userData, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', authUser.email)
        .single();

      console.log('📊 User data from database:', { userData, error });

      if (userData && !error) {
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
        const defaultUser = createDefaultUser(authUser);
        setUser(defaultUser);
      }
      
    } catch (error) {
      console.error('💥 Error in loadUser:', error);
      const defaultUser = createDefaultUser(authUser);
      setUser(defaultUser);
    }
  };

  const createDefaultUser = (authUser: User): UserWithRole => {
    // Vérifier si c'est l'admin par défaut
    if (authUser.email === 'sdbkmanagement@gmail.com') {
      return {
        id: authUser.id,
        nom: 'Système',
        prenom: 'Admin',
        email: authUser.email,
        role: 'admin',
        roles: ['admin'],
        module_permissions: ['fleet', 'drivers', 'rh', 'cargo', 'missions', 'billing', 'dashboard'],
        permissions: ['all']
      };
    }

    // Utilisateur par défaut
    return {
      id: authUser.id,
      nom: 'Utilisateur',
      prenom: 'Nouveau',
      email: authUser.email || '',
      role: 'transport',
      roles: ['transport'],
      module_permissions: ['fleet', 'drivers', 'missions'],
      permissions: []
    };
  };

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        console.log('🚀 Initializing auth...');
        
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user && mounted) {
          await loadUser(session.user);
        } else if (mounted) {
          console.log('🚫 No active session found');
        }
      } catch (error) {
        console.error('💥 Error during auth initialization:', error);
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

        if (event === 'SIGNED_IN' && session?.user) {
          await loadUser(session.user);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
        }
        
        if (mounted) {
          setLoading(false);
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
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      console.error('💥 Sign in error:', error);
      throw error;
    }
  };

  const signOut = async () => {
    console.log('👋 Signing out...');
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('💥 Sign out error:', error);
      throw error;
    }
    setUser(null);
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
