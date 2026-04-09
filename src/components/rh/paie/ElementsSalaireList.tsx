import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export const ElementsSalaireList = () => {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ employe_id: '', salaire_base: '', prime_transport: '0', prime_logement: '0', prime_risque: '0', prime_anciennete: '0', prime_rendement: '0', indemnite_repas: '0', autres_primes: '0', date_effet: new Date().toISOString().split('T')[0] });

  const { data: elements, isLoading } = useQuery({
    queryKey: ['elements-salaire'],
    queryFn: async () => {
      const { data, error } = await supabase.from('elements_salaire').select('*, employe:employes(nom, prenom, poste)').order('date_effet', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  const { data: employes } = useQuery({
    queryKey: ['employes-list'],
    queryFn: async () => { const { data } = await supabase.from('employes').select('id, nom, prenom').order('nom'); return data; }
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => { const { error } = await supabase.from('elements_salaire').insert(data); if (error) throw error; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['elements-salaire'] }); setShowForm(false); toast({ title: 'Éléments de salaire enregistrés' }); },
    onError: (e: any) => toast({ title: 'Erreur', description: e.message, variant: 'destructive' })
  });

  const fmt = (n: any) => Number(n || 0).toLocaleString('fr-FR');

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Éléments de salaire</h2>
        <Button onClick={() => setShowForm(true)}><Plus className="w-4 h-4 mr-2" />Configurer</Button>
      </div>
      <Card><CardContent className="p-0">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/50"><tr>
            <th className="text-left p-3">Employé</th><th className="text-right p-3">Base</th><th className="text-right p-3">Transport</th><th className="text-right p-3">Logement</th><th className="text-right p-3">Risque</th><th className="text-right p-3">Total</th><th className="text-left p-3">Date effet</th>
          </tr></thead>
          <tbody>
            {isLoading ? <tr><td colSpan={7} className="p-4 text-center text-muted-foreground">Chargement...</td></tr>
            : elements?.length === 0 ? <tr><td colSpan={7} className="p-4 text-center text-muted-foreground">Aucun élément configuré</td></tr>
            : elements?.map((e: any) => {
              const total = Number(e.salaire_base || 0) + Number(e.prime_transport || 0) + Number(e.prime_logement || 0) + Number(e.prime_risque || 0) + Number(e.prime_anciennete || 0) + Number(e.prime_rendement || 0) + Number(e.indemnite_repas || 0) + Number(e.autres_primes || 0);
              return (
                <tr key={e.id} className="border-b hover:bg-muted/30">
                  <td className="p-3 font-medium">{e.employe?.prenom} {e.employe?.nom}</td>
                  <td className="p-3 text-right">{fmt(e.salaire_base)}</td>
                  <td className="p-3 text-right">{fmt(e.prime_transport)}</td>
                  <td className="p-3 text-right">{fmt(e.prime_logement)}</td>
                  <td className="p-3 text-right">{fmt(e.prime_risque)}</td>
                  <td className="p-3 text-right font-semibold">{fmt(total)}</td>
                  <td className="p-3">{new Date(e.date_effet).toLocaleDateString('fr-FR')}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </CardContent></Card>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Éléments de salaire</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Employé *</Label>
              <Select value={form.employe_id} onValueChange={v => setForm({...form, employe_id: v})}>
                <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                <SelectContent>{employes?.map(e => <SelectItem key={e.id} value={e.id}>{e.prenom} {e.nom}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Salaire de base (GNF) *</Label><Input type="number" value={form.salaire_base} onChange={e => setForm({...form, salaire_base: e.target.value})} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Prime transport</Label><Input type="number" value={form.prime_transport} onChange={e => setForm({...form, prime_transport: e.target.value})} /></div>
              <div><Label>Prime logement</Label><Input type="number" value={form.prime_logement} onChange={e => setForm({...form, prime_logement: e.target.value})} /></div>
              <div><Label>Prime risque</Label><Input type="number" value={form.prime_risque} onChange={e => setForm({...form, prime_risque: e.target.value})} /></div>
              <div><Label>Prime ancienneté</Label><Input type="number" value={form.prime_anciennete} onChange={e => setForm({...form, prime_anciennete: e.target.value})} /></div>
              <div><Label>Prime rendement</Label><Input type="number" value={form.prime_rendement} onChange={e => setForm({...form, prime_rendement: e.target.value})} /></div>
              <div><Label>Indemnité repas</Label><Input type="number" value={form.indemnite_repas} onChange={e => setForm({...form, indemnite_repas: e.target.value})} /></div>
            </div>
            <div><Label>Autres primes</Label><Input type="number" value={form.autres_primes} onChange={e => setForm({...form, autres_primes: e.target.value})} /></div>
            <div><Label>Date d'effet</Label><Input type="date" value={form.date_effet} onChange={e => setForm({...form, date_effet: e.target.value})} /></div>
            <Button onClick={() => {
              if (!form.employe_id || !form.salaire_base) return toast({ title: 'Champs requis', variant: 'destructive' });
              createMutation.mutate({
                employe_id: form.employe_id, salaire_base: parseFloat(form.salaire_base),
                prime_transport: parseFloat(form.prime_transport), prime_logement: parseFloat(form.prime_logement),
                prime_risque: parseFloat(form.prime_risque), prime_anciennete: parseFloat(form.prime_anciennete),
                prime_rendement: parseFloat(form.prime_rendement), indemnite_repas: parseFloat(form.indemnite_repas),
                autres_primes: parseFloat(form.autres_primes), date_effet: form.date_effet
              });
            }} className="w-full" disabled={createMutation.isPending}>Enregistrer</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
