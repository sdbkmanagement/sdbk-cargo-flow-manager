
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';

interface AuthUser {
  id: string;
  email: string;
  nom: string;
  prenom: string;
  role: string;
  roles?: string[];
  module_permissions?: string[];
  permissions?: string[];
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  initialized: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  hasRole: (role: string) => boolean;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);

  const loadUserFromDatabase = useCallback(async (authUser: User): Promise<AuthUser | null> => {
    try {
      console.log('🔄 Loading user data for:', authUser.email);
      
      const { data: userData, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', authUser.email)
        .single();

      if (error || !userData) {
        console.error('❌ Error loading user:', error);
        return null;
      }

      const authUserData: AuthUser = {
        id: userData.id,
        nom: userData.last_name || '',
        prenom: userData.first_name || '',
        email: userData.email,
        role: userData.roles?.[0] || 'transport',
        roles: userData.roles || ['transport'],
        module_permissions: userData.module_permissions || [],
        permissions: userData.roles?.includes('admin') ? ['all'] : userData.module_permissions || []
      };

      console.log('✅ User loaded successfully:', authUserData);
      return authUserData;
    } catch (error) {
      console.error('❌ Exception loading user:', error);
      return null;
    }
  }, []);

  const initializeAuth = useCallback(async () => {
    console.log('🚀 Initializing auth...');
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        console.log('👤 Active session found');
        const userData = await loadUserFromDatabase(session.user);
        setUser(userData);
      } else {
        console.log('🚫 No active session');
        setUser(null);
      }
    } catch (error) {
      console.error('❌ Auth initialization error:', error);
      setUser(null);
    } finally {
      setInitialized(true);
      console.log('✅ Auth initialization completed');
    }
  }, [loadUserFromDatabase]);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 Auth state changed:', event);
      
      if (event === 'SIGNED_IN' && session?.user) {
        console.log('✅ User signed in, loading profile...');
        setLoading(true);
        const userData = await loadUserFromDatabase(session.user);
        setUser(userData);
        setLoading(false);
      } else if (event === 'SIGNED_OUT') {
        console.log('👋 User signed out');
        setUser(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [loadUserFromDatabase]);

  const login = async (email: string, password: string) => {
    console.log('🔐 Attempting login for:', email);
    setLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password
      });

      if (error) {
        console.error('❌ Login error:', error);
        setLoading(false);
        return { success: false, error: error.message };
      }

      if (data.user) {
        console.log('✅ Login successful, loading user data...');
        const userData = await loadUserFromDatabase(data.user);
        setUser(userData);
        setLoading(false);
        return { success: true };
      }

      setLoading(false);
      return { success: false, error: 'Échec de la connexion' };
    } catch (error: any) {
      console.error('❌ Login exception:', error);
      setLoading(false);
      return { success: false, error: error.message || 'Erreur de connexion' };
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      await supabase.auth.signOut();
      setUser(null);
      setLoading(false);
    } catch (error) {
      console.error('❌ Logout error:', error);
      setLoading(false);
    }
  };

  const hasRole = (role: string): boolean => {
    if (!user) return false;
    const userRoles = user.roles || [user.role];
    return userRoles.includes(role) || userRoles.includes('admin');
  };

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    if (user.roles?.includes('admin')) return true;
    return user.permissions?.includes(permission) || user.permissions?.includes('all') || false;
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      initialized,
      login,
      logout,
      hasRole,
      hasPermission
    }}>
      {children}
    </AuthContext.Provider>
  );
};
