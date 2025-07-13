
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { UserRole, UserWithRole } from '@/types';

interface AuthContextType {
  user: UserWithRole | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
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
      
      // Optimisation : ne charger les données que si l'utilisateur change
      if (user && user.email === authUser.email) {
        console.log('User data already loaded for:', authUser.email);
        return;
      }

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', authUser.email)
        .single();

      if (error) {
        console.error('Error loading user data:', error);
        throw error;
      }

      if (data) {
        const userWithRole: UserWithRole = {
          id: data.id,
          nom: data.last_name,
          prenom: data.first_name,
          email: data.email,
          role: (data.roles?.[0] as UserRole) || 'transport',
          permissions: data.roles?.includes('admin') ? ['all'] : []
        };

        console.log('User loaded successfully:', userWithRole);
        setUser(userWithRole);
      }
    } catch (error) {
      console.error('Error in loadUser:', error);
      setUser(null);
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
  }, []); // Retirer 'user' des dépendances pour éviter les boucles

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

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
