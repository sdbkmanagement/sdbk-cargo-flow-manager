
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
  const [initialized, setInitialized] = useState(false);

  const createDefaultUser = async (authUser: User): Promise<UserWithRole> => {
    console.log('🔧 Creating default user for:', authUser.email);
    
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

      // Créer l'utilisateur admin dans la base de manière asynchrone
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

    // Créer l'utilisateur par défaut dans la base de manière asynchrone
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

  const loadUser = async (authUser: User) => {
    try {
      console.log('🔄 Loading user data for:', authUser.email);
      
      // Récupérer les données depuis la table users
      const { data: userData, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', authUser.email)
        .single();

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
        const defaultUser = await createDefaultUser(authUser);
        setUser(defaultUser);
      }
      
    } catch (error) {
      console.error('💥 Error in loadUser:', error);
      const defaultUser = await createDefaultUser(authUser);
      setUser(defaultUser);
    }
  };

  useEffect(() => {
    let mounted = true;
    
    const initializeAuth = async () => {
      try {
        console.log('🚀 Initializing auth...');
        
        // Obtenir la session actuelle
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          if (mounted) {
            setUser(null);
            setLoading(false);
            setInitialized(true);
          }
          return;
        }
        
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
          setInitialized(true);
        }
      }
    };

    // Configurer l'écoute des changements d'état d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Auth state changed:', event);
        
        if (!mounted || !initialized) return;

        if (event === 'SIGNED_IN' && session?.user) {
          setLoading(true);
          await loadUser(session.user);
          setLoading(false);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setLoading(false);
        }
      }
    );

    // Initialiser l'authentification
    if (!initialized) {
      initializeAuth();
    }

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [initialized]);

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
        setLoading(false);
        throw error;
      }
    } catch (error) {
      setLoading(false);
      throw error;
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
      setLoading(false);
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
