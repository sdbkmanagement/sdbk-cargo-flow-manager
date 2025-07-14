
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

  // Cache pour éviter les appels répétés
  const [userCache, setUserCache] = useState<Map<string, AuthUser>>(new Map());

  const loadUserFromDatabase = useCallback(async (authUser: User): Promise<AuthUser | null> => {
    try {
      // Vérifier le cache d'abord
      const cached = userCache.get(authUser.email!);
      if (cached) {
        console.log('✅ User loaded from cache:', authUser.email);
        return cached;
      }

      console.log('🔄 Loading user data for:', authUser.email);
      
      const { data: userData, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', authUser.email)
        .single();

      if (error) {
        console.error('❌ Error loading user:', error);
        return null;
      }

      if (!userData) {
        console.warn('⚠️ No user data found for:', authUser.email);
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

      // Mettre en cache
      setUserCache(prev => new Map(prev.set(authUser.email!, authUserData)));
      
      console.log('✅ User loaded from database:', authUserData);
      return authUserData;
    } catch (error) {
      console.error('❌ Exception loading user:', error);
      return null;
    }
  }, [userCache]);

  const initializeAuth = useCallback(async () => {
    if (initialized) return;

    console.log('🚀 Initializing auth...');
    setLoading(true);

    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('❌ Auth session error:', error);
        setUser(null);
      } else if (session?.user) {
        console.log('👤 Active session found for:', session.user.email);
        const userData = await loadUserFromDatabase(session.user);
        setUser(userData);
      } else {
        console.log('🚫 No active session found');
        setUser(null);
      }
    } catch (error) {
      console.error('❌ Auth initialization error:', error);
      setUser(null);
    } finally {
      setLoading(false);
      setInitialized(true);
      console.log('✅ Auth initialization completed');
    }
  }, [initialized, loadUserFromDatabase]);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 Auth state changed:', event);
      
      if (event === 'SIGNED_IN' && session?.user) {
        setLoading(true);
        const userData = await loadUserFromDatabase(session.user);
        setUser(userData);
        setLoading(false);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setUserCache(new Map()); // Clear cache on logout
      }
    });

    return () => subscription.unsubscribe();
  }, [loadUserFromDatabase]);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password
      });

      if (error) {
        console.error('❌ Login error:', error);
        return { success: false, error: error.message };
      }

      if (data.user) {
        const userData = await loadUserFromDatabase(data.user);
        setUser(userData);
        return { success: true };
      }

      return { success: false, error: 'Échec de la connexion' };
    } catch (error: any) {
      console.error('❌ Login exception:', error);
      return { success: false, error: error.message || 'Erreur de connexion' };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setUserCache(new Map()); // Clear cache
    } catch (error) {
      console.error('❌ Logout error:', error);
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
