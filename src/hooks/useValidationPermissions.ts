
import { useAuth } from '@/contexts/AuthContext';

export const useValidationPermissions = () => {
  const { user, hasRole } = useAuth();

  const canValidateEtape = (etape: string): boolean => {
    if (!user) return false;
    
    // L'admin peut tout faire
    if (user.role === 'admin') return true;
    
    // Chaque rôle peut valider son étape correspondante
    switch (etape) {
      case 'maintenance':
        return user.role === 'maintenance';
      case 'administratif':
        return user.role === 'administratif';
      case 'hsecq':
        return user.role === 'hsecq';
      case 'obc':
        return user.role === 'obc';
      default:
        return false;
    }
  };

  const getUserRole = (): string => {
    if (!user) return '';
    return user.role || '';
  };

  const getUserName = (): string => {
    if (!user) return 'Utilisateur inconnu';
    return `${user.prenom || ''} ${user.nom || ''}`.trim() || user.email || 'Utilisateur';
  };

  return {
    canValidateEtape,
    getUserRole,
    getUserName
  };
};
