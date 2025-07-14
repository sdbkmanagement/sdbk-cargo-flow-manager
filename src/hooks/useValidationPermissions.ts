
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
      userRoles: user.roles
    });
    
    // L'admin peut tout faire
    if (user.role === 'admin' || hasRole('admin')) {
      console.log('✅ Permission accordée - Admin');
      return true;
    }
    
    // Vérifier si l'utilisateur a le rôle spécifique pour cette étape
    const userRoles = user.roles || [user.role];
    
    console.log('🔍 Tous les rôles de l\'utilisateur:', userRoles);
    
    let hasPermission = false;
    
    switch (etape) {
      case 'maintenance':
        hasPermission = userRoles.includes('maintenance');
        break;
      case 'administratif':
        hasPermission = userRoles.includes('administratif');
        break;
      case 'hsecq':
        hasPermission = userRoles.includes('hsecq');
        break;
      case 'obc':
        hasPermission = userRoles.includes('obc');
        break;
      default:
        hasPermission = false;
    }
    
    console.log(`${hasPermission ? '✅' : '❌'} Permission ${etape}:`, {
      required: etape,
      userRoles,
      hasPermission
    });
    
    return hasPermission;
  };

  const hasModulePermission = (module: string): boolean => {
    if (!user) return false;
    
    // L'admin a accès à tout
    if (user.role === 'admin' || hasRole('admin')) return true;
    
    // Vérifier les permissions de module
    const modulePermissions = user.module_permissions || [];
    return modulePermissions.includes(module);
  };

  const hasValidationAccess = (): boolean => {
    if (!user) return false;
    
    // L'admin a accès à tout
    if (user.role === 'admin' || hasRole('admin')) return true;
    
    // Vérifier si l'utilisateur a au moins un rôle de validation
    const userRoles = user.roles || [user.role];
    
    const validationRoles = ['maintenance', 'administratif', 'hsecq', 'obc'];
    return validationRoles.some(role => userRoles.includes(role));
  };

  const getUserRole = (): string => {
    if (!user) return '';
    return user.role || '';
  };

  const getUserRoles = (): string[] => {
    if (!user) return [];
    return user.roles || [user.role];
  };

  const getUserName = (): string => {
    if (!user) return 'Utilisateur inconnu';
    return `${user.prenom || ''} ${user.nom || ''}`.trim() || user.email || 'Utilisateur';
  };

  return {
    canValidateEtape,
    hasModulePermission,
    hasValidationAccess,
    getUserRole,
    getUserRoles,
    getUserName
  };
};
