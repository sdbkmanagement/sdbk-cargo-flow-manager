
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
  },

  async getFinancialStats() {
    try {
      // Chiffre d'affaires basé sur les factures payées
      const { data: facturesPaye, error: facturesError } = await supabase
        .from('factures')
        .select('montant_ttc')
        .eq('statut', 'paye');

      if (facturesError) throw facturesError;

      const chiffreAffaires = facturesPaye?.reduce((total, facture) => 
        total + (Number(facture.montant_ttc) || 0), 0) || 0;

      // Factures en attente
      const { data: facturesEnAttente, error: attenteError } = await supabase
        .from('factures')
        .select('montant_ttc')
        .eq('statut', 'en_attente');

      if (attenteError) throw attenteError;

      const montantEnAttente = facturesEnAttente?.reduce((total, facture) => 
        total + (Number(facture.montant_ttc) || 0), 0) || 0;

      // Nombre total de factures
      const { count: totalFactures, error: countError } = await supabase
        .from('factures')
        .select('*', { count: 'exact', head: true });

      if (countError) throw countError;

      return {
        chiffreAffaires,
        montantEnAttente,
        totalFactures: totalFactures || 0,
        facturesPayees: facturesPaye?.length || 0,
        facturesEnAttente: facturesEnAttente?.length || 0
      };
    } catch (error) {
      console.error('Erreur lors du chargement des stats financières:', error);
      return {
        chiffreAffaires: 0,
        montantEnAttente: 0,
        totalFactures: 0,
        facturesPayees: 0,
        facturesEnAttente: 0
      };
    }
  }
};
