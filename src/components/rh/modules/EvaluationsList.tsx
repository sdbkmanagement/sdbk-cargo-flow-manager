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

export const EvaluationsList = () => {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ employe_id: '', periode: 'Annuelle', date_evaluation: '', note_globale: '', performance: 'satisfaisante', points_forts: '', points_amelioration: '', objectifs_prochaine_periode: '' });

  const { data: evaluations, isLoading } = useQuery({
    queryKey: ['evaluations'],
    queryFn: async () => {
      const { data, error } = await supabase.from('evaluations').select('*, employe:employes(nom, prenom, poste)').order('date_evaluation', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  const { data: employes } = useQuery({
    queryKey: ['employes-list'],
    queryFn: async () => { const { data } = await supabase.from('employes').select('id, nom, prenom').order('nom'); return data; }
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => { const { error } = await supabase.from('evaluations').insert(data); if (error) throw error; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['evaluations'] }); setShowForm(false); toast({ title: 'Évaluation enregistrée' }); },
    onError: (e: any) => toast({ title: 'Erreur', description: e.message, variant: 'destructive' })
  });

  const perfColor = (p: string) => { switch(p) { case 'excellente': return 'default'; case 'satisfaisante': return 'secondary'; case 'insuffisante': return 'destructive'; default: return 'outline'; } };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Évaluations</h2>
        <Button onClick={() => setShowForm(true)}><Plus className="w-4 h-4 mr-2" />Nouvelle évaluation</Button>
      </div>
      <Card><CardContent className="p-0">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/50"><tr>
            <th className="text-left p-3">Employé</th><th className="text-left p-3">Poste</th><th className="text-left p-3">Période</th><th className="text-left p-3">Date</th><th className="text-left p-3">Note</th><th className="text-left p-3">Performance</th>
          </tr></thead>
          <tbody>
            {isLoading ? <tr><td colSpan={6} className="p-4 text-center text-muted-foreground">Chargement...</td></tr>
            : evaluations?.length === 0 ? <tr><td colSpan={6} className="p-4 text-center text-muted-foreground">Aucune évaluation</td></tr>
            : evaluations?.map((e: any) => (
              <tr key={e.id} className="border-b hover:bg-muted/30">
                <td className="p-3 font-medium">{e.employe?.prenom} {e.employe?.nom}</td>
                <td className="p-3">{e.employe?.poste || '-'}</td>
                <td className="p-3">{e.periode}</td>
                <td className="p-3">{new Date(e.date_evaluation).toLocaleDateString('fr-FR')}</td>
                <td className="p-3">{e.note_globale || '-'}/20</td>
                <td className="p-3"><Badge variant={perfColor(e.performance)}>{e.performance}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent></Card>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Nouvelle évaluation</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Employé *</Label>
              <Select value={form.employe_id} onValueChange={v => setForm({...form, employe_id: v})}>
                <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                <SelectContent>{employes?.map(e => <SelectItem key={e.id} value={e.id}>{e.prenom} {e.nom}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div><Label>Période</Label>
                <Select value={form.periode} onValueChange={v => setForm({...form, periode: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Annuelle">Annuelle</SelectItem><SelectItem value="Semestrielle">Semestrielle</SelectItem><SelectItem value="Trimestrielle">Trimestrielle</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Date *</Label><Input type="date" value={form.date_evaluation} onChange={e => setForm({...form, date_evaluation: e.target.value})} /></div>
              <div><Label>Note /20</Label><Input type="number" max="20" step="0.5" value={form.note_globale} onChange={e => setForm({...form, note_globale: e.target.value})} /></div>
            </div>
            <div><Label>Performance</Label>
              <Select value={form.performance} onValueChange={v => setForm({...form, performance: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="excellente">Excellente</SelectItem><SelectItem value="satisfaisante">Satisfaisante</SelectItem><SelectItem value="a_ameliorer">À améliorer</SelectItem><SelectItem value="insuffisante">Insuffisante</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Points forts</Label><Textarea value={form.points_forts} onChange={e => setForm({...form, points_forts: e.target.value})} /></div>
            <div><Label>Points d'amélioration</Label><Textarea value={form.points_amelioration} onChange={e => setForm({...form, points_amelioration: e.target.value})} /></div>
            <div><Label>Objectifs prochaine période</Label><Textarea value={form.objectifs_prochaine_periode} onChange={e => setForm({...form, objectifs_prochaine_periode: e.target.value})} /></div>
            <Button onClick={() => {
              if (!form.employe_id || !form.date_evaluation) return toast({ title: 'Champs requis', variant: 'destructive' });
              createMutation.mutate({ employe_id: form.employe_id, periode: form.periode, date_evaluation: form.date_evaluation, note_globale: form.note_globale ? parseFloat(form.note_globale) : null, performance: form.performance, points_forts: form.points_forts || null, points_amelioration: form.points_amelioration || null, objectifs_prochaine_periode: form.objectifs_prochaine_periode || null });
            }} className="w-full" disabled={createMutation.isPending}>Enregistrer</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
