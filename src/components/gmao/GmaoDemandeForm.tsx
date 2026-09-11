import React, { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
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
import { useAuth } from '@/contexts/AuthContext';
import { Plus, Trash2 } from 'lucide-react';
import { EquipementCombobox } from './EquipementCombobox';
import { fmtMontant, PRIORITES, STATUTS_OT, TYPES_MAINTENANCE } from './gmaoUi';

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  equipementId?: string | null;
  /** Demande existante à modifier (ex : rejetée pour adaptation) */
  demande?: any | null;
  onSaved?: () => void;
}

type LignePiece = { piece_id: string; quantite: number; prix_unitaire: number };

const initial = {
  titre: '',
  equipement_id: '',
  type_maintenance: 'correctif',
  priorite: 'normale',
  statut_souhaite: 'planifie',
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

/**
 * Formulaire complet de demande d'intervention.
 * Tous les champs saisis ici sont relus par le responsable maintenance
 * avant la validation de la demande en ordre de travail.
 */
export const GmaoDemandeForm: React.FC<Props> = ({ open, onOpenChange, equipementId, demande, onSaved }) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { equipements, pieces, rafraichir } = useGmao();
  const nomUtilisateur = user ? `${user.prenom || ''} ${user.nom || ''}`.trim() || user.email : '';
  const [form, setForm] = useState<Record<string, any>>({ ...initial });
  const [lignes, setLignes] = useState<LignePiece[]>([]);
  const [enregistrement, setEnregistrement] = useState(false);

  useEffect(() => { if (open) rafraichir(); }, [open]);

  useEffect(() => {
    if (open) {
      if (demande) {
        // Pré-remplissage pour adaptation d'une demande rejetée
        setForm({
          ...initial,
          titre: demande.titre || '',
          equipement_id: demande.equipement_id || '',
          type_maintenance: demande.type_maintenance || 'correctif',
          priorite: demande.priorite || 'normale',
          statut_souhaite: demande.statut_souhaite || 'planifie',
          date_planifiee: demande.date_planifiee || '',
          date_debut: demande.date_debut ? new Date(demande.date_debut).toISOString().slice(0, 16) : '',
          date_fin: demande.date_fin ? new Date(demande.date_fin).toISOString().slice(0, 16) : '',
          description: demande.description || '',
          symptomes: demande.symptomes || '',
          diagnostic: demande.diagnostic || '',
          travaux_realises: demande.travaux_realises || '',
          technicien: demande.technicien || '',
          heures_main_oeuvre: demande.heures_main_oeuvre || '',
          cout_main_oeuvre: Number(demande.cout_main_oeuvre) || 0,
          cout_prestation: Number(demande.cout_prestation) || 0,
          cout_autres: Number(demande.cout_autres) || 0,
        });
        setLignes(Array.isArray(demande.pieces_prevues) ? demande.pieces_prevues : []);
      } else {
        setForm({ ...initial, equipement_id: equipementId || '' });
        setLignes([]);
      }
    }
  }, [open, equipementId, demande]);

  const set = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => {
    if (form.date_debut && form.date_fin) {
      const debut = new Date(form.date_debut).getTime();
      const fin = new Date(form.date_fin).getTime();
      if (fin > debut) {
        const heures = (fin - debut) / (1000 * 60 * 60);
        setForm((f) => ({ ...f, heures_main_oeuvre: heures.toFixed(2) }));
      }
    }
  }, [form.date_debut, form.date_fin]);

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
      toast({ title: 'Champ requis', description: "Le motif de la demande est obligatoire", variant: 'destructive' });
      return;
    }
    if (!form.equipement_id) {
      toast({ title: 'Équipement requis', description: 'Chaque demande est rattachée à une immatriculation', variant: 'destructive' });
      return;
    }
    setEnregistrement(true);
    try {
      const payload = {
        titre: form.titre.trim(),
        description: form.description || null,
        equipement_id: form.equipement_id,
        priorite: form.priorite,
        statut: 'nouvelle',
        type_maintenance: form.type_maintenance,
        statut_souhaite: form.statut_souhaite,
        date_planifiee: form.date_planifiee || null,
        date_debut: form.date_debut ? new Date(form.date_debut).toISOString() : null,
        date_fin: form.date_fin ? new Date(form.date_fin).toISOString() : null,
        symptomes: form.symptomes || null,
        diagnostic: form.diagnostic || null,
        travaux_realises: form.travaux_realises || null,
        technicien: form.technicien || null,
        heures_main_oeuvre: Number(form.heures_main_oeuvre) || 0,
        cout_main_oeuvre: Number(form.cout_main_oeuvre) || 0,
        cout_prestation: Number(form.cout_prestation) || 0,
        cout_autres: Number(form.cout_autres) || 0,
        pieces_prevues: lignes.filter((x) => x.piece_id && Number(x.quantite) > 0),
      };

      if (demande?.id) {
        // Adaptation d'une demande rejetée : elle repart en validation
        await gmaoService.updateDemande(demande.id, {
          ...payload,
          motif_rejet: null,
          date_traitement: null,
          traite_par_nom: null,
        } as any);
        toast({
          title: 'Demande modifiée',
          description: 'Elle est de nouveau en attente de validation du responsable maintenance.',
        });
      } else {
        const nouvelle: any = await gmaoService.createDemande({
          ...payload,
          demandeur_nom: nomUtilisateur || null,
        });
        toast({
          title: 'Demande enregistrée',
          description: `${nouvelle?.numero ? `N° ${nouvelle.numero} — ` : ''}En attente de validation du responsable maintenance.`,
        });
      }
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
        <DialogHeader>
          <DialogTitle>{demande ? `Modifier la demande ${demande.numero || ''}` : "Demande d'intervention"}</DialogTitle>
          <DialogDescription>
            Le responsable maintenance relit l'ensemble de ces informations avant de valider la demande en ordre de travail.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <Section titre="Identification">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <Label>Motif / objet *</Label>
                <Input value={form.titre} onChange={(e) => set('titre', e.target.value)} placeholder="Ex : Remplacement plaquettes de frein" />
              </div>
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
                <Label>Statut souhaité de l'OT</Label>
                <Select value={form.statut_souhaite} onValueChange={(v) => set('statut_souhaite', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{STATUTS_OT.filter((s) => s.value !== 'cloture').map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Date planifiée</Label><Input type="date" value={form.date_planifiee} onChange={(e) => set('date_planifiee', e.target.value)} /></div>
              <div className="md:col-span-2"><Label>Demandeur</Label><Input value={nomUtilisateur} readOnly disabled className="bg-muted" /></div>
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
              <div className="md:col-span-2"><Label>Travaux à réaliser / réalisés</Label><Textarea rows={3} value={form.travaux_realises} onChange={(e) => set('travaux_realises', e.target.value)} /></div>
              <div><Label>Technicien / prestataire</Label><Input value={form.technicien} onChange={(e) => set('technicien', e.target.value)} /></div>
              <div>
                <Label>Temps passé (heures)</Label>
                <Input type="number" value={form.heures_main_oeuvre} readOnly className="bg-muted/40" />
                <p className="text-xs text-muted-foreground mt-1">Calculé automatiquement à partir des dates de début et fin.</p>
              </div>
              <div><Label>Date de début</Label><Input type="datetime-local" value={form.date_debut} onChange={(e) => set('date_debut', e.target.value)} /></div>
              <div><Label>Date de fin</Label><Input type="datetime-local" value={form.date_fin} onChange={(e) => set('date_fin', e.target.value)} /></div>
            </div>
          </Section>

          <Separator />

          <Section titre="Pièces prévues">
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
            {enregistrement ? 'Enregistrement…' : demande ? 'Enregistrer et renvoyer en validation' : 'Envoyer la demande'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
