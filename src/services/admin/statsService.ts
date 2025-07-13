
import { supabase } from '@/integrations/supabase/client';

export const statsService = {
  async getUserStats() {
    const { data: users, error } = await supabase
      .from('users')
      .select('statut, role, status');
    
    if (error) throw error;

    const stats = {
      total: users.length,
      actifs: users.filter(u => (u.statut || u.status) === 'actif').length,
      inactifs: users.filter(u => (u.statut || u.status) === 'inactif').length,
      suspendus: users.filter(u => (u.statut || u.status) === 'suspendu').length,
      byRole: {} as Record<string, number>
    };

    users.forEach(user => {
      const role = user.role || 'transport';
      stats.byRole[role] = (stats.byRole[role] || 0) + 1;
    });

    return stats;
  }
};
