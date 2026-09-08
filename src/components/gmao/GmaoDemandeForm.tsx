import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { gmaoService } from '@/services/gmao';
import { useGmao } from './GmaoContext';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { EquipementCombobox } from './EquipementCombobox';
import { PRIORITES } from './gmaoUi';

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  equipementId?: string | null;
  onSaved?: () => void;
}

const initial = {
  titre: '',
  equipement_id: '',
  priorite: 'normale',
  symptomes: '',
  description: '',
};

/**
 * Formulaire de demande d'intervention.
 * La demande est ensuite validée par le responsable maintenance,
 * qui la transforme en ordre de travail.
 */
export const GmaoDemandeForm: React.FC<Props> = ({ open, onOpenChange, equipementId, onSaved }) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { equipements, rafraichir } = useGmao();
  const nomUtilisateur = user ? `${user.prenom || ''} ${user.nom || ''}`.trim() || user.email : '';
  const [form, setForm] = useState<Record<string, any>>({ ...initial });
  const [enregistrement, setEnregistrement] = useState(false);

  useEffect(() => {
    if (open) {
      rafraichir();
      setForm({ ...initial, equipement_id: equipementId || '' });
    }
  }, [open, equipementId]);

  const set = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));

  const enregistrer = async () => {
    if (!form.titre.trim()) {
      toast({ title: 'Champ requis', description: "Le motif de la demande est obligatoire", variant: 'destructive' });
      return;
    }
    if (!form.equipement_id) {
      toast({ title: 'Équipement requis', description: 'Chaque demande est rattachée à une immatriculation', variant: 'destructive' });
      return;
    }
    setEnregistrement(true);
    try {
      const description = [form.description, form.symptomes && `Symptômes constatés : ${form.symptomes}`]
        .filter(Boolean)
        .join('\n');

      const demande: any = await gmaoService.createDemande({
        titre: form.titre.trim(),
        equipement_id: form.equipement_id,
        priorite: form.priorite,
        statut: 'nouvelle',
        description: description || null,
        demandeur_nom: nomUtilisateur || null,
      });

      toast({
        title: 'Demande enregistrée',
        description: `${demande?.numero ? `N° ${demande.numero} — ` : ''}En attente de validation du responsable maintenance.`,
      });
      onOpenChange(false);
      await rafraichir();
      onSaved?.();
    } catch (e: any) {
      toast({ title: 'Erreur', description: e.message, variant: 'destructive' });
    } finally {
      setEnregistrement(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Demande d'intervention</DialogTitle>
          <DialogDescription>
            La demande sera validée par le responsable maintenance, qui la transformera en ordre de travail.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Motif / objet *</Label>
            <Input value={form.titre} onChange={(e) => set('titre', e.target.value)} placeholder="Ex : Remplacement plaquettes de frein" />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>Équipement (immatriculation) *</Label>
              <EquipementCombobox
                equipements={equipements}
                value={form.equipement_id}
                onChange={(v) => set('equipement_id', v)}
                placeholder="Sélectionner"
                searchPlaceholder="Rechercher une immatriculation..."
              />
            </div>
            <div>
              <Label>Priorité</Label>
              <Select value={form.priorite} onValueChange={(v) => set('priorite', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{PRIORITES.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Demandeur</Label>
            <Input value={nomUtilisateur} readOnly disabled className="bg-muted" />
          </div>
          <div>
            <Label>Symptômes constatés</Label>
            <Textarea rows={3} value={form.symptomes} onChange={(e) => set('symptomes', e.target.value)} />
          </div>
          <div>
            <Label>Observations</Label>
            <Textarea rows={3} value={form.description} onChange={(e) => set('description', e.target.value)} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button onClick={enregistrer} disabled={enregistrement}>
            {enregistrement ? 'Enregistrement…' : 'Envoyer la demande'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
