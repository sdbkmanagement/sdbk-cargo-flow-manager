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

export const AccidentsList = () => {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ employe_id: '', date_accident: '', lieu: '', description: '', gravite: 'leger', type_blessure: '', jours_arret: '' });

  const { data: accidents, isLoading } = useQuery({
    queryKey: ['accidents-travail'],
    queryFn: async () => {
      const { data, error } = await supabase.from('accidents_travail').select('*, employe:employes(nom, prenom)').order('date_accident', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  const { data: employes } = useQuery({
    queryKey: ['employes-list'],
    queryFn: async () => { const { data } = await supabase.from('employes').select('id, nom, prenom').order('nom'); return data; }
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => { const { error } = await supabase.from('accidents_travail').insert(data); if (error) throw error; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['accidents-travail'] }); setShowForm(false); toast({ title: 'Accident déclaré' }); },
    onError: (e: any) => toast({ title: 'Erreur', description: e.message, variant: 'destructive' })
  });

  const graviteColor = (g: string) => { switch(g) { case 'grave': return 'destructive'; case 'moyen': return 'default'; default: return 'secondary'; } };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Accidents de travail</h2>
        <Button onClick={() => setShowForm(true)}><Plus className="w-4 h-4 mr-2" />Déclarer un accident</Button>
      </div>
      <Card><CardContent className="p-0">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/50"><tr>
            <th className="text-left p-3">Employé</th><th className="text-left p-3">Date</th><th className="text-left p-3">Lieu</th><th className="text-left p-3">Gravité</th><th className="text-left p-3">Jours arrêt</th><th className="text-left p-3">CNSS</th>
          </tr></thead>
          <tbody>
            {isLoading ? <tr><td colSpan={6} className="p-4 text-center text-muted-foreground">Chargement...</td></tr>
            : accidents?.length === 0 ? <tr><td colSpan={6} className="p-4 text-center text-muted-foreground">Aucun accident</td></tr>
            : accidents?.map((a: any) => (
              <tr key={a.id} className="border-b hover:bg-muted/30">
                <td className="p-3 font-medium">{a.employe?.prenom} {a.employe?.nom}</td>
                <td className="p-3">{new Date(a.date_accident).toLocaleDateString('fr-FR')}</td>
                <td className="p-3">{a.lieu || '-'}</td>
                <td className="p-3"><Badge variant={graviteColor(a.gravite)}>{a.gravite}</Badge></td>
                <td className="p-3">{a.jours_arret || 0}</td>
                <td className="p-3">{a.declaration_cnss ? <Badge variant="default">Déclaré</Badge> : <Badge variant="outline">Non</Badge>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent></Card>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader><DialogTitle>Déclarer un accident de travail</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Employé *</Label>
              <Select value={form.employe_id} onValueChange={v => setForm({...form, employe_id: v})}>
                <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                <SelectContent>{employes?.map(e => <SelectItem key={e.id} value={e.id}>{e.prenom} {e.nom}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Date *</Label><Input type="date" value={form.date_accident} onChange={e => setForm({...form, date_accident: e.target.value})} /></div>
              <div><Label>Gravité</Label>
                <Select value={form.gravite} onValueChange={v => setForm({...form, gravite: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="leger">Léger</SelectItem><SelectItem value="moyen">Moyen</SelectItem><SelectItem value="grave">Grave</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>Lieu</Label><Input value={form.lieu} onChange={e => setForm({...form, lieu: e.target.value})} /></div>
            <div><Label>Description *</Label><Textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Type de blessure</Label><Input value={form.type_blessure} onChange={e => setForm({...form, type_blessure: e.target.value})} /></div>
              <div><Label>Jours d'arrêt</Label><Input type="number" value={form.jours_arret} onChange={e => setForm({...form, jours_arret: e.target.value})} /></div>
            </div>
            <Button onClick={() => {
              if (!form.employe_id || !form.date_accident || !form.description) return toast({ title: 'Champs requis', variant: 'destructive' });
              createMutation.mutate({ employe_id: form.employe_id, date_accident: form.date_accident, lieu: form.lieu || null, description: form.description, gravite: form.gravite, type_blessure: form.type_blessure || null, jours_arret: form.jours_arret ? parseInt(form.jours_arret) : 0 });
            }} className="w-full" disabled={createMutation.isPending}>Enregistrer</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
