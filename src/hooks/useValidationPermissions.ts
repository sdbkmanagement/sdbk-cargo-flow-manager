
import { useAuth } from '@/contexts/AuthContext';

export const useValidationPermissions = () => {
  const { user, hasRole } = useAuth();

  const canValidateEtape = (etape: string): boolean => {
    switch (etape) {
      case 'maintenance':
        return hasRole('maintenance') || hasRole('admin');
      case 'administratif':
        return hasRole('administratif') || hasRole('admin');
      case 'hsecq':
        return hasRole('hsecq') || hasRole('admin');
      case 'obc':
        return hasRole('obc') || hasRole('admin');
      default:
        return false;
    }
  };

  const getUserRole = (): string => {
    if (!user) return '';
    // Retourner le premier rôle trouvé
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
