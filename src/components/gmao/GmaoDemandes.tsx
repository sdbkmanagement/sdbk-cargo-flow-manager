import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { gmaoService, GmaoDemande, GmaoEquipement } from '@/services/gmao';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Plus, CheckCircle2, XCircle, ShieldAlert } from 'lucide-react';

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

export const GmaoDemandes: React.FC = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const nomUtilisateur = user ? `${user.prenom || ''} ${user.nom || ''}`.trim() || user.email : '';
  const [items, setItems] = useState<GmaoDemande[]>([]);
  const [equipements, setEquipements] = useState<GmaoEquipement[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<Record<string, any>>({
    titre: '', description: '', priorite: 'normale', equipement_id: '', demandeur_nom: '',
  });

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
    setTraitement({
      type_maintenance: 'correctif',
      priorite: d.priorite || 'normale',
      date_planifiee: '',
      commentaire: '',
      motif_rejet: '',
    });
  };

  const fermerAction = () => { setDemandeActive(null); setModeAction(null); };

  const charger = async () => {
    try {
      const [d, e] = await Promise.all([gmaoService.getDemandes(), gmaoService.getEquipements()]);
      setItems(d); setEquipements(e);
    } catch (e: any) {
      toast({ title: 'Erreur', description: e.message, variant: 'destructive' });
    } finally { setLoading(false); }
  };

  useEffect(() => { charger(); }, []);

  // Le demandeur est toujours l'utilisateur connecté
  useEffect(() => {
    setForm((f) => ({ ...f, demandeur_nom: nomUtilisateur }));
  }, [nomUtilisateur]);

  const enregistrer = async () => {
    if (!form.titre) {
      toast({ title: 'Champ requis', description: 'Le titre est obligatoire', variant: 'destructive' });
      return;
    }
    try {
      await gmaoService.createDemande({ ...form, demandeur_nom: nomUtilisateur || null, equipement_id: form.equipement_id || null });
      toast({ title: 'Demande enregistrée' });
      setOpen(false);
      setForm({ titre: '', description: '', priorite: 'normale', equipement_id: '', demandeur_nom: nomUtilisateur });
      charger();
    } catch (e: any) {
      toast({ title: 'Erreur', description: e.message, variant: 'destructive' });
    }
  };

  const valider = async () => {
    if (!demandeActive) return;
    setEnCours(true);
    try {
      const ot = await gmaoService.createOrdreTravail({
        demande_id: demandeActive.id,
        equipement_id: demandeActive.equipement_id || null,
        titre: demandeActive.titre,
        description: [demandeActive.description, traitement.commentaire].filter(Boolean).join('\n\n') || null,
        type_maintenance: traitement.type_maintenance,
        priorite: traitement.priorite,
        statut: 'planifie',
        date_planifiee: traitement.date_planifiee || null,
      });
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
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Demandes d'intervention</CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" /> Déclarer une panne</Button></DialogTrigger>
          <DialogContent className="max-w-xl">
            <DialogHeader><DialogTitle>Nouvelle demande d'intervention</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Titre *</Label><Input value={form.titre} onChange={(e) => setForm({ ...form, titre: e.target.value })} /></div>
              <div>
                <Label>Équipement</Label>
                <Select value={form.equipement_id} onValueChange={(v) => setForm({ ...form, equipement_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Sélectionner un équipement" /></SelectTrigger>
                  <SelectContent>
                    {equipements.map((e) => <SelectItem key={e.id} value={e.id}>{e.code} — {e.designation}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Priorité</Label>
                <Select value={form.priorite} onValueChange={(v) => setForm({ ...form, priorite: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{PRIORITES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Demandeur</Label><Input value={nomUtilisateur} readOnly disabled className="bg-muted" /></div>
              <div><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
              <Button onClick={enregistrer}>Enregistrer</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
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
              <div className="rounded-md border p-3 text-sm space-y-1">
                <div><span className="text-muted-foreground">Demande :</span> {demandeActive.numero} — {demandeActive.titre}</div>
                <div><span className="text-muted-foreground">Demandeur :</span> {demandeActive.demandeur_nom || '—'}</div>
                {demandeActive.description && (
                  <div className="text-muted-foreground whitespace-pre-wrap">{demandeActive.description}</div>
                )}
              </div>

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
