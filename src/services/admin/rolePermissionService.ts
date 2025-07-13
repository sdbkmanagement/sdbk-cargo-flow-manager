
import { supabase } from '@/integrations/supabase/client';

// Service simplifié pour les rôles et permissions
export const rolePermissionService = {
  async getUserRole(): Promise<string | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('users')
        .select('role')
        .eq('email', user.email)
        .eq('statut', 'actif')
        .single();

      if (error || !data) return null;
      return data.role;
    } catch (error) {
      console.error('Erreur lors de la récupération du rôle:', error);
      return null;
    }
  },

  async hasRole(requiredRole: string): Promise<boolean> {
    try {
      const userRole = await this.getUserRole();
      return userRole === requiredRole || userRole === 'admin';
    } catch (error) {
      console.error('Erreur lors de la vérification du rôle:', error);
      return false;
    }
  }
};
