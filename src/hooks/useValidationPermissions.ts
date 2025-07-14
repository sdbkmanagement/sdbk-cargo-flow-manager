
import { useAuth } from '@/contexts/AuthContext';

export const useValidationPermissions = () => {
  const { user, hasRole } = useAuth();

  const canValidateEtape = (etape: string): boolean => {
    if (!user) return false;
    
    // L'admin peut tout faire
    if (user.role === 'admin' || (user.roles && user.roles.includes('admin'))) return true;
    
    // Vérifier si l'utilisateur a le rôle spécifique pour cette étape
    const userRoles = user.roles || [user.role];
    
    switch (etape) {
      case 'maintenance':
        return userRoles.includes('maintenance');
      case 'administratif':
        return userRoles.includes('administratif');
      case 'hsecq':
        return userRoles.includes('hsecq');
      case 'obc':
        return userRoles.includes('obc');
      default:
        return false;
    }
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
    return user.roles || [user.role];
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
