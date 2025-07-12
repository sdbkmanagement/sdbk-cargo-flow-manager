
import { supabase } from '@/integrations/supabase/client';

export const statsService = {
  async getUserStats() {
    const { data: users, error } = await supabase
      .from('users')
      .select('status, roles');
    
    if (error) throw error;

    const stats = {
      total: users.length,
      actifs: users.filter(u => u.status === 'active').length,
      inactifs: users.filter(u => u.status === 'inactive').length,
      suspendus: 0, // No suspended status in new schema
      byRole: {} as Record<string, number>
    };

    users.forEach(user => {
      user.roles.forEach(role => {
        stats.byRole[role] = (stats.byRole[role] || 0) + 1;
      });
    });

    return stats;
  }
};
