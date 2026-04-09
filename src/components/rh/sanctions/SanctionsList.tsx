import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

const typesSanction = ['Avertissement', 'Blâme', 'Mise à pied', 'Suspension', 'Licenciement'];

export const SanctionsList = () => {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ employe_id: '', type_sanction: 'Avertissement', motif: '', date_sanction: '', duree_jours: '', commentaires: '' });

  const { data: sanctions, isLoading } = useQuery({
    queryKey: ['sanctions'],
    queryFn: async () => {
      const { data, error } = await supabase.from('sanctions').select('*, employe:employes(nom, prenom)').order('date_sanction', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  const { data: employes } = useQuery({
    queryKey: ['employes-list'],
    queryFn: async () => { const { data } = await supabase.from('employes').select('id, nom, prenom').order('nom'); return data; }
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => { const { error } = await supabase.from('sanctions').insert(data); if (error) throw error; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['sanctions'] }); setShowForm(false); toast({ title: 'Sanction enregistrée' }); },
    onError: (e: any) => toast({ title: 'Erreur', description: e.message, variant: 'destructive' })
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Sanctions disciplinaires</h2>
        <Button onClick={() => setShowForm(true)}><Plus className="w-4 h-4 mr-2" />Nouvelle sanction</Button>
      </div>
      <Card><CardContent className="p-0">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/50"><tr>
            <th className="text-left p-3">Employé</th><th className="text-left p-3">Type</th><th className="text-left p-3">Date</th><th className="text-left p-3">Durée</th><th className="text-left p-3">Statut</th>
          </tr></thead>
          <tbody>
            {isLoading ? <tr><td colSpan={5} className="p-4 text-center text-muted-foreground">Chargement...</td></tr>
            : sanctions?.length === 0 ? <tr><td colSpan={5} className="p-4 text-center text-muted-foreground">Aucune sanction</td></tr>
            : sanctions?.map((s: any) => (
              <tr key={s.id} className="border-b hover:bg-muted/30">
                <td className="p-3 font-medium">{s.employe?.prenom} {s.employe?.nom}</td>
                <td className="p-3"><Badge variant={s.type_sanction === 'Licenciement' ? 'destructive' : 'outline'}>{s.type_sanction}</Badge></td>
                <td className="p-3">{new Date(s.date_sanction).toLocaleDateString('fr-FR')}</td>
                <td className="p-3">{s.duree_jours ? `${s.duree_jours} jours` : '-'}</td>
                <td className="p-3"><Badge variant={s.statut === 'active' ? 'default' : 'secondary'}>{s.statut}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent></Card>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nouvelle sanction</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Employé *</Label>
              <Select value={form.employe_id} onValueChange={v => setForm({...form, employe_id: v})}>
                <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                <SelectContent>{employes?.map(e => <SelectItem key={e.id} value={e.id}>{e.prenom} {e.nom}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Type</Label>
              <Select value={form.type_sanction} onValueChange={v => setForm({...form, type_sanction: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{typesSanction.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Motif *</Label><Textarea value={form.motif} onChange={e => setForm({...form, motif: e.target.value})} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Date *</Label><Input type="date" value={form.date_sanction} onChange={e => setForm({...form, date_sanction: e.target.value})} /></div>
              <div><Label>Durée (jours)</Label><Input type="number" value={form.duree_jours} onChange={e => setForm({...form, duree_jours: e.target.value})} /></div>
            </div>
            <div><Label>Commentaires</Label><Textarea value={form.commentaires} onChange={e => setForm({...form, commentaires: e.target.value})} /></div>
            <Button onClick={() => {
              if (!form.employe_id || !form.motif || !form.date_sanction) return toast({ title: 'Champs requis', variant: 'destructive' });
              createMutation.mutate({ employe_id: form.employe_id, type_sanction: form.type_sanction, motif: form.motif, date_sanction: form.date_sanction, duree_jours: form.duree_jours ? parseInt(form.duree_jours) : null, commentaires: form.commentaires || null });
            }} className="w-full" disabled={createMutation.isPending}>Enregistrer</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
