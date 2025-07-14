
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

// Créer le contexte avec une valeur par défaut
const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => ({ success: false }),
  logout: async () => {},
  hasPermission: () => false,
  hasRole: () => false,
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  return context; // Pas besoin de vérifier undefined car on a une valeur par défaut
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('🔍 Initialisation de l\'authentification');
    
    let mounted = true;

    // Fonction pour traiter une session Supabase
    const handleSession = (session: Session | null) => {
      if (!mounted) return;
      
      console.log('📊 Traitement de la session:', !!session);
      
      if (session?.user) {
        // Créer un utilisateur admin par défaut
        const authUser: AuthUser = {
          id: session.user.id,
          email: session.user.email || '',
          nom: 'Admin',
          prenom: 'Utilisateur',
          role: 'admin',
          roles: ['admin'],
          module_permissions: ['dashboard', 'fleet', 'missions', 'drivers', 'cargo', 'billing', 'validations', 'rh', 'admin'],
          permissions: ['read', 'write', 'delete', 'validate', 'export', 'admin']
        };
        
        console.log('✅ Utilisateur connecté:', authUser.email);
        setUser(authUser);
      } else {
        console.log('🚪 Aucune session active');
        setUser(null);
      }
      
      setLoading(false);
    };

    // Écouter les changements d'authentification en premier
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔔 Changement d\'état auth:', event);
      handleSession(session);
    });

    // Vérifier la session actuelle
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('❌ Erreur lors de la récupération de session:', error);
          if (mounted) setLoading(false);
          return;
        }
        handleSession(session);
      } catch (error) {
        console.error('❌ Exception lors de la vérification de session:', error);
        if (mounted) setLoading(false);
      }
    };

    checkSession();

    // Cleanup
    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    console.log('🔐 Tentative de connexion pour:', email);
    setLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password
      });

      if (error) {
        console.error('❌ Erreur de connexion:', error.message);
        setLoading(false);
        return { success: false, error: error.message };
      }

      if (data.user) {
        console.log('✅ Connexion réussie');
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
      console.log('🚪 Déconnexion...');
      await supabase.auth.signOut();
      setUser(null);
    } catch (error) {
      console.error('❌ Erreur de déconnexion:', error);
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

  const value = {
    user,
    loading,
    login,
    logout,
    hasPermission,
    hasRole
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
