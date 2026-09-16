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
import { getParametresPaie, calculerBulletin } from '@/services/paieConfig';

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
      // Paramétrage de paie (CNSS, barème RTS, ONFPP, versement forfaitaire)
      const params = await getParametresPaie();

      // Récupérer tous les employés actifs
      const { data: employes, error: empError } = await supabase.from('employes').select('id').eq('statut', 'actif');
      if (empError) throw empError;

      // Récupérer les éléments de salaire
      for (const emp of (employes || [])) {
        const { data: elements } = await supabase.from('elements_salaire').select('*').eq('employe_id', emp.id).order('date_effet', { ascending: false }).limit(1);

        const el = elements?.[0];
        // Retenue prêt
        const { data: prets } = await supabase.from('prets').select('montant_mensualite').eq('employe_id', emp.id).eq('statut', 'en_cours');
        const retenuePret = prets?.reduce((sum, p) => sum + (p.montant_mensualite || 0), 0) || 0;

        const autresPrimes = (el?.prime_risque || 0) + (el?.prime_anciennete || 0) + (el?.prime_rendement || 0) + (el?.autres_primes || 0) + (el?.indemnite_repas || 0);
        const r = calculerBulletin({
          salaireBase: el?.salaire_base || 0,
          primeTransport: el?.prime_transport || 0,
          primeLogement: el?.prime_logement || 0,
          primeChereteVie: 0,
          autresPrimes,
          retenuePret,
        }, params);

        const { error } = await supabase.from('bulletins_paie').insert({
          employe_id: emp.id,
          periode_id: periodeId,
          salaire_base: r.salaireBase,
          prime_transport: el?.prime_transport || 0,
          prime_logement: el?.prime_logement || 0,
          prime_cherete_vie: 0,
          autres_primes: autresPrimes,
          total_primes: r.totalPrimes,
          total_indemnites: 0,
          salaire_brut: r.salaireBrut,
          base_cnss: r.baseCnss,
          cotisation_cnss_employe: r.cnssSalarie,
          cotisation_cnss_employeur: r.cnssPatronal,
          base_rts: r.baseRts,
          rts: r.rts,
          irg: r.rts,
          onfpp: r.onfpp,
          versement_forfaitaire: r.versementForfaitaire,
          total_charges_patronales: r.totalChargesPatronales,
          retenue_pret: retenuePret,
          total_retenues: r.totalRetenues,
          salaire_net: r.netAPayer,
          net_a_payer: r.netAPayer,
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
            <th className="text-left p-3">Employé</th><th className="text-left p-3">Période</th><th className="text-left p-3">Brut</th><th className="text-left p-3">Base CNSS</th><th className="text-left p-3">CNSS salarié</th><th className="text-left p-3">Base RTS</th><th className="text-left p-3">RTS</th><th className="text-left p-3">CNSS patronale</th><th className="text-left p-3">ONFPP</th><th className="text-left p-3">VF</th><th className="text-left p-3">Total charges patronales</th><th className="text-left p-3">Retenues</th><th className="text-left p-3">Net à payer</th><th className="text-left p-3">Statut</th><th className="text-left p-3">Actions</th>
          </tr></thead>
          <tbody>
            {isLoading ? <tr><td colSpan={15} className="p-4 text-center text-muted-foreground">Chargement...</td></tr>
            : bulletins?.length === 0 ? <tr><td colSpan={15} className="p-4 text-center text-muted-foreground">Aucun bulletin</td></tr>
            : bulletins?.map((b: any) => (
              <tr key={b.id} className="border-b hover:bg-muted/30">
                <td className="p-3 font-medium">{b.employe?.prenom} {b.employe?.nom}</td>
                <td className="p-3">{b.periode ? `${moisNoms[b.periode.mois]} ${b.periode.annee}` : '-'}</td>
                <td className="p-3">{Number(b.salaire_brut).toLocaleString('fr-FR')} GNF</td>
                <td className="p-3">{Number(b.base_cnss || 0).toLocaleString('fr-FR')} GNF</td>
                <td className="p-3">{Number(b.cotisation_cnss_employe || 0).toLocaleString('fr-FR')} GNF</td>
                <td className="p-3">{Number(b.cotisation_cnss_employeur || 0).toLocaleString('fr-FR')} GNF</td>
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
