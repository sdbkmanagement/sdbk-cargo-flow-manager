import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Download, Wallet } from 'lucide-react';
import * as XLSX from 'xlsx';
import { rhService } from '@/services/rh';
import { getParametresPaie, calculerBulletin, PARAMETRES_PAIE_DEFAUT } from '@/services/paieConfig';

const fmt = (n: number) => `${Math.round(n).toLocaleString('fr-FR')} GNF`;

export const MasseSalariale = () => {
  const [departement, setDepartement] = useState('tous');
  const { data: employes, isLoading } = useQuery({ queryKey: ['employes'], queryFn: () => rhService.getEmployes() });
  const { data: paramsPaie } = useQuery({ queryKey: ['parametres-paie'], queryFn: getParametresPaie });
  const params = paramsPaie || PARAMETRES_PAIE_DEFAUT;

  const list = useMemo(() => {
    let l = ((employes || []) as any[]).filter((e) => e.statut === 'actif');
    if (departement !== 'tous') l = l.filter((e) => (e.departement || e.service) === departement);
    return l;
  }, [employes, departement]);

  const departements = useMemo(
    () => Array.from(new Set(((employes || []) as any[]).map((e) => e.departement || e.service).filter(Boolean))).sort(),
    [employes]
  );

  const lignes = list.map((e) => {
    const base = Number(e.salaire_base || 0);
    const r = calculerBulletin({ salaireBase: base }, params);
    return {
      id: e.id,
      nom: `${e.nom} ${e.prenom}`,
      departement: e.departement || e.service,
      service: e.service,
      brut: r.salaireBrut,
      baseCnss: r.baseCnss,
      cnssSalarie: r.cnssSalarie,
      irg: r.rts,
      onfpp: r.onfpp,
      vf: r.versementForfaitaire,
      net: r.netAPayer,
      patronal: r.totalChargesPatronales,
      cout: r.salaireBrut + r.totalChargesPatronales,
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
      'Salaire brut': l.brut,
      'Base CNSS': Math.round(l.baseCnss),
      'CNSS salarié': Math.round(l.cnssSalarie),
      RTS: Math.round(l.irg),
      'Salaire net': Math.round(l.net),
      ONFPP: Math.round(l.onfpp),
      'Versement forfaitaire': Math.round(l.vf),
      'Total charges patronales': Math.round(l.patronal),
      'Coût employeur': Math.round(l.cout),
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Masse salariale');
    XLSX.writeFile(wb, `masse_salariale_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold">Masse salariale</h2>
          <p className="text-sm text-muted-foreground">Brut, cotisations, net et coût employeur par département et service</p>
        </div>
        <div className="flex gap-2">
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
          {isLoading ? <p className="p-6 text-sm text-muted-foreground">Chargement...</p> : (
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
                </TableRow>
              </TableHeader>
              <TableBody>
                {lignes.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell className="font-medium">{l.nom}</TableCell>
                    <TableCell>{l.departement}</TableCell>
                    <TableCell className="text-right">{fmt(l.brut)}</TableCell>
                    <TableCell className="text-right">{fmt(0)}</TableCell>
                    <TableCell className="text-right">{fmt(0)}</TableCell>
                    <TableCell className="text-right">{fmt(0)}</TableCell>
                    <TableCell className="text-right">{fmt(0)}</TableCell>
                    <TableCell className="text-right">{fmt(l.brut)}</TableCell>
                    <TableCell className="text-right">{fmt(l.baseCnss)}</TableCell>
                    <TableCell className="text-right">{fmt(l.cnssSalarie)}</TableCell>
                    <TableCell className="text-right">{fmt(l.brut - l.cnssSalarie)}</TableCell>
                    <TableCell className="text-right">{fmt(l.irg)}</TableCell>
                    <TableCell className="text-right font-semibold">{fmt(l.net)}</TableCell>
                    <TableCell className="text-right">{fmt(l.onfpp)}</TableCell>
                    <TableCell className="text-right">{fmt(l.vf)}</TableCell>
                    <TableCell className="text-right">{fmt(l.patronal)}</TableCell>
                    <TableCell className="text-right font-semibold">{fmt(l.cout)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
