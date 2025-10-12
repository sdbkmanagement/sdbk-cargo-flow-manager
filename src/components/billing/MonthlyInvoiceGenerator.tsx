import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Download } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { billingService } from '@/services/billing';
import { tarifsHydrocarburesService } from '@/services/tarifsHydrocarburesService';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { generateMonthlyInvoicePDF } from '@/utils/pdfGenerator';

export const MonthlyInvoiceGenerator = () => {
  const [open, setOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [clientNom, setClientNom] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Récupérer les missions terminées
  const { data: missions = [] } = useQuery({
    queryKey: ['missions-terminees'],
    queryFn: billingService.getMissionsTerminees,
    enabled: open
  });

  const handleExport = async () => {
    if (!selectedMonth || !selectedYear) {
      toast({
        title: 'Erreur',
        description: 'Veuillez sélectionner le mois et l\'année',
        variant: 'destructive'
      });
      return;
    }

    setIsGenerating(true);
    try {
      const monthNumber = parseInt(selectedMonth);
      const yearNumber = parseInt(selectedYear);

      // Récupérer tous les BL du mois avec leurs informations complètes
      const { data: blsData, error } = await supabase
        .from('bons_livraison')
        .select(`
          *,
          missions!inner(
            numero,
            site_depart,
            site_arrivee,
            vehicule:vehicules(numero, immatriculation, remorque_immatriculation),
            chauffeur:chauffeurs(nom, prenom)
          )
        `)
        .gte('date_chargement_reelle', `${yearNumber}-${selectedMonth.padStart(2, '0')}-01`)
        .lt('date_chargement_reelle', monthNumber === 12 ? `${yearNumber + 1}-01-01` : `${yearNumber}-${(monthNumber + 1).toString().padStart(2, '0')}-01`)
        .not('numero_tournee', 'is', null)
        .order('numero_tournee', { ascending: true })
        .order('date_chargement_reelle', { ascending: true });

      if (error) throw error;

      if (!blsData || blsData.length === 0) {
        toast({
          title: 'Aucune donnée',
          description: 'Aucun bon de livraison trouvé pour cette période',
          variant: 'destructive'
        });
        return;
      }

      // Grouper par N° Tournée
      const groupedByTournee = blsData.reduce((acc: any, bl: any) => {
        const tournee = bl.numero_tournee || 'Sans tournée';
        if (!acc[tournee]) {
          acc[tournee] = [];
        }
        acc[tournee].push(bl);
        return acc;
      }, {});

      // Créer les lignes pour Excel
      const excelData: any[] = [];

      Object.keys(groupedByTournee).sort().forEach(tournee => {
        const bls = groupedByTournee[tournee];
        
        // Calculer les totaux pour ce groupe
        let totalQuantite = 0;
        let totalMontant = 0;
        let totalManquant = 0;
        let totalManquantCompteur = 0;
        let totalManquantCuve = 0;
        const clientCodes = new Set<string>();

        bls.forEach((bl: any) => {
          const quantite = bl.quantite_livree || bl.quantite_prevue || 0;
          const prixUnitaire = bl.prix_unitaire || 0;
          const montant = quantite * prixUnitaire;
          
          totalQuantite += quantite;
          totalMontant += montant;
          totalManquant += bl.manquant_total || 0;
          totalManquantCompteur += bl.manquant_compteur || 0;
          totalManquantCuve += bl.manquant_cuve || 0;
          
          if (bl.client_code) clientCodes.add(bl.client_code);

          // Ajouter la ligne de détail
          excelData.push({
            'Date Chargement': bl.date_chargement_reelle ? format(new Date(bl.date_chargement_reelle), 'dd/MM/yyyy') : '',
            'N° Tournée': tournee,
            'Camions': bl.missions?.vehicule?.remorque_immatriculation || bl.missions?.vehicule?.immatriculation || bl.missions?.vehicule?.numero || '',
            'Dépôt': bl.lieu_depart || bl.missions?.site_depart || '',
            'BL': bl.numero || '',
            'Client': bl.lieu_arrivee || bl.missions?.site_arrivee || '',
            'Destination': bl.lieu_arrivee || bl.missions?.site_arrivee || '',
            'Prod': bl.produit === 'essence' ? 'Ess' : bl.produit === 'gasoil' ? 'Go' : bl.produit || '',
            'Qté': quantite || 0,
            'Pu': prixUnitaire || 0,
            'Montant': montant || 0,
            'Manq$': bl.manquant_total || 0,
            'Cpteur': bl.manquant_compteur || 0,
            'Cuve': bl.manquant_cuve || 0,
            'Numéros Clients': bl.client_code_total || bl.client_code || '',
            'Montant ': montant || 0
          });
        });

        // Ajouter la ligne de total pour cette tournée
        excelData.push({
          'Date Chargement': '',
          'N° Tournée': '',
          'Camions': '',
          'Dépôt': '',
          'BL': '',
          'Client': `Total ${tournee}`,
          'Destination': '',
          'Prod': '',
          'Qté': '',
          'Pu': '',
          'Montant': totalMontant,
          'Manq$': totalManquant,
          'Cpteur': totalManquantCompteur,
          'Cuve': totalManquantCuve,
          'Numéros Clients': '',
          'Montant ': totalMontant
        });
      });

      // Créer le fichier Excel
      const ws = XLSX.utils.json_to_sheet(excelData);
      
      // Définir la largeur des colonnes
      const colWidths = [
        { wch: 12 },  // Date Chargement
        { wch: 12 },  // N° Tournée
        { wch: 12 },  // Camions
        { wch: 10 },  // Dépôt
        { wch: 12 },  // BL
        { wch: 25 },  // Client
        { wch: 15 },  // Destination
        { wch: 6 },   // Prod
        { wch: 10 },  // Qté
        { wch: 10 },  // Pu
        { wch: 15 },  // Montant
        { wch: 10 },  // Manq$
        { wch: 10 },  // Cpteur
        { wch: 10 },  // Cuve
        { wch: 15 },  // Numéros Clients
        { wch: 15 }   // Montant 
      ];
      ws['!cols'] = colWidths;

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Facture Groupée Mensuelle');

      // Télécharger le fichier
      const filename = `facture_groupee_${selectedMonth.padStart(2, '0')}_${selectedYear}.xlsx`;
      XLSX.writeFile(wb, filename);

      toast({
        title: 'Export réussi',
        description: `${blsData.length} bons de livraison exportés avec succès`
      });

      setOpen(false);
    } catch (error) {
      console.error('Erreur export:', error);
      toast({
        title: 'Erreur',
        description: 'Erreur lors de l\'export des données',
        variant: 'destructive'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerate = async () => {
    if (!selectedMonth || !selectedYear) {
      toast({
        title: 'Erreur',
        description: 'Veuillez sélectionner le mois et l\'année',
        variant: 'destructive'
      });
      return;
    }

    setIsGenerating(true);
    try {
      const monthNumber = parseInt(selectedMonth);
      const yearNumber = parseInt(selectedYear);

      // Récupérer tous les BL du mois
      const { data: blsData, error } = await supabase
        .from('bons_livraison')
        .select(`
          *,
          missions!inner(
            numero,
            site_depart,
            site_arrivee,
            vehicule:vehicules(numero, immatriculation, remorque_immatriculation),
            chauffeur:chauffeurs(nom, prenom)
          )
        `)
        .gte('date_chargement_reelle', `${yearNumber}-${selectedMonth.padStart(2, '0')}-01`)
        .lt('date_chargement_reelle', monthNumber === 12 ? `${yearNumber + 1}-01-01` : `${yearNumber}-${(monthNumber + 1).toString().padStart(2, '0')}-01`)
        .order('date_chargement_reelle', { ascending: true });

      if (error) throw error;

      if (!blsData || blsData.length === 0) {
        toast({
          title: 'Aucune donnée',
          description: 'Aucun bon de livraison trouvé pour cette période',
          variant: 'destructive'
        });
        return;
      }

      // Calculer les totaux
      let totalHT = 0;
      blsData.forEach((bl: any) => {
        const quantite = bl.quantite_livree || bl.quantite_prevue || 0;
        const prixUnitaire = bl.prix_unitaire || 0;
        totalHT += quantite * prixUnitaire;
      });

      const totalTVA = totalHT * 0.18;
      const totalTTC = totalHT + totalTVA;

      // Générer le PDF
      generateMonthlyInvoicePDF({
        month: selectedMonth,
        year: selectedYear,
        clientNom: clientNom || 'TOTALEnergies GUINEE SA',
        totalHT,
        totalTVA,
        totalTTC,
        blCount: blsData.length
      });

      toast({
        title: 'Facture générée',
        description: `Facture PDF générée avec succès pour ${blsData.length} bons de livraison`
      });

      setOpen(false);
    } catch (error) {
      console.error('Erreur:', error);
      toast({
        title: 'Erreur',
        description: 'Erreur lors de la génération de la facture',
        variant: 'destructive'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const months = [
    { value: '1', label: 'Janvier' },
    { value: '2', label: 'Février' },
    { value: '3', label: 'Mars' },
    { value: '4', label: 'Avril' },
    { value: '5', label: 'Mai' },
    { value: '6', label: 'Juin' },
    { value: '7', label: 'Juillet' },
    { value: '8', label: 'Août' },
    { value: '9', label: 'Septembre' },
    { value: '10', label: 'Octobre' },
    { value: '11', label: 'Novembre' },
    { value: '12', label: 'Décembre' }
  ];

  const years = [];
  const currentYear = new Date().getFullYear();
  for (let i = currentYear - 2; i <= currentYear + 1; i++) {
    years.push(i.toString());
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <FileText className="w-4 h-4 mr-2" />
          Facture groupée mensuelle
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Générer une facture groupée mensuelle</DialogTitle>
          <DialogDescription>
            Créer une facture unique pour toutes les missions du mois
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Nom du client (optionnel)</Label>
            <input
              type="text"
              className="w-full px-3 py-2 border rounded-md"
              placeholder="Ex: TOTALEnergies GUINEE SA"
              value={clientNom}
              onChange={(e) => setClientNom(e.target.value)}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Mois</Label>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent>
                  {months.map(month => (
                    <SelectItem key={month.value} value={month.value}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Année</Label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map(year => (
                    <SelectItem key={year} value={year}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Button 
              onClick={handleExport} 
              disabled={isGenerating || !selectedMonth || !selectedYear}
              variant="outline"
              className="w-full"
            >
              <Download className="w-4 h-4 mr-2" />
              {isGenerating ? 'Export...' : 'Export Mouvement'}
            </Button>

            <Button 
              onClick={handleGenerate} 
              disabled={isGenerating || !selectedMonth || !selectedYear}
              className="w-full"
            >
              {isGenerating ? 'Génération...' : 'Générer facture'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
