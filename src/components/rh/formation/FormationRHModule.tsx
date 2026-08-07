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
import { Plus, GraduationCap } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { rhService } from '@/services/rh';

const sb = supabase as any;

const statutFormation = (dateExp?: string | null) => {
  if (!dateExp) return <Badge className="bg-emerald-600 text-white hover:bg-emerald-600">Valide</Badge>;
  const d = new Date(dateExp);
  const diff = Math.ceil((d.getTime() - Date.now()) / 86400000);
  if (diff < 0) return <Badge variant="destructive">Expirée</Badge>;
  if (diff <= 30) return <Badge className="bg-amber-500 text-white hover:bg-amber-500">À renouveler</Badge>;
  return <Badge className="bg-emerald-600 text-white hover:bg-emerald-600">Valide</Badge>;
};

export const FormationRHModule = ({ employeId }: { employeId?: string }) => {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>({
    employe_id: employeId || '', nom_formation: '', type_formation: 'interne', organisme: '',
    date_debut: '', date_fin: '', date_expiration: '', obligatoire: false, remarques: '',
  });

  const { data: formations } = useQuery({
    queryKey: ['formations-rh', employeId || 'all'],
    queryFn: async () => {
      let q = sb.from('formations_employes').select('*, employes:employe_id (id, nom, prenom, service)').order('date_debut', { ascending: false });
      if (employeId) q = q.eq('employe_id', employeId);
      const { data, error } = await q;
      if (error) throw error;
      return data || [];
    },
  });

  const { data: employes } = useQuery({ queryKey: ['employes'], queryFn: () => rhService.getEmployes() });

  const stats = useMemo(() => {
    const list = (formations || []) as any[];
    const expirees = list.filter((f) => f.date_expiration && new Date(f.date_expiration) < new Date()).length;
    const obligatoires = list.filter((f) => f.obligatoire).length;
    return { total: list.length, expirees, obligatoires };
  }, [formations]);

  const save = async () => {
    if (!form.employe_id || !form.nom_formation || !form.date_debut) {
      toast.error('Collaborateur, intitulé et date de début sont obligatoires');
      return;
    }
    try {
      const { error } = await sb.from('formations_employes').insert([{
        employe_id: form.employe_id,
        nom_formation: form.nom_formation,
        organisme: form.organisme || null,
        date_debut: form.date_debut,
        date_fin: form.date_fin || null,
        date_expiration: form.date_expiration || null,
        obligatoire: form.obligatoire,
        remarques: form.remarques || null,
      }]);
      if (error) throw error;
      toast.success('Formation enregistrée');
      qc.invalidateQueries({ queryKey: ['formations-rh'] });
      qc.invalidateQueries({ queryKey: ['rh-alertes'] });
      setOpen(false);
    } catch (e: any) {
      toast.error(e.message || 'Erreur');
    }
  };

  return (
    <div className="space-y-5">
      {!employeId && (
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Formation</h2>
            <p className="text-sm text-muted-foreground">Catalogue, suivi des formations et plan de développement</p>
          </div>
          <Button onClick={() => setOpen(true)}><Plus className="w-4 h-4 mr-2" />Nouvelle formation</Button>
        </div>
      )}
      {employeId && (
        <div className="flex justify-end"><Button size="sm" onClick={() => setOpen(true)}><Plus className="w-4 h-4 mr-2" />Ajouter</Button></div>
      )}

      {!employeId && (
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { label: 'Formations enregistrées', value: stats.total },
            { label: 'Formations obligatoires', value: stats.obligatoires },
            { label: 'Certifications expirées', value: stats.expirees },
          ].map((k) => (
            <Card key={k.label}>
              <CardContent className="p-4 flex items-start justify-between">
                <div>
                  <p className="text-xs uppercase text-muted-foreground">{k.label}</p>
                  <p className="text-2xl font-bold">{k.value}</p>
                </div>
                <GraduationCap className="h-5 w-5 text-primary/70" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Suivi des formations</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                {!employeId && <TableHead>Collaborateur</TableHead>}
                <TableHead>Formation</TableHead>
                <TableHead>Organisme</TableHead>
                <TableHead>Début</TableHead>
                <TableHead>Expiration</TableHead>
                <TableHead>Obligatoire</TableHead>
                <TableHead>Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {((formations || []) as any[]).map((f) => (
                <TableRow key={f.id}>
                  {!employeId && <TableCell className="font-medium">{f.employes ? `${f.employes.nom} ${f.employes.prenom}` : '—'}</TableCell>}
                  <TableCell>{f.nom_formation}</TableCell>
                  <TableCell>{f.organisme || '—'}</TableCell>
                  <TableCell>{f.date_debut ? new Date(f.date_debut).toLocaleDateString('fr-FR') : '—'}</TableCell>
                  <TableCell>{f.date_expiration ? new Date(f.date_expiration).toLocaleDateString('fr-FR') : '—'}</TableCell>
                  <TableCell>{f.obligatoire ? 'Oui' : 'Non'}</TableCell>
                  <TableCell>{statutFormation(f.date_expiration)}</TableCell>
                </TableRow>
              ))}
              {((formations || []) as any[]).length === 0 && (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Aucune formation enregistrée</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Nouvelle formation</DialogTitle></DialogHeader>
          <div className="space-y-3">
            {!employeId && (
              <div>
                <Label>Collaborateur *</Label>
                <select className="w-full h-10 px-3 border border-input rounded-md bg-background text-sm"
                  value={form.employe_id} onChange={(e) => setForm({ ...form, employe_id: e.target.value })}>
                  <option value="">-- Sélectionner --</option>
                  {((employes || []) as any[]).map((e) => <option key={e.id} value={e.id}>{e.nom} {e.prenom}</option>)}
                </select>
              </div>
            )}
            <div><Label>Intitulé *</Label><Input value={form.nom_formation} onChange={(e) => setForm({ ...form, nom_formation: e.target.value })} /></div>
            <div>
              <Label>Type</Label>
              <select className="w-full h-10 px-3 border border-input rounded-md bg-background text-sm"
                value={form.type_formation} onChange={(e) => setForm({ ...form, type_formation: e.target.value })}>
                <option value="interne">Interne</option>
                <option value="externe">Externe</option>
                <option value="certification">Certification</option>
                <option value="elearning">E-learning</option>
              </select>
            </div>
            <div><Label>Organisme</Label><Input value={form.organisme} onChange={(e) => setForm({ ...form, organisme: e.target.value })} /></div>
            <div className="grid grid-cols-3 gap-3">
              <div><Label>Début *</Label><Input type="date" value={form.date_debut} onChange={(e) => setForm({ ...form, date_debut: e.target.value })} /></div>
              <div><Label>Fin</Label><Input type="date" value={form.date_fin} onChange={(e) => setForm({ ...form, date_fin: e.target.value })} /></div>
              <div><Label>Expiration</Label><Input type="date" value={form.date_expiration} onChange={(e) => setForm({ ...form, date_expiration: e.target.value })} /></div>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.obligatoire} onChange={(e) => setForm({ ...form, obligatoire: e.target.checked })} />
              Formation obligatoire
            </label>
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
