import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Target, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { sirhService } from '@/services/sirhService';
import { rhService } from '@/services/rh';
import { EvaluationsList } from '../modules/EvaluationsList';

const statutBadge = (s: string) => {
  if (s === 'atteint') return <Badge className="bg-emerald-600 text-white hover:bg-emerald-600">Atteint</Badge>;
  if (s === 'non_atteint') return <Badge variant="destructive">Non atteint</Badge>;
  return <Badge variant="secondary">En cours</Badge>;
};

const ObjectifsTab = ({ employeId }: { employeId?: string }) => {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>({
    employe_id: employeId || '', perimetre: 'individuel', intitule: '', kpi: '',
    valeur_cible: '', valeur_actuelle: '', unite: '', ponderation: 100,
    avancement: 0, date_echeance: '', statut: 'en_cours',
  });

  const { data: objectifs } = useQuery({
    queryKey: ['objectifs', employeId || 'all'],
    queryFn: () => sirhService.getObjectifs(employeId),
  });
  const { data: employes } = useQuery({ queryKey: ['employes'], queryFn: () => rhService.getEmployes() });

  const save = async () => {
    if (!form.intitule) { toast.error("Intitulé obligatoire"); return; }
    try {
      await sirhService.saveObjectif({
        ...form,
        employe_id: form.employe_id || null,
        valeur_cible: form.valeur_cible === '' ? null : Number(form.valeur_cible),
        valeur_actuelle: form.valeur_actuelle === '' ? null : Number(form.valeur_actuelle),
        ponderation: Number(form.ponderation) || 100,
        avancement: Number(form.avancement) || 0,
        date_echeance: form.date_echeance || null,
      });
      toast.success('Objectif enregistré');
      qc.invalidateQueries({ queryKey: ['objectifs'] });
      setOpen(false);
    } catch (e: any) {
      toast.error(e.message || 'Erreur');
    }
  };

  const remove = async (id: string) => {
    await sirhService.deleteObjectif(id);
    qc.invalidateQueries({ queryKey: ['objectifs'] });
    toast.success('Objectif supprimé');
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setOpen(true)}><Plus className="w-4 h-4 mr-2" />Nouvel objectif</Button>
      </div>
      <Card>
        <CardContent className="p-0">
          {(objectifs || []).length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Target className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">Aucun objectif défini</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Objectif</TableHead>
                  {!employeId && <TableHead>Collaborateur</TableHead>}
                  <TableHead>Périmètre</TableHead>
                  <TableHead>KPI</TableHead>
                  <TableHead>Cible</TableHead>
                  <TableHead className="w-40">Avancement</TableHead>
                  <TableHead>Échéance</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {(objectifs || []).map((o: any) => (
                  <TableRow key={o.id}>
                    <TableCell className="font-medium">{o.intitule}</TableCell>
                    {!employeId && <TableCell>{o.employes ? `${o.employes.nom} ${o.employes.prenom}` : '—'}</TableCell>}
                    <TableCell className="capitalize">{o.perimetre}</TableCell>
                    <TableCell>{o.kpi || '—'}</TableCell>
                    <TableCell>{o.valeur_cible ?? '—'} {o.unite || ''}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={Number(o.avancement) || 0} className="h-2" />
                        <span className="text-xs w-10 text-right">{Number(o.avancement) || 0}%</span>
                      </div>
                    </TableCell>
                    <TableCell>{o.date_echeance ? new Date(o.date_echeance).toLocaleDateString('fr-FR') : '—'}</TableCell>
                    <TableCell>{statutBadge(o.statut)}</TableCell>
                    <TableCell className="text-right">
                      <Button size="icon" variant="ghost" onClick={() => remove(o.id)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Nouvel objectif</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Périmètre</Label>
              <select className="w-full h-10 px-3 border border-input rounded-md bg-background text-sm"
                value={form.perimetre} onChange={(e) => setForm({ ...form, perimetre: e.target.value })}>
                <option value="individuel">Individuel</option>
                <option value="equipe">Équipe</option>
                <option value="departement">Département</option>
              </select>
            </div>
            {!employeId && (
              <div>
                <Label>Collaborateur</Label>
                <select className="w-full h-10 px-3 border border-input rounded-md bg-background text-sm"
                  value={form.employe_id} onChange={(e) => setForm({ ...form, employe_id: e.target.value })}>
                  <option value="">-- Aucun (objectif collectif) --</option>
                  {((employes || []) as any[]).map((e) => <option key={e.id} value={e.id}>{e.nom} {e.prenom}</option>)}
                </select>
              </div>
            )}
            <div><Label>Intitulé *</Label><Input value={form.intitule} onChange={(e) => setForm({ ...form, intitule: e.target.value })} /></div>
            <div><Label>KPI</Label><Input value={form.kpi} onChange={(e) => setForm({ ...form, kpi: e.target.value })} /></div>
            <div className="grid grid-cols-3 gap-3">
              <div><Label>Cible</Label><Input type="number" value={form.valeur_cible} onChange={(e) => setForm({ ...form, valeur_cible: e.target.value })} /></div>
              <div><Label>Actuel</Label><Input type="number" value={form.valeur_actuelle} onChange={(e) => setForm({ ...form, valeur_actuelle: e.target.value })} /></div>
              <div><Label>Unité</Label><Input value={form.unite} onChange={(e) => setForm({ ...form, unite: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div><Label>Pondération (%)</Label><Input type="number" value={form.ponderation} onChange={(e) => setForm({ ...form, ponderation: e.target.value })} /></div>
              <div><Label>Avancement (%)</Label><Input type="number" value={form.avancement} onChange={(e) => setForm({ ...form, avancement: e.target.value })} /></div>
              <div><Label>Échéance</Label><Input type="date" value={form.date_echeance} onChange={(e) => setForm({ ...form, date_echeance: e.target.value })} /></div>
            </div>
            <div>
              <Label>Statut</Label>
              <select className="w-full h-10 px-3 border border-input rounded-md bg-background text-sm"
                value={form.statut} onChange={(e) => setForm({ ...form, statut: e.target.value })}>
                <option value="en_cours">En cours</option>
                <option value="atteint">Atteint</option>
                <option value="non_atteint">Non atteint</option>
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
              <Button onClick={save}>Enregistrer</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export const PerformanceModule = ({ employeId }: { employeId?: string }) => (
  <div className="space-y-5">
    {!employeId && (
      <div>
        <h2 className="text-2xl font-bold">Performance</h2>
        <p className="text-sm text-muted-foreground">Objectifs, KPI et évaluations (collaborateur → manager → RH → direction)</p>
      </div>
    )}
    <Tabs defaultValue="objectifs">
      <TabsList>
        <TabsTrigger value="objectifs">Objectifs</TabsTrigger>
        <TabsTrigger value="evaluations">Évaluations</TabsTrigger>
      </TabsList>
      <TabsContent value="objectifs"><ObjectifsTab employeId={employeId} /></TabsContent>
      <TabsContent value="evaluations"><EvaluationsList /></TabsContent>
    </Tabs>
  </div>
);

export { ObjectifsTab };
