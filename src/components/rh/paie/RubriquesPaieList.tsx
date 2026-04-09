import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Pencil } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export const RubriquesPaieList = () => {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ code: '', nom: '', type: 'gain', categorie: 'prime', taux: '', montant_fixe: '', obligatoire: false, description: '' });

  const { data: rubriques, isLoading } = useQuery({
    queryKey: ['rubriques-paie'],
    queryFn: async () => {
      const { data, error } = await supabase.from('rubriques_paie').select('*').order('ordre');
      if (error) throw error;
      return data;
    }
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => { const { error } = await supabase.from('rubriques_paie').insert(data); if (error) throw error; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['rubriques-paie'] }); setShowForm(false); toast({ title: 'Rubrique créée' }); },
    onError: (e: any) => toast({ title: 'Erreur', description: e.message, variant: 'destructive' })
  });

  const typeColor = (t: string) => { switch(t) { case 'gain': return 'default'; case 'retenue': return 'destructive'; case 'charge_patronale': return 'secondary'; default: return 'outline'; } };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Rubriques de paie</h2>
        <Button onClick={() => setShowForm(true)}><Plus className="w-4 h-4 mr-2" />Nouvelle rubrique</Button>
      </div>
      <Card><CardContent className="p-0">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/50"><tr>
            <th className="text-left p-3">Code</th><th className="text-left p-3">Nom</th><th className="text-left p-3">Type</th><th className="text-left p-3">Catégorie</th><th className="text-left p-3">Taux</th><th className="text-left p-3">Obligatoire</th>
          </tr></thead>
          <tbody>
            {isLoading ? <tr><td colSpan={6} className="p-4 text-center text-muted-foreground">Chargement...</td></tr>
            : rubriques?.map((r: any) => (
              <tr key={r.id} className="border-b hover:bg-muted/30">
                <td className="p-3 font-mono text-xs">{r.code}</td>
                <td className="p-3 font-medium">{r.nom}</td>
                <td className="p-3"><Badge variant={typeColor(r.type)}>{r.type}</Badge></td>
                <td className="p-3">{r.categorie || '-'}</td>
                <td className="p-3">{r.taux ? `${r.taux}%` : r.montant_fixe ? `${Number(r.montant_fixe).toLocaleString('fr-FR')} GNF` : '-'}</td>
                <td className="p-3">{r.obligatoire ? '✓' : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent></Card>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nouvelle rubrique de paie</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Code *</Label><Input value={form.code} onChange={e => setForm({...form, code: e.target.value})} placeholder="PRI_XXX" /></div>
              <div><Label>Nom *</Label><Input value={form.nom} onChange={e => setForm({...form, nom: e.target.value})} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Type</Label>
                <Select value={form.type} onValueChange={v => setForm({...form, type: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gain">Gain</SelectItem><SelectItem value="retenue">Retenue</SelectItem><SelectItem value="charge_patronale">Charge patronale</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Catégorie</Label>
                <Select value={form.categorie} onValueChange={v => setForm({...form, categorie: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="salaire">Salaire</SelectItem><SelectItem value="prime">Prime</SelectItem><SelectItem value="indemnite">Indemnité</SelectItem><SelectItem value="cotisation">Cotisation</SelectItem><SelectItem value="impot">Impôt</SelectItem><SelectItem value="retenue">Retenue</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Taux (%)</Label><Input type="number" step="0.01" value={form.taux} onChange={e => setForm({...form, taux: e.target.value})} /></div>
              <div><Label>Montant fixe</Label><Input type="number" value={form.montant_fixe} onChange={e => setForm({...form, montant_fixe: e.target.value})} /></div>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox checked={form.obligatoire} onCheckedChange={v => setForm({...form, obligatoire: !!v})} />
              <Label>Obligatoire</Label>
            </div>
            <div><Label>Description</Label><Textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} /></div>
            <Button onClick={() => {
              if (!form.code || !form.nom) return toast({ title: 'Champs requis', variant: 'destructive' });
              createMutation.mutate({ code: form.code, nom: form.nom, type: form.type, categorie: form.categorie, taux: form.taux ? parseFloat(form.taux) : null, montant_fixe: form.montant_fixe ? parseFloat(form.montant_fixe) : null, obligatoire: form.obligatoire, description: form.description || null });
            }} className="w-full" disabled={createMutation.isPending}>Enregistrer</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
