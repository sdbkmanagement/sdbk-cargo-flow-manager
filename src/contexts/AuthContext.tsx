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

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(false);

  const login = async (email: string, password: string) => {
    console.log('🔐 Tentative de connexion pour:', email);
    setLoading(true);
    
    try {
      const cleanEmail = email.trim();
      
      // 1. Vérifier si l'utilisateur existe dans la table users
      console.log('🔍 Recherche utilisateur dans la table users...');
      const { data: existingUser, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('email', cleanEmail)
        .eq('status', 'active')
        .single();

      if (userError) {
        console.error('❌ Erreur lors de la vérification utilisateur:', userError);
        setLoading(false);
        return { success: false, error: 'Utilisateur non trouvé dans la base de données' };
      }

      console.log('✅ Utilisateur trouvé:', existingUser);

      // 2. Tenter la connexion avec Supabase Auth
      console.log('🔐 Tentative de connexion Auth...');
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password
      });

      if (authError) {
        console.error('❌ Erreur Auth:', authError);
        setLoading(false);
        return { success: false, error: 'Identifiants invalides' };
      }

      console.log('✅ Connexion Auth réussie:', authData.user?.id);

      // 3. Synchroniser l'ID Auth avec la table users si nécessaire
      if (authData.user && existingUser.id !== authData.user.id) {
        console.log('🔄 Synchronisation des IDs...');
        const { error: syncError } = await supabase
          .from('users')
          .update({ id: authData.user.id })
          .eq('email', cleanEmail);

        if (syncError) {
          console.error('⚠️ Erreur de synchronisation:', syncError);
        } else {
          console.log('✅ ID synchronisé avec succès');
          existingUser.id = authData.user.id;
        }
      }

      // 4. Construire les données utilisateur
      const userData = buildUserData(existingUser);
      console.log('✅ Données utilisateur construites:', userData);
      
      setUser(userData);
      setLoading(false);
      return { success: true };

    } catch (error: any) {
      console.error('❌ Exception lors de la connexion:', error);
      setLoading(false);
      return { success: false, error: 'Erreur de connexion' };
    }
  };

  const buildUserData = (dbUser: any): AuthUser => {
    const userRoles = dbUser.roles || ['transport'];
    
    // Utiliser les permissions de modules définies en base de données
    // Ne calculer automatiquement que pour les admins ou si aucune permission n'est définie
    let modulePermissions: string[] = [];
    
    if (dbUser.module_permissions && dbUser.module_permissions.length > 0) {
      // Utiliser les permissions explicites de la base de données
      modulePermissions = dbUser.module_permissions;
      console.log('📋 Utilisation des permissions explicites de la DB:', modulePermissions);
    } else if (userRoles.includes('admin')) {
      // Pour les admins, donner accès à tout
      modulePermissions = getModulePermissionsByRoles(['admin']);
      console.log('👑 Permissions admin automatiques:', modulePermissions);
    } else {
      // Pour les autres, utiliser les permissions par défaut du rôle
      modulePermissions = getModulePermissionsByRoles(userRoles);
      console.log('🎯 Permissions par défaut du rôle:', modulePermissions);
    }
    
    // Toujours ajouter le dashboard pour tous les utilisateurs connectés
    if (!modulePermissions.includes('dashboard')) {
      modulePermissions.push('dashboard');
    }
    
    const authUser: AuthUser = {
      id: dbUser.id,
      email: dbUser.email,
      nom: dbUser.last_name || '',
      prenom: dbUser.first_name || '',
      role: userRoles[0] || 'transport',
      roles: userRoles,
      module_permissions: modulePermissions,
      permissions: ['read', 'write']
    };

    // Donner toutes les permissions aux admins
    if (authUser.roles?.includes('admin')) {
      authUser.permissions = ['read', 'write', 'delete', 'validate', 'export', 'admin'];
    }

    return authUser;
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
