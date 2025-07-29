import { supabase } from '@/integrations/supabase/client';
import { validationService } from '@/services/validation';

export interface DashboardStats {
  vehicules: number;
  chauffeurs: number;
  missionsEnCours: number;
  missionsEnAttente: number;
  employes: number;
  validationsEnAttente: number; // Ajout de cette statistique
}

export interface FinancialStats {
  totalFactures: number;
  chiffreAffaires: number;
  facturesPayees: number;
  facturesEnAttente: number;
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

  async getFinancialStats(): Promise<FinancialStats> {
    console.log('💰 Chargement des statistiques financières...');
    
    try {
      const [facturesResult, chiffreAffairesResult] = await Promise.all([
        supabase.from('factures').select('id, montant_ttc, statut', { count: 'exact' }),
        supabase.from('missions').select('id').eq('statut', 'terminee')
      ]);

      const factures = facturesResult.data || [];
      const facturesPayees = factures.filter(f => f.statut === 'payee').length;
      const facturesEnAttente = factures.filter(f => f.statut === 'en_attente').length;
      const chiffreAffaires = factures
        .filter(f => f.statut === 'payee')
        .reduce((sum, f) => sum + (f.montant_ttc || 0), 0);

      const stats = {
        totalFactures: facturesResult.count || 0,
        chiffreAffaires,
        facturesPayees,
        facturesEnAttente
      };

      console.log('✅ Statistiques financières chargées:', stats);
      return stats;

    } catch (error) {
      console.error('❌ Erreur lors du chargement des statistiques financières:', error);
      
      return {
        totalFactures: 0,
        chiffreAffaires: 0,
        facturesPayees: 0,
        facturesEnAttente: 0
      };
    }
  }
};
