import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { gmaoService, GmaoPlan, GmaoEquipement } from '@/services/gmao';
import { useToast } from '@/hooks/use-toast';
import { Plus } from 'lucide-react';
import { EquipementCombobox } from './EquipementCombobox';

const DECLENCHEURS = [
  { value: 'date', label: 'Périodicité (jours)' },
  { value: 'km', label: 'Kilométrage' },
  { value: 'heures', label: 'Heures de fonctionnement' },
];

export const GmaoPreventif: React.FC = () => {
  const { toast } = useToast();
  const [items, setItems] = useState<GmaoPlan[]>([]);
  const [equipements, setEquipements] = useState<GmaoEquipement[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Record<string, any>>({
    libelle: '', equipement_id: '', type_declencheur: 'date',
    periodicite_jours: 30, periodicite_km: '', periodicite_heures: '', prochaine_echeance: '', prochain_km: '',
  });

  const charger = async () => {
    try {
      const [p, e] = await Promise.all([gmaoService.getPlans(), gmaoService.getEquipements()]);
      setItems(p); setEquipements(e);
    } catch (e: any) {
      toast({ title: 'Erreur', description: e.message, variant: 'destructive' });
    } finally { setLoading(false); }
  };

  useEffect(() => { charger(); }, []);

  const enregistrer = async () => {
    if (!form.libelle) {
      toast({ title: 'Champ requis', description: 'Le libellé est obligatoire', variant: 'destructive' });
      return;
    }
    try {
      await gmaoService.createPlan({
        libelle: form.libelle,
        equipement_id: form.equipement_id || null,
        type_declencheur: form.type_declencheur,
        periodicite_jours: form.periodicite_jours ? Number(form.periodicite_jours) : null,
        periodicite_km: form.periodicite_km ? Number(form.periodicite_km) : null,
        periodicite_heures: form.periodicite_heures ? Number(form.periodicite_heures) : null,
        prochaine_echeance: form.type_declencheur === 'km' ? null : (form.prochaine_echeance || null),
        prochain_km: form.type_declencheur === 'km' && form.prochain_km ? Number(form.prochain_km) : null,
      });
      toast({ title: 'Plan de maintenance créé' });
      setOpen(false);
      setForm({ ...form, libelle: '' });
      charger();
    } catch (e: any) {
      toast({ title: 'Erreur', description: e.message, variant: 'destructive' });
    }
  };

  const genererOT = async (p: GmaoPlan) => {
    try {
      await gmaoService.createOrdreTravail({
        plan_id: p.id,
        equipement_id: p.equipement_id || null,
        titre: p.libelle,
        type_maintenance: 'preventif',
        statut: 'planifie',
        date_planifiee: p.prochaine_echeance || new Date().toISOString().slice(0, 10),
      });
      toast({ title: 'Ordre de travail préventif créé' });
    } catch (e: any) {
      toast({ title: 'Erreur', description: e.message, variant: 'destructive' });
    }
  };

  const nomEquipement = (id?: string | null) => {
    const e = equipements.find((x) => x.id === id);
    return e ? `${e.code} — ${e.designation}` : '—';
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Maintenance préventive</CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" /> Nouveau plan</Button></DialogTrigger>
          <DialogContent className="max-w-xl">
            <DialogHeader><DialogTitle>Nouveau plan de maintenance</DialogTitle></DialogHeader>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2"><Label>Libellé *</Label><Input value={form.libelle} onChange={(e) => setForm({ ...form, libelle: e.target.value })} /></div>
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
                <Label>Déclencheur</Label>
                <Select value={form.type_declencheur} onValueChange={(v) => setForm({ ...form, type_declencheur: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{DECLENCHEURS.map((d) => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              {form.type_declencheur === 'date' && (
                <div><Label>Périodicité (jours)</Label><Input type="number" value={form.periodicite_jours} onChange={(e) => setForm({ ...form, periodicite_jours: e.target.value })} /></div>
              )}
              {form.type_declencheur === 'km' && (
                <div><Label>Périodicité (km)</Label><Input type="number" value={form.periodicite_km} onChange={(e) => setForm({ ...form, periodicite_km: e.target.value })} /></div>
              )}
              {form.type_declencheur === 'heures' && (
                <div><Label>Périodicité (heures)</Label><Input type="number" value={form.periodicite_heures} onChange={(e) => setForm({ ...form, periodicite_heures: e.target.value })} /></div>
              )}
              {form.type_declencheur === 'km' ? (
                <div><Label>Prochaine échéance (km)</Label><Input type="number" placeholder="Ex. 150000" value={form.prochain_km} onChange={(e) => setForm({ ...form, prochain_km: e.target.value })} /></div>
              ) : (
                <div><Label>Prochaine échéance</Label><Input type="date" value={form.prochaine_echeance} onChange={(e) => setForm({ ...form, prochaine_echeance: e.target.value })} /></div>
              )}
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
              <TableHead>Libellé</TableHead>
              <TableHead>Équipement</TableHead>
              <TableHead>Déclencheur</TableHead>
              <TableHead>Prochaine échéance</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && <TableRow><TableCell colSpan={5}>Chargement…</TableCell></TableRow>}
            {!loading && items.length === 0 && (
              <TableRow><TableCell colSpan={5} className="text-muted-foreground">Aucun plan préventif.</TableCell></TableRow>
            )}
            {items.map((p) => {
              const echu = p.prochaine_echeance && new Date(p.prochaine_echeance) <= new Date();
              return (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.libelle}</TableCell>
                  <TableCell>{nomEquipement(p.equipement_id)}</TableCell>
                  <TableCell>{DECLENCHEURS.find((d) => d.value === p.type_declencheur)?.label || p.type_declencheur}</TableCell>
                  <TableCell>
                    {p.type_declencheur === 'km'
                      ? (p.prochain_km ? <Badge variant="secondary">{Number(p.prochain_km).toLocaleString('fr-FR')} km</Badge> : '—')
                      : p.prochaine_echeance
                        ? <Badge variant={echu ? 'destructive' : 'secondary'}>{new Date(p.prochaine_echeance).toLocaleDateString('fr-FR')}</Badge>
                        : '—'}
                  </TableCell>
                  <TableCell>
                    <Button size="sm" variant="outline" onClick={() => genererOT(p)}>Générer un OT</Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
