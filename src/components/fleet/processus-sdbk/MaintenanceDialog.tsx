import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { processusSDBKService } from '@/services/processus-sdbk';
import { useToast } from '@/hooks/use-toast';

interface MaintenanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehiculeId: string;
  onSuccess: () => void;
}

export const MaintenanceDialog = ({ open, onOpenChange, vehiculeId, onSuccess }: MaintenanceDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    type_panne: '',
    description_panne: '',
    duree_reparation_estimee: '',
    cout_reparation: '',
    pieces_changees: '',
    technicien_nom: '',
    commentaires: ''
  });
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const diagnosticData = {
        vehicule_id: vehiculeId,
        type_panne: formData.type_panne,
        description_panne: formData.description_panne,
        duree_reparation_estimee: formData.duree_reparation_estimee ? parseInt(formData.duree_reparation_estimee) : undefined,
        cout_reparation: formData.cout_reparation ? parseFloat(formData.cout_reparation) : undefined,
        pieces_changees: formData.pieces_changees ? [formData.pieces_changees] : undefined,
        technicien_nom: formData.technicien_nom,
        commentaires: formData.commentaires
      };

      const diagnostic = await processusSDBKService.creerDiagnosticMaintenance(diagnosticData);
      
      // Si pas de panne, terminer directement le diagnostic
      if (!formData.type_panne || formData.type_panne === 'aucune') {
        await processusSDBKService.terminerDiagnosticMaintenance(diagnostic.id);
      }

      onSuccess();
      setFormData({
        type_panne: '',
        description_panne: '',
        duree_reparation_estimee: '',
        cout_reparation: '',
        pieces_changees: '',
        technicien_nom: '',
        commentaires: ''
      });
    } catch (error) {
      console.error('Erreur:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de créer le diagnostic',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Diagnostic de Maintenance</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="type_panne">Type de panne</Label>
              <Select value={formData.type_panne} onValueChange={(value) => setFormData(prev => ({ ...prev, type_panne: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="aucune">Aucune panne détectée</SelectItem>
                  <SelectItem value="mecanique">Panne mécanique</SelectItem>
                  <SelectItem value="electrique">Panne électrique</SelectItem>
                  <SelectItem value="freinage">Problème de freinage</SelectItem>
                  <SelectItem value="pneumatique">Problème pneumatique</SelectItem>
                  <SelectItem value="carrosserie">Problème carrosserie</SelectItem>
                  <SelectItem value="autre">Autre</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="technicien_nom">Nom du technicien</Label>
              <Input
                id="technicien_nom"
                value={formData.technicien_nom}
                onChange={(e) => setFormData(prev => ({ ...prev, technicien_nom: e.target.value }))}
                placeholder="Nom du technicien"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="description_panne">Description détaillée</Label>
            <Textarea
              id="description_panne"
              value={formData.description_panne}
              onChange={(e) => setFormData(prev => ({ ...prev, description_panne: e.target.value }))}
              placeholder="Décrivez les problèmes détectés ou l'état du véhicule..."
              rows={3}
            />
          </div>

          {formData.type_panne && formData.type_panne !== 'aucune' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="duree_reparation_estimee">Durée réparation (heures)</Label>
                  <Input
                    id="duree_reparation_estimee"
                    type="number"
                    value={formData.duree_reparation_estimee}
                    onChange={(e) => setFormData(prev => ({ ...prev, duree_reparation_estimee: e.target.value }))}
                    placeholder="Ex: 24"
                  />
                </div>

                <div>
                  <Label htmlFor="cout_reparation">Coût estimé (€)</Label>
                  <Input
                    id="cout_reparation"
                    type="number"
                    step="0.01"
                    value={formData.cout_reparation}
                    onChange={(e) => setFormData(prev => ({ ...prev, cout_reparation: e.target.value }))}
                    placeholder="Ex: 1500.00"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="pieces_changees">Pièces à changer</Label>
                <Input
                  id="pieces_changees"
                  value={formData.pieces_changees}
                  onChange={(e) => setFormData(prev => ({ ...prev, pieces_changees: e.target.value }))}
                  placeholder="Ex: Plaquettes de frein, Filtre à huile..."
                />
              </div>
            </>
          )}

          <div>
            <Label htmlFor="commentaires">Commentaires additionnels</Label>
            <Textarea
              id="commentaires"
              value={formData.commentaires}
              onChange={(e) => setFormData(prev => ({ ...prev, commentaires: e.target.value }))}
              placeholder="Observations, recommandations..."
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Enregistrement...' : 'Enregistrer le diagnostic'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};