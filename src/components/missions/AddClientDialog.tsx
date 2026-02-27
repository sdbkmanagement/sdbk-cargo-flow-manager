import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DESTINATIONS } from '@/data/destinations';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { MapPin, Building, Plus } from 'lucide-react';

interface AddClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultVille?: string;
  onClientAdded: (ville: string, nom: string) => void;
}

export const AddClientDialog = ({ open, onOpenChange, defaultVille, onClientAdded }: AddClientDialogProps) => {
  const [ville, setVille] = useState(defaultVille || '');
  const [nom, setNom] = useState('');
  const [saving, setSaving] = useState(false);

  React.useEffect(() => {
    if (defaultVille) setVille(defaultVille);
  }, [defaultVille]);

  const handleSave = async () => {
    if (!ville.trim() || !nom.trim()) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    setSaving(true);
    try {
      // Sauvegarder dans la table clients
      const { error } = await supabase
        .from('clients')
        .insert({ nom: nom.trim(), ville: ville.trim() });

      if (error) throw error;

      toast.success(`Client "${nom}" ajouté pour ${ville}`);
      onClientAdded(ville.trim(), nom.trim());
      setNom('');
      onOpenChange(false);
    } catch (err: any) {
      toast.error('Erreur lors de l\'ajout: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Ajouter un nouveau client
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Ville de destination</Label>
            <Select value={ville} onValueChange={setVille}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner une ville" />
              </SelectTrigger>
              <SelectContent>
                {DESTINATIONS.map(d => (
                  <SelectItem key={d.ville} value={d.ville}>
                    <div className="flex items-center">
                      <MapPin className="w-4 h-4 mr-2" />
                      {d.ville}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Nom du client / lieu de livraison</Label>
            <Input
              value={nom}
              onChange={e => setNom(e.target.value)}
              placeholder="Ex: Station XYZ, Entreprise ABC..."
              className="mt-1"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button onClick={handleSave} disabled={saving || !ville || !nom.trim()}>
            {saving ? 'Ajout...' : 'Ajouter'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
