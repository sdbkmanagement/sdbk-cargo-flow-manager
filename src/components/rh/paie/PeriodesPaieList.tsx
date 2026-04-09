import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

const moisNoms = ['', 'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

export const PeriodesPaieList = () => {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const now = new Date();
  const [form, setForm] = useState({ mois: String(now.getMonth() + 1), annee: String(now.getFullYear()) });

  const { data: periodes, isLoading } = useQuery({
    queryKey: ['periodes-paie'],
    queryFn: async () => {
      const { data, error } = await supabase.from('periodes_paie').select('*').order('annee', { ascending: false }).order('mois', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const m = parseInt(data.mois); const a = parseInt(data.annee);
      const date_debut = `${a}-${String(m).padStart(2,'0')}-01`;
      const lastDay = new Date(a, m, 0).getDate();
      const date_fin = `${a}-${String(m).padStart(2,'0')}-${lastDay}`;
      const { error } = await supabase.from('periodes_paie').insert({ mois: m, annee: a, date_debut, date_fin });
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['periodes-paie'] }); setShowForm(false); toast({ title: 'Période créée' }); },
    onError: (e: any) => toast({ title: 'Erreur', description: e.message, variant: 'destructive' })
  });

  const cloturerMutation = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from('periodes_paie').update({ statut: 'cloturee', date_cloture: new Date().toISOString().split('T')[0] }).eq('id', id); if (error) throw error; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['periodes-paie'] }); toast({ title: 'Période clôturée' }); }
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Périodes de paie</h2>
        <Button onClick={() => setShowForm(true)}><Plus className="w-4 h-4 mr-2" />Nouvelle période</Button>
      </div>
      <Card><CardContent className="p-0">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/50"><tr>
            <th className="text-left p-3">Période</th><th className="text-left p-3">Du</th><th className="text-left p-3">Au</th><th className="text-left p-3">Statut</th><th className="text-left p-3">Clôture</th><th className="text-left p-3">Actions</th>
          </tr></thead>
          <tbody>
            {isLoading ? <tr><td colSpan={6} className="p-4 text-center text-muted-foreground">Chargement...</td></tr>
            : periodes?.length === 0 ? <tr><td colSpan={6} className="p-4 text-center text-muted-foreground">Aucune période</td></tr>
            : periodes?.map((p: any) => (
              <tr key={p.id} className="border-b hover:bg-muted/30">
                <td className="p-3 font-medium">{moisNoms[p.mois]} {p.annee}</td>
                <td className="p-3">{new Date(p.date_debut).toLocaleDateString('fr-FR')}</td>
                <td className="p-3">{new Date(p.date_fin).toLocaleDateString('fr-FR')}</td>
                <td className="p-3"><Badge variant={p.statut === 'cloturee' ? 'secondary' : 'default'}>{p.statut}</Badge></td>
                <td className="p-3">{p.date_cloture ? new Date(p.date_cloture).toLocaleDateString('fr-FR') : '-'}</td>
                <td className="p-3">
                  {p.statut === 'ouverte' && <Button size="sm" variant="outline" onClick={() => cloturerMutation.mutate(p.id)}>Clôturer</Button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent></Card>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nouvelle période de paie</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Mois</Label><Input type="number" min="1" max="12" value={form.mois} onChange={e => setForm({...form, mois: e.target.value})} /></div>
              <div><Label>Année</Label><Input type="number" value={form.annee} onChange={e => setForm({...form, annee: e.target.value})} /></div>
            </div>
            <Button onClick={() => createMutation.mutate(form)} className="w-full" disabled={createMutation.isPending}>Créer</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
