import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Paperclip, X } from 'lucide-react';
import { socotacService } from '@/services/socotac';
import { controlesAnnuelsService } from '@/services/controlesAnnuels';
import type { TypeControle } from '@/services/controlesHistorique';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { fmtDate } from '../gmaoUi';
import { prochainControle } from '../socotac/socotacUtils';
import { prochainControleAnnuel } from '../annuel/annuelUtils';
import type { ControleCourant } from './ControleHistoriqueDialog';

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  type: TypeControle;
  controle: ControleCourant | null;
  onSaved?: () => void;
}

type Doc = { nom: string; url: string; type?: string };

export const ControleRenouvellementDialog: React.FC<Props> = ({ open, onOpenChange, type, controle, onSaved }) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [date, setDate] = useState('');
  const [resultat, setResultat] = useState('accepte');
  const [motif, setMotif] = useState('');
  const [observations, setObservations] = useState('');
  const [documents, setDocuments] = useState<Doc[]>([]);
  const [upload, setUpload] = useState(false);
  const [enregistrement, setEnregistrement] = useState(false);

  useEffect(() => {
    if (!open) return;
    setDate(new Date().toISOString().slice(0, 10));
    setResultat('accepte');
    setMotif('');
    setObservations('');
    setDocuments([]);
  }, [open]);

  const service = type === 'socotac' ? socotacService : controlesAnnuelsService;
  const nouvelleEcheance = date ? (type === 'socotac' ? prochainControle(date) : prochainControleAnnuel(date)) : null;

  const televerser = async (f: File | undefined) => {
    if (!f) return;
    setUpload(true);
    try {
      const d = await service.uploadDocument(f);
      setDocuments((l) => [...l, d]);
    } catch (e: any) {
      toast({ title: 'Erreur de téléversement', description: e.message, variant: 'destructive' });
    } finally {
      setUpload(false);
    }
  };

  const enregistrer = async () => {
    if (!controle || !date) return;
    if (resultat === 'rejete' && !motif.trim()) {
      toast({ title: 'Motif requis', description: 'Renseignez le motif du rejet.', variant: 'destructive' });
      return;
    }
    setEnregistrement(true);
    const nom = user ? `${user.prenom || ''} ${user.nom || ''}`.trim() || user.email : null;
    try {
      await service.update(controle.id, {
        date_controle: date,
        date_prochain_controle: nouvelleEcheance,
        resultat,
        motif_rejet: resultat === 'rejete' ? motif.trim() : null,
        observations: observations.trim() || null,
        documents: documents.length ? documents : (controle.documents as Doc[] | null) || [],
        updated_by: user?.id || null,
        updated_by_nom: nom,
      });
      toast({ title: 'Contrôle mis à jour', description: `Prochaine échéance : ${fmtDate(nouvelleEcheance)}` });
      onSaved?.();
      onOpenChange(false);
    } catch (e: any) {
      toast({ title: 'Erreur', description: e.message, variant: 'destructive' });
    } finally {
      setEnregistrement(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Mettre à jour le contrôle {type === 'socotac' ? 'SOCOTAC' : 'annuel'} — {controle?.immatriculation_tracteur || '—'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Contrôle actuel du {fmtDate(controle?.date_controle)} — échéance {fmtDate(controle?.date_prochain_controle)}.
            L'ancienne version est conservée dans l'historique.
          </p>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label>Nouvelle date de contrôle *</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div>
              <Label>Résultat</Label>
              <Select value={resultat} onValueChange={setResultat}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="accepte">Accepté</SelectItem>
                  <SelectItem value="rejete">Rejeté</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-md border border-border/60 bg-muted/40 p-3 text-sm">
            Nouvelle échéance calculée : <strong>{fmtDate(nouvelleEcheance)}</strong>
            <Badge variant="outline" className="ml-2">{type === 'socotac' ? '+ 6 mois' : '+ 12 mois'}</Badge>
          </div>

          {resultat === 'rejete' && (
            <div>
              <Label>Motif du rejet *</Label>
              <Textarea value={motif} onChange={(e) => setMotif(e.target.value)} rows={2} />
            </div>
          )}

          <div>
            <Label>Observations</Label>
            <Textarea value={observations} onChange={(e) => setObservations(e.target.value)} rows={2} />
          </div>

          <div className="space-y-2">
            <Label>Certificat / justificatif</Label>
            <Input type="file" accept="application/pdf,image/*" disabled={upload} onChange={(e) => televerser(e.target.files?.[0])} />
            {upload && <p className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Téléversement…</p>}
            {documents.map((d, i) => (
              <div key={d.url} className="flex items-center justify-between rounded-md border border-border/60 px-3 py-1.5 text-sm">
                <a href={d.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
                  <Paperclip className="h-3.5 w-3.5" />{d.nom}
                </a>
                <Button variant="ghost" size="icon" onClick={() => setDocuments((l) => l.filter((_, k) => k !== i))}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button onClick={enregistrer} disabled={enregistrement || !date}>
            {enregistrement && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Enregistrer la mise à jour
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
