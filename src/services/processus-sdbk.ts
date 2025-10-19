import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

// Types pour les nouvelles entités
export type Associe = Database["public"]["Tables"]["associes"]["Row"];
export type AssocieInsert = Database["public"]["Tables"]["associes"]["Insert"];
export type TarifDestination = Database["public"]["Tables"]["tarifs_destinations"]["Row"];
export type ClientTotal = Database["public"]["Tables"]["clients_total"]["Row"];
export type AffectationChauffeur = Database["public"]["Tables"]["affectations_chauffeurs"]["Row"];
export type RapportService = Database["public"]["Tables"]["rapports_services"]["Row"];

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
  },

  // === GESTION DES ASSOCIÉS ===
  async getAssocies(): Promise<Associe[]> {
    const { data, error } = await supabase
      .from('associes')
      .select('*')
      .order('nom');

    if (error) throw error;
    return data || [];
  },

  async creerAssocie(associeData: AssocieInsert): Promise<Associe> {
    const { data, error } = await supabase
      .from('associes')
      .insert([associeData])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // === GESTION DES TARIFS ===
  async getTarifs(): Promise<TarifDestination[]> {
    const { data, error } = await supabase
      .from('tarifs_destinations')
      .select('*')
      .order('destination');

    if (error) throw error;
    return data || [];
  },

  async getTarifByDestination(destination: string): Promise<TarifDestination | null> {
    const { data, error } = await supabase
      .from('tarifs_destinations')
      .select('*')
      .eq('destination', destination)
      .single();

    if (error) return null;
    return data;
  },

  // === GESTION DES CLIENTS TOTAL ===
  async getClientsTotal(): Promise<ClientTotal[]> {
    const { data, error } = await supabase
      .from('clients_total')
      .select('*')
      .order('nom_client');

    if (error) throw error;
    return data || [];
  },

  async getClientByCode(codeClient: string): Promise<ClientTotal | null> {
    const { data, error } = await supabase
      .from('clients_total')
      .select('*')
      .eq('code_client', codeClient)
      .single();

    if (error) return null;
    return data;
  },

  // === GESTION DES AFFECTATIONS ===
  async affecter_chauffeur_vehicule(
    vehiculeId: string, 
    chauffeurId: string, 
    motif: string,
    autorisePar: string
  ): Promise<AffectationChauffeur> {
    // Terminer l'affectation précédente s'il y en a une
    await supabase
      .from('affectations_chauffeurs')
      .update({ 
        statut: 'terminee',
        date_fin: new Date().toISOString().split('T')[0],
        motif_changement: motif
      })
      .eq('vehicule_id', vehiculeId)
      .eq('statut', 'active');

    // Créer la nouvelle affectation
    const { data, error } = await supabase
      .from('affectations_chauffeurs')
      .insert([{
        vehicule_id: vehiculeId,
        chauffeur_id: chauffeurId,
        date_debut: new Date().toISOString().split('T')[0],
        motif_changement: motif,
        autorise_par: autorisePar,
        statut: 'active'
      }])
      .select()
      .single();

    if (error) throw error;

    // Mettre à jour le véhicule
    await supabase
      .from('vehicules')
      .update({ chauffeur_assigne: chauffeurId })
      .eq('id', vehiculeId);

    return data;
  },

  // === FACTURATION AMÉLIORÉE ===
  async calculerFacturationBL(blId: string): Promise<{
    prix_unitaire: number;
    montant_total: number;
    montant_facture: number;
  }> {
    const { data: bl, error } = await supabase
      .from('bons_livraison')
      .select('*, vehicules!inner(associe_id)')
      .eq('id', blId)
      .single();

    if (error) throw error;

    const tarif = await this.getTarifByDestination(bl.destination);
    if (!tarif) throw new Error('Tarif non trouvé pour cette destination');

    const prixUnitaire = bl.produit.toLowerCase().includes('essence') 
      ? tarif.prix_unitaire_essence 
      : tarif.prix_unitaire_gasoil;

    const quantiteLivree = bl.quantite_livree || bl.quantite_prevue;
    const montantTotal = quantiteLivree * prixUnitaire;
    // Les manquants sont informatifs uniquement, ils ne doivent pas être soustraits du montant facturé
    const montantFacture = montantTotal;

    // Mettre à jour le BL avec la facturation
    await supabase
      .from('bons_livraison')
      .update({
        prix_unitaire: prixUnitaire,
        montant_total: montantTotal,
        montant_facture: montantFacture,
        associe_id: bl.vehicules?.associe_id,
        chiffre_affaire_associe: montantFacture
      })
      .eq('id', blId);

    return {
      prix_unitaire: prixUnitaire,
      montant_total: montantTotal,
      montant_facture: montantFacture
    };
  },

  // === RAPPORTS PAR SERVICE ===
  async creerRapportService(serviceData: Omit<RapportService, 'id' | 'created_at'>): Promise<RapportService> {
    const { data, error } = await supabase
      .from('rapports_services')
      .insert([serviceData])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getRapportsVehicule(vehiculeId: string): Promise<RapportService[]> {
    const { data, error } = await supabase
      .from('rapports_services')
      .select('*')
      .eq('vehicule_id', vehiculeId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // === CHIFFRE D'AFFAIRES ASSOCIÉS ===
  async getChiffreAffairesAssocie(associeId: string, dateDebut?: string, dateFin?: string) {
    let query = supabase
      .from('bons_livraison')
      .select('chiffre_affaire_associe, date_emission')
      .eq('associe_id', associeId)
      .not('chiffre_affaire_associe', 'is', null);

    if (dateDebut) {
      query = query.gte('date_emission', dateDebut);
    }
    if (dateFin) {
      query = query.lte('date_emission', dateFin);
    }

    const { data, error } = await query;
    if (error) throw error;

    const total = data?.reduce((sum, bl) => sum + (bl.chiffre_affaire_associe || 0), 0) || 0;
    const nombre_missions = data?.length || 0;

    return {
      total_ca: total,
      nombre_missions,
      moyenne_par_mission: nombre_missions > 0 ? total / nombre_missions : 0
    };
  }
};