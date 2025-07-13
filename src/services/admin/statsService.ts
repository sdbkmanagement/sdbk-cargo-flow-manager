
import { supabase } from '@/integrations/supabase/client';

export const statsService = {
  async getUserStats() {
    const { data: users, error } = await supabase
      .from('users')
      .select('roles, status');

    if (error) throw error;

    const total = users?.length || 0;
    const actifs = users?.filter(u => u.status === 'active').length || 0;
    const inactifs = users?.filter(u => u.status === 'inactive').length || 0;
    const suspendus = users?.filter(u => u.status === 'suspended').length || 0;

    // Count by role
    const byRole: Record<string, number> = {};
    users?.forEach(user => {
      const role = user.roles?.[0] || 'unknown';
      byRole[role] = (byRole[role] || 0) + 1;
    });

    return {
      total,
      actifs,
      inactifs,
      suspendus,
      byRole
    };
  }
};
