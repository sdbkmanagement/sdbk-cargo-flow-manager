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

const categories = ['Transport', 'Hébergement', 'Repas', 'Fournitures', 'Communication', 'Déplacement', 'Autre'];

export const NotesFraisList = () => {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ employe_id: '', date_note: new Date().toISOString().split('T')[0], categorie: 'Transport', description: '', montant: '' });

  const { data: notes, isLoading } = useQuery({
    queryKey: ['notes-frais'],
    queryFn: async () => {
      const { data, error } = await supabase.from('notes_frais').select('*, employe:employes(nom, prenom)').order('date_note', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  const { data: employes } = useQuery({
    queryKey: ['employes-list'],
    queryFn: async () => { const { data } = await supabase.from('employes').select('id, nom, prenom').order('nom'); return data; }
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => { const { error } = await supabase.from('notes_frais').insert(data); if (error) throw error; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['notes-frais'] }); setShowForm(false); toast({ title: 'Note de frais enregistrée' }); },
    onError: (e: any) => toast({ title: 'Erreur', description: e.message, variant: 'destructive' })
  });

  const updateStatut = useMutation({
    mutationFn: async ({ id, statut }: { id: string, statut: string }) => { const { error } = await supabase.from('notes_frais').update({ statut, date_approbation: new Date().toISOString().split('T')[0] }).eq('id', id); if (error) throw error; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['notes-frais'] }); toast({ title: 'Statut mis à jour' }); }
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Notes de frais</h2>
        <Button onClick={() => setShowForm(true)}><Plus className="w-4 h-4 mr-2" />Nouvelle note</Button>
      </div>
      <Card><CardContent className="p-0">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/50"><tr>
            <th className="text-left p-3">Employé</th><th className="text-left p-3">Date</th><th className="text-left p-3">Catégorie</th><th className="text-left p-3">Description</th><th className="text-right p-3">Montant</th><th className="text-left p-3">Statut</th><th className="text-left p-3">Actions</th>
          </tr></thead>
          <tbody>
            {isLoading ? <tr><td colSpan={7} className="p-4 text-center text-muted-foreground">Chargement...</td></tr>
            : notes?.length === 0 ? <tr><td colSpan={7} className="p-4 text-center text-muted-foreground">Aucune note de frais</td></tr>
            : notes?.map((n: any) => (
              <tr key={n.id} className="border-b hover:bg-muted/30">
                <td className="p-3 font-medium">{n.employe?.prenom} {n.employe?.nom}</td>
                <td className="p-3">{new Date(n.date_note).toLocaleDateString('fr-FR')}</td>
                <td className="p-3">{n.categorie}</td>
                <td className="p-3 max-w-[200px] truncate">{n.description}</td>
                <td className="p-3 text-right">{Number(n.montant).toLocaleString('fr-FR')} GNF</td>
                <td className="p-3"><Badge variant={n.statut === 'approuvee' ? 'default' : n.statut === 'refusee' ? 'destructive' : 'secondary'}>{n.statut}</Badge></td>
                <td className="p-3">
                  {n.statut === 'soumise' && (
                    <div className="flex gap-1">
                      <Button size="sm" variant="outline" onClick={() => updateStatut.mutate({ id: n.id, statut: 'approuvee' })}><Check className="w-3 h-3" /></Button>
                      <Button size="sm" variant="outline" onClick={() => updateStatut.mutate({ id: n.id, statut: 'refusee' })}><X className="w-3 h-3" /></Button>
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
          <DialogHeader><DialogTitle>Nouvelle note de frais</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Employé *</Label>
              <Select value={form.employe_id} onValueChange={v => setForm({...form, employe_id: v})}>
                <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                <SelectContent>{employes?.map(e => <SelectItem key={e.id} value={e.id}>{e.prenom} {e.nom}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Date</Label><Input type="date" value={form.date_note} onChange={e => setForm({...form, date_note: e.target.value})} /></div>
              <div><Label>Catégorie</Label>
                <Select value={form.categorie} onValueChange={v => setForm({...form, categorie: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>Description *</Label><Textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} /></div>
            <div><Label>Montant (GNF) *</Label><Input type="number" value={form.montant} onChange={e => setForm({...form, montant: e.target.value})} /></div>
            <Button onClick={() => {
              if (!form.employe_id || !form.description || !form.montant) return toast({ title: 'Champs requis', variant: 'destructive' });
              createMutation.mutate({ employe_id: form.employe_id, date_note: form.date_note, categorie: form.categorie, description: form.description, montant: parseFloat(form.montant) });
            }} className="w-full" disabled={createMutation.isPending}>Enregistrer</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
