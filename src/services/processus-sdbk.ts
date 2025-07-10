import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type DiagnosticMaintenance = Database['public']['Tables']['diagnostics_maintenance']['Row'];
type DiagnosticMaintenanceInsert = Database['public']['Tables']['diagnostics_maintenance']['Insert'];
type ControleOBC = Database['public']['Tables']['controles_obc']['Row'];
type ControleOBCInsert = Database['public']['Tables']['controles_obc']['Insert'];
type ControleHSSE = Database['public']['Tables']['controles_hsse']['Row'];
type ControleHSSEInsert = Database['public']['Tables']['controles_hsse']['Insert'];
type BonLivraison = Database['public']['Tables']['bons_livraison']['Row'];
type BonLivraisonInsert = Database['public']['Tables']['bons_livraison']['Insert'];

export type StatutVehicule = 
  | 'retour_maintenance' 
  | 'maintenance_en_cours' 
  | 'disponible_maintenance'
  | 'verification_admin' 
  | 'controle_obc' 
  | 'controle_hsse' 
  | 'disponible' 
  | 'en_mission' 
  | 'bloque';

export const processusSDBKService = {
  // ÉTAPE 1: Retour de voyage et entrée en maintenance
  async creerDiagnosticMaintenance(diagnosticData: DiagnosticMaintenanceInsert): Promise<DiagnosticMaintenance> {
    const { data, error } = await supabase
      .from('diagnostics_maintenance')
      .insert([diagnosticData])
      .select()
      .single();

    if (error) throw error;

    // Mettre à jour le statut du véhicule
    await supabase
      .from('vehicules')
      .update({ statut: 'maintenance_en_cours' })
      .eq('id', diagnosticData.vehicule_id);

    return data;
  },

  async terminerDiagnosticMaintenance(diagnosticId: string): Promise<void> {
    const { data: diagnostic, error: fetchError } = await supabase
      .from('diagnostics_maintenance')
      .update({ 
        statut: 'termine',
        updated_at: new Date().toISOString()
      })
      .eq('id', diagnosticId)
      .select()
      .single();

    if (fetchError) throw fetchError;

    // Mettre le véhicule disponible pour l'étape suivante
    await supabase
      .from('vehicules')
      .update({ statut: 'disponible_maintenance' })
      .eq('id', diagnostic.vehicule_id);
  },

  // ÉTAPE 2: Vérification administrative
  async passerVerificationAdministrative(vehiculeId: string): Promise<void> {
    await supabase
      .from('vehicules')
      .update({ statut: 'verification_admin' })
      .eq('id', vehiculeId);
  },

  async terminerVerificationAdministrative(vehiculeId: string, conforme: boolean): Promise<void> {
    const nouveauStatut = conforme ? 'controle_obc' : 'bloque';
    await supabase
      .from('vehicules')
      .update({ statut: nouveauStatut })
      .eq('id', vehiculeId);
  },

  // ÉTAPE 3: Contrôle OBC
  async creerControleOBC(controleData: ControleOBCInsert): Promise<ControleOBC> {
    const { data, error } = await supabase
      .from('controles_obc')
      .insert([controleData])
      .select()
      .single();

    if (error) throw error;

    // Mettre à jour le statut du véhicule
    await supabase
      .from('vehicules')
      .update({ statut: 'controle_obc' })
      .eq('id', controleData.vehicule_id);

    return data;
  },

  async terminerControleOBC(controleId: string, conforme: boolean, safeToLoadValide: boolean): Promise<void> {
    const { data: controle, error: updateError } = await supabase
      .from('controles_obc')
      .update({ 
        conforme,
        safe_to_load_valide: safeToLoadValide
      })
      .eq('id', controleId)
      .select()
      .single();

    if (updateError) throw updateError;

    // Mettre à jour le statut du véhicule
    const nouveauStatut = (conforme && safeToLoadValide) ? 'controle_hsse' : 'bloque';
    await supabase
      .from('vehicules')
      .update({ statut: nouveauStatut })
      .eq('id', controle.vehicule_id);
  },

  // ÉTAPE 4: Contrôle HSSE
  async creerControleHSSE(controleData: ControleHSSEInsert): Promise<ControleHSSE> {
    const { data, error } = await supabase
      .from('controles_hsse')
      .insert([controleData])
      .select()
      .single();

    if (error) throw error;

    // Mettre à jour le statut du véhicule
    await supabase
      .from('vehicules')
      .update({ statut: 'controle_hsse' })
      .eq('id', controleData.vehicule_id);

    return data;
  },

  async terminerControleHSSE(controleId: string, conforme: boolean, pointsBloquants?: string[]): Promise<void> {
    const { data: controle, error: updateError } = await supabase
      .from('controles_hsse')
      .update({ 
        conforme,
        points_bloquants: pointsBloquants || []
      })
      .eq('id', controleId)
      .select()
      .single();

    if (updateError) throw updateError;

    // Mettre à jour le statut du véhicule
    const nouveauStatut = conforme ? 'disponible' : 'bloque';
    await supabase
      .from('vehicules')
      .update({ statut: nouveauStatut })
      .eq('id', controle.vehicule_id);
  },

  // ÉTAPE 5: Planification et émission du BL
  async creerBonLivraison(blData: BonLivraisonInsert): Promise<BonLivraison> {
    const { data, error } = await supabase
      .from('bons_livraison')
      .insert([blData])
      .select()
      .single();

    if (error) throw error;

    // Mettre le véhicule en mission
    await supabase
      .from('vehicules')
      .update({ statut: 'en_mission' })
      .eq('id', blData.vehicule_id);

    return data;
  },

  // ÉTAPE 6: Retour de voyage - Traitement par le service Transport
  async mettreAJourRetourMission(
    blId: string, 
    donneesRetour: {
      quantite_livree?: number;
      manquant_cuve?: number;
      manquant_compteur?: number;
      date_arrivee_reelle?: string;
      date_dechargement?: string;
      numero_tournee?: string;
    }
  ): Promise<void> {
    const { data, error } = await supabase
      .from('bons_livraison')
      .update({
        ...donneesRetour,
        statut: 'livre',
        updated_at: new Date().toISOString()
      })
      .eq('id', blId)
      .select()
      .single();

    if (error) throw error;

    // Remettre le véhicule en retour de maintenance pour le cycle suivant
    await supabase
      .from('vehicules')
      .update({ statut: 'retour_maintenance' })
      .eq('id', data.vehicule_id);
  },

  // Fonctions utilitaires pour récupérer les données
  async getDiagnosticsMaintenanceByVehicule(vehiculeId: string): Promise<DiagnosticMaintenance[]> {
    const { data, error } = await supabase
      .from('diagnostics_maintenance')
      .select('*')
      .eq('vehicule_id', vehiculeId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getControlesOBCByVehicule(vehiculeId: string): Promise<ControleOBC[]> {
    const { data, error } = await supabase
      .from('controles_obc')
      .select('*')
      .eq('vehicule_id', vehiculeId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getControlesHSSEByVehicule(vehiculeId: string): Promise<ControleHSSE[]> {
    const { data, error } = await supabase
      .from('controles_hsse')
      .select('*')
      .eq('vehicule_id', vehiculeId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getBonsLivraisonByVehicule(vehiculeId: string): Promise<BonLivraison[]> {
    const { data, error } = await supabase
      .from('bons_livraison')
      .select('*')
      .eq('vehicule_id', vehiculeId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Vérifier les documents administratifs expirés
  async getDocumentsExpirants(vehiculeId: string, joursAvant = 30): Promise<any[]> {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('entity_id', vehiculeId)
      .eq('entity_type', 'vehicule')
      .gte('jours_avant_expiration', 0)
      .lte('jours_avant_expiration', joursAvant)
      .order('jours_avant_expiration', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  // Statistiques du processus
  async getStatistiquesProcessus() {
    const { data: vehicules, error } = await supabase
      .from('vehicules')
      .select('statut');

    if (error) throw error;

    const statistiques = {
      retour_maintenance: 0,
      maintenance_en_cours: 0,
      disponible_maintenance: 0,
      verification_admin: 0,
      controle_obc: 0,
      controle_hsse: 0,
      disponible: 0,
      en_mission: 0,
      bloque: 0
    };

    vehicules?.forEach(vehicule => {
      if (vehicule.statut in statistiques) {
        statistiques[vehicule.statut as keyof typeof statistiques]++;
      }
    });

    return statistiques;
  }
};