
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
      console.log('Loading user data for:', authUser.email);
      
      // Vérifier si c'est l'admin par défaut
      if (authUser.email === 'sdbkmanagement@gmail.com') {
        const userWithRole: UserWithRole = {
          id: authUser.id,
          nom: 'Admin',
          prenom: 'SDBK',
          email: authUser.email,
          role: 'admin',
          permissions: ['all']
        };
        console.log('Admin user loaded:', userWithRole);
        setUser(userWithRole);
        return;
      }

      // Essayer de charger depuis la table users
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', authUser.email)
        .maybeSingle();

      if (error) {
        console.error('Error loading user data:', error);
        // Si erreur, créer un utilisateur par défaut
        const defaultUser: UserWithRole = {
          id: authUser.id,
          nom: 'Utilisateur',
          prenom: 'Nouveau',
          email: authUser.email,
          role: 'transport',
          permissions: []
        };
        setUser(defaultUser);
        return;
      }

      if (data) {
        const userWithRole: UserWithRole = {
          id: data.id,
          nom: data.last_name || 'Nom',
          prenom: data.first_name || 'Prénom',
          email: data.email,
          role: (data.roles?.[0] as UserRole) || 'transport',
          permissions: data.roles?.includes('admin') ? ['all'] : []
        };

        console.log('User loaded successfully:', userWithRole);
        setUser(userWithRole);
      } else {
        // Créer un utilisateur par défaut si pas trouvé
        const defaultUser: UserWithRole = {
          id: authUser.id,
          nom: 'Utilisateur',
          prenom: 'Nouveau',
          email: authUser.email,
          role: 'transport',
          permissions: []
        };
        setUser(defaultUser);
      }
    } catch (error) {
      console.error('Error in loadUser:', error);
      // En cas d'erreur, créer un utilisateur par défaut
      const defaultUser: UserWithRole = {
        id: authUser.id,
        nom: 'Utilisateur',
        prenom: 'Nouveau',
        email: authUser.email,
        role: 'transport',
        permissions: []
      };
      setUser(defaultUser);
    }
  };

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        console.log('Initializing auth...');
        
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user && mounted) {
          await loadUser(session.user);
        }
      } catch (error) {
        console.error('Error during auth initialization:', error);
      } finally {
        if (mounted) {
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
    if (user.role === 'admin') return true;
    return user.permissions.includes(permission) || user.permissions.includes('all');
  };

  const hasRole = (role: string): boolean => {
    if (!user) return false;
    return user.role === role || user.role === 'admin';
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
