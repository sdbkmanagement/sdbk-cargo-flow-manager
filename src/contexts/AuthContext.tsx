
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Session, User } from '@supabase/supabase-js';

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
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
  hasRole: (role: string) => boolean;
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
  const [loading, setLoading] = useState(true);

  // Initialisation de l'état d'authentification
  useEffect(() => {
    console.log('🔍 Initialisation de l\'authentification');
    
    // Vérifier la session actuelle
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        console.log('📊 Session actuelle:', !!session);
        
        if (session?.user) {
          await handleUserSession(session.user);
        }
      } catch (error) {
        console.error('❌ Erreur lors de la vérification de session:', error);
      } finally {
        setLoading(false);
      }
    };

    // Écouter les changements d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔔 Changement d\'état auth:', event, !!session);
      
      if (event === 'SIGNED_IN' && session?.user) {
        await handleUserSession(session.user);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
      }
      
      setLoading(false);
    });

    checkSession();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleUserSession = async (supabaseUser: User) => {
    try {
      console.log('👤 Traitement de l\'utilisateur:', supabaseUser.email);
      
      // Récupérer les données utilisateur depuis la base
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', supabaseUser.email)
        .eq('status', 'active')
        .single();

      if (error) {
        console.error('❌ Erreur récupération utilisateur:', error);
        // Créer un utilisateur par défaut si non trouvé
        const defaultUser: AuthUser = {
          id: supabaseUser.id,
          email: supabaseUser.email || '',
          nom: 'Utilisateur',
          prenom: 'Admin',
          role: 'admin',
          roles: ['admin'],
          module_permissions: ['dashboard', 'fleet', 'missions', 'drivers', 'cargo', 'billing', 'validations', 'rh', 'admin'],
          permissions: ['read', 'write', 'delete', 'validate', 'export', 'admin']
        };
        setUser(defaultUser);
        return;
      }

      if (data) {
        console.log('✅ Données utilisateur trouvées');
        
        const authUser: AuthUser = {
          id: supabaseUser.id,
          email: data.email,
          nom: data.last_name || 'Admin',
          prenom: data.first_name || 'Utilisateur',
          role: data.roles?.[0] || 'admin',
          roles: data.roles || ['admin'],
          module_permissions: data.module_permissions || ['dashboard'],
          permissions: ['read', 'write']
        };

        // Donner tous les accès aux admins
        if (authUser.roles?.includes('admin')) {
          authUser.module_permissions = ['fleet', 'missions', 'drivers', 'cargo', 'billing', 'validations', 'rh', 'admin', 'dashboard'];
          authUser.permissions = ['read', 'write', 'delete', 'validate', 'export', 'admin'];
        }

        setUser(authUser);
      }
    } catch (error) {
      console.error('❌ Exception handleUserSession:', error);
      // En cas d'erreur, créer un utilisateur admin par défaut
      const fallbackUser: AuthUser = {
        id: supabaseUser.id,
        email: supabaseUser.email || '',
        nom: 'Admin',
        prenom: 'Utilisateur',
        role: 'admin',
        roles: ['admin'],
        module_permissions: ['dashboard', 'fleet', 'missions', 'drivers', 'cargo', 'billing', 'validations', 'rh', 'admin'],
        permissions: ['read', 'write', 'delete', 'validate', 'export', 'admin']
      };
      setUser(fallbackUser);
    }
  };

  const login = async (email: string, password: string) => {
    console.log('🔐 Tentative de connexion pour:', email);
    setLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password
      });

      if (error) {
        console.error('❌ Erreur de connexion:', error);
        setLoading(false);
        return { success: false, error: error.message };
      }

      if (data.user) {
        console.log('✅ Connexion Supabase réussie');
        // L'utilisateur sera traité dans onAuthStateChange
        return { success: true };
      }

      setLoading(false);
      return { success: false, error: 'Échec de la connexion' };
    } catch (error: any) {
      console.error('❌ Exception lors de la connexion:', error);
      setLoading(false);
      return { success: false, error: 'Erreur de connexion' };
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      console.log('🚪 Déconnexion...');
      await supabase.auth.signOut();
      setUser(null);
      setLoading(false);
    } catch (error) {
      console.error('❌ Erreur de déconnexion:', error);
      setLoading(false);
    }
  };

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    
    // L'admin a toutes les permissions
    if (user.roles?.includes('admin')) return true;
    
    // Vérifier les permissions spécifiques
    const userPermissions = user.permissions || [];
    const modulePermissions = user.module_permissions || [];
    
    // Permissions de base pour tous les utilisateurs connectés
    const basePermissions = ['dashboard', 'read'];
    
    return basePermissions.includes(permission) ||
           userPermissions.includes(permission) ||
           modulePermissions.includes(permission) ||
           permission.endsWith('_read');
  };

  const hasRole = (role: string): boolean => {
    if (!user) return false;
    
    // Vérifier le rôle principal
    if (user.role === role) return true;
    
    // Vérifier dans la liste des rôles
    const userRoles = user.roles || [];
    return userRoles.includes(role);
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      logout,
      hasPermission,
      hasRole
    }}>
      {children}
    </AuthContext.Provider>
  );
};
