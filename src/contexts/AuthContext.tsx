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
        modulePermissions.add('clients');
        modulePermissions.add('societe');
        modulePermissions.add('validations');
        modulePermissions.add('rh');
        modulePermissions.add('admin');
        modulePermissions.add('dashboard');
        break;
      case 'transport':
        // Transport a accès à Flotte et Missions
        modulePermissions.add('fleet');
        modulePermissions.add('missions');
        modulePermissions.add('clients');
        modulePermissions.add('dashboard');
        break;
      case 'transitaire':
        // Transitaire a accès aux Missions avec permissions complètes
        modulePermissions.add('missions');
        modulePermissions.add('clients');
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
        modulePermissions.add('clients');
        modulePermissions.add('dashboard');
        break;
      case 'maintenance':
        // Maintenance a accès aux validations et flotte
        modulePermissions.add('validations');
        modulePermissions.add('fleet');
        modulePermissions.add('dashboard');
        break;
      case 'administratif':
        // Administratif a accès aux validations, société et au dashboard
        modulePermissions.add('validations');
        modulePermissions.add('societe');
        modulePermissions.add('dashboard');
        console.log('✅ Permissions accordées au rôle administratif:', ['validations', 'societe', 'dashboard']);
        break;
      case 'hseq':
        // HSEQ a accès aux validations
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
        modulePermissions.add('clients');
        modulePermissions.add('societe');
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
        modulePermissions.add('clients');
        modulePermissions.add('societe');
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

      // 1. Authentification Supabase Auth
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

      // 2. Récupérer ou synchroniser l'utilisateur via fonction sécurisée
      console.log('🔍 Récupération/Synchronisation utilisateur...');
      const { data: dbUser, error: userError } = await supabase
        .rpc('get_or_sync_user_by_auth');

      if (userError || !dbUser) {
        console.error('❌ Erreur lors de la récupération utilisateur:', userError);
        setLoading(false);
        return { success: false, error: 'Erreur de récupération des données utilisateur' };
      }

      console.log('✅ Utilisateur récupéré:', dbUser);

      // 3. Construire les données utilisateur
      const userData = await buildUserData(dbUser);
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

  const buildUserData = async (dbUser: any): Promise<AuthUser> => {
    // Récupérer les rôles depuis la table user_roles (sécurisée)
    const { data: userRolesData, error: rolesError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', dbUser.id);

    if (rolesError) {
      console.error('❌ Erreur lors de la récupération des rôles:', rolesError);
    }

    let userRoles = userRolesData?.map((r: any) => r.role) || [];
    
    // Si pas de rôles dans user_roles, créer le rôle par défaut
    if (userRoles.length === 0) {
      console.warn('⚠️ Aucun rôle défini, attribution du rôle transport par défaut');
      
      const { error: insertError } = await supabase
        .from('user_roles')
        .insert({ user_id: dbUser.id, role: 'transport' });
      
      if (!insertError) {
        userRoles = ['transport'];
      }
    }
    
    console.log('🔧 Construction données utilisateur pour rôles depuis user_roles:', userRoles);
    
    // Pour les transitaires, s'assurer qu'ils ont bien les permissions
    let modulePermissions: string[] = [];
    
    if (dbUser.module_permissions && dbUser.module_permissions.length > 0) {
      // Utiliser les permissions explicites de la base de données
      modulePermissions = dbUser.module_permissions;
      console.log('📋 Utilisation des permissions explicites de la DB:', modulePermissions);
    } else {
      // Calculer les permissions selon les rôles
      modulePermissions = getModulePermissionsByRoles(userRoles);
      console.log('🎯 Permissions calculées selon les rôles:', modulePermissions);
    }
    
    // Toujours ajouter le dashboard pour tous les utilisateurs connectés
    if (!modulePermissions.includes('dashboard')) {
      modulePermissions.push('dashboard');
    }
    
    // S'assurer que les transitaires ont accès aux missions
    if (userRoles.includes('transitaire') && !modulePermissions.includes('missions')) {
      modulePermissions.push('missions');
      console.log('✅ Permission missions ajoutée pour le transitaire');
    }

    // S'assurer que les rôles de validation ont accès aux validations
    const validationRoles = ['maintenance', 'administratif', 'hseq', 'obc'];
    if (userRoles.some(role => validationRoles.includes(role)) && !modulePermissions.includes('validations')) {
      modulePermissions.push('validations');
      console.log('✅ Permission validations ajoutée pour le rôle de validation:', userRoles);
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

    // Donner les permissions d'écriture aux transitaires pour les missions
    if (authUser.roles?.includes('transitaire')) {
      authUser.permissions = ['read', 'write', 'missions_write', 'missions_read'];
      console.log('✅ Permissions missions accordées au transitaire');
    }

    // Donner les permissions de validation aux rôles appropriés
    if (authUser.roles?.some(role => validationRoles.includes(role))) {
      authUser.permissions = [...(authUser.permissions || []), 'validate', 'validations_write', 'validations_read'];
      console.log('✅ Permissions validation accordées au rôle:', userRoles);
    }

    console.log('📊 Utilisateur final construit:', {
      email: authUser.email,
      roles: authUser.roles,
      modulePermissions: authUser.module_permissions,
      permissions: authUser.permissions
    });

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
    
    // Permissions spéciales pour les transitaires
    if (user.roles?.includes('transitaire')) {
      if (permission === 'missions_read' || permission === 'missions_write') {
        return true;
      }
    }
    
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
