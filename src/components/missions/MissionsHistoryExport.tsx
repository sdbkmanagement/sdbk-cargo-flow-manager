import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Download } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import * as XLSX from 'xlsx';

interface MissionsHistoryExportProps {
  missions: any[];
  statusFilter: string;
}

export const MissionsHistoryExport = ({ missions, statusFilter }: MissionsHistoryExportProps) => {
  const [open, setOpen] = useState(false);
  const [dateDebut, setDateDebut] = useState<Date>();
  const [dateFin, setDateFin] = useState<Date>();
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    if (!dateDebut || !dateFin) {
      toast({
        title: 'Erreur',
        description: 'Veuillez sélectionner une période',
        variant: 'destructive'
      });
      return;
    }

    setIsExporting(true);
    try {
      // Filtrer les missions selon la période et le filtre de statut actuel
      const missionsFiltrees = missions.filter(m => {
        const missionDate = new Date(m.created_at);
        const dateMatch = missionDate >= dateDebut && missionDate <= dateFin;
        
        // Si un filtre de statut spécifique est sélectionné, l'appliquer
        if (statusFilter !== 'all') {
          return dateMatch && m.statut === statusFilter;
        }
        
        // Sinon, exporter toutes les missions de la période
        return dateMatch;
      });

      if (missionsFiltrees.length === 0) {
        const statusLabel = statusFilter === 'all' ? 'missions' : 
                           statusFilter === 'en_attente' ? 'missions en attente' :
                           statusFilter === 'en_cours' ? 'missions en cours' :
                           statusFilter === 'terminee' ? 'missions terminées' :
                           'missions annulées';
        toast({
          title: 'Aucune mission',
          description: `Aucune ${statusLabel} trouvée pour cette période`,
          variant: 'destructive'
        });
        return;
      }

      // Récupérer les détails complets des missions avec BL
      const missionsDetails = await Promise.all(
        missionsFiltrees.map(async (mission) => {
          const { data: bls } = await supabase
            .from('bons_livraison')
            .select('*')
            .eq('mission_id', mission.id);

          // Récupérer les numéros de BL
          const blNums = bls?.map(bl => bl.numero).filter(Boolean).join(', ') || '';

          // Calculer les totaux de BL si disponibles
          const totalQuantite = bls?.reduce((sum, bl) => sum + (bl.quantite_livree || bl.quantite_prevue || 0), 0) || 0;
          const produits = bls?.map(bl => bl.produit).filter(Boolean);
          const produitType = produits && produits.length > 0 ? 
                             (produits[0] === 'essence' ? 'ESSENCE' : 'GASOIL') : 
                             (mission.type_transport === 'hydrocarbures' ? 'Hydrocarbures' : 'Bauxite');
          
          // Calculer les totaux des manquants
          const totalManquantEssence = bls?.filter(bl => bl.produit === 'essence')
            .reduce((sum, bl) => sum + (bl.manquant_total || 0), 0) || 0;
          const totalManquantGasoil = bls?.filter(bl => bl.produit === 'gasoil')
            .reduce((sum, bl) => sum + (bl.manquant_total || 0), 0) || 0;
          const totalManquantCuve = bls?.reduce((sum, bl) => sum + (bl.manquant_cuve || 0), 0) || 0;
          const totalManquantCompteur = bls?.reduce((sum, bl) => sum + (bl.manquant_compteur || 0), 0) || 0;
          const totalManquant = bls?.reduce((sum, bl) => sum + (bl.manquant_total || 0), 0) || 0;
          
          return {
            'N°': mission.numero || '',
            'Citerne': mission.vehicule?.remorque_immatriculation || mission.vehicule?.immatriculation || mission.vehicule?.numero || '',
            'Prénoms et Nom du Chauffeur': `${mission.chauffeur?.prenom || ''} ${mission.chauffeur?.nom || ''}`.trim(),
            'N°BL': blNums,
            'N° Tournée': bls?.[0]?.numero_tournee || '',
            'NOMBRE DE BL': bls?.length || 0,
            'Capacité': mission.vehicule?.capacite_citerne || '',
            'Quantité / Litre': totalQuantite,
            'Produits': produitType,
            'Provenance': mission.site_depart || '',
            'Destinations': mission.site_arrivee || '',
            'Sites': mission.sites || '',
            'date reception DS': bls?.[0]?.date_emission ? format(new Date(bls[0].date_emission), 'dd/MM/yyyy') : '',
            'DATE chargements': bls?.[0]?.date_chargement_reelle ? format(new Date(bls[0].date_chargement_reelle), 'dd/MM/yyyy') : '',
            'DATE DEPART': bls?.[0]?.date_depart ? format(new Date(bls[0].date_depart), 'dd/MM/yyyy') : 
                          (mission.created_at ? format(new Date(mission.created_at), 'dd/MM/yyyy') : ''),
            'DATE ARRIVEE': bls?.[0]?.date_arrivee_reelle ? format(new Date(bls[0].date_arrivee_reelle), 'dd/MM/yyyy') : '',
            'DATE Dechargement': bls?.[0]?.date_dechargement ? format(new Date(bls[0].date_dechargement), 'dd/MM/yyyy') : 
                                (mission.statut === 'terminee' && mission.updated_at ? 
                                format(new Date(mission.updated_at), 'dd/MM/yyyy') : ''),
            'Manquant Essence': totalManquantEssence || '',
            'Manquant Gasoil': totalManquantGasoil || '',
            'Manquant Cuve': totalManquantCuve || '',
            'Manquant Compteur': totalManquantCompteur || '',
            'Total Manquant': totalManquant || ''
          };
        })
      );

      // Créer le fichier Excel avec mise en forme
      const ws = XLSX.utils.json_to_sheet(missionsDetails);
      
      // Ajuster la largeur des colonnes selon le format du screenshot
      const colWidths = [
        { wch: 12 },  // N°
        { wch: 15 },  // Citerne
        { wch: 25 },  // Prénoms et Nom du Chauffeur
        { wch: 15 },  // N°BL
        { wch: 12 },  // N° Tournée
        { wch: 12 },  // NOMBRE DE BL
        { wch: 10 },  // Capacité
        { wch: 15 },  // Quantité / Litre
        { wch: 15 },  // Produits
        { wch: 18 },  // Provenance
        { wch: 18 },  // Destinations
        { wch: 15 },  // Sites
        { wch: 15 },  // date reception DS
        { wch: 15 },  // DATE chargements
        { wch: 12 },  // DATE DEPART
        { wch: 12 },  // DATE ARRIVEE
        { wch: 15 },  // DATE Dechargement
        { wch: 15 },  // Manquant Essence
        { wch: 15 },  // Manquant Gasoil
        { wch: 15 },  // Manquant Cuve
        { wch: 15 },  // Manquant Compteur
        { wch: 15 }   // Total Manquant
      ];
      ws['!cols'] = colWidths;
      
      const wb = XLSX.utils.book_new();
      const sheetName = statusFilter === 'terminee' ? 'SUIVI MISSION TERMINEE' :
                       statusFilter === 'en_cours' ? 'SUIVI MISSION EN COURS' :
                       statusFilter === 'en_attente' ? 'SUIVI MISSION EN ATTENTE' :
                       statusFilter === 'all' ? 'SUIVI MISSIONS' :
                       'SUIVI MISSION ANNULEE';
      XLSX.utils.book_append_sheet(wb, ws, sheetName);

      // Télécharger le fichier
      const filename = `missions_${format(dateDebut, 'dd-MM-yyyy')}_au_${format(dateFin, 'dd-MM-yyyy')}.xlsx`;
      XLSX.writeFile(wb, filename);

      const statusLabel = statusFilter === 'all' ? 'mission(s)' : 
                         statusFilter === 'en_attente' ? 'mission(s) en attente' :
                         statusFilter === 'en_cours' ? 'mission(s) en cours' :
                         statusFilter === 'terminee' ? 'mission(s) terminée(s)' :
                         'mission(s) annulée(s)';
      
      toast({
        title: 'Export réussi',
        description: `${missionsFiltrees.length} ${statusLabel} exportée(s) avec succès`
      });

      setOpen(false);
    } catch (error) {
      console.error('Erreur export:', error);
      toast({
        title: 'Erreur',
        description: 'Erreur lors de l\'export des missions',
        variant: 'destructive'
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Download className="w-4 h-4 mr-2" />
          {statusFilter === 'all' ? 'Exporter' : 
           statusFilter === 'en_attente' ? 'Exporter (En attente)' :
           statusFilter === 'en_cours' ? 'Exporter (En cours)' :
           statusFilter === 'terminee' ? 'Exporter (Terminées)' :
           'Exporter (Annulées)'}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Exporter les missions</DialogTitle>
          <DialogDescription>
            {statusFilter === 'all' 
              ? 'Sélectionnez la période pour exporter toutes les missions'
              : statusFilter === 'en_attente'
              ? 'Sélectionnez la période pour exporter les missions en attente'
              : statusFilter === 'en_cours'
              ? 'Sélectionnez la période pour exporter les missions en cours'
              : statusFilter === 'terminee'
              ? 'Sélectionnez la période pour exporter les missions terminées'
              : 'Sélectionnez la période pour exporter les missions annulées'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Date de début</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateDebut ? format(dateDebut, 'dd MMMM yyyy', { locale: fr }) : 'Sélectionner'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={dateDebut}
                  onSelect={setDateDebut}
                  locale={fr}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <Label>Date de fin</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateFin ? format(dateFin, 'dd MMMM yyyy', { locale: fr }) : 'Sélectionner'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={dateFin}
                  onSelect={setDateFin}
                  locale={fr}
                />
              </PopoverContent>
            </Popover>
          </div>

          <Button 
            onClick={handleExport} 
            disabled={isExporting || !dateDebut || !dateFin}
            className="w-full"
          >
            {isExporting ? 'Export en cours...' : 'Exporter'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
