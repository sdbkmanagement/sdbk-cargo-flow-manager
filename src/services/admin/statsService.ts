
import { supabase } from '@/integrations/supabase/client';
import { validationService } from '@/services/validation';

export interface DashboardStats {
  vehicules: number;
  chauffeurs: number;
  missionsEnCours: number;
  missionsEnAttente: number;
  employes: number;
  validationsEnAttente: number;
}

export interface FinancialStats {
  totalFactures: number;
  chiffreAffaires: number;
  facturesPayees: number;
  facturesEnAttente: number;
  caEnAttente: number;
  facturesMensuelles: number;
}

export interface UserStats {
  total: number;
  actifs: number;
  inactifs: number;
  suspendus: number;
  byRole: Record<string, number>;
}

export const statsService = {
  async getDashboardStats(): Promise<DashboardStats> {
    console.log('📊 Chargement des statistiques du dashboard...');
    
    try {
      // Récupérer les statistiques en parallèle
      const [
        vehiculesResult,
        chauffeursResult,
        missionsResult,
        employesResult,
        validationStats
      ] = await Promise.all([
        supabase.from('vehicules').select('id', { count: 'exact' }).limit(1),
        supabase.from('chauffeurs').select('id', { count: 'exact' }).limit(1),
        supabase.from('missions').select('id, statut', { count: 'exact' }),
        supabase.from('employes').select('id', { count: 'exact' }).limit(1),
        validationService.getStatistiquesGlobales()
      ]);

      // Compter les missions en cours et en attente
      const missions = missionsResult.data || [];
      const missionsEnCours = missions.filter(m => m.statut === 'en_cours').length;
      const missionsEnAttente = missions.filter(m => m.statut === 'en_attente').length;

      const stats = {
        vehicules: vehiculesResult.count || 0,
        chauffeurs: chauffeursResult.count || 0,
        missionsEnCours,
        missionsEnAttente,
        employes: employesResult.count || 0,
        validationsEnAttente: validationStats?.en_validation || 0
      };

      console.log('✅ Statistiques du dashboard chargées:', stats);
      return stats;

    } catch (error) {
      console.error('❌ Erreur lors du chargement des statistiques:', error);
      
      // Retourner des valeurs par défaut en cas d'erreur
      return {
        vehicules: 0,
        chauffeurs: 0,
        missionsEnCours: 0,
        missionsEnAttente: 0,
        employes: 0,
        validationsEnAttente: 0
      };
    }
  },

  async getUserStats(): Promise<UserStats> {
    console.log('👥 Chargement des statistiques utilisateurs...');
    
    try {
      const { data: users, error } = await supabase
        .from('users')
        .select('status, roles');

      if (error) {
        console.error('❌ Erreur lors de la récupération des utilisateurs:', error);
        throw error;
      }

      const total = users?.length || 0;
      const actifs = users?.filter(u => u.status === 'active').length || 0;
      const inactifs = users?.filter(u => u.status === 'inactive').length || 0;
      const suspendus = users?.filter(u => u.status === 'suspended').length || 0;

      // Compter par rôle
      const byRole: Record<string, number> = {};
      users?.forEach(user => {
        if (user.roles && Array.isArray(user.roles)) {
          user.roles.forEach(role => {
            byRole[role] = (byRole[role] || 0) + 1;
          });
        }
      });

      const stats = {
        total,
        actifs,
        inactifs,
        suspendus,
        byRole
      };

      console.log('✅ Statistiques utilisateurs chargées:', stats);
      return stats;

    } catch (error) {
      console.error('❌ Erreur lors du chargement des statistiques utilisateurs:', error);
      
      return {
        total: 0,
        actifs: 0,
        inactifs: 0,
        suspendus: 0,
        byRole: {}
      };
    }
  },

  async getFinancialStats(): Promise<FinancialStats> {
    console.log('💰 Chargement des statistiques financières...');
    
    try {
      const [facturesResult, chiffreAffairesResult] = await Promise.all([
        supabase.from('factures').select('id, montant_ttc, statut, numero', { count: 'exact' }),
        supabase.from('missions').select('id').eq('statut', 'terminee')
      ]);

      const factures = facturesResult.data || [];
      const facturesPayees = factures.filter(f => f.statut === 'payee').length;
      const facturesEnAttente = factures.filter(f => f.statut === 'en_attente' && f.numero?.startsWith('FM')).length;
      const facturesMensuelles = factures.filter(f => f.numero?.startsWith('FM')).length;
      const chiffreAffaires = factures
        .filter(f => f.statut === 'payee')
        .reduce((sum, f) => sum + (f.montant_ttc || 0), 0);
      const caEnAttente = factures
        .filter(f => f.statut === 'en_attente' && f.numero?.startsWith('FM'))
        .reduce((sum, f) => sum + (f.montant_ttc || 0), 0);

      const stats = {
        totalFactures: facturesResult.count || 0,
        chiffreAffaires,
        facturesPayees,
        facturesEnAttente,
        caEnAttente,
        facturesMensuelles
      };

      console.log('✅ Statistiques financières chargées:', stats);
      return stats;

    } catch (error) {
      console.error('❌ Erreur lors du chargement des statistiques financières:', error);
      
      return {
        totalFactures: 0,
        chiffreAffaires: 0,
        facturesPayees: 0,
        facturesEnAttente: 0,
        caEnAttente: 0,
        facturesMensuelles: 0
      };
    }
  }
};
