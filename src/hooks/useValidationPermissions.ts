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
        console.log(`🔧 Vérification rôle maintenance: ${hasPermission}`);
        break;
      case 'administratif':
        hasPermission = userRoles.includes('administratif');
        console.log(`📋 Vérification rôle administratif: ${hasPermission}`);
        break;
      case 'hseq':
        hasPermission = userRoles.includes('hseq');
        console.log(`🛡️ Vérification rôle hseq: ${hasPermission}`);
        break;
      case 'obc':
        hasPermission = userRoles.includes('obc');
        console.log(`🚛 Vérification rôle obc: ${hasPermission}`);
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
    const hasAccess = modulePermissions.includes(module);
    
    console.log(`🔍 Vérification permission module ${module}:`, {
      modulePermissions,
      hasAccess
    });
    
    return hasAccess;
  };

  const hasValidationAccess = (): boolean => {
    if (!user) return false;
    
    // L'admin a accès à tout
    if (user.role === 'admin' || hasRole('admin')) {
      console.log('✅ Accès validation accordé - Admin');
      return true;
    }
    
    // Vérifier si l'utilisateur a au moins un rôle de validation
    const userRoles = user.roles || [user.role];
    
    const validationRoles = ['maintenance', 'administratif', 'hseq', 'obc'];
    const hasAccess = validationRoles.some(role => userRoles.includes(role));
    
    console.log('🔍 Vérification accès validation:', {
      userRoles,
      validationRoles,
      hasAccess
    });
    
    return hasAccess;
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
