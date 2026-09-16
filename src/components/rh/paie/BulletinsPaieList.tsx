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
import { getParametresPaie, calculerBulletin, PARAMETRES_PAIE_DEFAUT } from '@/services/paieConfig';

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

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!editBulletin) return;
      const params = await getParametresPaie();
      const n = (v: any) => Number(v) || 0;
      const r = calculerBulletin({
        salaireBase: n(form.salaire_base),
        primeTransport: n(form.prime_transport),
        primeLogement: n(form.prime_logement),
        primeChereteVie: n(form.prime_cherete_vie),
        autresPrimes: n(form.autres_primes),
        avanceSalaire: n(form.avance_salaire),
        manquant: n(form.manquant),
        complementMoisPrecedent: n(form.complement_mois_precedent),
        retenuePret: n(editBulletin.retenue_pret),
      }, params);
      const { error } = await supabase.from('bulletins_paie').update({
        salaire_base: r.salaireBase,
        prime_transport: n(form.prime_transport),
        prime_logement: n(form.prime_logement),
        prime_cherete_vie: n(form.prime_cherete_vie),
        autres_primes: n(form.autres_primes),
        total_primes: r.totalPrimes,
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
        avance_salaire: n(form.avance_salaire),
        manquant: n(form.manquant),
        complement_mois_precedent: n(form.complement_mois_precedent),
        total_retenues: r.totalRetenues,
        salaire_net: r.netAPayer,
        net_a_payer: r.netAPayer,
      }).eq('id', editBulletin.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bulletins-paie'] });
      setEditBulletin(null);
      toast({ title: 'Bulletin mis à jour' });
    },
    onError: (e: any) => toast({ title: 'Erreur', description: e.message, variant: 'destructive' })
  });

  const openEdit = (b: any) => {
    setEditBulletin(b);
    setForm({
      salaire_base: b.salaire_base ?? 0,
      prime_transport: b.prime_transport ?? 0,
      prime_logement: b.prime_logement ?? 0,
      prime_cherete_vie: b.prime_cherete_vie ?? 0,
      autres_primes: b.autres_primes ?? 0,
      avance_salaire: b.avance_salaire ?? 0,
      manquant: b.manquant ?? 0,
      complement_mois_precedent: b.complement_mois_precedent ?? 0,
    });
  };

  const apercu = React.useMemo(() => {
    const n = (v: any) => Number(v) || 0;
    return calculerBulletin({
      salaireBase: n(form.salaire_base),
      primeTransport: n(form.prime_transport),
      primeLogement: n(form.prime_logement),
      primeChereteVie: n(form.prime_cherete_vie),
      autresPrimes: n(form.autres_primes),
      avanceSalaire: n(form.avance_salaire),
      manquant: n(form.manquant),
      complementMoisPrecedent: n(form.complement_mois_precedent),
      retenuePret: Number(editBulletin?.retenue_pret) || 0,
    }, parametres || PARAMETRES_PAIE_DEFAUT);
  }, [form, editBulletin, parametres]);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Bulletins de paie</h2>
        <Button onClick={() => setShowGenerate(true)}><Calculator className="w-4 h-4 mr-2" />Générer les bulletins</Button>
      </div>
      <Card><CardContent className="p-0 overflow-x-auto">
        <table className="w-max min-w-full text-sm whitespace-nowrap">
          <thead className="border-b bg-muted/50"><tr>
            <th className="text-left p-3">Personnel</th><th className="text-left p-3">Fonction</th><th className="text-left p-3">Période</th><th className="text-right p-3">Salaire Base</th><th className="text-right p-3">P. transport</th><th className="text-right p-3">P. de Logement</th><th className="text-right p-3">Prime de cherté de vie</th><th className="text-right p-3">Autres primes et indemnité</th><th className="text-right p-3">Salaire Brut</th><th className="text-right p-3">CNSS1 (5%)</th><th className="text-right p-3">CNSS (18%)</th><th className="text-right p-3">Base d'imposition RTS</th><th className="text-right p-3">RTS net</th><th className="text-right p-3">Salaire net</th><th className="text-right p-3">Avance sur Salaire</th><th className="text-right p-3">Manquant</th><th className="text-right p-3">Complément Salaire Mois Précédent</th><th className="text-right p-3">ONFPP</th><th className="text-right p-3">VF</th><th className="text-left p-3">Statut</th><th className="text-left p-3">Actions</th>
          </tr></thead>
          <tbody>
            {isLoading ? <tr><td colSpan={21} className="p-4 text-center text-muted-foreground">Chargement...</td></tr>
            : bulletins?.length === 0 ? <tr><td colSpan={21} className="p-4 text-center text-muted-foreground">Aucun bulletin</td></tr>
            : bulletins?.map((b: any) => (
              <tr key={b.id} className="border-b hover:bg-muted/30">
                <td className="p-3 font-medium">{b.employe?.prenom} {b.employe?.nom}</td>
                <td className="p-3">{b.employe?.poste || '-'}</td>
                <td className="p-3">{b.periode ? `${moisNoms[b.periode.mois]} ${b.periode.annee}` : '-'}</td>
                <td className="p-3 text-right">{Number(b.salaire_base || 0).toLocaleString('fr-FR')}</td>
                <td className="p-3 text-right">{Number(b.prime_transport || 0).toLocaleString('fr-FR')}</td>
                <td className="p-3 text-right">{Number(b.prime_logement || 0).toLocaleString('fr-FR')}</td>
                <td className="p-3 text-right">{Number(b.prime_cherete_vie || 0).toLocaleString('fr-FR')}</td>
                <td className="p-3 text-right">{Number(b.autres_primes || 0).toLocaleString('fr-FR')}</td>
                <td className="p-3 text-right font-medium">{Number(b.salaire_brut || 0).toLocaleString('fr-FR')}</td>
                <td className="p-3 text-right">{Number(b.cotisation_cnss_employe || 0).toLocaleString('fr-FR')}</td>
                <td className="p-3 text-right">{Number(b.cotisation_cnss_employeur || 0).toLocaleString('fr-FR')}</td>
                <td className="p-3 text-right">{Number(b.base_rts || 0).toLocaleString('fr-FR')}</td>
                <td className="p-3 text-right">{Number(b.rts ?? b.irg ?? 0).toLocaleString('fr-FR')}</td>
                <td className="p-3 text-right font-semibold">{Number(b.net_a_payer || 0).toLocaleString('fr-FR')}</td>
                <td className="p-3 text-right">{Number(b.avance_salaire || 0).toLocaleString('fr-FR')}</td>
                <td className="p-3 text-right">{Number(b.manquant || 0).toLocaleString('fr-FR')}</td>
                <td className="p-3 text-right">{Number(b.complement_mois_precedent || 0).toLocaleString('fr-FR')}</td>
                <td className="p-3 text-right">{Number(b.onfpp || 0).toLocaleString('fr-FR')}</td>
                <td className="p-3 text-right">{Number(b.versement_forfaitaire || 0).toLocaleString('fr-FR')}</td>
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
