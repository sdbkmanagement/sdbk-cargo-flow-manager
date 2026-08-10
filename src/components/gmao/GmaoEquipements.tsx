import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { gmaoService, GmaoEquipement } from '@/services/gmao';
import { useToast } from '@/hooks/use-toast';
import { Plus, Download } from 'lucide-react';

const STATUTS = [
  { value: 'operationnel', label: 'Opérationnel' },
  { value: 'en_maintenance', label: 'En maintenance' },
  { value: 'hors_service', label: 'Hors service' },
  { value: 'reforme', label: 'Réformé' },
];

const CRITICITES = [
  { value: 'faible', label: 'Faible' },
  { value: 'normale', label: 'Normale' },
  { value: 'haute', label: 'Haute' },
  { value: 'critique', label: 'Critique' },
];

export const GmaoEquipements: React.FC = () => {
  const { toast } = useToast();
  const [items, setItems] = useState<GmaoEquipement[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [recherche, setRecherche] = useState('');
  const [form, setForm] = useState<Record<string, any>>({
    code: '', designation: '', marque: '', modele: '', numero_serie: '',
    site: '', departement: '', statut: 'operationnel', criticite: 'normale',
    compteur_km: 0, observations: '',
  });

  const charger = async () => {
    try {
      setItems(await gmaoService.getEquipements());
    } catch (e: any) {
      toast({ title: 'Erreur', description: e.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { charger(); }, []);

  const enregistrer = async () => {
    if (!form.code || !form.designation) {
      toast({ title: 'Champs requis', description: 'Code et désignation sont obligatoires', variant: 'destructive' });
      return;
    }
    try {
      await gmaoService.createEquipement(form);
      toast({ title: 'Équipement créé' });
      setOpen(false);
      setForm({ ...form, code: '', designation: '', numero_serie: '' });
      charger();
    } catch (e: any) {
      toast({ title: 'Erreur', description: e.message, variant: 'destructive' });
    }
  };

  const importer = async () => {
    try {
      const n = await gmaoService.importerVehicules();
      toast({ title: 'Import terminé', description: `${n} véhicule(s) rattaché(s) au parc GMAO` });
      charger();
    } catch (e: any) {
      toast({ title: 'Erreur', description: e.message, variant: 'destructive' });
    }
  };

  const filtres = items.filter((e) =>
    `${e.code} ${e.designation} ${e.marque || ''} ${e.site || ''}`.toLowerCase().includes(recherche.toLowerCase())
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4 flex-wrap">
        <CardTitle>Parc d'équipements</CardTitle>
        <div className="flex gap-2">
          <Button variant="outline" onClick={importer}>
            <Download className="w-4 h-4 mr-2" /> Importer les véhicules
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="w-4 h-4 mr-2" /> Nouvel équipement</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader><DialogTitle>Nouvel équipement</DialogTitle></DialogHeader>
              <div className="grid gap-4 md:grid-cols-2">
                <div><Label>Code *</Label><Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} /></div>
                <div><Label>Désignation *</Label><Input value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} /></div>
                <div><Label>Marque</Label><Input value={form.marque} onChange={(e) => setForm({ ...form, marque: e.target.value })} /></div>
                <div><Label>Modèle</Label><Input value={form.modele} onChange={(e) => setForm({ ...form, modele: e.target.value })} /></div>
                <div><Label>N° de série</Label><Input value={form.numero_serie} onChange={(e) => setForm({ ...form, numero_serie: e.target.value })} /></div>
                <div><Label>Site</Label><Input value={form.site} onChange={(e) => setForm({ ...form, site: e.target.value })} /></div>
                <div>
                  <Label>Statut</Label>
                  <Select value={form.statut} onValueChange={(v) => setForm({ ...form, statut: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{STATUTS.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Criticité</Label>
                  <Select value={form.criticite} onValueChange={(v) => setForm({ ...form, criticite: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{CRITICITES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-2"><Label>Observations</Label><Textarea value={form.observations} onChange={(e) => setForm({ ...form, observations: e.target.value })} /></div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
                <Button onClick={enregistrer}>Enregistrer</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input placeholder="Rechercher un équipement…" value={recherche} onChange={(e) => setRecherche(e.target.value)} className="max-w-sm" />
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Désignation</TableHead>
                <TableHead>Site</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Criticité</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && <TableRow><TableCell colSpan={5}>Chargement…</TableCell></TableRow>}
              {!loading && filtres.length === 0 && (
                <TableRow><TableCell colSpan={5} className="text-muted-foreground">Aucun équipement. Importez les véhicules ou créez-en un.</TableCell></TableRow>
              )}
              {filtres.map((e) => (
                <TableRow key={e.id}>
                  <TableCell className="font-medium">{e.code}</TableCell>
                  <TableCell>{e.designation}</TableCell>
                  <TableCell>{e.site || '—'}</TableCell>
                  <TableCell>
                    <Badge variant={e.statut === 'operationnel' ? 'default' : e.statut === 'en_maintenance' ? 'secondary' : 'destructive'}>
                      {STATUTS.find((s) => s.value === e.statut)?.label || e.statut}
                    </Badge>
                  </TableCell>
                  <TableCell>{CRITICITES.find((c) => c.value === e.criticite)?.label || e.criticite}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
