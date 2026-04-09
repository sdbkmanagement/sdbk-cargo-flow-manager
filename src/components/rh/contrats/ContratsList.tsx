import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, FileText } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export const ContratsList = () => {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ employe_id: '', type_contrat: 'CDI', date_debut: '', date_fin: '', salaire_base: '', duree_periode_essai: '' });

  const { data: contrats, isLoading } = useQuery({
    queryKey: ['contrats'],
    queryFn: async () => {
      const { data, error } = await supabase.from('contrats').select('*, employe:employes(nom, prenom, poste)').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  const { data: employes } = useQuery({
    queryKey: ['employes-list'],
    queryFn: async () => {
      const { data, error } = await supabase.from('employes').select('id, nom, prenom').order('nom');
      if (error) throw error;
      return data;
    }
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase.from('contrats').insert(data);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contrats'] });
      setShowForm(false);
      toast({ title: 'Contrat créé avec succès' });
    },
    onError: (e: any) => toast({ title: 'Erreur', description: e.message, variant: 'destructive' })
  });

  const handleSubmit = () => {
    if (!form.employe_id || !form.date_debut) return toast({ title: 'Champs requis manquants', variant: 'destructive' });
    createMutation.mutate({
      employe_id: form.employe_id,
      type_contrat: form.type_contrat,
      date_debut: form.date_debut,
      date_fin: form.date_fin || null,
      salaire_base: form.salaire_base ? parseFloat(form.salaire_base) : null,
      duree_periode_essai: form.duree_periode_essai ? parseInt(form.duree_periode_essai) : null,
    });
  };

  const statutColor = (s: string) => {
    switch (s) { case 'actif': return 'default'; case 'expire': return 'destructive'; case 'resilie': return 'secondary'; default: return 'outline'; }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Contrats de travail</h2>
        <Button onClick={() => setShowForm(true)}><Plus className="w-4 h-4 mr-2" />Nouveau contrat</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/50">
              <tr>
                <th className="text-left p-3">Employé</th>
                <th className="text-left p-3">Type</th>
                <th className="text-left p-3">Début</th>
                <th className="text-left p-3">Fin</th>
                <th className="text-left p-3">Salaire base</th>
                <th className="text-left p-3">Statut</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={6} className="p-4 text-center text-muted-foreground">Chargement...</td></tr>
              ) : contrats?.length === 0 ? (
                <tr><td colSpan={6} className="p-4 text-center text-muted-foreground">Aucun contrat</td></tr>
              ) : contrats?.map((c: any) => (
                <tr key={c.id} className="border-b hover:bg-muted/30">
                  <td className="p-3 font-medium">{c.employe?.prenom} {c.employe?.nom}</td>
                  <td className="p-3"><Badge variant="outline">{c.type_contrat}</Badge></td>
                  <td className="p-3">{new Date(c.date_debut).toLocaleDateString('fr-FR')}</td>
                  <td className="p-3">{c.date_fin ? new Date(c.date_fin).toLocaleDateString('fr-FR') : '-'}</td>
                  <td className="p-3">{c.salaire_base ? `${Number(c.salaire_base).toLocaleString('fr-FR')} GNF` : '-'}</td>
                  <td className="p-3"><Badge variant={statutColor(c.statut)}>{c.statut}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nouveau contrat</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Employé *</Label>
              <Select value={form.employe_id} onValueChange={v => setForm({...form, employe_id: v})}>
                <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                <SelectContent>{employes?.map(e => <SelectItem key={e.id} value={e.id}>{e.prenom} {e.nom}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Type de contrat</Label>
              <Select value={form.type_contrat} onValueChange={v => setForm({...form, type_contrat: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['CDI', 'CDD', 'Stage', 'Interim', 'Apprentissage'].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Date début *</Label><Input type="date" value={form.date_debut} onChange={e => setForm({...form, date_debut: e.target.value})} /></div>
              <div><Label>Date fin</Label><Input type="date" value={form.date_fin} onChange={e => setForm({...form, date_fin: e.target.value})} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Salaire de base (GNF)</Label><Input type="number" value={form.salaire_base} onChange={e => setForm({...form, salaire_base: e.target.value})} /></div>
              <div><Label>Période d'essai (jours)</Label><Input type="number" value={form.duree_periode_essai} onChange={e => setForm({...form, duree_periode_essai: e.target.value})} /></div>
            </div>
            <Button onClick={handleSubmit} className="w-full" disabled={createMutation.isPending}>Enregistrer</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
