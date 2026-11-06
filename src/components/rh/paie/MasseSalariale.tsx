import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Download, Pencil, Wallet } from 'lucide-react';
import * as XLSX from 'xlsx';
import { rhService } from '@/services/rh';
import { supabase } from '@/integrations/supabase/client';
import { getParametresPaie, calculerBulletin, PARAMETRES_PAIE_DEFAUT } from '@/services/paieConfig';
import { BulletinEditDialog } from './BulletinEditDialog';

const fmt = (n: number) => `${Math.round(n).toLocaleString('fr-FR')} GNF`;
const moisNoms = ['', 'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

export const MasseSalariale = () => {
  const [departement, setDepartement] = useState('tous');
  const [periodeId, setPeriodeId] = useState('');
  const [editBulletin, setEditBulletin] = useState<any>(null);

  const { data: employes, isLoading } = useQuery({ queryKey: ['employes'], queryFn: () => rhService.getEmployes() });
  const { data: paramsPaie } = useQuery({ queryKey: ['parametres-paie'], queryFn: getParametresPaie });
  const params = paramsPaie || PARAMETRES_PAIE_DEFAUT;

  const { data: periodes } = useQuery({
    queryKey: ['periodes-paie-masse'],
    queryFn: async () => {
      const { data, error } = await supabase.from('periodes_paie').select('id, mois, annee, statut').order('annee', { ascending: false }).order('mois', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
  const periodeActiveId = periodeId || periodes?.[0]?.id || '';
  const periodeActive = periodes?.find((p) => p.id === periodeActiveId);

  const { data: bulletins, isLoading: chargementBulletins } = useQuery({
    queryKey: ['masse-salariale-bulletins', periodeActiveId],
    enabled: !!periodeActiveId,
    queryFn: async () => {
      const { data, error } = await supabase.from('bulletins_paie')
        .select('*, employe:employes(nom, prenom, poste), periode:periodes_paie(mois, annee)')
        .eq('periode_id', periodeActiveId);
      if (error) throw error;
      return data;
    },
  });

  const list = useMemo(() => {
    let lignes = ((employes || []) as any[]).filter((e) => e.statut === 'actif');
    if (departement !== 'tous') lignes = lignes.filter((e) => (e.departement || e.service) === departement);
    return lignes;
  }, [employes, departement]);

  const departements = useMemo(
    () => Array.from(new Set(((employes || []) as any[]).map((e) => e.departement || e.service).filter(Boolean))).sort(),
    [employes]
  );

  const lignes = list.map((e) => {
    const bulletin = (bulletins || []).find((b: any) => b.employe_id === e.id);
    const n = (value: any) => Number(value) || 0;
    const base = n(bulletin?.salaire_base ?? e.salaire_base);
    const primeTransport = n(bulletin?.prime_transport);
    const primeLogement = n(bulletin?.prime_logement);
    const primeChereteVie = n(bulletin?.prime_cherete_vie);
    const autresPrimes = n(bulletin?.autres_primes);
    const r = calculerBulletin({
      salaireBase: base,
      primeTransport,
      primeLogement,
      primeChereteVie,
      autresPrimes,
      avanceSalaire: n(bulletin?.avance_salaire),
      manquant: n(bulletin?.manquant),
      complementMoisPrecedent: n(bulletin?.complement_mois_precedent),
      retenuePret: n(bulletin?.retenue_pret),
    }, params);
    const brut = bulletin ? n(bulletin.salaire_brut) : r.salaireBrut;
    const patronal = bulletin ? n(bulletin.total_charges_patronales) : r.totalChargesPatronales;
    return {
      id: e.id,
      bulletin,
      nom: `${e.nom} ${e.prenom}`,
      departement: e.departement || e.service,
      service: e.service,
      base,
      primeTransport,
      primeLogement,
      primeChereteVie,
      autresPrimes,
      brut,
      baseCnss: bulletin ? n(bulletin.base_cnss) : r.baseCnss,
      cnssSalarie: bulletin ? n(bulletin.cotisation_cnss_employe) : r.cnssSalarie,
      baseRts: bulletin ? n(bulletin.base_rts) : r.baseRts,
      irg: bulletin ? n(bulletin.rts ?? bulletin.irg) : r.rts,
      onfpp: bulletin ? n(bulletin.onfpp) : r.onfpp,
      vf: bulletin ? n(bulletin.versement_forfaitaire) : r.versementForfaitaire,
      net: bulletin ? n(bulletin.net_a_payer) : r.netAPayer,
      patronal,
      cout: brut + patronal,
    };
  });

  const totaux = lignes.reduce(
    (acc, l) => ({
      brut: acc.brut + l.brut,
      cnss: acc.cnss + l.cnssSalarie,
      irg: acc.irg + l.irg,
      net: acc.net + l.net,
      patronal: acc.patronal + l.patronal,
      cout: acc.cout + l.cout,
    }),
    { brut: 0, cnss: 0, irg: 0, net: 0, patronal: 0, cout: 0 }
  );

  const parDepartement = useMemo(() => {
    const m: Record<string, number> = {};
    lignes.forEach((l) => { m[l.departement || 'Non défini'] = (m[l.departement || 'Non défini'] || 0) + l.cout; });
    return Object.entries(m).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [lignes]);

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(lignes.map((l) => ({
      Collaborateur: l.nom,
      Département: l.departement,
      Service: l.service,
      'Salaire de base': Math.round(l.base),
      'Prime de transport': Math.round(l.primeTransport),
      'Prime de logement': Math.round(l.primeLogement),
      'Prime de cherté de vie': Math.round(l.primeChereteVie),
      'Autres primes et indemnités': Math.round(l.autresPrimes),
      'Salaire brut': Math.round(l.brut),
      'Base CNSS': Math.round(l.baseCnss),
      'CNSS salarié': Math.round(l.cnssSalarie),
      "Base d'imposition RTS": Math.round(l.baseRts),
      RTS: Math.round(l.irg),
      'Salaire net': Math.round(l.net),
      ONFPP: Math.round(l.onfpp),
      'Versement forfaitaire': Math.round(l.vf),
      'Total charges patronales': Math.round(l.patronal),
      'Coût employeur': Math.round(l.cout),
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Masse salariale');
    const suffixe = periodeActive ? `${periodeActive.annee}_${String(periodeActive.mois).padStart(2, '0')}` : new Date().toISOString().slice(0, 10);
    XLSX.writeFile(wb, `masse_salariale_${suffixe}.xlsx`);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold">Masse salariale</h2>
          <p className="text-sm text-muted-foreground">Primes, cotisations, net et coût employeur par collaborateur</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Select value={periodeActiveId} onValueChange={setPeriodeId} disabled={!periodes?.length}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Choisir une période" /></SelectTrigger>
            <SelectContent>
              {periodes?.map((p) => <SelectItem key={p.id} value={p.id}>{moisNoms[p.mois]} {p.annee}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={departement} onValueChange={setDepartement}>
            <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="tous">Tous les départements</SelectItem>
              {departements.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={exportExcel}><Download className="w-4 h-4 mr-2" />Export Excel</Button>
        </div>
      </div>

      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-4 text-sm">
          Pour encoder les primes d'un collaborateur, cliquez sur <strong>Saisir les primes</strong> dans sa ligne. Chaque montant est propre au bulletin et au mois sélectionné.
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Masse salariale brute', value: totaux.brut },
          { label: 'Cotisations salariales', value: totaux.cnss + totaux.irg },
          { label: 'Charges patronales', value: totaux.patronal },
          { label: 'Coût employeur total', value: totaux.cout },
        ].map((k) => (
          <Card key={k.label}>
            <CardContent className="p-4 flex items-start justify-between">
              <div>
                <p className="text-xs uppercase text-muted-foreground">{k.label}</p>
                <p className="text-xl font-bold">{fmt(k.value)}</p>
              </div>
              <Wallet className="h-5 w-5 text-primary/70" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Coût employeur par département</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={parDepartement} layout="vertical" margin={{ left: 0, right: 12 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 10 }} />
              <Tooltip formatter={(v: any) => fmt(Number(v))} />
              <Bar dataKey="value" name="Coût employeur" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} maxBarSize={22} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          {isLoading || chargementBulletins ? <p className="p-6 text-sm text-muted-foreground">Chargement...</p> : (
            <Table className="w-max min-w-full whitespace-nowrap">
              <TableHeader>
                <TableRow>
                  <TableHead>Collaborateur</TableHead>
                  <TableHead>Département</TableHead>
                  <TableHead className="text-right">Salaire Base</TableHead>
                  <TableHead className="text-right">P. transport</TableHead>
                  <TableHead className="text-right">P. de Logement</TableHead>
                  <TableHead className="text-right">Prime de cherté de vie</TableHead>
                  <TableHead className="text-right">Autres primes et indemnité</TableHead>
                  <TableHead className="text-right">Salaire Brut</TableHead>
                  <TableHead className="text-right">Base CNSS</TableHead>
                  <TableHead className="text-right">CNSS1 (5%)</TableHead>
                  <TableHead className="text-right">Base d'imposition RTS</TableHead>
                  <TableHead className="text-right">RTS net</TableHead>
                  <TableHead className="text-right">Salaire net</TableHead>
                  <TableHead className="text-right">ONFPP</TableHead>
                  <TableHead className="text-right">VF</TableHead>
                  <TableHead className="text-right">Total charges patronales</TableHead>
                  <TableHead className="text-right">Coût employeur</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lignes.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell className="font-medium">{l.nom}</TableCell>
                    <TableCell>{l.departement}</TableCell>
                    <TableCell className="text-right">{fmt(l.base)}</TableCell>
                    <TableCell className="text-right">{fmt(l.primeTransport)}</TableCell>
                    <TableCell className="text-right">{fmt(l.primeLogement)}</TableCell>
                    <TableCell className="text-right">{fmt(l.primeChereteVie)}</TableCell>
                    <TableCell className="text-right">{fmt(l.autresPrimes)}</TableCell>
                    <TableCell className="text-right font-medium">{fmt(l.brut)}</TableCell>
                    <TableCell className="text-right">{fmt(l.baseCnss)}</TableCell>
                    <TableCell className="text-right">{fmt(l.cnssSalarie)}</TableCell>
                    <TableCell className="text-right">{fmt(l.baseRts)}</TableCell>
                    <TableCell className="text-right">{fmt(l.irg)}</TableCell>
                    <TableCell className="text-right font-semibold">{fmt(l.net)}</TableCell>
                    <TableCell className="text-right">{fmt(l.onfpp)}</TableCell>
                    <TableCell className="text-right">{fmt(l.vf)}</TableCell>
                    <TableCell className="text-right">{fmt(l.patronal)}</TableCell>
                    <TableCell className="text-right font-semibold">{fmt(l.cout)}</TableCell>
                    <TableCell>
                      {l.bulletin && l.bulletin.statut !== 'paye' ? (
                        <Button size="sm" variant="outline" onClick={() => setEditBulletin(l.bulletin)}>
                          <Pencil className="w-3.5 h-3.5 mr-1" />Saisir les primes
                        </Button>
                      ) : l.bulletin?.statut === 'paye' ? <span className="text-sm text-muted-foreground">Bulletin payé</span> : <span className="text-sm text-muted-foreground">Bulletin non généré</span>}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <BulletinEditDialog bulletin={editBulletin} onClose={() => setEditBulletin(null)} />
    </div>
  );
};
