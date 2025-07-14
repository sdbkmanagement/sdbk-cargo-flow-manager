
import { useAuth } from '@/contexts/AuthContext';

export const useValidationPermissions = () => {
  const { user, hasRole } = useAuth();

  const canValidateEtape = (etape: string): boolean => {
    if (!user) {
      console.log('❌ Pas d\'utilisateur connecté');
      return false;
    }
    
    console.log('🔍 Vérification permission validation:', {
      etape,
      user: user.email,
      userRole: user.role,
      userRoles: user.roles,
      rawUser: user
    });
    
    // L'admin peut tout faire
    if (user.role === 'admin' || (user.roles && user.roles.includes('admin'))) {
      console.log('✅ Permission accordée - Admin');
      return true;
    }
    
    // Vérifier si l'utilisateur a le rôle spécifique pour cette étape
    const userRoles = user.roles || [];
    // Aussi vérifier le rôle principal si pas dans les rôles
    const allRoles = [...userRoles];
    if (user.role && !allRoles.includes(user.role)) {
      allRoles.push(user.role);
    }
    
    console.log('🔍 Tous les rôles de l\'utilisateur:', allRoles);
    
    let hasPermission = false;
    
    switch (etape) {
      case 'maintenance':
        hasPermission = allRoles.includes('maintenance');
        break;
      case 'administratif':
        hasPermission = allRoles.includes('administratif');
        break;
      case 'hsecq':
        hasPermission = allRoles.includes('hsecq');
        break;
      case 'obc':
        hasPermission = allRoles.includes('obc');
        break;
      default:
        hasPermission = false;
    }
    
    console.log(`${hasPermission ? '✅' : '❌'} Permission ${etape}:`, {
      required: etape,
      allRoles,
      hasPermission
    });
    
    return hasPermission;
  };

  const hasModulePermission = (module: string): boolean => {
    if (!user) return false;
    
    // L'admin a accès à tout
    if (user.role === 'admin' || (user.roles && user.roles.includes('admin'))) return true;
    
    // Vérifier les permissions de module
    const modulePermissions = user.module_permissions || [];
    return modulePermissions.includes(module);
  };

  const getUserRole = (): string => {
    if (!user) return '';
    return user.role || '';
  };

  const getUserRoles = (): string[] => {
    if (!user) return [];
    const userRoles = user.roles || [];
    const allRoles = [...userRoles];
    if (user.role && !allRoles.includes(user.role)) {
      allRoles.push(user.role);
    }
    return allRoles;
  };

  const getUserName = (): string => {
    if (!user) return 'Utilisateur inconnu';
    return `${user.prenom || ''} ${user.nom || ''}`.trim() || user.email || 'Utilisateur';
  };

  return {
    canValidateEtape,
    hasModulePermission,
    getUserRole,
    getUserRoles,
    getUserName
  };
};
