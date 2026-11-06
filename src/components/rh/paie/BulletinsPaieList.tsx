import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Calculator, Pencil, Download, Search } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { getParametresPaie, calculerBulletin } from '@/services/paieConfig';
import { BulletinEditDialog } from './BulletinEditDialog';
import { creerBulletinPdf, telechargerBulletin, type BulletinPdf } from '@/utils/bulletinPaiePdf';

const moisNoms = ['', 'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

export const BulletinsPaieList = () => {
  const queryClient = useQueryClient();
  const [showGenerate, setShowGenerate] = useState(false);
  const [selectedPeriode, setSelectedPeriode] = useState('');
  const [showEtatMois, setShowEtatMois] = useState(false);
  const [moisEtat, setMoisEtat] = useState(String(new Date().getMonth() + 1));
  const [anneeEtat, setAnneeEtat] = useState(String(new Date().getFullYear()));
  const [editBulletin, setEditBulletin] = useState<any>(null);
  const [recherche, setRecherche] = useState('');
  const [periodeFiltre, setPeriodeFiltre] = useState('toutes');

  const { data: logo } = useQuery({
    queryKey: ['bulletin-paie-logo'],
    staleTime: Infinity,
    queryFn: async () => {
      const response = await fetch('/images/logo-sdbk.png');
      if (!response.ok) return null;
      const blob = await response.blob();
      return new Promise<string | null>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : null);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(blob);
      });
    },
  });

  const telecharger = (bulletin: BulletinPdf) => {
    try {
      void telechargerBulletin(creerBulletinPdf(bulletin, logo)).catch(() => {
        toast({ title: 'Téléchargement impossible', variant: 'destructive' });
      });
    } catch (error) {
      toast({ title: 'Téléchargement impossible', description: error instanceof Error ? error.message : 'Réessayez.', variant: 'destructive' });
    }
  };

  const { data: bulletins, isLoading } = useQuery({
    queryKey: ['bulletins-paie'],
    queryFn: async () => {
      const charger = async (offset = 0): Promise<BulletinPdf[]> => {
        const { data, error } = await supabase.from('bulletins_paie').select('*, employe:employes(nom, prenom, poste), periode:periodes_paie(mois, annee)').order('created_at', { ascending: false }).order('id').range(offset, offset + 999);
        if (error) throw error;
        return data.length === 1000 ? [...data, ...await charger(offset + 1000)] : data;
      };
      return charger();
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

  const genererBulletins = async (periodeId: string) => {
    {
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
    }
  };

  const generateMutation = useMutation({
    mutationFn: (periodeId: string) => genererBulletins(periodeId),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['bulletins-paie'] }); setShowGenerate(false); toast({ title: 'Bulletins générés avec succès' }); },
    onError: (e: any) => toast({ title: 'Erreur', description: e.message, variant: 'destructive' })
  });

  const etatMoisMutation = useMutation({
    mutationFn: async () => {
      const mois = Number(moisEtat);
      const annee = Number(anneeEtat);
      const { data: existante } = await supabase.from('periodes_paie').select('id').eq('mois', mois).eq('annee', annee).maybeSingle();
      let periodeId = existante?.id;
      if (!periodeId) {
        const dateDebut = new Date(Date.UTC(annee, mois - 1, 1)).toISOString().split('T')[0];
        const dateFin = new Date(Date.UTC(annee, mois, 0)).toISOString().split('T')[0];
        const { data: nouvelle, error } = await supabase.from('periodes_paie')
          .insert({ mois, annee, date_debut: dateDebut, date_fin: dateFin, statut: 'ouverte' })
          .select('id').single();
        if (error) throw error;
        periodeId = nouvelle.id;
      }
      await genererBulletins(periodeId!);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bulletins-paie'] });
      queryClient.invalidateQueries({ queryKey: ['periodes-paie-ouvertes'] });
      queryClient.invalidateQueries({ queryKey: ['periodes-paie'] });
      setShowEtatMois(false);
      toast({ title: "État du mois généré" });
    },
    onError: (e: any) => toast({ title: 'Erreur', description: e.message, variant: 'destructive' })
  });

  const validerMutation = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from('bulletins_paie').update({ statut: 'valide', date_validation: new Date().toISOString().split('T')[0] }).eq('id', id); if (error) throw error; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['bulletins-paie'] }); toast({ title: 'Bulletin validé' }); }
  });

  const periodesDisponibles = Array.from(new Map((bulletins || []).filter(b => b.periode).map(b => [b.periode_id, b.periode])).entries())
    .sort((a, b) => (b[1]?.annee ?? 0) - (a[1]?.annee ?? 0) || (b[1]?.mois ?? 0) - (a[1]?.mois ?? 0));
  const normaliser = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const bulletinsFiltres = bulletins?.filter(b => (periodeFiltre === 'toutes' || b.periode_id === periodeFiltre)
    && normaliser(`${b.employe?.prenom || ''} ${b.employe?.nom || ''}`).includes(normaliser(recherche.trim())));

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Bulletins de paie</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowGenerate(true)}><Calculator className="w-4 h-4 mr-2" />Générer les bulletins</Button>
          <Button onClick={() => setShowEtatMois(true)}><Plus className="w-4 h-4 mr-2" />Générer l'état du mois</Button>
        </div>
      </div>
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input aria-label="Rechercher un collaborateur" placeholder="Rechercher un collaborateur" value={recherche} onChange={e => setRecherche(e.target.value)} className="pl-9" />
        </div>
        <Select value={periodeFiltre} onValueChange={setPeriodeFiltre}>
          <SelectTrigger className="w-56" aria-label="Mois du bulletin"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="toutes">Tous les mois</SelectItem>
            {periodesDisponibles.map(([id, p]) => p && <SelectItem key={id} value={id}>{moisNoms[p.mois]} {p.annee}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <Card><CardContent className="p-0 overflow-x-auto">
        <table className="w-max min-w-full text-sm whitespace-nowrap">
          <thead className="border-b bg-muted/50"><tr>
            <th className="text-left p-3">Personnel</th><th className="text-left p-3">Fonction</th><th className="text-left p-3">Période</th><th className="text-right p-3">Salaire Base</th><th className="text-right p-3">P. transport</th><th className="text-right p-3">P. de Logement</th><th className="text-right p-3">Prime de cherté de vie</th><th className="text-right p-3">Autres primes et indemnité</th><th className="text-right p-3">Salaire Brut</th><th className="text-right p-3">CNSS1 (5%)</th><th className="text-right p-3">CNSS (18%)</th><th className="text-right p-3">Base d'imposition RTS</th><th className="text-right p-3">RTS net</th><th className="text-right p-3">Salaire net</th><th className="text-right p-3">Avance sur Salaire</th><th className="text-right p-3">Manquant</th><th className="text-right p-3">Complément Salaire Mois Précédent</th><th className="text-right p-3">ONFPP</th><th className="text-right p-3">VF</th><th className="text-left p-3">Statut</th><th className="text-left p-3">Actions</th>
          </tr></thead>
          <tbody>
            {isLoading ? <tr><td colSpan={21} className="p-4 text-center text-muted-foreground">Chargement...</td></tr>
            : bulletinsFiltres?.length === 0 ? <tr><td colSpan={21} className="p-4 text-center text-muted-foreground">Aucun bulletin</td></tr>
            : bulletinsFiltres?.map((b) => (
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
                <td className="p-3 sticky right-0 bg-background">
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => telecharger(b)} aria-label={`Télécharger le bulletin de ${b.employe?.prenom || ''} ${b.employe?.nom || ''}`}><Download className="w-3.5 h-3.5 mr-1" />PDF</Button>
                    {b.statut !== 'paye' && <Button size="sm" variant="outline" onClick={() => setEditBulletin(b)}><Pencil className="w-3.5 h-3.5 mr-1" />Modifier</Button>}
                    {b.statut === 'brouillon' && <Button size="sm" variant="outline" onClick={() => validerMutation.mutate(b.id)}>Valider</Button>}
                  </div>
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

      <Dialog open={showEtatMois} onOpenChange={setShowEtatMois}>
        <DialogContent>
          <DialogHeader><DialogTitle>Générer l'état du mois</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Mois</Label>
                <Select value={moisEtat} onValueChange={setMoisEtat}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {moisNoms.slice(1).map((m, i) => <SelectItem key={m} value={String(i + 1)}>{m}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Année</Label>
                <Input type="number" value={anneeEtat} onChange={(e) => setAnneeEtat(e.target.value)} />
              </div>
            </div>
            <p className="text-sm text-muted-foreground">La période sera créée si elle n'existe pas, puis les bulletins seront générés pour tous les collaborateurs actifs.</p>
            <Button className="w-full" disabled={etatMoisMutation.isPending} onClick={() => etatMoisMutation.mutate()}>
              {etatMoisMutation.isPending ? 'Génération en cours...' : "Générer l'état du mois"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <BulletinEditDialog bulletin={editBulletin} onClose={() => setEditBulletin(null)} />
    </div>
  );
};
