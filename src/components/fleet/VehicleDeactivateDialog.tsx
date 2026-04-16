import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { vehiculesService } from '@/services/vehicules';
import type { Vehicule } from '@/services/vehicules';

interface VehicleDeactivateDialogProps {
  vehicule: Vehicule | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const MOTIFS_SORTIE = [
  'Vente',
  'Casse / Accident irréparable',
  'Réforme (fin de vie)',
  'Transfert',
  'Vol',
  'Autre'
];

export const VehicleDeactivateDialog = ({ vehicule, open, onOpenChange, onSuccess }: VehicleDeactivateDialogProps) => {
  const [dateSortie, setDateSortie] = useState(new Date().toISOString().split('T')[0]);
  const [motif, setMotif] = useState('');
  const [motifAutre, setMotifAutre] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!vehicule) return;
    const motifFinal = motif === 'Autre' ? motifAutre : motif;
    if (!motifFinal) {
      toast.error('Veuillez indiquer un motif de sortie');
      return;
    }
    if (!dateSortie) {
      toast.error('Veuillez indiquer une date de sortie');
      return;
    }

    setLoading(true);
    try {
      await vehiculesService.update(vehicule.id, {
        actif: false,
        date_sortie_flotte: dateSortie,
        motif_sortie_flotte: motifFinal,
        statut: 'hors_service'
      });
      toast.success(`Véhicule ${vehicule.immatriculation || vehicule.numero} sorti de la flotte`);
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      toast.error("Erreur lors de la désactivation du véhicule");
    } finally {
      setLoading(false);
    }
  };

  const handleReactivate = async () => {
    if (!vehicule) return;
    setLoading(true);
    try {
      await vehiculesService.update(vehicule.id, {
        actif: true,
        date_sortie_flotte: null as any,
        motif_sortie_flotte: null as any,
        statut: 'validation_requise',
        validation_requise: true
      });
      toast.success(`Véhicule ${vehicule.immatriculation || vehicule.numero} réintégré dans la flotte`);
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      toast.error("Erreur lors de la réactivation du véhicule");
    } finally {
      setLoading(false);
    }
  };

  if (!vehicule) return null;

  const isInactive = vehicule.actif === false;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            {isInactive ? 'Réintégrer le véhicule' : 'Sortie de flotte'}
          </DialogTitle>
          <DialogDescription>
            {isInactive
              ? `Réintégrer le véhicule ${vehicule.immatriculation || vehicule.numero} dans la flotte active ?`
              : `Retirer le véhicule ${vehicule.immatriculation || vehicule.numero} de la flotte active.`}
          </DialogDescription>
        </DialogHeader>

        {isInactive ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Sorti le <strong>{vehicule.date_sortie_flotte}</strong> — Motif : <strong>{vehicule.motif_sortie_flotte}</strong>
            </p>
            <p className="text-sm">Le véhicule sera remis en statut « validation requise ».</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <Label>Date de sortie</Label>
              <Input type="date" value={dateSortie} onChange={(e) => setDateSortie(e.target.value)} />
            </div>
            <div>
              <Label>Motif de sortie</Label>
              <Select value={motif} onValueChange={setMotif}>
                <SelectTrigger><SelectValue placeholder="Sélectionner un motif" /></SelectTrigger>
                <SelectContent>
                  {MOTIFS_SORTIE.map(m => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {motif === 'Autre' && (
              <div>
                <Label>Précisez</Label>
                <Textarea value={motifAutre} onChange={(e) => setMotifAutre(e.target.value)} placeholder="Motif de sortie..." />
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
          {isInactive ? (
            <Button onClick={handleReactivate} disabled={loading}>
              {loading ? 'Réactivation...' : 'Réintégrer'}
            </Button>
          ) : (
            <Button variant="destructive" onClick={handleSubmit} disabled={loading}>
              {loading ? 'En cours...' : 'Confirmer la sortie'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
