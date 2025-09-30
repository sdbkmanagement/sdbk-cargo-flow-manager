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
}

export const MissionsHistoryExport = ({ missions }: MissionsHistoryExportProps) => {
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
      // Filtrer les missions selon la période
      const missionsFiltrees = missions.filter(m => {
        const missionDate = new Date(m.created_at);
        return missionDate >= dateDebut && missionDate <= dateFin && m.statut === 'terminee';
      });

      if (missionsFiltrees.length === 0) {
        toast({
          title: 'Aucune mission',
          description: 'Aucune mission terminée trouvée pour cette période',
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

          return {
            'N° Mission': mission.numero,
            'Date': format(new Date(mission.created_at), 'dd/MM/yyyy'),
            'Type Transport': mission.type_transport,
            'Véhicule': mission.vehicule?.numero || '',
            'Immatriculation': mission.vehicule?.immatriculation || mission.vehicule?.tracteur_immatriculation || '',
            'Chauffeur': `${mission.chauffeur?.prenom || ''} ${mission.chauffeur?.nom || ''}`,
            'Départ': mission.site_depart,
            'Arrivée': mission.site_arrivee,
            'Volume/Poids': mission.volume_poids || '',
            'Unité': mission.unite_mesure || '',
            'Nombre BL': bls?.length || 0,
            'Statut': mission.statut,
            'Observations': mission.observations || ''
          };
        })
      );

      // Créer le fichier Excel
      const ws = XLSX.utils.json_to_sheet(missionsDetails);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Missions');

      // Télécharger le fichier
      const filename = `missions_${format(dateDebut, 'dd-MM-yyyy')}_au_${format(dateFin, 'dd-MM-yyyy')}.xlsx`;
      XLSX.writeFile(wb, filename);

      toast({
        title: 'Export réussi',
        description: `${missionsFiltrees.length} missions exportées`
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
          Exporter l'historique
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Exporter l'historique des missions</DialogTitle>
          <DialogDescription>
            Sélectionnez la période pour générer le rapport
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
