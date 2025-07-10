import * as XLSX from 'xlsx';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

export interface ExportFactureData {
  date_chargement: string;
  numero_tournee: string;
  camion: string;
  depot: string;
  numero_bl: string;
  client: string;
  destination: string;
  produit: string;
  quantite: number;
  prix_unitaire: number;
  montant: number;
  manquant_compteur: number;
  manquant_cuve: number;
  numero_client: string;
}

export const exportService = {
  // Récupérer les données de facturation pour export
  async getFacturesForExport(dateDebut: string, dateFin: string): Promise<ExportFactureData[]> {
    const { data, error } = await supabase
      .from('bons_livraison')
      .select(`
        numero,
        date_chargement_reelle,
        numero_tournee,
        quantite_livree,
        quantite_prevue,
        prix_unitaire,
        montant_total,
        montant_facture,
        manquant_compteur,
        manquant_cuve,
        client_nom,
        client_code_total,
        destination,
        produit,
        vehicules!inner (numero),
        chauffeurs!inner (nom, prenom)
      `)
      .gte('date_emission', dateDebut)
      .lte('date_emission', dateFin)
      .eq('statut', 'livre')
      .order('date_emission', { ascending: true });

    if (error) throw error;

    return (data || []).map(bl => ({
      date_chargement: bl.date_chargement_reelle 
        ? format(new Date(bl.date_chargement_reelle), 'dd/MM/yyyy')
        : '',
      numero_tournee: bl.numero_tournee || '',
      camion: bl.vehicules?.numero || '',
      depot: 'Ckry', // Dépôt par défaut (Conakry)
      numero_bl: bl.numero,
      client: bl.client_nom,
      destination: bl.destination,
      produit: bl.produit,
      quantite: bl.quantite_livree || bl.quantite_prevue,
      prix_unitaire: bl.prix_unitaire || 0,
      montant: bl.montant_facture || 0,
      manquant_compteur: bl.manquant_compteur || 0,
      manquant_cuve: bl.manquant_cuve || 0,
      numero_client: bl.client_code_total || ''
    }));
  },

  // Exporter vers Excel avec le format TOTAL
  async exportToExcel(dateDebut: string, dateFin: string): Promise<void> {
    try {
      const data = await this.getFacturesForExport(dateDebut, dateFin);
      
      // Préparer les données pour Excel avec en-têtes français
      const worksheetData = [
        // En-têtes
        [
          'Date Chargement',
          'N°Tournée', 
          'Camions',
          'Dépôt',
          'BL',
          'Client',
          'Destination',
          'Prod',
          'Qté',
          'Pu (GNF)',
          'Montant (GNF)',
          'Mqts',
          'Cpteur',
          'Cuve',
          'Numeros Clients'
        ],
        // Données
        ...data.map(item => [
          item.date_chargement,
          item.numero_tournee,
          item.camion,
          item.depot,
          item.numero_bl,
          item.client,
          item.destination,
          item.produit,
          item.quantite,
          item.prix_unitaire,
          item.montant,
          (item.manquant_compteur || 0) + (item.manquant_cuve || 0), // Total manquants
          item.manquant_compteur,
          item.manquant_cuve,
          item.numero_client
        ])
      ];

      // Créer le workbook et worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(worksheetData);

      // Formater les colonnes
      const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
      
      // Définir les largeurs de colonnes
      ws['!cols'] = [
        { width: 15 }, // Date Chargement
        { width: 12 }, // N°Tournée
        { width: 12 }, // Camions
        { width: 8 },  // Dépôt
        { width: 15 }, // BL
        { width: 25 }, // Client
        { width: 15 }, // Destination
        { width: 12 }, // Produit
        { width: 10 }, // Quantité
        { width: 10 }, // Prix unitaire
        { width: 12 }, // Montant
        { width: 8 },  // Manquants total
        { width: 8 },  // Compteur
        { width: 8 },  // Cuve
        { width: 12 }  // Numéros clients
      ];

      // Formater les en-têtes en gras
      for (let col = 0; col <= 14; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
        if (!ws[cellAddress]) continue;
        ws[cellAddress].s = {
          font: { bold: true },
          fill: { fgColor: { rgb: "EEEEEE" } },
          border: {
            top: { style: "thin" },
            bottom: { style: "thin" },
            left: { style: "thin" },
            right: { style: "thin" }
          }
        };
      }

      // Formater les cellules numériques
      for (let row = 1; row <= range.e.r; row++) {
        // Quantité (colonne H - index 8)
        const qtyCell = XLSX.utils.encode_cell({ r: row, c: 8 });
        if (ws[qtyCell]) {
          ws[qtyCell].t = 'n';
          ws[qtyCell].z = '#,##0.00';
        }

        // Prix unitaire (colonne I - index 9)
        const priceCell = XLSX.utils.encode_cell({ r: row, c: 9 });
        if (ws[priceCell]) {
          ws[priceCell].t = 'n';
          ws[priceCell].z = '#,##0.000';
        }

        // Montant (colonne J - index 10)
        const amountCell = XLSX.utils.encode_cell({ r: row, c: 10 });
        if (ws[amountCell]) {
          ws[amountCell].t = 'n';
          ws[amountCell].z = '#,##0.00';
        }

        // Manquants (colonnes K, L, M - index 11, 12, 13)
        for (let col = 11; col <= 13; col++) {
          const manqCell = XLSX.utils.encode_cell({ r: row, c: col });
          if (ws[manqCell]) {
            ws[manqCell].t = 'n';
            ws[manqCell].z = '#,##0.00';
          }
        }
      }

      // Ajouter le worksheet au workbook
      XLSX.utils.book_append_sheet(wb, ws, "Factures Export");

      // Générer le nom de fichier avec les dates
      const fileName = `Export_Factures_${format(new Date(dateDebut), 'ddMMyyyy')}_${format(new Date(dateFin), 'ddMMyyyy')}.xlsx`;

      // Télécharger le fichier
      XLSX.writeFile(wb, fileName);

      return Promise.resolve();
    } catch (error) {
      console.error('Erreur lors de l\'export Excel:', error);
      throw new Error('Impossible de générer le fichier Excel');
    }
  },

  // Export CSV alternatif
  async exportToCSV(dateDebut: string, dateFin: string): Promise<void> {
    try {
      const data = await this.getFacturesForExport(dateDebut, dateFin);
      
      const headers = [
        'Date Chargement',
        'N°Tournée',
        'Camions', 
        'Dépôt',
        'BL',
        'Client',
        'Destination',
        'Prod',
        'Qté',
        'Pu',
        'Montant',
        'Mqts',
        'Cpteur',
        'Cuve',
        'Numeros Clients'
      ];

      const csvContent = [
        headers.join(';'),
        ...data.map(item => [
          item.date_chargement,
          item.numero_tournee,
          item.camion,
          item.depot,
          item.numero_bl,
          `"${item.client}"`, // Échapper les guillemets pour les noms avec virgules
          item.destination,
          item.produit,
          item.quantite.toString().replace('.', ','), // Format français
          item.prix_unitaire.toString().replace('.', ','),
          item.montant.toString().replace('.', ','),
          ((item.manquant_compteur || 0) + (item.manquant_cuve || 0)).toString().replace('.', ','),
          (item.manquant_compteur || 0).toString().replace('.', ','),
          (item.manquant_cuve || 0).toString().replace('.', ','),
          item.numero_client
        ].join(';'))
      ].join('\n');

      // Ajouter BOM UTF-8 pour Excel
      const BOM = '\uFEFF';
      const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
      
      const fileName = `Export_Factures_${format(new Date(dateDebut), 'ddMMyyyy')}_${format(new Date(dateFin), 'ddMMyyyy')}.csv`;
      
      // Créer un lien de téléchargement
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = fileName;
      link.click();
      
      // Nettoyer
      URL.revokeObjectURL(link.href);
    } catch (error) {
      console.error('Erreur lors de l\'export CSV:', error);
      throw new Error('Impossible de générer le fichier CSV');
    }
  }
};