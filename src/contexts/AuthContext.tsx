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

// Fonction pour vérifier si l'utilisateur existe dans la table users
const checkExistingUser = async (email: string): Promise<any> => {
  try {
    console.log('🔍 Vérification utilisateur existant:', email);
    
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .eq('status', 'active')
      .single();

    if (error && error.code === 'PGRST116') {
      console.log('⚠️ Utilisateur non trouvé dans la table users');
      return null;
    }

    if (error) {
      console.error('❌ Erreur lors de la vérification utilisateur:', error);
      return null;
    }

    console.log('✅ Utilisateur trouvé dans la table users:', data);
    return data;
  } catch (error) {
    console.error('❌ Exception lors de la vérification utilisateur:', error);
    return null;
  }
};

// Fonction pour créer l'utilisateur Auth si nécessaire
const createAuthUserIfNeeded = async (email: string, password: string): Promise<any> => {
  try {
    console.log('🔐 Tentative de création utilisateur Auth pour:', email);
    
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password
    });

    if (error) {
      console.error('❌ Erreur création utilisateur Auth:', error);
      return null;
    }

    console.log('✅ Utilisateur Auth créé ou existe déjà:', data.user?.id);
    return data;
  } catch (error) {
    console.error('❌ Exception création utilisateur Auth:', error);
    return null;
  }
};

// Fonction pour synchroniser l'ID Auth avec la table users
const syncAuthIdWithUser = async (authUserId: string, userEmail: string): Promise<void> => {
  try {
    console.log('🔄 Synchronisation ID Auth avec table users');
    
    const { error } = await supabase
      .from('users')
      .update({ id: authUserId })
      .eq('email', userEmail);

    if (error) {
      console.error('❌ Erreur synchronisation ID:', error);
    } else {
      console.log('✅ ID Auth synchronisé avec succès');
    }
  } catch (error) {
    console.error('❌ Exception synchronisation ID:', error);
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(false);

  const login = async (email: string, password: string) => {
    console.log('🔐 Tentative de connexion pour:', email);
    setLoading(true);
    
    try {
      const cleanEmail = email.trim();
      
      // 1. Vérifier si l'utilisateur existe dans la table users
      const existingUser = await checkExistingUser(cleanEmail);
      if (!existingUser) {
        setLoading(false);
        return { success: false, error: 'Utilisateur non trouvé dans la base de données' };
      }

      // 2. Essayer de se connecter avec Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password
      });

      if (authError) {
        console.log('⚠️ Erreur Auth, tentative de création du compte Auth:', authError.message);
        
        // Si l'utilisateur n'existe pas dans Auth, le créer
        if (authError.message.includes('Invalid login credentials')) {
          const createResult = await createAuthUserIfNeeded(cleanEmail, password);
          if (createResult && createResult.user) {
            // Synchroniser l'ID Auth avec la table users
            await syncAuthIdWithUser(createResult.user.id, cleanEmail);
            
            // Réessayer la connexion
            const { data: retryData, error: retryError } = await supabase.auth.signInWithPassword({
              email: cleanEmail,
              password
            });
            
            if (retryError) {
              setLoading(false);
              return { success: false, error: 'Erreur lors de la reconnexion après création du compte' };
            }
            
            // Utiliser les données de la retry
            const userData = await buildUserData(retryData.user.id, existingUser);
            if (userData) {
              setUser(userData);
              setLoading(false);
              return { success: true };
            }
          }
        }
        
        setLoading(false);
        return { success: false, error: 'Erreur d\'authentification' };
      }

      // 3. Construire les données utilisateur
      const userData = await buildUserData(authData.user.id, existingUser);
      if (userData) {
        console.log('✅ Utilisateur connecté:', userData);
        setUser(userData);
        setLoading(false);
        return { success: true };
      }

      setLoading(false);
      return { success: false, error: 'Impossible de récupérer les données utilisateur' };
    } catch (error: any) {
      console.error('❌ Exception lors de la connexion:', error);
      setLoading(false);
      return { success: false, error: 'Erreur de connexion' };
    }
  };

  const buildUserData = async (authUserId: string, existingUser: any): Promise<AuthUser | null> => {
    try {
      const userRoles = existingUser.roles || ['transport'];
      const modulePermissions = getModulePermissionsByRoles(userRoles);
      
      const authUser: AuthUser = {
        id: authUserId,
        email: existingUser.email,
        nom: existingUser.last_name || '',
        prenom: existingUser.first_name || '',
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
    } catch (error) {
      console.error('❌ Exception lors de la construction des données utilisateur:', error);
      return null;
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
