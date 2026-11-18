import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { gmaoService } from '@/services/gmao';
import { buildOtDatePayload, toLocalDateInput } from '@/services/gmaoDates.js';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export type OtDateAction = 'start' | 'finish' | 'close';
export type OtDateTarget = { id: string; numero?: string | null; date_debut?: string | null; date_fin?: string | null };

export function GmaoOtDatesDialog({ ordre, action, onClose, onSaved }: {
  ordre: OtDateTarget;
  action: OtDateAction;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [dates, setDates] = useState({
    date_debut: toLocalDateInput(ordre.date_debut),
    date_fin: toLocalDateInput(ordre.date_fin),
    date_cloture: '',
  });
  const [saving, setSaving] = useState(false);
  const title = action === 'start' ? "Démarrer l’intervention" : action === 'finish' ? "Terminer l’intervention" : 'Valider et clôturer';
  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    try {
      const validator = user ? `${user.prenom || ''} ${user.nom || ''}`.trim() || user.email : null;
      await gmaoService.updateOrdreTravail(ordre.id, buildOtDatePayload(action, dates, validator));
      toast({ title: action === 'close' ? 'Intervention validée et clôturée' : action === 'finish' ? 'Intervention terminée' : 'Intervention démarrée' });
      onSaved();
      onClose();
    } catch (error) {
      toast({ title: 'Erreur', description: error instanceof Error ? error.message : 'Enregistrement impossible', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };
  return (
    <Dialog open onOpenChange={(open) => { if (!open && !saving) onClose(); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>{title} — {ordre.numero || 'Ordre de travail'}</DialogTitle></DialogHeader>
        <form onSubmit={save} className="space-y-4">
          {action === 'start' ? (
            <div className="space-y-2">
              <Label htmlFor="ot-date-debut">Date de début d’intervention *</Label>
              <Input id="ot-date-debut" type="datetime-local" required value={dates.date_debut} onChange={(e) => setDates({ ...dates, date_debut: e.target.value })} disabled={saving} />
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="ot-date-fin">Date intervention terminée *</Label>
              <Input id="ot-date-fin" type="datetime-local" required value={dates.date_fin} onChange={(e) => setDates({ ...dates, date_fin: e.target.value })} disabled={saving} />
            </div>
          )}
          {action === 'close' && (
            <div className="space-y-2">
              <Label htmlFor="ot-date-cloture">Date intervention validée et clôturée *</Label>
              <Input id="ot-date-cloture" type="datetime-local" required value={dates.date_cloture} onChange={(e) => setDates({ ...dates, date_cloture: e.target.value })} disabled={saving} />
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>Annuler</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Enregistrement…' : title}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}