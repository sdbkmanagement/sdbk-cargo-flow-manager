
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

  async getVehicleStats() {
    try {
      const { data: vehicules, error } = await supabase
        .from('vehicules')
        .select('statut');

      if (error) throw error;

      const total = vehicules?.length || 0;
      const disponibles = vehicules?.filter(v => v.statut === 'disponible').length || 0;
      const en_mission = vehicules?.filter(v => v.statut === 'en_mission').length || 0;
      const maintenance = vehicules?.filter(v => v.statut === 'maintenance').length || 0;

      return {
        total,
        disponibles,
        en_mission,
        maintenance
      };
    } catch (error) {
      console.error('Erreur lors du chargement des stats véhicules:', error);
      return { total: 0, disponibles: 0, en_mission: 0, maintenance: 0 };
    }
  },

  async getDriverStats() {
    try {
      const { data: chauffeurs, error } = await supabase
        .from('chauffeurs')
        .select('statut');

      if (error) throw error;

      const total = chauffeurs?.length || 0;
      const actifs = chauffeurs?.filter(c => c.statut === 'actif').length || 0;
      const inactifs = chauffeurs?.filter(c => c.statut === 'inactif').length || 0;
      const congé = chauffeurs?.filter(c => c.statut === 'congé').length || 0;

      return {
        total,
        actifs,
        inactifs,
        congé
      };
    } catch (error) {
      console.error('Erreur lors du chargement des stats chauffeurs:', error);
      return { total: 0, actifs: 0, inactifs: 0, congé: 0 };
    }
  },

  async getMissionStats() {
    try {
      const { data: missions, error } = await supabase
        .from('missions')
        .select('statut');

      if (error) throw error;

      const total = missions?.length || 0;
      const en_cours = missions?.filter(m => m.statut === 'en_cours').length || 0;
      const en_attente = missions?.filter(m => m.statut === 'en_attente').length || 0;
      const terminées = missions?.filter(m => m.statut === 'terminee').length || 0;

      return {
        total,
        en_cours,
        en_attente,
        terminées
      };
    } catch (error) {
      console.error('Erreur lors du chargement des stats missions:', error);
      return { total: 0, en_cours: 0, en_attente: 0, terminées: 0 };
    }
  },

  async getEmployeeStats() {
    try {
      const { data: employes, error } = await supabase
        .from('employes')
        .select('statut');

      if (error) throw error;

      const total = employes?.length || 0;
      const actifs = employes?.filter(e => e.statut === 'actif').length || 0;
      const inactifs = employes?.filter(e => e.statut === 'inactif').length || 0;

      return {
        total,
        actifs,
        inactifs
      };
    } catch (error) {
      console.error('Erreur lors du chargement des stats employés:', error);
      return { total: 0, actifs: 0, inactifs: 0 };
    }
  },

  async getValidationStats() {
    try {
      const { data: validations, error } = await supabase
        .from('validation_workflows')
        .select('statut_global');

      if (error) throw error;

      const total = validations?.length || 0;
      const en_attente = validations?.filter(v => v.statut_global === 'en_validation').length || 0;
      const validées = validations?.filter(v => v.statut_global === 'valide').length || 0;
      const rejetées = validations?.filter(v => v.statut_global === 'rejete').length || 0;

      return {
        total,
        en_attente,
        validées,
        rejetées
      };
    } catch (error) {
      console.error('Erreur lors du chargement des stats validations:', error);
      return { total: 0, en_attente: 0, validées: 0, rejetées: 0 };
    }
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
