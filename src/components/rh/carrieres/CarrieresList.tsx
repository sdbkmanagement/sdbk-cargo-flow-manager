import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, TrendingUp } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export const CarrieresList = () => {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ employe_id: '', type_evenement: 'promotion', nouveau_poste: '', nouveau_service: '', nouveau_salaire: '', date_effet: '', motif: '' });

  const { data: carrieres, isLoading } = useQuery({
    queryKey: ['carrieres'],
    queryFn: async () => {
      const { data, error } = await supabase.from('carrieres').select('*, employe:employes(nom, prenom)').order('date_effet', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  const { data: employes } = useQuery({
    queryKey: ['employes-list'],
    queryFn: async () => {
      const { data, error } = await supabase.from('employes').select('id, nom, prenom, poste, service').order('nom');
      if (error) throw error;
      return data;
    }
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const emp = employes?.find(e => e.id === data.employe_id);
      const { error } = await supabase.from('carrieres').insert({
        ...data,
        ancien_poste: emp?.poste,
        ancien_service: emp?.service,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['carrieres'] });
      setShowForm(false);
      toast({ title: 'Évolution enregistrée' });
    },
    onError: (e: any) => toast({ title: 'Erreur', description: e.message, variant: 'destructive' })
  });

  const typeLabels: Record<string, string> = { promotion: 'Promotion', mutation: 'Mutation', reclassement: 'Reclassement', augmentation: 'Augmentation' };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Évolutions de carrière</h2>
        <Button onClick={() => setShowForm(true)}><Plus className="w-4 h-4 mr-2" />Nouvelle évolution</Button>
      </div>
      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/50">
              <tr>
                <th className="text-left p-3">Employé</th>
                <th className="text-left p-3">Type</th>
                <th className="text-left p-3">Ancien poste</th>
                <th className="text-left p-3">Nouveau poste</th>
                <th className="text-left p-3">Date effet</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? <tr><td colSpan={5} className="p-4 text-center text-muted-foreground">Chargement...</td></tr>
              : carrieres?.length === 0 ? <tr><td colSpan={5} className="p-4 text-center text-muted-foreground">Aucune évolution</td></tr>
              : carrieres?.map((c: any) => (
                <tr key={c.id} className="border-b hover:bg-muted/30">
                  <td className="p-3 font-medium">{c.employe?.prenom} {c.employe?.nom}</td>
                  <td className="p-3"><Badge variant="outline">{typeLabels[c.type_evenement] || c.type_evenement}</Badge></td>
                  <td className="p-3">{c.ancien_poste || '-'}</td>
                  <td className="p-3">{c.nouveau_poste || '-'}</td>
                  <td className="p-3">{new Date(c.date_effet).toLocaleDateString('fr-FR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nouvelle évolution de carrière</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Employé *</Label>
              <Select value={form.employe_id} onValueChange={v => setForm({...form, employe_id: v})}>
                <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                <SelectContent>{employes?.map(e => <SelectItem key={e.id} value={e.id}>{e.prenom} {e.nom}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Type d'évolution</Label>
              <Select value={form.type_evenement} onValueChange={v => setForm({...form, type_evenement: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(typeLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Nouveau poste</Label><Input value={form.nouveau_poste} onChange={e => setForm({...form, nouveau_poste: e.target.value})} /></div>
              <div><Label>Nouveau service</Label><Input value={form.nouveau_service} onChange={e => setForm({...form, nouveau_service: e.target.value})} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Nouveau salaire (GNF)</Label><Input type="number" value={form.nouveau_salaire} onChange={e => setForm({...form, nouveau_salaire: e.target.value})} /></div>
              <div><Label>Date d'effet *</Label><Input type="date" value={form.date_effet} onChange={e => setForm({...form, date_effet: e.target.value})} /></div>
            </div>
            <div><Label>Motif</Label><Textarea value={form.motif} onChange={e => setForm({...form, motif: e.target.value})} /></div>
            <Button onClick={() => {
              if (!form.employe_id || !form.date_effet) return toast({ title: 'Champs requis', variant: 'destructive' });
              createMutation.mutate({ employe_id: form.employe_id, type_evenement: form.type_evenement, nouveau_poste: form.nouveau_poste || null, nouveau_service: form.nouveau_service || null, nouveau_salaire: form.nouveau_salaire ? parseFloat(form.nouveau_salaire) : null, date_effet: form.date_effet, motif: form.motif || null });
            }} className="w-full" disabled={createMutation.isPending}>Enregistrer</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
