
import React, { createContext, useContext, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

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
  const [loading, setLoading] = useState(false);

  const logSecurityEvent = async (eventType: string, details: any) => {
    try {
      await supabase
        .from('security_audit_log')
        .insert({
          user_id: user?.id,
          event_type: eventType,
          event_details: details,
          created_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  };

  const fetchUserData = async (supabaseUserId: string, email: string) => {
    try {
      console.log('🔍 Récupération des données utilisateur pour:', email);
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .eq('status', 'active')
        .single();

      if (error) {
        console.error('❌ Erreur lors de la récupération des données utilisateur:', error);
        await logSecurityEvent('user_data_fetch_failed', {
          email,
          error: error.message
        });
        return null;
      }

      if (data) {
        console.log('✅ Données utilisateur récupérées:', data);
        
        const authUser: AuthUser = {
          id: supabaseUserId,
          email: data.email,
          nom: data.last_name || '',
          prenom: data.first_name || '',
          role: data.roles?.[0] || 'transport',
          roles: data.roles || ['transport'],
          module_permissions: data.module_permissions || ['dashboard'],
          permissions: ['read', 'write']
        };

        // Donner tous les accès aux admins
        if (authUser.roles?.includes('admin')) {
          authUser.module_permissions = ['fleet', 'missions', 'drivers', 'cargo', 'billing', 'validations', 'rh', 'admin', 'dashboard'];
          authUser.permissions = ['read', 'write', 'delete', 'validate', 'export', 'admin'];
        }

        return authUser;
      }

      return null;
    } catch (error) {
      console.error('❌ Exception lors de la récupération des données utilisateur:', error);
      await logSecurityEvent('user_data_fetch_exception', {
        email,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return null;
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
        await logSecurityEvent('login_failed', {
          email,
          error: error.message
        });
        setLoading(false);
        return { success: false, error: error.message };
      }

      if (data.user) {
        console.log('✅ Connexion Supabase réussie, récupération des données...');
        
        // Récupérer les données utilisateur depuis la base
        const userData = await fetchUserData(data.user.id, data.user.email || '');
        
        if (userData) {
          console.log('✅ Utilisateur connecté:', userData);
          setUser(userData);
          
          await logSecurityEvent('login_success', {
            user_id: userData.id,
            email: userData.email,
            roles: userData.roles
          });
          
          setLoading(false);
          return { success: true };
        } else {
          console.error('❌ Impossible de récupérer les données utilisateur');
          await logSecurityEvent('login_failed', {
            email,
            error: 'User data not found'
          });
          setLoading(false);
          return { success: false, error: 'Utilisateur non trouvé dans la base de données' };
        }
      }

      setLoading(false);
      return { success: false, error: 'Échec de la connexion' };
    } catch (error: any) {
      console.error('❌ Exception lors de la connexion:', error);
      await logSecurityEvent('login_exception', {
        email,
        error: error.message
      });
      setLoading(false);
      return { success: false, error: 'Erreur de connexion' };
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      
      await logSecurityEvent('logout_initiated', {
        user_id: user?.id,
        email: user?.email
      });
      
      await supabase.auth.signOut();
      setUser(null);
      setLoading(false);
    } catch (error) {
      console.error('❌ Erreur de déconnexion:', error);
      await logSecurityEvent('logout_failed', {
        user_id: user?.id,
        email: user?.email,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
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
           permission.endsWith('_read'); // Permet la lecture par défaut
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
