import React, { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Paperclip, Trash2, X } from 'lucide-react';
import { socotacService, SocotacControle, SocotacDocument } from '@/services/socotac';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useGmao } from '../GmaoContext';
import { CLASSE_STATUT, LIBELLE_STATUT, joursRestants, normaliserImmat, prochainControle, statutDepuisJours } from './socotacUtils';

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  controle?: SocotacControle | null;
  immatTracteurInitial?: string | null;
  onSaved?: () => void;
}

const vide = {
  immatriculation_tracteur: '',
  immatriculation_remorque: '',
  conducteur_nom: '',
  conducteur_contact: '',
  date_controle: new Date().toISOString().slice(0, 10),
  resultat: 'accepte',
  motif_rejet: '',
  observations: '',
  action_corrective: '',
  responsable_action: '',
  date_correction_prevue: '',
  date_correction: '',
  date_contre_visite: '',
  resultat_contre_visite: '',
};

export const SocotacForm: React.FC<Props> = ({ open, onOpenChange, controle, immatTracteurInitial, onSaved }) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { equipements } = useGmao();
  const [form, setForm] = useState<Record<string, string>>({ ...vide });
  const [documents, setDocuments] = useState<SocotacDocument[]>([]);
  const [enregistrement, setEnregistrement] = useState(false);
  const [upload, setUpload] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (controle) {
      setForm({
        immatriculation_tracteur: controle.immatriculation_tracteur || '',
        immatriculation_remorque: controle.immatriculation_remorque || '',
        conducteur_nom: controle.conducteur_nom || '',
        conducteur_contact: controle.conducteur_contact || '',
        date_controle: controle.date_controle || '',
        resultat: controle.resultat || 'accepte',
        motif_rejet: controle.motif_rejet || '',
        observations: controle.observations || '',
        action_corrective: controle.action_corrective || '',
        responsable_action: controle.responsable_action || '',
        date_correction_prevue: controle.date_correction_prevue || '',
        date_correction: controle.date_correction || '',
        date_contre_visite: controle.date_contre_visite || '',
        resultat_contre_visite: controle.resultat_contre_visite || '',
      });
      setDocuments(Array.isArray(controle.documents) ? controle.documents : []);
    } else {
      setForm({ ...vide, immatriculation_tracteur: immatTracteurInitial || '' });
      setDocuments([]);
    }
  }, [open, controle, immatTracteurInitial]);

  const maj = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const tracteurs = useMemo(
    () => equipements.filter((e) => e.type_equipement === 'tracteur' && e.immatriculation),
    [equipements]
  );
  const remorques = useMemo(
    () => equipements.filter((e) => e.type_equipement === 'remorque' && e.immatriculation),
    [equipements]
  );

  const dateProchain = form.date_controle ? prochainControle(form.date_controle) : null;
  const jours = joursRestants(dateProchain);
  const statut = statutDepuisJours(jours);

  const televerser = async (files: FileList | null) => {
    if (!files?.length) return;
    setUpload(true);
    try {
      const ajouts: SocotacDocument[] = [];
      for (const f of Array.from(files)) ajouts.push(await socotacService.uploadDocument(f));
      setDocuments((d) => [...d, ...ajouts]);
    } catch (e: any) {
      toast({ title: 'Erreur de téléversement', description: e.message, variant: 'destructive' });
    } finally {
      setUpload(false);
    }
  };

  const enregistrer = async () => {
    if (!form.immatriculation_tracteur || !form.date_controle) {
      toast({ title: 'Champs obligatoires', description: 'Immatriculation tracteur et date du contrôle requises.', variant: 'destructive' });
      return;
    }
    if (form.resultat === 'rejete' && !form.motif_rejet) {
      toast({ title: 'Motif requis', description: 'Renseignez le motif du rejet.', variant: 'destructive' });
      return;
    }
    setEnregistrement(true);
    const tr = normaliserImmat(form.immatriculation_tracteur);
    const rm = normaliserImmat(form.immatriculation_remorque);
    const nomUtilisateur = user ? `${user.prenom || ''} ${user.nom || ''}`.trim() || user.email : null;
    const payload: Record<string, unknown> = {
      immatriculation_tracteur: tr,
      immatriculation_remorque: rm || null,
      equipement_id: tracteurs.find((e) => normaliserImmat(e.immatriculation) === tr)?.id || null,
      equipement_remorque_id: remorques.find((e) => normaliserImmat(e.immatriculation) === rm)?.id || null,
      conducteur_nom: form.conducteur_nom || null,
      conducteur_contact: form.conducteur_contact || null,
      date_controle: form.date_controle,
      resultat: form.resultat,
      motif_rejet: form.resultat === 'rejete' ? form.motif_rejet || null : null,
      observations: form.observations || null,
      action_corrective: form.action_corrective || null,
      responsable_action: form.responsable_action || null,
      date_correction_prevue: form.date_correction_prevue || null,
      date_correction: form.date_correction || null,
      date_contre_visite: form.date_contre_visite || null,
      resultat_contre_visite: form.resultat_contre_visite || null,
      documents,
    };

    try {
      if (controle) {
        await socotacService.update(controle.id, { ...payload, updated_by: user?.id || null, updated_by_nom: nomUtilisateur });
        toast({ title: 'Contrôle mis à jour' });
      } else {
        await socotacService.create({ ...payload, created_by: user?.id || null, created_by_nom: nomUtilisateur });
        toast({ title: 'Contrôle SOCOTAC enregistré', description: `Prochaine échéance : ${dateProchain}` });
      }
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
      <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{controle ? 'Modifier le contrôle SOCOTAC' : 'Nouveau contrôle SOCOTAC'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Identification</h3>
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <Label>Immatriculation tracteur *</Label>
                <Input
                  list="socotac-tracteurs"
                  value={form.immatriculation_tracteur}
                  onChange={(e) => maj('immatriculation_tracteur', e.target.value.toUpperCase())}
                  placeholder="AA-8575-02"
                />
                <datalist id="socotac-tracteurs">
                  {tracteurs.map((e) => <option key={e.id} value={e.immatriculation as string} />)}
                </datalist>
              </div>
              <div>
                <Label>Immatriculation remorque</Label>
                <Input
                  list="socotac-remorques"
                  value={form.immatriculation_remorque}
                  onChange={(e) => maj('immatriculation_remorque', e.target.value.toUpperCase())}
                  placeholder="AA-8883-02"
                />
                <datalist id="socotac-remorques">
                  {remorques.map((e) => <option key={e.id} value={e.immatriculation as string} />)}
                </datalist>
              </div>
              <div>
                <Label>Conducteur affecté</Label>
                <Input value={form.conducteur_nom} onChange={(e) => maj('conducteur_nom', e.target.value)} />
              </div>
              <div>
                <Label>Contact conducteur</Label>
                <Input value={form.conducteur_contact} onChange={(e) => maj('conducteur_contact', e.target.value)} />
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Contrôle</h3>
            <div className="grid gap-3 md:grid-cols-3">
              <div>
                <Label>Date du contrôle *</Label>
                <Input type="date" value={form.date_controle} onChange={(e) => maj('date_controle', e.target.value)} />
              </div>
              <div>
                <Label>Prochain contrôle (auto +6 mois)</Label>
                <Input value={dateProchain ? new Date(`${dateProchain}T00:00:00`).toLocaleDateString('fr-FR') : '—'} readOnly disabled />
              </div>
              <div>
                <Label>Statut / jours restants</Label>
                <div className="flex h-10 items-center gap-2">
                  <Badge className={CLASSE_STATUT[statut]}>{LIBELLE_STATUT[statut]}</Badge>
                  <span className="text-sm text-muted-foreground">{jours !== null ? `${jours} j` : '—'}</span>
                </div>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <Label>Résultat du contrôle *</Label>
                <Select value={form.resultat} onValueChange={(v) => maj('resultat', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="accepte">Accepté</SelectItem>
                    <SelectItem value="rejete">Rejeté</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Observations</Label>
                <Input value={form.observations} onChange={(e) => maj('observations', e.target.value)} />
              </div>
            </div>
          </section>

          {form.resultat === 'rejete' && (
            <Card className="border-destructive/40">
              <CardContent className="space-y-3 p-4">
                <h3 className="text-sm font-semibold text-destructive uppercase tracking-wide">Traitement du rejet</h3>
                <div>
                  <Label>Motif du rejet *</Label>
                  <Input value={form.motif_rejet} onChange={(e) => maj('motif_rejet', e.target.value)} placeholder="Éclairage, Pneumatiques, Freinage…" />
                </div>
                <div>
                  <Label>Action corrective</Label>
                  <Textarea rows={2} value={form.action_corrective} onChange={(e) => maj('action_corrective', e.target.value)} />
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <Label>Responsable de l'action</Label>
                    <Input value={form.responsable_action} onChange={(e) => maj('responsable_action', e.target.value)} />
                  </div>
                  <div>
                    <Label>Date prévue de correction</Label>
                    <Input type="date" value={form.date_correction_prevue} onChange={(e) => maj('date_correction_prevue', e.target.value)} />
                  </div>
                  <div>
                    <Label>Date de correction</Label>
                    <Input type="date" value={form.date_correction} onChange={(e) => maj('date_correction', e.target.value)} />
                  </div>
                  <div>
                    <Label>Date de contre-visite</Label>
                    <Input type="date" value={form.date_contre_visite} onChange={(e) => maj('date_contre_visite', e.target.value)} />
                  </div>
                  <div className="md:col-span-2">
                    <Label>Résultat de la contre-visite</Label>
                    <Select value={form.resultat_contre_visite || 'aucun'} onValueChange={(v) => maj('resultat_contre_visite', v === 'aucun' ? '' : v)}>
                      <SelectTrigger><SelectValue placeholder="Non réalisée" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="aucun">Non réalisée</SelectItem>
                        <SelectItem value="accepte">Acceptée</SelectItem>
                        <SelectItem value="rejete">Rejetée</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Documents justificatifs</h3>
            <Input type="file" multiple onChange={(e) => televerser(e.target.files)} disabled={upload} />
            {upload && <p className="text-xs text-muted-foreground flex items-center gap-2"><Loader2 className="h-3 w-3 animate-spin" /> Téléversement…</p>}
            <div className="space-y-1">
              {documents.map((d, i) => (
                <div key={`${d.url}-${i}`} className="flex items-center gap-2 rounded-md border border-border/60 px-3 py-2 text-sm">
                  <Paperclip className="h-4 w-4 text-muted-foreground" />
                  <a href={d.url} target="_blank" rel="noreferrer" className="flex-1 truncate hover:underline">{d.nom}</a>
                  <Button variant="ghost" size="icon" onClick={() => setDocuments((l) => l.filter((_, j) => j !== i))}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
              {!documents.length && <p className="text-xs text-muted-foreground">Aucun document (certificat, rapport de contrôle…).</p>}
            </div>
          </section>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}><X className="mr-2 h-4 w-4" />Annuler</Button>
          <Button onClick={enregistrer} disabled={enregistrement}>
            {enregistrement && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Enregistrer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
