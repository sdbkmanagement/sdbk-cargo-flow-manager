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

export const HeuresSupList = () => {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ employe_id: '', date_hs: '', nombre_heures: '', taux_majoration: '1.5', motif: '' });

  const { data: heuresSup, isLoading } = useQuery({
    queryKey: ['heures-sup'],
    queryFn: async () => {
      const { data, error } = await supabase.from('heures_supplementaires').select('*, employe:employes(nom, prenom)').order('date_hs', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  const { data: employes } = useQuery({
    queryKey: ['employes-list'],
    queryFn: async () => { const { data } = await supabase.from('employes').select('id, nom, prenom').order('nom'); return data; }
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => { const { error } = await supabase.from('heures_supplementaires').insert(data); if (error) throw error; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['heures-sup'] }); setShowForm(false); toast({ title: 'HS enregistrées' }); },
    onError: (e: any) => toast({ title: 'Erreur', description: e.message, variant: 'destructive' })
  });

  const updateStatut = useMutation({
    mutationFn: async ({ id, statut }: { id: string, statut: string }) => { const { error } = await supabase.from('heures_supplementaires').update({ statut }).eq('id', id); if (error) throw error; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['heures-sup'] }); toast({ title: 'Statut mis à jour' }); }
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Heures supplémentaires</h2>
        <Button onClick={() => setShowForm(true)}><Plus className="w-4 h-4 mr-2" />Saisir des HS</Button>
      </div>
      <Card><CardContent className="p-0">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/50"><tr>
            <th className="text-left p-3">Employé</th><th className="text-left p-3">Date</th><th className="text-left p-3">Heures</th><th className="text-left p-3">Taux</th><th className="text-left p-3">Motif</th><th className="text-left p-3">Statut</th><th className="text-left p-3">Actions</th>
          </tr></thead>
          <tbody>
            {isLoading ? <tr><td colSpan={7} className="p-4 text-center text-muted-foreground">Chargement...</td></tr>
            : heuresSup?.length === 0 ? <tr><td colSpan={7} className="p-4 text-center text-muted-foreground">Aucune HS</td></tr>
            : heuresSup?.map((h: any) => (
              <tr key={h.id} className="border-b hover:bg-muted/30">
                <td className="p-3 font-medium">{h.employe?.prenom} {h.employe?.nom}</td>
                <td className="p-3">{new Date(h.date_hs).toLocaleDateString('fr-FR')}</td>
                <td className="p-3">{h.nombre_heures}h</td>
                <td className="p-3">x{h.taux_majoration}</td>
                <td className="p-3 max-w-[200px] truncate">{h.motif || '-'}</td>
                <td className="p-3"><Badge variant={h.statut === 'approuve' ? 'default' : h.statut === 'refuse' ? 'destructive' : 'secondary'}>{h.statut}</Badge></td>
                <td className="p-3">
                  {h.statut === 'en_attente' && (
                    <div className="flex gap-1">
                      <Button size="sm" variant="outline" onClick={() => updateStatut.mutate({ id: h.id, statut: 'approuve' })}><Check className="w-3 h-3" /></Button>
                      <Button size="sm" variant="outline" onClick={() => updateStatut.mutate({ id: h.id, statut: 'refuse' })}><X className="w-3 h-3" /></Button>
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
          <DialogHeader><DialogTitle>Saisie d'heures supplémentaires</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Employé *</Label>
              <Select value={form.employe_id} onValueChange={v => setForm({...form, employe_id: v})}>
                <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                <SelectContent>{employes?.map(e => <SelectItem key={e.id} value={e.id}>{e.prenom} {e.nom}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div><Label>Date *</Label><Input type="date" value={form.date_hs} onChange={e => setForm({...form, date_hs: e.target.value})} /></div>
              <div><Label>Nb heures *</Label><Input type="number" step="0.5" value={form.nombre_heures} onChange={e => setForm({...form, nombre_heures: e.target.value})} /></div>
              <div><Label>Taux majoration</Label>
                <Select value={form.taux_majoration} onValueChange={v => setForm({...form, taux_majoration: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1.25">25% (x1.25)</SelectItem><SelectItem value="1.5">50% (x1.50)</SelectItem><SelectItem value="2">100% (x2.00)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>Motif</Label><Textarea value={form.motif} onChange={e => setForm({...form, motif: e.target.value})} /></div>
            <Button onClick={() => {
              if (!form.employe_id || !form.date_hs || !form.nombre_heures) return toast({ title: 'Champs requis', variant: 'destructive' });
              createMutation.mutate({ employe_id: form.employe_id, date_hs: form.date_hs, nombre_heures: parseFloat(form.nombre_heures), taux_majoration: parseFloat(form.taux_majoration), motif: form.motif || null });
            }} className="w-full" disabled={createMutation.isPending}>Enregistrer</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
