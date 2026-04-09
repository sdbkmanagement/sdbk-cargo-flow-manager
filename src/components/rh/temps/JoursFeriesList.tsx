import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Trash2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export const JoursFeriesList = () => {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ nom: '', date_ferie: '', recurrent: false, description: '' });

  const { data: jours, isLoading } = useQuery({
    queryKey: ['jours-feries'],
    queryFn: async () => {
      const { data, error } = await supabase.from('jours_feries').select('*').order('date_ferie');
      if (error) throw error;
      return data;
    }
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => { const { error } = await supabase.from('jours_feries').insert(data); if (error) throw error; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['jours-feries'] }); setShowForm(false); toast({ title: 'Jour férié ajouté' }); },
    onError: (e: any) => toast({ title: 'Erreur', description: e.message, variant: 'destructive' })
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from('jours_feries').delete().eq('id', id); if (error) throw error; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['jours-feries'] }); toast({ title: 'Jour férié supprimé' }); }
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Jours fériés</h2>
        <Button onClick={() => setShowForm(true)}><Plus className="w-4 h-4 mr-2" />Ajouter</Button>
      </div>
      <Card><CardContent className="p-0">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/50"><tr>
            <th className="text-left p-3">Nom</th><th className="text-left p-3">Date</th><th className="text-left p-3">Récurrent</th><th className="text-left p-3">Description</th><th className="text-left p-3"></th>
          </tr></thead>
          <tbody>
            {isLoading ? <tr><td colSpan={5} className="p-4 text-center text-muted-foreground">Chargement...</td></tr>
            : jours?.map((j: any) => (
              <tr key={j.id} className="border-b hover:bg-muted/30">
                <td className="p-3 font-medium">{j.nom}</td>
                <td className="p-3">{new Date(j.date_ferie).toLocaleDateString('fr-FR')}</td>
                <td className="p-3">{j.recurrent ? <Badge>Oui</Badge> : <Badge variant="outline">Non</Badge>}</td>
                <td className="p-3">{j.description || '-'}</td>
                <td className="p-3"><Button size="sm" variant="ghost" onClick={() => deleteMutation.mutate(j.id)}><Trash2 className="w-3 h-3" /></Button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent></Card>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader><DialogTitle>Ajouter un jour férié</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Nom *</Label><Input value={form.nom} onChange={e => setForm({...form, nom: e.target.value})} /></div>
            <div><Label>Date *</Label><Input type="date" value={form.date_ferie} onChange={e => setForm({...form, date_ferie: e.target.value})} /></div>
            <div className="flex items-center gap-2">
              <Checkbox checked={form.recurrent} onCheckedChange={v => setForm({...form, recurrent: !!v})} />
              <Label>Récurrent chaque année</Label>
            </div>
            <div><Label>Description</Label><Input value={form.description} onChange={e => setForm({...form, description: e.target.value})} /></div>
            <Button onClick={() => {
              if (!form.nom || !form.date_ferie) return toast({ title: 'Champs requis', variant: 'destructive' });
              createMutation.mutate(form);
            }} className="w-full" disabled={createMutation.isPending}>Enregistrer</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
