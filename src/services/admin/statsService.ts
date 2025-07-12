
import { supabase } from '@/integrations/supabase/client';

export const statsService = {
  async getUserStats() {
    const { data: users, error } = await supabase
      .from('users')
      .select('statut, role');
    
    if (error) throw error;

    const stats = {
      total: users.length,
      actifs: users.filter(u => u.statut === 'actif').length,
      inactifs: users.filter(u => u.statut === 'inactif').length,
      suspendus: users.filter(u => u.statut === 'suspendu').length,
      byRole: {} as Record<string, number>
    };

    users.forEach(user => {
      stats.byRole[user.role] = (stats.byRole[user.role] || 0) + 1;
    });

    return stats;
  }
};
