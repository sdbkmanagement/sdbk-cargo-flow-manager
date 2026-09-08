import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { gmaoService, GmaoDemande } from '@/services/gmao';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { CheckCircle2, XCircle, ShieldAlert } from 'lucide-react';
import { useGmao } from './GmaoContext';
import { fmtMontant } from './gmaoUi';

const PRIORITES = ['basse', 'normale', 'haute', 'urgente'];
const TYPES_MAINTENANCE = [
  { value: 'correctif', label: 'Correctif' },
  { value: 'preventif', label: 'Préventif' },
  { value: 'ameliorative', label: 'Curative' },
];
const STATUTS: Record<string, string> = {
  nouvelle: 'En attente de validation', acceptee: 'Acceptée', rejetee: 'Rejetée', transformee: 'Validée — OT créé',
};
const STATUT_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  nouvelle: 'outline', acceptee: 'secondary', rejetee: 'destructive', transformee: 'default',
};


const Ligne: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="text-sm"><span className="text-muted-foreground">{label} : </span>{children || '—'}</div>
);

/** Récapitulatif complet de la demande, relu par le responsable avant validation. */
const RecapDemande: React.FC<{ demande: any; equipementParId: (id?: string | null) => any; pieces: any[] }> = ({ demande, equipementParId, pieces }) => {
  const eq = equipementParId(demande.equipement_id);
  const lignes = Array.isArray(demande.pieces_prevues) ? demande.pieces_prevues : [];
  const coutPieces = lignes.reduce((s: number, l: any) => s + Number(l.quantite || 0) * Number(l.prix_unitaire || 0), 0);
  const coutTotal = coutPieces + Number(demande.cout_main_oeuvre || 0) + Number(demande.cout_prestation || 0) + Number(demande.cout_autres || 0);
  const dt = (v?: string | null) => (v ? new Date(v).toLocaleString('fr-FR') : '');

  return (
    <div className="space-y-3 rounded-md border p-3">
      <div className="grid gap-x-6 gap-y-1 md:grid-cols-2">
        <Ligne label="Demande">{demande.numero} — {demande.titre}</Ligne>
        <Ligne label="Demandeur">{demande.demandeur_nom}</Ligne>
        <Ligne label="Équipement">{eq ? `${eq.immatriculation || eq.code} — ${eq.designation}` : ''}</Ligne>
        <Ligne label="Type demandé">{TYPES_MAINTENANCE.find((t) => t.value === demande.type_maintenance)?.label}</Ligne>
        <Ligne label="Priorité">{demande.priorite}</Ligne>
        <Ligne label="Date planifiée souhaitée">{demande.date_planifiee ? new Date(demande.date_planifiee).toLocaleDateString('fr-FR') : ''}</Ligne>
        <Ligne label="Début">{dt(demande.date_debut)}</Ligne>
        <Ligne label="Fin">{dt(demande.date_fin)}</Ligne>
        <Ligne label="Technicien / prestataire">{demande.technicien}</Ligne>
        <Ligne label="Temps passé">{demande.heures_main_oeuvre ? `${demande.heures_main_oeuvre} h` : ''}</Ligne>
      </div>

      {demande.symptomes && <Ligne label="Symptômes"><span className="whitespace-pre-wrap">{demande.symptomes}</span></Ligne>}
      {demande.diagnostic && <Ligne label="Diagnostic"><span className="whitespace-pre-wrap">{demande.diagnostic}</span></Ligne>}
      {demande.description && <Ligne label="Observations"><span className="whitespace-pre-wrap">{demande.description}</span></Ligne>}
      {demande.travaux_realises && <Ligne label="Travaux"><span className="whitespace-pre-wrap">{demande.travaux_realises}</span></Ligne>}

      {lignes.length > 0 && (
        <div>
          <p className="text-sm font-medium">Pièces prévues</p>
          <ul className="mt-1 space-y-0.5 text-sm text-muted-foreground">
            {lignes.map((l: any, i: number) => {
              const p = pieces.find((x: any) => x.id === l.piece_id);
              return (
                <li key={i}>
                  {p ? `${p.reference} — ${p.designation}` : 'Pièce'} × {l.quantite} = {fmtMontant(Number(l.quantite || 0) * Number(l.prix_unitaire || 0))}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <div className="flex flex-wrap justify-between gap-2 rounded bg-muted/50 p-2 text-sm">
        <span>Pièces : <strong>{fmtMontant(coutPieces)}</strong></span>
        <span>Main-d'œuvre : <strong>{fmtMontant(Number(demande.cout_main_oeuvre || 0))}</strong></span>
        <span>Prestation : <strong>{fmtMontant(Number(demande.cout_prestation || 0))}</strong></span>
        <span>Autres : <strong>{fmtMontant(Number(demande.cout_autres || 0))}</strong></span>
        <span className="font-semibold">Total estimé : {fmtMontant(coutTotal)}</span>
      </div>
    </div>
  );
};

interface Props { refreshKey?: number }

export const GmaoDemandes: React.FC<Props> = ({ refreshKey = 0 }) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const nomUtilisateur = user ? `${user.prenom || ''} ${user.nom || ''}`.trim() || user.email : '';
  const { equipementParId, pieces } = useGmao();
  const [items, setItems] = useState<GmaoDemande[]>([]);
  const [loading, setLoading] = useState(true);

  // Seul le responsable maintenance (ou un admin/direction) peut valider ou rejeter
  const roles = user?.roles || [];
  const peutValider = roles.some((r: string) => ['admin', 'maintenance', 'direction'].includes(r));

  const [demandeActive, setDemandeActive] = useState<GmaoDemande | null>(null);
  const [modeAction, setModeAction] = useState<'valider' | 'rejeter' | null>(null);
  const [traitement, setTraitement] = useState<Record<string, any>>({
    type_maintenance: 'correctif', priorite: 'normale', date_planifiee: '', commentaire: '', motif_rejet: '',
  });
  const [enCours, setEnCours] = useState(false);

  const ouvrirAction = (d: GmaoDemande, mode: 'valider' | 'rejeter') => {
    setDemandeActive(d);
    setModeAction(mode);
    const dd = d as any;
    setTraitement({
      type_maintenance: dd.type_maintenance || 'correctif',
      priorite: d.priorite || 'normale',
      date_planifiee: dd.date_planifiee || '',
      commentaire: '',
      motif_rejet: '',
    });
  };

  const fermerAction = () => { setDemandeActive(null); setModeAction(null); };

  const charger = async () => {
    try {
      // Une fois transformée en OT ou rejetée, la demande disparaît de la liste
      const d = (await gmaoService.getDemandes()).filter((x: any) => !['transformee', 'rejetee'].includes(x.statut));
      setItems(d);
    } catch (e: any) {
      toast({ title: 'Erreur', description: e.message, variant: 'destructive' });
    } finally { setLoading(false); }
  };

  useEffect(() => { charger(); }, [refreshKey]);

  const valider = async () => {
    if (!demandeActive) return;
    setEnCours(true);
    try {
      const d = demandeActive as any;
      const ot: any = await gmaoService.createOrdreTravail({
        demande_id: demandeActive.id,
        equipement_id: demandeActive.equipement_id || null,
        titre: demandeActive.titre,
        description: [demandeActive.description, traitement.commentaire].filter(Boolean).join('\n\n') || null,
        type_maintenance: traitement.type_maintenance,
        priorite: traitement.priorite,
        statut: d.statut_souhaite || 'planifie',
        date_planifiee: traitement.date_planifiee || null,
        date_debut: d.date_debut || null,
        date_fin: d.date_fin || null,
        diagnostic: [d.symptomes && `Symptômes : ${d.symptomes}`, d.diagnostic].filter(Boolean).join('\n') || null,
        travaux_realises: [
          d.travaux_realises,
          d.technicien && `Technicien / prestataire : ${d.technicien}`,
          d.heures_main_oeuvre && `Temps passé : ${d.heures_main_oeuvre} h`,
        ].filter(Boolean).join('\n') || null,
        cout_main_oeuvre: Number(d.cout_main_oeuvre) || 0,
        cout_prestation: Number(d.cout_prestation) || 0,
        cout_autres: Number(d.cout_autres) || 0,
      });

      for (const l of (Array.isArray(d.pieces_prevues) ? d.pieces_prevues : [])) {
        if (!l?.piece_id || !(Number(l.quantite) > 0)) continue;
        await gmaoService.addOtPiece({
          ot_id: ot.id,
          piece_id: l.piece_id,
          quantite: Number(l.quantite),
          prix_unitaire: Number(l.prix_unitaire) || 0,
          montant: Number(l.quantite) * (Number(l.prix_unitaire) || 0),
        });
      }
      await gmaoService.updateDemande(demandeActive.id, {
        statut: 'transformee',
        date_traitement: new Date().toISOString(),
        traite_par_nom: nomUtilisateur || null,
        commentaire_validation: traitement.commentaire || null,
      });
      toast({ title: 'Demande validée', description: `Ordre de travail ${ot?.numero || ''} créé.` });
      fermerAction();
      charger();
    } catch (e: any) {
      toast({ title: 'Erreur', description: e.message, variant: 'destructive' });
    } finally { setEnCours(false); }
  };

  const rejeter = async () => {
    if (!demandeActive) return;
    if (!traitement.motif_rejet?.trim()) {
      toast({ title: 'Motif requis', description: 'Merci d’indiquer le motif du rejet', variant: 'destructive' });
      return;
    }
    setEnCours(true);
    try {
      await gmaoService.updateDemande(demandeActive.id, {
        statut: 'rejetee',
        date_traitement: new Date().toISOString(),
        traite_par_nom: nomUtilisateur || null,
        motif_rejet: traitement.motif_rejet.trim(),
      });
      toast({ title: 'Demande rejetée' });
      fermerAction();
      charger();
    } catch (e: any) {
      toast({ title: 'Erreur', description: e.message, variant: 'destructive' });
    } finally { setEnCours(false); }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Demandes d'intervention</CardTitle>
        <p className="text-sm text-muted-foreground">
          Le responsable maintenance valide chaque demande pour la transformer en ordre de travail.
        </p>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>N°</TableHead>
              <TableHead>Titre</TableHead>
              <TableHead>Priorité</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Traité par</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && <TableRow><TableCell colSpan={7}>Chargement…</TableCell></TableRow>}
            {!loading && items.length === 0 && (
              <TableRow><TableCell colSpan={7} className="text-muted-foreground">Aucune demande enregistrée.</TableCell></TableRow>
            )}
            {items.map((d) => (
              <TableRow key={d.id}>
                <TableCell className="font-medium">{d.numero}</TableCell>
                <TableCell>{d.titre}</TableCell>
                <TableCell><Badge variant={d.priorite === 'urgente' ? 'destructive' : 'secondary'}>{d.priorite}</Badge></TableCell>
                <TableCell>
                  <Badge variant={STATUT_VARIANT[d.statut] || 'secondary'}>{STATUTS[d.statut] || d.statut}</Badge>
                  {d.statut === 'rejetee' && d.motif_rejet && (
                    <div className="text-xs text-muted-foreground mt-1 max-w-[220px]">Motif : {d.motif_rejet}</div>
                  )}
                </TableCell>
                <TableCell>{new Date(d.date_demande).toLocaleDateString('fr-FR')}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{d.traite_par_nom || '—'}</TableCell>
                <TableCell className="space-x-2 whitespace-nowrap">
                  {d.statut === 'nouvelle' && peutValider && (
                    <>
                      <Button size="sm" onClick={() => ouvrirAction(d, 'valider')}>
                        <CheckCircle2 className="w-4 h-4 mr-1" /> Valider en OT
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => ouvrirAction(d, 'rejeter')}>
                        <XCircle className="w-4 h-4 mr-1" /> Rejeter
                      </Button>
                    </>
                  )}
                  {d.statut === 'nouvelle' && !peutValider && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <ShieldAlert className="w-3.5 h-3.5" /> En attente du responsable maintenance
                    </span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>

      {/* Dialogue de validation / rejet par le responsable maintenance */}
      <Dialog open={!!demandeActive} onOpenChange={(o) => { if (!o) fermerAction(); }}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {modeAction === 'valider' ? 'Valider la demande et créer un ordre de travail' : 'Rejeter la demande'}
            </DialogTitle>
          </DialogHeader>
          {demandeActive && (
            <div className="space-y-4">
              <RecapDemande demande={demandeActive} equipementParId={equipementParId} pieces={pieces} />

              {modeAction === 'valider' ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Type de maintenance</Label>
                      <Select value={traitement.type_maintenance} onValueChange={(v) => setTraitement({ ...traitement, type_maintenance: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{TYPES_MAINTENANCE.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Priorité de l'OT</Label>
                      <Select value={traitement.priorite} onValueChange={(v) => setTraitement({ ...traitement, priorite: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{PRIORITES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label>Date planifiée</Label>
                    <Input type="date" value={traitement.date_planifiee} onChange={(e) => setTraitement({ ...traitement, date_planifiee: e.target.value })} />
                  </div>
                  <div>
                    <Label>Commentaire du responsable</Label>
                    <Textarea value={traitement.commentaire} onChange={(e) => setTraitement({ ...traitement, commentaire: e.target.value })} placeholder="Consignes, précisions techniques…" />
                  </div>
                </>
              ) : (
                <div>
                  <Label>Motif du rejet *</Label>
                  <Textarea value={traitement.motif_rejet} onChange={(e) => setTraitement({ ...traitement, motif_rejet: e.target.value })} placeholder="Expliquer pourquoi la demande est rejetée" />
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={fermerAction} disabled={enCours}>Annuler</Button>
            {modeAction === 'valider' ? (
              <Button onClick={valider} disabled={enCours}>{enCours ? 'Traitement…' : 'Valider et créer l\'OT'}</Button>
            ) : (
              <Button variant="destructive" onClick={rejeter} disabled={enCours}>{enCours ? 'Traitement…' : 'Confirmer le rejet'}</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
