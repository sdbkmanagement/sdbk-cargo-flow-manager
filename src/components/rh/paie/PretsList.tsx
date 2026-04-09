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

export const PretsList = () => {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ employe_id: '', montant_total: '', montant_mensualite: '', nombre_echeances: '', date_debut: '', motif: '' });

  const { data: prets, isLoading } = useQuery({
    queryKey: ['prets'],
    queryFn: async () => {
      const { data, error } = await supabase.from('prets').select('*, employe:employes(nom, prenom)').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  const { data: employes } = useQuery({
    queryKey: ['employes-list'],
    queryFn: async () => { const { data } = await supabase.from('employes').select('id, nom, prenom').order('nom'); return data; }
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      data.solde_restant = data.montant_total;
      const { error } = await supabase.from('prets').insert(data);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['prets'] }); setShowForm(false); toast({ title: 'Prêt enregistré' }); },
    onError: (e: any) => toast({ title: 'Erreur', description: e.message, variant: 'destructive' })
  });

  const fmt = (n: any) => Number(n || 0).toLocaleString('fr-FR');

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Prêts</h2>
        <Button onClick={() => setShowForm(true)}><Plus className="w-4 h-4 mr-2" />Nouveau prêt</Button>
      </div>
      <Card><CardContent className="p-0">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/50"><tr>
            <th className="text-left p-3">Employé</th><th className="text-right p-3">Montant</th><th className="text-right p-3">Mensualité</th><th className="text-right p-3">Solde</th><th className="text-left p-3">Échéances</th><th className="text-left p-3">Statut</th>
          </tr></thead>
          <tbody>
            {isLoading ? <tr><td colSpan={6} className="p-4 text-center text-muted-foreground">Chargement...</td></tr>
            : prets?.length === 0 ? <tr><td colSpan={6} className="p-4 text-center text-muted-foreground">Aucun prêt</td></tr>
            : prets?.map((p: any) => (
              <tr key={p.id} className="border-b hover:bg-muted/30">
                <td className="p-3 font-medium">{p.employe?.prenom} {p.employe?.nom}</td>
                <td className="p-3 text-right">{fmt(p.montant_total)} GNF</td>
                <td className="p-3 text-right">{fmt(p.montant_mensualite)} GNF</td>
                <td className="p-3 text-right">{fmt(p.solde_restant)} GNF</td>
                <td className="p-3">{p.echeances_payees}/{p.nombre_echeances}</td>
                <td className="p-3"><Badge variant={p.statut === 'en_cours' ? 'default' : p.statut === 'rembourse' ? 'secondary' : 'outline'}>{p.statut}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent></Card>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nouveau prêt</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Employé *</Label>
              <Select value={form.employe_id} onValueChange={v => setForm({...form, employe_id: v})}>
                <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                <SelectContent>{employes?.map(e => <SelectItem key={e.id} value={e.id}>{e.prenom} {e.nom}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Montant total (GNF) *</Label><Input type="number" value={form.montant_total} onChange={e => setForm({...form, montant_total: e.target.value})} /></div>
              <div><Label>Mensualité (GNF) *</Label><Input type="number" value={form.montant_mensualite} onChange={e => setForm({...form, montant_mensualite: e.target.value})} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Nombre d'échéances *</Label><Input type="number" value={form.nombre_echeances} onChange={e => setForm({...form, nombre_echeances: e.target.value})} /></div>
              <div><Label>Date début *</Label><Input type="date" value={form.date_debut} onChange={e => setForm({...form, date_debut: e.target.value})} /></div>
            </div>
            <div><Label>Motif</Label><Textarea value={form.motif} onChange={e => setForm({...form, motif: e.target.value})} /></div>
            <Button onClick={() => {
              if (!form.employe_id || !form.montant_total || !form.montant_mensualite || !form.nombre_echeances || !form.date_debut) return toast({ title: 'Champs requis', variant: 'destructive' });
              createMutation.mutate({ employe_id: form.employe_id, montant_total: parseFloat(form.montant_total), montant_mensualite: parseFloat(form.montant_mensualite), nombre_echeances: parseInt(form.nombre_echeances), date_debut: form.date_debut, motif: form.motif || null });
            }} className="w-full" disabled={createMutation.isPending}>Enregistrer</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
