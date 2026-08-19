import React, { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { gmaoService } from '@/services/gmao';
import { useGmao } from './GmaoContext';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2 } from 'lucide-react';
import { EquipementCombobox } from './EquipementCombobox';
import { fmtMontant, PRIORITES, STATUTS_OT, TYPES_MAINTENANCE } from './gmaoUi';

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  equipementId?: string | null;
  onSaved?: () => void;
}

type LignePiece = { piece_id: string; quantite: number; prix_unitaire: number };

const initial = {
  titre: '',
  equipement_id: '',
  type_maintenance: 'correctif',
  priorite: 'normale',
  statut: 'planifie',
  date_planifiee: '',
  date_debut: '',
  date_fin: '',
  description: '',
  symptomes: '',
  diagnostic: '',
  travaux_realises: '',
  technicien: '',
  heures_main_oeuvre: '',
  cout_main_oeuvre: 0,
  cout_prestation: 0,
  cout_autres: 0,
};

const Section: React.FC<{ titre: string; children: React.ReactNode }> = ({ titre, children }) => (
  <div className="space-y-3">
    <p className="text-sm font-semibold text-foreground">{titre}</p>
    {children}
  </div>
);


export const GmaoInterventionForm: React.FC<Props> = ({ open, onOpenChange, equipementId, onSaved }) => {
  const { toast } = useToast();
  const { equipements, pieces, rafraichir } = useGmao();
  const [form, setForm] = useState<Record<string, any>>({ ...initial });
  const [lignes, setLignes] = useState<LignePiece[]>([]);
  const [enregistrement, setEnregistrement] = useState(false);

  useEffect(() => {
    if (open) {
      setForm({ ...initial, equipement_id: equipementId || '' });
      setLignes([]);
    }
  }, [open, equipementId]);

  const set = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));

  const coutPieces = useMemo(
    () => lignes.reduce((s, l) => s + Number(l.quantite || 0) * Number(l.prix_unitaire || 0), 0),
    [lignes]
  );
  const coutTotal =
    coutPieces + Number(form.cout_main_oeuvre || 0) + Number(form.cout_prestation || 0) + Number(form.cout_autres || 0);

  const ajouterLigne = () => setLignes((l) => [...l, { piece_id: '', quantite: 1, prix_unitaire: 0 }]);

  const majLigne = (i: number, patch: Partial<LignePiece>) =>
    setLignes((l) => l.map((x, idx) => (idx === i ? { ...x, ...patch } : x)));

  const choisirPiece = (i: number, pieceId: string) => {
    const p = pieces.find((x) => x.id === pieceId);
    majLigne(i, { piece_id: pieceId, prix_unitaire: Number(p?.prix_unitaire || 0) });
  };

  const enregistrer = async () => {
    if (!form.titre.trim()) {
      toast({ title: 'Champ requis', description: "Le motif de l'intervention est obligatoire", variant: 'destructive' });
      return;
    }
    if (!form.equipement_id) {
      toast({ title: 'Équipement requis', description: 'Chaque intervention est rattachée à une immatriculation', variant: 'destructive' });
      return;
    }
    setEnregistrement(true);
    try {
      const description = [form.description, form.symptomes && `Symptômes : ${form.symptomes}`]
        .filter(Boolean)
        .join('\n');

      const ot: any = await gmaoService.createOrdreTravail({
        titre: form.titre.trim(),
        description: description || null,
        equipement_id: form.equipement_id,
        type_maintenance: form.type_maintenance,
        priorite: form.priorite,
        statut: form.statut,
        date_planifiee: form.date_planifiee || null,
        date_debut: form.date_debut ? new Date(form.date_debut).toISOString() : null,
        date_fin: form.date_fin ? new Date(form.date_fin).toISOString() : null,
        diagnostic: form.diagnostic || null,
        travaux_realises: [
          form.travaux_realises,
          form.technicien && `Technicien / prestataire : ${form.technicien}`,
          form.heures_main_oeuvre && `Temps passé : ${form.heures_main_oeuvre} h`,
        ].filter(Boolean).join('\n') || null,
        cout_main_oeuvre: Number(form.cout_main_oeuvre) || 0,
        cout_prestation: Number(form.cout_prestation) || 0,
        cout_autres: Number(form.cout_autres) || 0,
      });

      for (const l of lignes.filter((x) => x.piece_id && Number(x.quantite) > 0)) {
        await gmaoService.addOtPiece({
          ot_id: ot.id,
          piece_id: l.piece_id,
          quantite: Number(l.quantite),
          prix_unitaire: Number(l.prix_unitaire) || 0,
          montant: Number(l.quantite) * (Number(l.prix_unitaire) || 0),
        });
      }

      toast({ title: 'Intervention enregistrée', description: ot.numero ? `N° ${ot.numero}` : undefined });
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
      <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Nouvelle intervention</DialogTitle></DialogHeader>

        <div className="space-y-6">
          <Section titre="Identification">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <Label>Motif / objet *</Label>
                <Input value={form.titre} onChange={(e) => set('titre', e.target.value)} placeholder="Ex : Remplacement plaquettes de frein" />
              </div>
              <div>
                <Label>Équipement (immatriculation) *</Label>
                <Select value={form.equipement_id} onValueChange={(v) => set('equipement_id', v)}>
                  <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                  <SelectContent className="max-h-72">
                    {equipements.map((e) => (
                      <SelectItem key={e.id} value={e.id}>
                        {e.immatriculation || e.code} — {e.designation}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Type d'intervention</Label>
                <Select value={form.type_maintenance} onValueChange={(v) => set('type_maintenance', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{TYPES_MAINTENANCE.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Priorité</Label>
                <Select value={form.priorite} onValueChange={(v) => set('priorite', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{PRIORITES.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Statut</Label>
                <Select value={form.statut} onValueChange={(v) => set('statut', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{STATUTS_OT.filter((s) => s.value !== 'cloture').map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Date planifiée</Label><Input type="date" value={form.date_planifiee} onChange={(e) => set('date_planifiee', e.target.value)} /></div>
            </div>
          </Section>

          <Separator />

          <Section titre="Diagnostic">
            <div className="grid gap-4 md:grid-cols-2">
              <div><Label>Symptômes constatés</Label><Textarea rows={3} value={form.symptomes} onChange={(e) => set('symptomes', e.target.value)} /></div>
              <div><Label>Diagnostic</Label><Textarea rows={3} value={form.diagnostic} onChange={(e) => set('diagnostic', e.target.value)} /></div>
              <div className="md:col-span-2"><Label>Observations</Label><Textarea rows={2} value={form.description} onChange={(e) => set('description', e.target.value)} /></div>
            </div>
          </Section>

          <Separator />

          <Section titre="Travaux">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2"><Label>Travaux réalisés</Label><Textarea rows={3} value={form.travaux_realises} onChange={(e) => set('travaux_realises', e.target.value)} /></div>
              <div><Label>Technicien / prestataire</Label><Input value={form.technicien} onChange={(e) => set('technicien', e.target.value)} /></div>
              <div><Label>Temps passé (heures)</Label><Input type="number" value={form.heures_main_oeuvre} onChange={(e) => set('heures_main_oeuvre', e.target.value)} /></div>
              <div><Label>Date de début</Label><Input type="datetime-local" value={form.date_debut} onChange={(e) => set('date_debut', e.target.value)} /></div>
              <div><Label>Date de fin</Label><Input type="datetime-local" value={form.date_fin} onChange={(e) => set('date_fin', e.target.value)} /></div>
            </div>
          </Section>

          <Separator />

          <Section titre="Pièces consommées">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-56">Pièce</TableHead>
                    <TableHead className="w-24">Qté</TableHead>
                    <TableHead className="w-36">Prix unitaire</TableHead>
                    <TableHead className="w-36 text-right">Montant</TableHead>
                    <TableHead className="w-12" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lignes.length === 0 && (
                    <TableRow><TableCell colSpan={5} className="text-sm text-muted-foreground">Aucune pièce ajoutée.</TableCell></TableRow>
                  )}
                  {lignes.map((l, i) => {
                    const p = pieces.find((x) => x.id === l.piece_id);
                    return (
                      <TableRow key={i}>
                        <TableCell>
                          <Select value={l.piece_id} onValueChange={(v) => choisirPiece(i, v)}>
                            <SelectTrigger><SelectValue placeholder="Sélectionner une pièce" /></SelectTrigger>
                            <SelectContent className="max-h-72">
                              {pieces.map((x) => (
                                <SelectItem key={x.id} value={x.id}>
                                  {x.reference} — {x.designation} (stock {x.quantite_stock})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {p && Number(l.quantite) > Number(p.quantite_stock) && (
                            <p className="mt-1 text-xs text-destructive">Quantité supérieure au stock disponible</p>
                          )}
                        </TableCell>
                        <TableCell>
                          <Input type="number" min={1} value={l.quantite} onChange={(e) => majLigne(i, { quantite: Number(e.target.value) })} />
                        </TableCell>
                        <TableCell>
                          <Input type="number" value={l.prix_unitaire} onChange={(e) => majLigne(i, { prix_unitaire: Number(e.target.value) })} />
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {fmtMontant(Number(l.quantite || 0) * Number(l.prix_unitaire || 0))}
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" onClick={() => setLignes((x) => x.filter((_, idx) => idx !== i))}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
            <Button variant="outline" size="sm" onClick={ajouterLigne}><Plus className="mr-2 h-4 w-4" /> Ajouter une pièce</Button>
          </Section>

          <Separator />

          <Section titre="Coûts">
            <div className="grid gap-4 md:grid-cols-3">
              <div><Label>Main-d'œuvre (GNF)</Label><Input type="number" value={form.cout_main_oeuvre} onChange={(e) => set('cout_main_oeuvre', e.target.value)} /></div>
              <div><Label>Prestation externe (GNF)</Label><Input type="number" value={form.cout_prestation} onChange={(e) => set('cout_prestation', e.target.value)} /></div>
              <div><Label>Autres coûts (GNF)</Label><Input type="number" value={form.cout_autres} onChange={(e) => set('cout_autres', e.target.value)} /></div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-muted/40 p-4">
              <span className="text-sm text-muted-foreground">Pièces : <strong className="text-foreground">{fmtMontant(coutPieces)}</strong></span>
              <span className="text-base font-semibold">Coût total estimé : {fmtMontant(coutTotal)}</span>
            </div>
          </Section>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button onClick={enregistrer} disabled={enregistrement}>
            {enregistrement ? 'Enregistrement…' : "Enregistrer l'intervention"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
