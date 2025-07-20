
import { supabase } from '@/integrations/supabase/client';

export const exportService = {
  async exportBLData() {
    try {
      console.log('🔄 Début de l\'export des données BL...');
      
      const { data: bls, error } = await supabase
        .from('bons_livraison')
        .select(`
          *,
          vehicules(numero, marque, modele, immatriculation),
          chauffeurs(nom, prenom)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Erreur lors de la récupération des BL:', error);
        throw error;
      }

      if (!bls || bls.length === 0) {
        throw new Error('Aucune donnée BL à exporter');
      }

      console.log(`✅ ${bls.length} BL récupérés pour l'export`);

      // Transformer les données pour l'export
      const exportData = bls.map(bl => ({
        'N° BL': bl.numero || '',
        'Date Emission': bl.date_emission || '',
        'Véhicule': bl.vehicules ? `${bl.vehicules.numero} - ${bl.vehicules.marque} ${bl.vehicules.modele}` : '',
        'Chauffeur': bl.chauffeurs ? `${bl.chauffeurs.prenom} ${bl.chauffeurs.nom}` : '',
        'Destination': bl.destination || bl.lieu_arrivee || '',
        'Lieu Départ': bl.lieu_depart || '',
        'Lieu Arrivée': bl.lieu_arrivee || '',
        'Produit': bl.produit || '',
        'Quantité Prévue': bl.quantite_prevue || 0,
        'Quantité Livrée': bl.quantite_livree || 0,
        'Prix Unitaire': bl.prix_unitaire || 0,
        'Montant Facturé': bl.montant_facture || 0,
        'Manquant Compteur': bl.manquant_compteur || 0,
        'Manquant Cuve': bl.manquant_cuve || 0,
        'Code Client TOTAL': bl.client_code_total || '',
        'Statut': bl.statut || '',
        'Date Chargement': bl.date_chargement_reelle || '',
        'Date Départ': bl.date_depart || '',
        'Date Arrivée': bl.date_arrivee_reelle || '',
        'Date Déchargement': bl.date_dechargement || '',
        'Observations': bl.observations || ''
      }));

      return exportData;

    } catch (error) {
      console.error('❌ Erreur générale lors de l\'export:', error);
      throw error;
    }
  },

  async exportMissionsData() {
    try {
      console.log('🔄 Début de l\'export des données missions...');
      
      const { data: missions, error } = await supabase
        .from('missions')
        .select(`
          *,
          vehicules(numero, marque, modele, immatriculation),
          chauffeurs(nom, prenom)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Erreur lors de la récupération des missions:', error);
        throw error;
      }

      if (!missions || missions.length === 0) {
        throw new Error('Aucune donnée mission à exporter');
      }

      console.log(`✅ ${missions.length} missions récupérées pour l'export`);

      // Transformer les données pour l'export
      const exportData = missions.map(mission => ({
        'N° Mission': mission.numero || '',
        'Type Transport': mission.type_transport || '',
        'Site Départ': mission.site_depart || '',
        'Site Arrivée': mission.site_arrivee || '',
        'Date Départ': mission.date_heure_depart || '',
        'Date Arrivée Prévue': mission.date_heure_arrivee_prevue || '',
        'Véhicule': mission.vehicules ? `${mission.vehicules.numero} - ${mission.vehicules.marque} ${mission.vehicules.modele}` : '',
        'Chauffeur': mission.chauffeurs ? `${mission.chauffeurs.prenom} ${mission.chauffeurs.nom}` : '',
        'Volume/Poids': mission.volume_poids || 0,
        'Unité Mesure': mission.unite_mesure || '',
        'Statut': mission.statut || '',
        'Observations': mission.observations || '',
        'Créé le': mission.created_at || '',
        'Créé par': mission.created_by || ''
      }));

      return exportData;

    } catch (error) {
      console.error('❌ Erreur générale lors de l\'export des missions:', error);
      throw error;
    }
  }
};
