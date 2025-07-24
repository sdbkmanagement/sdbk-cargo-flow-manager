
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

// Fonction pour obtenir les permissions de modules selon les rôles
const getModulePermissionsByRoles = (roles: string[]): string[] => {
  const modulePermissions = new Set<string>();
  
  roles.forEach(role => {
    switch (role) {
      case 'admin':
        // L'admin a accès à tous les modules
        modulePermissions.add('fleet');
        modulePermissions.add('missions');
        modulePermissions.add('drivers');
        modulePermissions.add('billing');
        modulePermissions.add('validations');
        modulePermissions.add('rh');
        modulePermissions.add('admin');
        modulePermissions.add('dashboard');
        break;
      case 'transport':
        // Transport a accès à Flotte et Missions
        modulePermissions.add('fleet');
        modulePermissions.add('missions');
        modulePermissions.add('dashboard');
        break;
      case 'transitaire':
        // Transitaire a accès aux Missions
        modulePermissions.add('missions');
        modulePermissions.add('dashboard');
        break;
      case 'rh':
        // RH a accès aux modules RH et Chauffeurs
        modulePermissions.add('rh');
        modulePermissions.add('drivers');
        modulePermissions.add('dashboard');
        break;
      case 'facturation':
        // Facturation a accès aux Missions et Facturation
        modulePermissions.add('missions');
        modulePermissions.add('billing');
        modulePermissions.add('dashboard');
        break;
      case 'maintenance':
        // Maintenance a accès aux validations et flotte
        modulePermissions.add('validations');
        modulePermissions.add('fleet');
        modulePermissions.add('dashboard');
        break;
      case 'administratif':
        // Administratif a accès aux validations
        modulePermissions.add('validations');
        modulePermissions.add('dashboard');
        break;
      case 'hsecq':
        // HSECQ a accès aux validations
        modulePermissions.add('validations');
        modulePermissions.add('dashboard');
        break;
      case 'obc':
        // OBC a accès aux validations et missions
        modulePermissions.add('validations');
        modulePermissions.add('missions');
        modulePermissions.add('dashboard');
        break;
      case 'direction':
        // Direction a accès à tout sauf admin
        modulePermissions.add('fleet');
        modulePermissions.add('missions');
        modulePermissions.add('drivers');
        modulePermissions.add('billing');
        modulePermissions.add('validations');
        modulePermissions.add('rh');
        modulePermissions.add('dashboard');
        break;
      case 'directeur_exploitation':
        // Directeur exploitation a accès à tout sauf admin
        modulePermissions.add('fleet');
        modulePermissions.add('missions');
        modulePermissions.add('drivers');
        modulePermissions.add('billing');
        modulePermissions.add('validations');
        modulePermissions.add('rh');
        modulePermissions.add('dashboard');
        break;
      default:
        // Rôle par défaut : accès au dashboard uniquement
        modulePermissions.add('dashboard');
    }
  });
  
  return Array.from(modulePermissions);
};

// Fonction pour créer automatiquement un utilisateur manquant dans la table users
const createMissingUser = async (supabaseUserId: string, email: string): Promise<AuthUser | null> => {
  try {
    console.log('🔄 Création automatique de l\'utilisateur manquant:', email);
    
    // Déterminer le rôle par défaut basé sur l'email
    let defaultRole: 'admin' | 'transport' = 'transport';
    if (email.includes('admin') || email.includes('management')) {
      defaultRole = 'admin';
    }
    
    const userRoles = [defaultRole];
    const modulePermissions = getModulePermissionsByRoles(userRoles);
    
    // Créer l'utilisateur dans la table users avec l'ID de Supabase Auth
    const { data: newUser, error } = await supabase
      .from('users')
      .insert({
        id: supabaseUserId, // Utiliser l'ID de Supabase Auth
        email: email,
        first_name: '',
        last_name: '',
        roles: userRoles,
        module_permissions: modulePermissions,
        status: 'active',
        password_hash: 'managed_by_supabase_auth'
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Erreur lors de la création automatique de l\'utilisateur:', error);
      return null;
    }

    console.log('✅ Utilisateur créé automatiquement:', newUser);
    
    const authUser: AuthUser = {
      id: supabaseUserId,
      email: newUser.email,
      nom: newUser.last_name || '',
      prenom: newUser.first_name || '',
      role: userRoles[0],
      roles: userRoles,
      module_permissions: modulePermissions,
      permissions: defaultRole === 'admin' ? ['read', 'write', 'delete', 'validate', 'export', 'admin'] : ['read', 'write']
    };

    return authUser;
  } catch (error) {
    console.error('❌ Exception lors de la création automatique de l\'utilisateur:', error);
    return null;
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchUserData = async (supabaseUserId: string, email: string) => {
    try {
      console.log('🔍 Récupération des données utilisateur pour:', email);
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', supabaseUserId) // Chercher par ID au lieu d'email
        .eq('status', 'active')
        .single();

      if (error && error.code === 'PGRST116') {
        // Utilisateur non trouvé dans la table users, le créer automatiquement
        console.log('⚠️ Utilisateur non trouvé, création automatique...');
        return await createMissingUser(supabaseUserId, email);
      }

      if (error) {
        console.error('❌ Erreur lors de la récupération des données utilisateur:', error);
        return null;
      }

      if (data) {
        console.log('✅ Données utilisateur récupérées:', data);
        
        const userRoles = data.roles || ['transport'];
        const modulePermissions = getModulePermissionsByRoles(userRoles);
        
        const authUser: AuthUser = {
          id: supabaseUserId,
          email: data.email,
          nom: data.last_name || '',
          prenom: data.first_name || '',
          role: userRoles[0] || 'transport',
          roles: userRoles,
          module_permissions: modulePermissions,
          permissions: ['read', 'write']
        };

        // Donner toutes les permissions aux admins
        if (authUser.roles?.includes('admin')) {
          authUser.permissions = ['read', 'write', 'delete', 'validate', 'export', 'admin'];
        }

        console.log('✅ Permissions de modules attribuées:', modulePermissions);
        return authUser;
      }

      return null;
    } catch (error) {
      console.error('❌ Exception lors de la récupération des données utilisateur:', error);
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
          setLoading(false);
          return { success: true };
        } else {
          console.error('❌ Impossible de récupérer les données utilisateur');
          setLoading(false);
          return { success: false, error: 'Impossible de récupérer les données utilisateur' };
        }
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
