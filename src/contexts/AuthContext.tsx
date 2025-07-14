
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

  const createDefaultUser = (authUser: User): UserWithRole => {
    // Vérifier si c'est l'admin par défaut
    if (authUser.email === 'sdbkmanagement@gmail.com') {
      return {
        id: authUser.id,
        nom: 'Admin',
        prenom: 'SDBK',
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
      email: authUser.email,
      role: 'transport',
      roles: ['transport'],
      module_permissions: ['fleet', 'drivers', 'missions'],
      permissions: []
    };
  };

  const loadUser = async (authUser: User) => {
    try {
      console.log('Loading user data for:', authUser.email);
      
      // Essayer de récupérer les données utilisateur depuis la base
      const { data: userData, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading user data:', error);
      }

      if (userData) {
        const userWithRole: UserWithRole = {
          id: userData.id,
          nom: userData.last_name || 'Utilisateur',
          prenom: userData.first_name || 'Nouveau',
          email: authUser.email,
          role: userData.roles?.[0] || 'transport',
          roles: userData.roles || ['transport'],
          module_permissions: userData.module_permissions || [],
          permissions: userData.roles?.includes('admin') ? ['all'] : []
        };
        setUser(userWithRole);
        console.log('User loaded from database:', userWithRole);
      } else {
        // Créer un utilisateur par défaut si pas trouvé en base
        const defaultUser = createDefaultUser(authUser);
        setUser(defaultUser);
        console.log('Default user created:', defaultUser);
      }
      
    } catch (error) {
      console.error('Error in loadUser:', error);
      // En cas d'erreur, créer quand même un utilisateur par défaut
      const defaultUser = createDefaultUser(authUser);
      setUser(defaultUser);
    }
  };

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        console.log('Initializing auth...');
        
        // Définir un timeout pour éviter les blocages infinis
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Auth timeout')), 5000)
        );
        
        const sessionPromise = supabase.auth.getSession();
        
        const { data: { session } } = await Promise.race([sessionPromise, timeoutPromise]) as any;
        
        if (session?.user && mounted) {
          await loadUser(session.user);
        } else if (mounted) {
          console.log('No active session found');
        }
      } catch (error) {
        console.error('Error during auth initialization:', error);
      } finally {
        if (mounted) {
          console.log('Auth initialization completed, setting loading to false');
          setLoading(false);
        }
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event);
        
        if (!mounted) return;

        if (event === 'SIGNED_IN' && session?.user) {
          await loadUser(session.user);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
        }
        
        setLoading(false);
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    console.log('Attempting sign in for:', email);
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  };

  const signOut = async () => {
    console.log('Signing out...');
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Sign out error:', error);
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
    return userRoles.includes(role) || userRoles.includes('admin');
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
