import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Check, X } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

const typesConge = ['Annuel', 'Maladie', 'Maternité', 'Paternité', 'Familial', 'Sans solde', 'Récupération', 'Exceptionnel'];

export const CongesList = () => {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ employe_id: '', type_conge: 'Annuel', date_debut: '', date_fin: '', motif: '' });

  const { data: conges, isLoading } = useQuery({
    queryKey: ['conges'],
    queryFn: async () => {
      const { data, error } = await supabase.from('conges').select('*, employe:employes(nom, prenom)').order('date_debut', { ascending: false });
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
      const d1 = new Date(data.date_debut); const d2 = new Date(data.date_fin);
      data.nombre_jours = Math.ceil((d2.getTime() - d1.getTime()) / (1000*60*60*24)) + 1;
      const { error } = await supabase.from('conges').insert(data);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['conges'] }); setShowForm(false); toast({ title: 'Congé enregistré' }); },
    onError: (e: any) => toast({ title: 'Erreur', description: e.message, variant: 'destructive' })
  });

  const updateStatut = useMutation({
    mutationFn: async ({ id, statut }: { id: string, statut: string }) => {
      const { error } = await supabase.from('conges').update({ statut, date_approbation: new Date().toISOString().split('T')[0] }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['conges'] }); toast({ title: 'Statut mis à jour' }); }
  });

  const statutColor = (s: string) => { switch(s) { case 'approuve': return 'default'; case 'refuse': return 'destructive'; default: return 'secondary'; } };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Congés</h2>
        <Button onClick={() => setShowForm(true)}><Plus className="w-4 h-4 mr-2" />Demande de congé</Button>
      </div>
      <Card><CardContent className="p-0">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/50"><tr>
            <th className="text-left p-3">Employé</th><th className="text-left p-3">Type</th><th className="text-left p-3">Du</th><th className="text-left p-3">Au</th><th className="text-left p-3">Jours</th><th className="text-left p-3">Statut</th><th className="text-left p-3">Actions</th>
          </tr></thead>
          <tbody>
            {isLoading ? <tr><td colSpan={7} className="p-4 text-center text-muted-foreground">Chargement...</td></tr>
            : conges?.length === 0 ? <tr><td colSpan={7} className="p-4 text-center text-muted-foreground">Aucun congé</td></tr>
            : conges?.map((c: any) => (
              <tr key={c.id} className="border-b hover:bg-muted/30">
                <td className="p-3 font-medium">{c.employe?.prenom} {c.employe?.nom}</td>
                <td className="p-3">{c.type_conge}</td>
                <td className="p-3">{new Date(c.date_debut).toLocaleDateString('fr-FR')}</td>
                <td className="p-3">{new Date(c.date_fin).toLocaleDateString('fr-FR')}</td>
                <td className="p-3">{c.nombre_jours}</td>
                <td className="p-3"><Badge variant={statutColor(c.statut)}>{c.statut}</Badge></td>
                <td className="p-3">
                  {c.statut === 'en_attente' && (
                    <div className="flex gap-1">
                      <Button size="sm" variant="outline" onClick={() => updateStatut.mutate({ id: c.id, statut: 'approuve' })}><Check className="w-3 h-3" /></Button>
                      <Button size="sm" variant="outline" onClick={() => updateStatut.mutate({ id: c.id, statut: 'refuse' })}><X className="w-3 h-3" /></Button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent></Card>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader><DialogTitle>Demande de congé</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Employé *</Label>
              <Select value={form.employe_id} onValueChange={v => setForm({...form, employe_id: v})}>
                <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                <SelectContent>{employes?.map(e => <SelectItem key={e.id} value={e.id}>{e.prenom} {e.nom}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Type</Label>
              <Select value={form.type_conge} onValueChange={v => setForm({...form, type_conge: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{typesConge.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Du *</Label><Input type="date" value={form.date_debut} onChange={e => setForm({...form, date_debut: e.target.value})} /></div>
              <div><Label>Au *</Label><Input type="date" value={form.date_fin} onChange={e => setForm({...form, date_fin: e.target.value})} /></div>
            </div>
            <div><Label>Motif</Label><Textarea value={form.motif} onChange={e => setForm({...form, motif: e.target.value})} /></div>
            <Button onClick={() => {
              if (!form.employe_id || !form.date_debut || !form.date_fin) return toast({ title: 'Champs requis', variant: 'destructive' });
              createMutation.mutate({ employe_id: form.employe_id, type_conge: form.type_conge, date_debut: form.date_debut, date_fin: form.date_fin, motif: form.motif || null });
            }} className="w-full" disabled={createMutation.isPending}>Enregistrer</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
