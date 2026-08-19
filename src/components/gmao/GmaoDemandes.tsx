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
  { value: 'ameliorative', label: 'Améliorative' },
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

  const transformer = async (d: GmaoDemande) => {
    try {
      await gmaoService.createOrdreTravail({
        demande_id: d.id,
        equipement_id: d.equipement_id || null,
        titre: d.titre,
        description: d.description,
        type_maintenance: 'correctif',
        priorite: d.priorite,
        statut: 'planifie',
      });
      await gmaoService.updateDemande(d.id, { statut: 'transformee', date_traitement: new Date().toISOString() });
      toast({ title: 'Ordre de travail créé' });
      charger();
    } catch (e: any) {
      toast({ title: 'Erreur', description: e.message, variant: 'destructive' });
    }
  };

  const changerStatut = async (d: GmaoDemande, statut: string) => {
    try {
      await gmaoService.updateDemande(d.id, { statut, date_traitement: new Date().toISOString() });
      charger();
    } catch (e: any) {
      toast({ title: 'Erreur', description: e.message, variant: 'destructive' });
    }
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
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && <TableRow><TableCell colSpan={6}>Chargement…</TableCell></TableRow>}
            {!loading && items.length === 0 && (
              <TableRow><TableCell colSpan={6} className="text-muted-foreground">Aucune demande enregistrée.</TableCell></TableRow>
            )}
            {items.map((d) => (
              <TableRow key={d.id}>
                <TableCell className="font-medium">{d.numero}</TableCell>
                <TableCell>{d.titre}</TableCell>
                <TableCell><Badge variant={d.priorite === 'urgente' ? 'destructive' : 'secondary'}>{d.priorite}</Badge></TableCell>
                <TableCell>{STATUTS[d.statut] || d.statut}</TableCell>
                <TableCell>{new Date(d.date_demande).toLocaleDateString('fr-FR')}</TableCell>
                <TableCell className="space-x-2 whitespace-nowrap">
                  {d.statut === 'nouvelle' && (
                    <>
                      <Button size="sm" variant="outline" onClick={() => transformer(d)}>
                        <ArrowRightCircle className="w-4 h-4 mr-1" /> Créer OT
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => changerStatut(d, 'rejetee')}>Rejeter</Button>
                    </>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
