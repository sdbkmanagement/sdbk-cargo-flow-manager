import { useAuth } from '@/contexts/AuthContext';
import { useMemo } from 'react';

export const useHSEQPermissions = () => {
  const { user } = useAuth();

  const permissions = useMemo(() => {
    if (!user) {
      return {
        canViewHSEQ: false,
        canManageControls: false,
        canManageNC: false,
        canViewStats: false,
        canExport: false,
        isAdmin: false,
        isHSEQ: false,
      };
    }

    const roles = user.roles || [user.role];
    const isAdmin = roles.includes('admin');
    const isHSEQ = roles.includes('hsecq');
    const isDirection = roles.includes('direction');
    const isTransport = roles.includes('transport');

    return {
      canViewHSEQ: isAdmin || isHSEQ || isDirection || isTransport,
      canManageControls: isAdmin || isHSEQ,
      canManageNC: isAdmin || isHSEQ,
      canViewStats: isAdmin || isHSEQ || isDirection,
      canExport: isAdmin || isHSEQ || isDirection,
      isAdmin,
      isHSEQ,
    };
  }, [user]);

  return permissions;
};
