
import { supabase } from '@/integrations/supabase/client';
import * as XLSX from 'xlsx';

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
        'N° Tournée': bl.numero_tournee || '',
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
          chauffeurs(nom, prenom),
          bons_livraison(numero)
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
        'Véhicule': mission.vehicules ? `${mission.vehicules.numero} - ${mission.vehicules.marque} ${mission.vehicules.modele}` : '',
        'Chauffeur': mission.chauffeurs ? `${mission.chauffeurs.prenom} ${mission.chauffeurs.nom}` : '',
        'Numéros BL': mission.bons_livraison?.map((bl: any) => bl.numero).filter(Boolean).join(', ') || '',
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
  },

  async exportToExcel(dateDebut: string, dateFin: string) {
    try {
      console.log(`🔄 Export Excel pour la période du ${dateDebut} au ${dateFin}`);
      
      // Récupérer les données BL filtrées par date avec les tarifs
      const { data: bls, error } = await supabase
        .from('bons_livraison')
        .select(`
          *,
          vehicules(numero, marque, modele, immatriculation),
          chauffeurs(nom, prenom)
        `)
        .gte('date_emission', dateDebut)
        .lte('date_emission', dateFin)
        .eq('statut', 'livre')
        .order('date_emission', { ascending: true });

      if (error) {
        console.error('❌ Erreur lors de la récupération des BL:', error);
        throw error;
      }

      if (!bls || bls.length === 0) {
        throw new Error('Aucune donnée à exporter pour cette période');
      }

      // Récupérer tous les tarifs destinations
      const { data: tarifs, error: tarifsError } = await supabase
        .from('tarifs_destinations')
        .select('*');

      if (tarifsError) {
        console.error('❌ Erreur lors de la récupération des tarifs:', tarifsError);
        throw tarifsError;
      }

      // Transformer les données pour l'export Excel avec calcul du montant et numéro de tournée
      const exportData = await Promise.all(bls.map(async bl => {
        const quantite = bl.quantite_livree || bl.quantite_prevue || 0;
        let prixUnitaire = bl.prix_unitaire || 0;
        
        // Si pas de prix unitaire dans le BL, chercher dans les tarifs par destination
        if (!prixUnitaire && bl.destination && tarifs) {
          const tarif = tarifs.find(t => 
            t.destination.toLowerCase() === bl.destination.toLowerCase() ||
            t.destination.toLowerCase() === (bl.lieu_arrivee || '').toLowerCase()
          );
          
          if (tarif) {
            // Utiliser le prix selon le produit (essence ou gasoil)
            if (bl.produit && bl.produit.toLowerCase().includes('essence')) {
              prixUnitaire = tarif.prix_unitaire_essence || 0;
            } else if (bl.produit && bl.produit.toLowerCase().includes('gasoil')) {
              prixUnitaire = tarif.prix_unitaire_gasoil || 0;
            } else {
              // Par défaut, utiliser le prix essence
              prixUnitaire = tarif.prix_unitaire_essence || 0;
            }
          }
        }
        
        const montantCalcule = quantite * prixUnitaire;
        
        return {
          'Date Chargement': bl.date_chargement_reelle || bl.date_emission || '',
          'N°Tournée': bl.numero_tournee || '',
          'Camions': bl.vehicules ? `${bl.vehicules.numero} - ${bl.vehicules.marque} ${bl.vehicules.modele}` : '',
          'Dépôt': bl.lieu_depart || '',
          'BL': bl.numero || '',
          'Client': bl.destination || bl.lieu_arrivee || '',
          'Destination': bl.lieu_arrivee || '',
          'Produit': bl.produit || '',
          'Quantité': quantite,
          'Prix Unitaire': prixUnitaire,
          'Montant': bl.montant_facture || montantCalcule,
          'Manquants (Total)': (bl.manquant_compteur || 0) + (bl.manquant_cuve || 0),
          'Manquant Compteur': bl.manquant_compteur || 0,
          'Manquant Cuve': bl.manquant_cuve || 0,
          'Numéros Clients': bl.client_code_total || bl.client_code || ''
        };
      }));

      // Créer le fichier Excel avec formatage des nombres
      const ws = XLSX.utils.json_to_sheet(exportData);
      
      // Formater les colonnes numériques
      const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
      for (let row = range.s.r + 1; row <= range.e.r; row++) {
        // Formater la colonne Prix Unitaire (colonne J)
        const prixCell = XLSX.utils.encode_cell({ r: row, c: 9 });
        if (ws[prixCell]) {
          ws[prixCell].t = 'n'; // type number
          ws[prixCell].z = '#,##0.00'; // format numérique
        }
        
        // Formater la colonne Montant (colonne K)
        const montantCell = XLSX.utils.encode_cell({ r: row, c: 10 });
        if (ws[montantCell]) {
          ws[montantCell].t = 'n'; // type number
          ws[montantCell].z = '#,##0.00'; // format numérique
        }
      }
      
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Factures');

      // Générer et télécharger le fichier
      const fileName = `Factures_${dateDebut}_${dateFin}.xlsx`;
      XLSX.writeFile(wb, fileName);

      console.log(`✅ Fichier Excel généré: ${fileName}`);

    } catch (error) {
      console.error('❌ Erreur lors de l\'export Excel:', error);
      throw error;
    }
  },

  async exportToCSV(dateDebut: string, dateFin: string) {
    try {
      console.log(`🔄 Export CSV pour la période du ${dateDebut} au ${dateFin}`);
      
      // Récupérer les données BL filtrées par date
      const { data: bls, error } = await supabase
        .from('bons_livraison')
        .select(`
          *,
          vehicules(numero, marque, modele, immatriculation),
          chauffeurs(nom, prenom)
        `)
        .gte('date_emission', dateDebut)
        .lte('date_emission', dateFin)
        .eq('statut', 'livre')
        .order('date_emission', { ascending: true });

      if (error) {
        console.error('❌ Erreur lors de la récupération des BL:', error);
        throw error;
      }

      if (!bls || bls.length === 0) {
        throw new Error('Aucune donnée à exporter pour cette période');
      }

      // Transformer les données pour l'export CSV avec calcul du montant si nécessaire
      const exportData = bls.map(bl => {
        const quantite = bl.quantite_livree || bl.quantite_prevue || 0;
        const prixUnitaire = bl.prix_unitaire || 0;
        const montantCalcule = quantite * prixUnitaire;
        
        return {
          'Date Chargement': bl.date_chargement_reelle || bl.date_emission || '',
          'N°Tournée': bl.numero_tournee || '',
          'Camions': bl.vehicules ? `${bl.vehicules.numero} - ${bl.vehicules.marque} ${bl.vehicules.modele}` : '',
          'Dépôt': bl.lieu_depart || '',
          'BL': bl.numero || '',
          'Client': bl.destination || bl.lieu_arrivee || '',
          'Destination': bl.lieu_arrivee || '',
          'Produit': bl.produit || '',
          'Quantité': quantite,
          'Prix Unitaire': prixUnitaire,
          'Montant': bl.montant_facture || montantCalcule,
          'Manquants (Total)': (bl.manquant_compteur || 0) + (bl.manquant_cuve || 0),
          'Manquant Compteur': bl.manquant_compteur || 0,
          'Manquant Cuve': bl.manquant_cuve || 0,
          'Numéros Clients': bl.client_code_total || bl.client_code || ''
        };
      });

      // Créer le contenu CSV avec séparateur français (point-virgule)
      const headers = Object.keys(exportData[0]);
      const csvContent = [
        headers.join(';'),
        ...exportData.map(row => 
          headers.map(header => {
            const value = row[header as keyof typeof row];
            // Échapper les guillemets et encapsuler si nécessaire
            if (typeof value === 'string' && (value.includes(';') || value.includes('"') || value.includes('\n'))) {
              return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
          }).join(';')
        )
      ].join('\n');

      // Ajouter BOM UTF-8 pour une meilleure compatibilité avec Excel
      const BOM = '\uFEFF';
      const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });

      // Télécharger le fichier
      const fileName = `Factures_${dateDebut}_${dateFin}.csv`;
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', fileName);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      console.log(`✅ Fichier CSV généré: ${fileName}`);

    } catch (error) {
      console.error('❌ Erreur lors de l\'export CSV:', error);
      throw error;
    }
  }
};
