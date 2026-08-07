import React, { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Trash2, Award, Grid3X3 } from 'lucide-react';
import { toast } from 'sonner';
import { sirhService } from '@/services/sirhService';
import { rhService } from '@/services/rh';

const NIVEAUX = [
  { v: 1, label: 'Débutant' },
  { v: 2, label: '基 Intermédiaire'.replace('基 ', '') },
  { v: 3, label: 'Confirmé' },
  { v: 4, label: 'Avancé' },
  { v: 5, label: 'Expert' },
];

const CatalogueTab = () => {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>({ libelle: '', categorie: 'technique', niveau_requis: 3, description: '' });

  const { data: competences } = useQuery({ queryKey: ['competences'], queryFn: () => sirhService.getCompetences() });

  const save = async () => {
    if (!form.libelle) { toast.error('Libellé obligatoire'); return; }
    try {
      await sirhService.saveCompetence({ ...form, niveau_requis: Number(form.niveau_requis) });
      qc.invalidateQueries({ queryKey: ['competences'] });
      setForm({ libelle: '', categorie: 'technique', niveau_requis: 3, description: '' });
      setOpen(false);
      toast.success('Compétence enregistrée');
    } catch (e: any) { toast.error(e.message || 'Erreur'); }
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setOpen(true)}><Plus className="w-4 h-4 mr-2" />Nouvelle compétence</Button>
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Compétence</TableHead>
                <TableHead>Catégorie</TableHead>
                <TableHead>Niveau requis</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {(competences || []).map((c: any) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.libelle}</TableCell>
                  <TableCell className="capitalize">{c.categorie}</TableCell>
                  <TableCell>{NIVEAUX.find((n) => n.v === c.niveau_requis)?.label || c.niveau_requis}</TableCell>
                  <TableCell className="text-right">
                    <Button size="icon" variant="ghost" onClick={async () => {
                      await sirhService.deleteCompetence(c.id);
                      qc.invalidateQueries({ queryKey: ['competences'] });
                    }}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {(competences || []).length === 0 && (
                <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">Aucune compétence au catalogue</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Nouvelle compétence</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Libellé *</Label><Input value={form.libelle} onChange={(e) => setForm({ ...form, libelle: e.target.value })} /></div>
            <div>
              <Label>Catégorie</Label>
              <select className="w-full h-10 px-3 border border-input rounded-md bg-background text-sm"
                value={form.categorie} onChange={(e) => setForm({ ...form, categorie: e.target.value })}>
                <option value="technique">Technique</option>
                <option value="comportementale">Comportementale</option>
                <option value="managériale">Managériale</option>
                <option value="hseq">HSEQ</option>
              </select>
            </div>
            <div>
              <Label>Niveau requis</Label>
              <select className="w-full h-10 px-3 border border-input rounded-md bg-background text-sm"
                value={form.niveau_requis} onChange={(e) => setForm({ ...form, niveau_requis: e.target.value })}>
                {NIVEAUX.map((n) => <option key={n.v} value={n.v}>{n.label}</option>)}
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

const CartographieTab = ({ employeId }: { employeId?: string }) => {
  const qc = useQueryClient();
  const { data: competences } = useQuery({ queryKey: ['competences'], queryFn: () => sirhService.getCompetences() });
  const { data: employes } = useQuery({ queryKey: ['employes'], queryFn: () => rhService.getEmployes() });
  const { data: liens } = useQuery({
    queryKey: ['competences-employes', employeId || 'all'],
    queryFn: () => sirhService.getCompetencesEmployes(employeId),
  });

  const map = useMemo(() => {
    const m: Record<string, any> = {};
    (liens || []).forEach((l: any) => { m[`${l.employe_id}_${l.competence_id}`] = l; });
    return m;
  }, [liens]);

  const rows = employeId ? ((employes || []) as any[]).filter((e) => e.id === employeId) : ((employes || []) as any[]);

  const setNiveau = async (employe_id: string, competence_id: string, niveau: number) => {
    try {
      await sirhService.setCompetenceEmploye({ employe_id, competence_id, niveau });
      qc.invalidateQueries({ queryKey: ['competences-employes'] });
    } catch (e: any) { toast.error(e.message || 'Erreur'); }
  };

  if ((competences || []).length === 0) {
    return <p className="text-sm text-muted-foreground py-8 text-center">Ajoutez d'abord des compétences au catalogue.</p>;
  }

  return (
    <Card>
      <CardContent className="p-0 overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="sticky left-0 bg-card">Collaborateur</TableHead>
              {(competences || []).map((c: any) => (
                <TableHead key={c.id} className="text-center text-xs">{c.libelle}<br /><span className="text-muted-foreground">(req. {c.niveau_requis})</span></TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((e) => (
              <TableRow key={e.id}>
                <TableCell className="font-medium sticky left-0 bg-card">{e.nom} {e.prenom}</TableCell>
                {(competences || []).map((c: any) => {
                  const lien = map[`${e.id}_${c.id}`];
                  const niveau = lien?.niveau ?? 0;
                  const ecart = niveau - (c.niveau_requis || 0);
                  return (
                    <TableCell key={c.id} className="text-center">
                      <select
                        value={niveau}
                        onChange={(ev) => setNiveau(e.id, c.id, Number(ev.target.value))}
                        className={`h-8 rounded-md border text-xs px-1 ${
                          niveau === 0 ? 'bg-muted' : ecart >= 0 ? 'bg-emerald-100 dark:bg-emerald-950/40' : 'bg-amber-100 dark:bg-amber-950/40'
                        }`}
                      >
                        <option value={0}>—</option>
                        {NIVEAUX.map((n) => <option key={n.v} value={n.v}>{n.v}</option>)}
                      </select>
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

const MatriceTalents = () => {
  const { data: liens } = useQuery({ queryKey: ['competences-employes', 'all'], queryFn: () => sirhService.getCompetencesEmployes() });

  const parEmploye = useMemo(() => {
    const m: Record<string, { nom: string; niveaux: number[]; certifs: number }> = {};
    (liens || []).forEach((l: any) => {
      const key = l.employe_id;
      if (!m[key]) m[key] = { nom: l.employes ? `${l.employes.nom} ${l.employes.prenom}` : '—', niveaux: [], certifs: 0 };
      m[key].niveaux.push(l.niveau);
      if (l.certifie) m[key].certifs += 1;
    });
    return Object.entries(m).map(([id, v]) => ({
      id,
      nom: v.nom,
      moyenne: v.niveaux.reduce((a, b) => a + b, 0) / (v.niveaux.length || 1),
      certifs: v.certifs,
    })).sort((a, b) => b.moyenne - a.moyenne);
  }, [liens]);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2"><Award className="w-4 h-4 text-primary" />Identification des talents</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Collaborateur</TableHead>
              <TableHead>Niveau moyen</TableHead>
              <TableHead>Certifications</TableHead>
              <TableHead>Positionnement</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {parEmploye.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-medium">{p.nom}</TableCell>
                <TableCell>{p.moyenne.toFixed(1)} / 5</TableCell>
                <TableCell>{p.certifs}</TableCell>
                <TableCell>
                  {p.moyenne >= 4
                    ? <Badge className="bg-emerald-600 text-white hover:bg-emerald-600">Talent clé</Badge>
                    : p.moyenne >= 3
                      ? <Badge className="bg-blue-600 text-white hover:bg-blue-600">Performant</Badge>
                      : <Badge variant="secondary">À développer</Badge>}
                </TableCell>
              </TableRow>
            ))}
            {parEmploye.length === 0 && (
              <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">Aucune évaluation de compétence</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export const CompetencesModule = ({ employeId }: { employeId?: string }) => (
  <div className="space-y-5">
    {!employeId && (
      <div>
        <h2 className="text-2xl font-bold">Compétences & Talents</h2>
        <p className="text-sm text-muted-foreground">Cartographie, écarts de compétences et identification des talents</p>
      </div>
    )}
    <Tabs defaultValue={employeId ? 'cartographie' : 'catalogue'}>
      <TabsList>
        {!employeId && <TabsTrigger value="catalogue">Catalogue</TabsTrigger>}
        <TabsTrigger value="cartographie"><Grid3X3 className="w-4 h-4 mr-2" />Cartographie</TabsTrigger>
        {!employeId && <TabsTrigger value="talents">Talents</TabsTrigger>}
      </TabsList>
      {!employeId && <TabsContent value="catalogue"><CatalogueTab /></TabsContent>}
      <TabsContent value="cartographie"><CartographieTab employeId={employeId} /></TabsContent>
      {!employeId && <TabsContent value="talents"><MatriceTalents /></TabsContent>}
    </Tabs>
  </div>
);
