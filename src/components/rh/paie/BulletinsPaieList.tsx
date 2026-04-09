import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Calculator } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

const moisNoms = ['', 'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

export const BulletinsPaieList = () => {
  const queryClient = useQueryClient();
  const [showGenerate, setShowGenerate] = useState(false);
  const [selectedPeriode, setSelectedPeriode] = useState('');

  const { data: bulletins, isLoading } = useQuery({
    queryKey: ['bulletins-paie'],
    queryFn: async () => {
      const { data, error } = await supabase.from('bulletins_paie').select('*, employe:employes(nom, prenom, poste), periode:periodes_paie(mois, annee)').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  const { data: periodes } = useQuery({
    queryKey: ['periodes-paie-ouvertes'],
    queryFn: async () => {
      const { data, error } = await supabase.from('periodes_paie').select('*').eq('statut', 'ouverte').order('annee', { ascending: false }).order('mois', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  const generateMutation = useMutation({
    mutationFn: async (periodeId: string) => {
      // Récupérer tous les employés actifs
      const { data: employes, error: empError } = await supabase.from('employes').select('id').eq('statut', 'actif');
      if (empError) throw empError;

      // Récupérer les éléments de salaire
      for (const emp of (employes || [])) {
        const { data: elements } = await supabase.from('elements_salaire').select('*').eq('employe_id', emp.id).order('date_effet', { ascending: false }).limit(1);
        
        const el = elements?.[0];
        const salaireBase = el?.salaire_base || 0;
        const primes = (el?.prime_transport || 0) + (el?.prime_logement || 0) + (el?.prime_risque || 0) + (el?.prime_anciennete || 0) + (el?.prime_rendement || 0) + (el?.autres_primes || 0);
        const indemnites = el?.indemnite_repas || 0;
        const brut = salaireBase + primes + indemnites;
        const cnssEmp = Math.round(brut * 0.05);
        const cnssPatr = Math.round(brut * 0.18);
        // IRG simplifié (barème progressif Guinée approximé)
        const brutImposable = brut - cnssEmp;
        let irg = 0;
        if (brutImposable > 0) {
          irg = Math.round(brutImposable * 0.10); // Taux simplifié 10%
        }
        // Retenue prêt
        const { data: prets } = await supabase.from('prets').select('montant_mensualite').eq('employe_id', emp.id).eq('statut', 'en_cours');
        const retenuePret = prets?.reduce((sum, p) => sum + (p.montant_mensualite || 0), 0) || 0;
        
        const totalRetenues = cnssEmp + irg + retenuePret;
        const net = brut - totalRetenues;

        const { error } = await supabase.from('bulletins_paie').insert({
          employe_id: emp.id,
          periode_id: periodeId,
          salaire_base: salaireBase,
          total_primes: primes,
          total_indemnites: indemnites,
          salaire_brut: brut,
          cotisation_cnss_employe: cnssEmp,
          cotisation_cnss_employeur: cnssPatr,
          irg,
          retenue_pret: retenuePret,
          total_retenues: totalRetenues,
          salaire_net: net,
          net_a_payer: net,
        });
        if (error && !error.message.includes('duplicate')) console.error(error);
      }
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['bulletins-paie'] }); setShowGenerate(false); toast({ title: 'Bulletins générés avec succès' }); },
    onError: (e: any) => toast({ title: 'Erreur', description: e.message, variant: 'destructive' })
  });

  const validerMutation = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from('bulletins_paie').update({ statut: 'valide', date_validation: new Date().toISOString().split('T')[0] }).eq('id', id); if (error) throw error; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['bulletins-paie'] }); toast({ title: 'Bulletin validé' }); }
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Bulletins de paie</h2>
        <Button onClick={() => setShowGenerate(true)}><Calculator className="w-4 h-4 mr-2" />Générer les bulletins</Button>
      </div>
      <Card><CardContent className="p-0">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/50"><tr>
            <th className="text-left p-3">Employé</th><th className="text-left p-3">Période</th><th className="text-left p-3">Brut</th><th className="text-left p-3">Retenues</th><th className="text-left p-3">Net à payer</th><th className="text-left p-3">Statut</th><th className="text-left p-3">Actions</th>
          </tr></thead>
          <tbody>
            {isLoading ? <tr><td colSpan={7} className="p-4 text-center text-muted-foreground">Chargement...</td></tr>
            : bulletins?.length === 0 ? <tr><td colSpan={7} className="p-4 text-center text-muted-foreground">Aucun bulletin</td></tr>
            : bulletins?.map((b: any) => (
              <tr key={b.id} className="border-b hover:bg-muted/30">
                <td className="p-3 font-medium">{b.employe?.prenom} {b.employe?.nom}</td>
                <td className="p-3">{b.periode ? `${moisNoms[b.periode.mois]} ${b.periode.annee}` : '-'}</td>
                <td className="p-3">{Number(b.salaire_brut).toLocaleString('fr-FR')} GNF</td>
                <td className="p-3 text-destructive">{Number(b.total_retenues).toLocaleString('fr-FR')} GNF</td>
                <td className="p-3 font-semibold">{Number(b.net_a_payer).toLocaleString('fr-FR')} GNF</td>
                <td className="p-3"><Badge variant={b.statut === 'valide' ? 'default' : b.statut === 'paye' ? 'secondary' : 'outline'}>{b.statut}</Badge></td>
                <td className="p-3">
                  {b.statut === 'brouillon' && <Button size="sm" variant="outline" onClick={() => validerMutation.mutate(b.id)}>Valider</Button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent></Card>

      <Dialog open={showGenerate} onOpenChange={setShowGenerate}>
        <DialogContent>
          <DialogHeader><DialogTitle>Générer les bulletins de paie</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Période</Label>
              <Select value={selectedPeriode} onValueChange={setSelectedPeriode}>
                <SelectTrigger><SelectValue placeholder="Sélectionner une période" /></SelectTrigger>
                <SelectContent>
                  {periodes?.map(p => <SelectItem key={p.id} value={p.id}>{moisNoms[p.mois]} {p.annee}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <p className="text-sm text-muted-foreground">Les bulletins seront générés pour tous les employés actifs avec leurs éléments de salaire configurés.</p>
            <Button onClick={() => {
              if (!selectedPeriode) return toast({ title: 'Sélectionnez une période', variant: 'destructive' });
              generateMutation.mutate(selectedPeriode);
            }} className="w-full" disabled={generateMutation.isPending}>
              {generateMutation.isPending ? 'Génération en cours...' : 'Générer'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
