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

      // Récupérer les détails complets des missions avec BL - une ligne par BL pour garder les manquants distincts
      const missionsDetails: any[] = [];
      
      for (const mission of missionsFiltrees) {
        const { data: bls } = await supabase
          .from('bons_livraison')
          .select('*')
          .eq('mission_id', mission.id);

        // Si pas de BL, créer une ligne pour la mission quand même
        if (!bls || bls.length === 0) {
          missionsDetails.push({
            'N°': mission.numero || '',
            'Citerne': mission.vehicule?.remorque_immatriculation || mission.vehicule?.immatriculation || mission.vehicule?.numero || '',
            'Prénoms et Nom du Chauffeur': `${mission.chauffeur?.prenom || ''} ${mission.chauffeur?.nom || ''}`.trim(),
            'N°BL': '',
            'N° Tournée': '',
            'NOMBRE DE BL': 0,
            'Capacité': mission.vehicule?.capacite_citerne || '',
            'Quantité / Litre': '',
            'Produits': mission.type_transport === 'hydrocarbures' ? 'Hydrocarbures' : 'Bauxite',
            'Provenance': mission.site_depart || '',
            'Destinations': mission.site_arrivee || '',
            'Sites': mission.sites || '',
            'date reception DS': '',
            'DATE chargements': '',
            'DATE DEPART': mission.created_at ? format(new Date(mission.created_at), 'dd/MM/yyyy') : '',
            'DATE ARRIVEE': '',
            'DATE Dechargement': mission.statut === 'terminee' && mission.updated_at ? format(new Date(mission.updated_at), 'dd/MM/yyyy') : '',
            'Manquant Cuve': '',
            'Manquant Compteur': '',
            'Manquant Total': ''
          });
          continue;
        }

        // Créer une ligne pour chaque BL avec ses propres valeurs de manquants (non agrégées)
        for (let i = 0; i < bls.length; i++) {
          const bl = bls[i];
          const produitType = bl.produit === 'essence' ? 'ESSENCE' : bl.produit === 'gasoil' ? 'GASOIL' : 'Hydrocarbures';
          
          missionsDetails.push({
            'N°': i === 0 ? mission.numero || '' : '', // Afficher le numéro mission uniquement sur la première ligne
            'Citerne': i === 0 ? (mission.vehicule?.remorque_immatriculation || mission.vehicule?.immatriculation || mission.vehicule?.numero || '') : '',
            'Prénoms et Nom du Chauffeur': i === 0 ? `${mission.chauffeur?.prenom || ''} ${mission.chauffeur?.nom || ''}`.trim() : '',
            'N°BL': bl.numero || '',
            'N° Tournée': bl.numero_tournee || '',
            'NOMBRE DE BL': i === 0 ? bls.length : '',
            'Capacité': i === 0 ? (mission.vehicule?.capacite_citerne || '') : '',
            'Quantité / Litre': bl.quantite_livree || bl.quantite_prevue || '',
            'Produits': produitType,
            'Provenance': bl.lieu_depart || mission.site_depart || '',
            'Destinations': bl.lieu_arrivee || bl.destination || mission.site_arrivee || '',
            'Sites': mission.sites || '',
            'date reception DS': bl.date_emission ? format(new Date(bl.date_emission), 'dd/MM/yyyy') : '',
            'DATE chargements': bl.date_chargement_reelle ? format(new Date(bl.date_chargement_reelle), 'dd/MM/yyyy') : '',
            'DATE DEPART': bl.date_depart ? format(new Date(bl.date_depart), 'dd/MM/yyyy') : (mission.created_at ? format(new Date(mission.created_at), 'dd/MM/yyyy') : ''),
            'DATE ARRIVEE': bl.date_arrivee_reelle ? format(new Date(bl.date_arrivee_reelle), 'dd/MM/yyyy') : '',
            'DATE Dechargement': bl.date_dechargement ? format(new Date(bl.date_dechargement), 'dd/MM/yyyy') : (mission.statut === 'terminee' && mission.updated_at ? format(new Date(mission.updated_at), 'dd/MM/yyyy') : ''),
            // Manquants individuels par BL - NON AGRÉGÉS
            'Manquant Cuve': bl.manquant_cuve !== null && bl.manquant_cuve !== undefined ? bl.manquant_cuve : '',
            'Manquant Compteur': bl.manquant_compteur !== null && bl.manquant_compteur !== undefined ? bl.manquant_compteur : '',
            'Manquant Total': bl.manquant_total !== null && bl.manquant_total !== undefined ? bl.manquant_total : ''
          });
        }
      }

      // Créer le fichier Excel avec mise en forme
      const ws = XLSX.utils.json_to_sheet(missionsDetails);
      
      // Ajuster la largeur des colonnes selon le format du screenshot
      const colWidths = [
        { wch: 15 },  // N°
        { wch: 15 },  // Citerne
        { wch: 28 },  // Prénoms et Nom du Chauffeur
        { wch: 18 },  // N°BL
        { wch: 14 },  // N° Tournée
        { wch: 12 },  // NOMBRE DE BL
        { wch: 12 },  // Capacité
        { wch: 15 },  // Quantité / Litre
        { wch: 12 },  // Produits
        { wch: 18 },  // Provenance
        { wch: 20 },  // Destinations
        { wch: 12 },  // Sites
        { wch: 15 },  // date reception DS
        { wch: 15 },  // DATE chargements
        { wch: 14 },  // DATE DEPART
        { wch: 14 },  // DATE ARRIVEE
        { wch: 15 },  // DATE Dechargement
        { wch: 14 },  // Manquant Cuve
        { wch: 16 },  // Manquant Compteur
        { wch: 14 }   // Manquant Total
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
