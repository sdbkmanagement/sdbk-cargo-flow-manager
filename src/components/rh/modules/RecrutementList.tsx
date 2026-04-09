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

const etapes = ['candidature', 'pre_selection', 'entretien', 'test_technique', 'decision', 'offre', 'integre', 'refuse'];
const etapeLabels: Record<string, string> = { candidature: 'Candidature', pre_selection: 'Pré-sélection', entretien: 'Entretien', test_technique: 'Test technique', decision: 'Décision', offre: 'Offre', integre: 'Intégré', refuse: 'Refusé' };

export const RecrutementList = () => {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ poste: '', service: '', candidat_nom: '', candidat_prenom: '', candidat_email: '', candidat_telephone: '', date_candidature: new Date().toISOString().split('T')[0], notes: '' });

  const { data: recrutements, isLoading } = useQuery({
    queryKey: ['recrutement'],
    queryFn: async () => {
      const { data, error } = await supabase.from('recrutement').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => { const { error } = await supabase.from('recrutement').insert(data); if (error) throw error; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['recrutement'] }); setShowForm(false); toast({ title: 'Candidature enregistrée' }); },
    onError: (e: any) => toast({ title: 'Erreur', description: e.message, variant: 'destructive' })
  });

  const updateEtape = useMutation({
    mutationFn: async ({ id, etape }: { id: string, etape: string }) => { const { error } = await supabase.from('recrutement').update({ etape }).eq('id', id); if (error) throw error; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['recrutement'] }); toast({ title: 'Étape mise à jour' }); }
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Recrutement</h2>
        <Button onClick={() => setShowForm(true)}><Plus className="w-4 h-4 mr-2" />Nouvelle candidature</Button>
      </div>
      <Card><CardContent className="p-0">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/50"><tr>
            <th className="text-left p-3">Candidat</th><th className="text-left p-3">Poste</th><th className="text-left p-3">Service</th><th className="text-left p-3">Date</th><th className="text-left p-3">Étape</th><th className="text-left p-3">Actions</th>
          </tr></thead>
          <tbody>
            {isLoading ? <tr><td colSpan={6} className="p-4 text-center text-muted-foreground">Chargement...</td></tr>
            : recrutements?.length === 0 ? <tr><td colSpan={6} className="p-4 text-center text-muted-foreground">Aucune candidature</td></tr>
            : recrutements?.map((r: any) => (
              <tr key={r.id} className="border-b hover:bg-muted/30">
                <td className="p-3 font-medium">{r.candidat_prenom} {r.candidat_nom}</td>
                <td className="p-3">{r.poste}</td>
                <td className="p-3">{r.service || '-'}</td>
                <td className="p-3">{r.date_candidature ? new Date(r.date_candidature).toLocaleDateString('fr-FR') : '-'}</td>
                <td className="p-3"><Badge variant={r.etape === 'integre' ? 'default' : r.etape === 'refuse' ? 'destructive' : 'secondary'}>{etapeLabels[r.etape] || r.etape}</Badge></td>
                <td className="p-3">
                  <Select value={r.etape} onValueChange={v => updateEtape.mutate({ id: r.id, etape: v })}>
                    <SelectTrigger className="h-7 text-xs w-32"><SelectValue /></SelectTrigger>
                    <SelectContent>{etapes.map(e => <SelectItem key={e} value={e}>{etapeLabels[e]}</SelectItem>)}</SelectContent>
                  </Select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent></Card>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nouvelle candidature</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Nom *</Label><Input value={form.candidat_nom} onChange={e => setForm({...form, candidat_nom: e.target.value})} /></div>
              <div><Label>Prénom *</Label><Input value={form.candidat_prenom} onChange={e => setForm({...form, candidat_prenom: e.target.value})} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Poste *</Label><Input value={form.poste} onChange={e => setForm({...form, poste: e.target.value})} /></div>
              <div><Label>Service</Label><Input value={form.service} onChange={e => setForm({...form, service: e.target.value})} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Email</Label><Input type="email" value={form.candidat_email} onChange={e => setForm({...form, candidat_email: e.target.value})} /></div>
              <div><Label>Téléphone</Label><Input value={form.candidat_telephone} onChange={e => setForm({...form, candidat_telephone: e.target.value})} /></div>
            </div>
            <div><Label>Date candidature</Label><Input type="date" value={form.date_candidature} onChange={e => setForm({...form, date_candidature: e.target.value})} /></div>
            <div><Label>Notes</Label><Textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} /></div>
            <Button onClick={() => {
              if (!form.candidat_nom || !form.candidat_prenom || !form.poste) return toast({ title: 'Champs requis', variant: 'destructive' });
              createMutation.mutate(form);
            }} className="w-full" disabled={createMutation.isPending}>Enregistrer</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
