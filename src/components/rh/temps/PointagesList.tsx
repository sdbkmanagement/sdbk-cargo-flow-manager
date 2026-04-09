import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Clock } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export const PointagesList = () => {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0]);
  const [form, setForm] = useState({ employe_id: '', date_pointage: new Date().toISOString().split('T')[0], heure_arrivee: '08:00', heure_depart: '17:00', statut: 'present' });

  const { data: pointages, isLoading } = useQuery({
    queryKey: ['pointages', dateFilter],
    queryFn: async () => {
      const { data, error } = await supabase.from('pointages').select('*, employe:employes(nom, prenom, poste)').eq('date_pointage', dateFilter).order('created_at', { ascending: false });
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
      // Calcul heures travaillées
      if (data.heure_arrivee && data.heure_depart) {
        const [ha, ma] = data.heure_arrivee.split(':').map(Number);
        const [hd, md] = data.heure_depart.split(':').map(Number);
        data.heures_travaillees = Math.round(((hd * 60 + md) - (ha * 60 + ma)) / 60 * 100) / 100;
        // Retard si arrivée après 8h
        const retard = (ha * 60 + ma) - 480;
        data.retard_minutes = retard > 0 ? retard : 0;
      }
      const { error } = await supabase.from('pointages').insert(data);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['pointages'] }); setShowForm(false); toast({ title: 'Pointage enregistré' }); },
    onError: (e: any) => toast({ title: 'Erreur', description: e.message, variant: 'destructive' })
  });

  const statutColor = (s: string) => { switch(s) { case 'present': return 'default'; case 'absent': return 'destructive'; case 'retard': return 'secondary'; default: return 'outline'; } };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Pointages</h2>
        <div className="flex gap-2">
          <Input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)} className="w-44" />
          <Button onClick={() => setShowForm(true)}><Plus className="w-4 h-4 mr-2" />Nouveau pointage</Button>
        </div>
      </div>
      <Card><CardContent className="p-0">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/50"><tr>
            <th className="text-left p-3">Employé</th><th className="text-left p-3">Arrivée</th><th className="text-left p-3">Départ</th><th className="text-left p-3">Heures</th><th className="text-left p-3">Retard</th><th className="text-left p-3">Statut</th>
          </tr></thead>
          <tbody>
            {isLoading ? <tr><td colSpan={6} className="p-4 text-center text-muted-foreground">Chargement...</td></tr>
            : pointages?.length === 0 ? <tr><td colSpan={6} className="p-4 text-center text-muted-foreground">Aucun pointage pour cette date</td></tr>
            : pointages?.map((p: any) => (
              <tr key={p.id} className="border-b hover:bg-muted/30">
                <td className="p-3 font-medium">{p.employe?.prenom} {p.employe?.nom}</td>
                <td className="p-3">{p.heure_arrivee || '-'}</td>
                <td className="p-3">{p.heure_depart || '-'}</td>
                <td className="p-3">{p.heures_travaillees ? `${p.heures_travaillees}h` : '-'}</td>
                <td className="p-3">{p.retard_minutes > 0 ? `${p.retard_minutes} min` : '-'}</td>
                <td className="p-3"><Badge variant={statutColor(p.statut)}>{p.statut}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent></Card>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nouveau pointage</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Employé *</Label>
              <Select value={form.employe_id} onValueChange={v => setForm({...form, employe_id: v})}>
                <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                <SelectContent>{employes?.map(e => <SelectItem key={e.id} value={e.id}>{e.prenom} {e.nom}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Date</Label><Input type="date" value={form.date_pointage} onChange={e => setForm({...form, date_pointage: e.target.value})} /></div>
            <div><Label>Statut</Label>
              <Select value={form.statut} onValueChange={v => setForm({...form, statut: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="present">Présent</SelectItem><SelectItem value="absent">Absent</SelectItem><SelectItem value="retard">Retard</SelectItem><SelectItem value="conge">Congé</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {form.statut !== 'absent' && form.statut !== 'conge' && (
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Heure arrivée</Label><Input type="time" value={form.heure_arrivee} onChange={e => setForm({...form, heure_arrivee: e.target.value})} /></div>
                <div><Label>Heure départ</Label><Input type="time" value={form.heure_depart} onChange={e => setForm({...form, heure_depart: e.target.value})} /></div>
              </div>
            )}
            <Button onClick={() => {
              if (!form.employe_id) return toast({ title: 'Sélectionnez un employé', variant: 'destructive' });
              createMutation.mutate({ employe_id: form.employe_id, date_pointage: form.date_pointage, heure_arrivee: form.statut !== 'absent' ? form.heure_arrivee : null, heure_depart: form.statut !== 'absent' ? form.heure_depart : null, statut: form.statut });
            }} className="w-full" disabled={createMutation.isPending}>Enregistrer</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
