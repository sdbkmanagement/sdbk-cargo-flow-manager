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

export const VisitesMedicalesList = () => {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ employe_id: '', type_visite: 'annuelle', date_visite: '', date_prochaine: '', medecin: '', resultat: 'apte', observations: '' });

  const { data: visites, isLoading } = useQuery({
    queryKey: ['visites-medicales'],
    queryFn: async () => {
      const { data, error } = await supabase.from('visites_medicales').select('*, employe:employes(nom, prenom)').order('date_visite', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  const { data: employes } = useQuery({
    queryKey: ['employes-list'],
    queryFn: async () => { const { data } = await supabase.from('employes').select('id, nom, prenom').order('nom'); return data; }
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => { const { error } = await supabase.from('visites_medicales').insert(data); if (error) throw error; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['visites-medicales'] }); setShowForm(false); toast({ title: 'Visite enregistrée' }); },
    onError: (e: any) => toast({ title: 'Erreur', description: e.message, variant: 'destructive' })
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Visites médicales</h2>
        <Button onClick={() => setShowForm(true)}><Plus className="w-4 h-4 mr-2" />Nouvelle visite</Button>
      </div>
      <Card><CardContent className="p-0">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/50"><tr>
            <th className="text-left p-3">Employé</th><th className="text-left p-3">Type</th><th className="text-left p-3">Date</th><th className="text-left p-3">Prochaine</th><th className="text-left p-3">Résultat</th><th className="text-left p-3">Médecin</th>
          </tr></thead>
          <tbody>
            {isLoading ? <tr><td colSpan={6} className="p-4 text-center text-muted-foreground">Chargement...</td></tr>
            : visites?.length === 0 ? <tr><td colSpan={6} className="p-4 text-center text-muted-foreground">Aucune visite</td></tr>
            : visites?.map((v: any) => (
              <tr key={v.id} className="border-b hover:bg-muted/30">
                <td className="p-3 font-medium">{v.employe?.prenom} {v.employe?.nom}</td>
                <td className="p-3">{v.type_visite}</td>
                <td className="p-3">{new Date(v.date_visite).toLocaleDateString('fr-FR')}</td>
                <td className="p-3">{v.date_prochaine ? new Date(v.date_prochaine).toLocaleDateString('fr-FR') : '-'}</td>
                <td className="p-3"><Badge variant={v.resultat === 'apte' ? 'default' : v.resultat === 'inapte' ? 'destructive' : 'secondary'}>{v.resultat}</Badge></td>
                <td className="p-3">{v.medecin || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent></Card>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nouvelle visite médicale</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Employé *</Label>
              <Select value={form.employe_id} onValueChange={v => setForm({...form, employe_id: v})}>
                <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                <SelectContent>{employes?.map(e => <SelectItem key={e.id} value={e.id}>{e.prenom} {e.nom}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Type</Label>
                <Select value={form.type_visite} onValueChange={v => setForm({...form, type_visite: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="embauche">Embauche</SelectItem><SelectItem value="annuelle">Annuelle</SelectItem><SelectItem value="reprise">Reprise</SelectItem><SelectItem value="periodique">Périodique</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Résultat</Label>
                <Select value={form.resultat} onValueChange={v => setForm({...form, resultat: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="apte">Apte</SelectItem><SelectItem value="apte_avec_reserve">Apte avec réserve</SelectItem><SelectItem value="inapte">Inapte</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Date visite *</Label><Input type="date" value={form.date_visite} onChange={e => setForm({...form, date_visite: e.target.value})} /></div>
              <div><Label>Prochaine visite</Label><Input type="date" value={form.date_prochaine} onChange={e => setForm({...form, date_prochaine: e.target.value})} /></div>
            </div>
            <div><Label>Médecin</Label><Input value={form.medecin} onChange={e => setForm({...form, medecin: e.target.value})} /></div>
            <div><Label>Observations</Label><Textarea value={form.observations} onChange={e => setForm({...form, observations: e.target.value})} /></div>
            <Button onClick={() => {
              if (!form.employe_id || !form.date_visite) return toast({ title: 'Champs requis', variant: 'destructive' });
              createMutation.mutate({ employe_id: form.employe_id, type_visite: form.type_visite, date_visite: form.date_visite, date_prochaine: form.date_prochaine || null, medecin: form.medecin || null, resultat: form.resultat, observations: form.observations || null });
            }} className="w-full" disabled={createMutation.isPending}>Enregistrer</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
