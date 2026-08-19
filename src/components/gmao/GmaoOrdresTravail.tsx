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
import { gmaoService, GmaoOrdreTravail, GmaoEquipement } from '@/services/gmao';
import { useToast } from '@/hooks/use-toast';
import { Plus, CheckCircle } from 'lucide-react';
import { EquipementCombobox } from './EquipementCombobox';

const TYPES = [
  { value: 'correctif', label: 'Correctif' },
  { value: 'preventif', label: 'Préventif' },
  { value: 'ameliorative', label: 'Amélioration' },
];
const STATUTS = [
  { value: 'planifie', label: 'Planifié' },
  { value: 'en_cours', label: 'En cours' },
  { value: 'termine', label: 'Terminé' },
  { value: 'cloture', label: 'Clôturé' },
];

export const GmaoOrdresTravail: React.FC = () => {
  const { toast } = useToast();
  const [items, setItems] = useState<GmaoOrdreTravail[]>([]);
  const [equipements, setEquipements] = useState<GmaoEquipement[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Record<string, any>>({
    titre: '', description: '', equipement_id: '', type_maintenance: 'correctif',
    priorite: 'normale', statut: 'planifie', date_planifiee: '',
    cout_main_oeuvre: 0, cout_prestation: 0, cout_autres: 0,
  });

  const charger = async () => {
    try {
      const [o, e] = await Promise.all([gmaoService.getOrdresTravail(), gmaoService.getEquipements()]);
      setItems(o); setEquipements(e);
    } catch (e: any) {
      toast({ title: 'Erreur', description: e.message, variant: 'destructive' });
    } finally { setLoading(false); }
  };

  useEffect(() => { charger(); }, []);

  const enregistrer = async () => {
    if (!form.titre) {
      toast({ title: 'Champ requis', description: 'Le titre est obligatoire', variant: 'destructive' });
      return;
    }
    try {
      await gmaoService.createOrdreTravail({
        ...form,
        equipement_id: form.equipement_id || null,
        date_planifiee: form.date_planifiee || null,
        cout_main_oeuvre: Number(form.cout_main_oeuvre) || 0,
        cout_prestation: Number(form.cout_prestation) || 0,
        cout_autres: Number(form.cout_autres) || 0,
      });
      toast({ title: 'Ordre de travail créé' });
      setOpen(false);
      setForm({ ...form, titre: '', description: '' });
      charger();
    } catch (e: any) {
      toast({ title: 'Erreur', description: e.message, variant: 'destructive' });
    }
  };

  const changerStatut = async (ot: GmaoOrdreTravail, statut: string) => {
    try {
      const payload: Record<string, any> = { statut };
      if (statut === 'en_cours' && !ot.date_debut) payload.date_debut = new Date().toISOString();
      if (statut === 'termine') payload.date_fin = new Date().toISOString();
      await gmaoService.updateOrdreTravail(ot.id, payload);
      charger();
    } catch (e: any) {
      toast({ title: 'Erreur', description: e.message, variant: 'destructive' });
    }
  };

  const cloturer = async (ot: GmaoOrdreTravail) => {
    try {
      await gmaoService.updateOrdreTravail(ot.id, {
        statut: 'cloture', cloture: true, date_cloture: new Date().toISOString(),
      });
      toast({ title: 'Ordre de travail clôturé' });
      charger();
    } catch (e: any) {
      toast({ title: 'Erreur', description: e.message, variant: 'destructive' });
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Ordres de travail</CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" /> Nouvel ordre de travail</Button></DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle>Nouvel ordre de travail</DialogTitle></DialogHeader>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2"><Label>Titre *</Label><Input value={form.titre} onChange={(e) => setForm({ ...form, titre: e.target.value })} /></div>
              <div>
                <Label>Équipement</Label>
                <EquipementCombobox
                  equipements={equipements}
                  value={form.equipement_id}
                  onChange={(v) => setForm({ ...form, equipement_id: v })}
                  placeholder="Sélectionner"
                  searchPlaceholder="Rechercher une immatriculation..."
                />
              </div>
              <div>
                <Label>Type de maintenance</Label>
                <Select value={form.type_maintenance} onValueChange={(v) => setForm({ ...form, type_maintenance: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Date planifiée</Label><Input type="date" value={form.date_planifiee} onChange={(e) => setForm({ ...form, date_planifiee: e.target.value })} /></div>
              <div>
                <Label>Statut</Label>
                <Select value={form.statut} onValueChange={(v) => setForm({ ...form, statut: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{STATUTS.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Main d'œuvre (GNF)</Label><Input type="number" value={form.cout_main_oeuvre} onChange={(e) => setForm({ ...form, cout_main_oeuvre: e.target.value })} /></div>
              <div><Label>Prestation (GNF)</Label><Input type="number" value={form.cout_prestation} onChange={(e) => setForm({ ...form, cout_prestation: e.target.value })} /></div>
              <div className="md:col-span-2"><Label>Description des travaux</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
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
              <TableHead>Type</TableHead>
              <TableHead>Planifié</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="text-right">Coût total</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && <TableRow><TableCell colSpan={7}>Chargement…</TableCell></TableRow>}
            {!loading && items.length === 0 && (
              <TableRow><TableCell colSpan={7} className="text-muted-foreground">Aucun ordre de travail.</TableCell></TableRow>
            )}
            {items.map((o) => (
              <TableRow key={o.id}>
                <TableCell className="font-medium">{o.numero}</TableCell>
                <TableCell>{o.titre}</TableCell>
                <TableCell>{TYPES.find((t) => t.value === o.type_maintenance)?.label || o.type_maintenance}</TableCell>
                <TableCell>{o.date_planifiee ? new Date(o.date_planifiee).toLocaleDateString('fr-FR') : '—'}</TableCell>
                <TableCell>
                  <Badge variant={o.cloture ? 'secondary' : o.statut === 'en_cours' ? 'default' : 'outline'}>
                    {STATUTS.find((s) => s.value === o.statut)?.label || o.statut}
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-medium">{Number(o.cout_total || 0).toLocaleString('fr-FR')} GNF</TableCell>
                <TableCell className="space-x-2 whitespace-nowrap">
                  {!o.cloture && o.statut === 'planifie' && (
                    <Button size="sm" variant="outline" onClick={() => changerStatut(o, 'en_cours')}>Démarrer</Button>
                  )}
                  {!o.cloture && o.statut === 'en_cours' && (
                    <Button size="sm" variant="outline" onClick={() => changerStatut(o, 'termine')}>Terminer</Button>
                  )}
                  {!o.cloture && o.statut === 'termine' && (
                    <Button size="sm" onClick={() => cloturer(o)}><CheckCircle className="w-4 h-4 mr-1" /> Clôturer</Button>
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
