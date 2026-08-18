import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts';
import { Coins, Package, Users, Building2, RotateCcw, FileSpreadsheet, FileText } from 'lucide-react';
import { useGmao } from './GmaoContext';
import { fmtDate, fmtMontant, KpiCard, libelle, moisCle, TYPES_MAINTENANCE } from './gmaoUi';
import { exporterExcel, exporterPdf } from '@/utils/gmaoExport';

export const GmaoCouts: React.FC = () => {
  const { ots, equipements, equipementParId } = useGmao();
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');
  const [equipement, setEquipement] = useState('tous');
  const [type, setType] = useState('tous');
  const [categorie, setCategorie] = useState('toutes');

  const filtres = useMemo(
    () =>
      ots.filter((o) => {
        const d = o.date_fin || o.date_debut || o.date_planifiee || o.created_at;
        if (dateDebut && (!d || new Date(d) < new Date(`${dateDebut}T00:00:00`))) return false;
        if (dateFin && (!d || new Date(d) > new Date(`${dateFin}T23:59:59`))) return false;
        if (equipement !== 'tous' && o.equipement_id !== equipement) return false;
        if (type !== 'tous' && o.type_maintenance !== type) return false;
        if (categorie === 'pieces' && !Number(o.cout_pieces)) return false;
        if (categorie === 'main_oeuvre' && !Number(o.cout_main_oeuvre)) return false;
        if (categorie === 'prestation' && !Number(o.cout_prestation)) return false;
        return true;
      }),
    [ots, dateDebut, dateFin, equipement, type, categorie]
  );

  const totaux = useMemo(() => {
    const s = { pieces: 0, mo: 0, prestation: 0, autres: 0, total: 0 };
    filtres.forEach((o) => {
      s.pieces += Number(o.cout_pieces || 0);
      s.mo += Number(o.cout_main_oeuvre || 0);
      s.prestation += Number(o.cout_prestation || 0);
      s.autres += Number(o.cout_autres || 0);
      s.total += Number(o.cout_total || 0);
    });
    return s;
  }, [filtres]);

  const parMois = useMemo(() => {
    const map: Record<string, { mois: string; Pièces: number; 'Main-d’œuvre': number; Prestations: number }> = {};
    filtres.forEach((o) => {
      const k = moisCle(o.date_fin || o.date_debut || o.date_planifiee || o.created_at);
      if (!k) return;
      map[k] ||= { mois: k, Pièces: 0, 'Main-d’œuvre': 0, Prestations: 0 };
      map[k]['Pièces'] += Number(o.cout_pieces || 0);
      map[k]['Main-d’œuvre'] += Number(o.cout_main_oeuvre || 0);
      map[k]['Prestations'] += Number(o.cout_prestation || 0) + Number(o.cout_autres || 0);
    });
    return Object.values(map).sort((a, b) => a.mois.localeCompare(b.mois)).slice(-12);
  }, [filtres]);

  const parEquipement = useMemo(() => {
    const map: Record<string, { id: string; nom: string; interventions: number; pieces: number; mo: number; prestation: number; total: number }> = {};
    filtres.forEach((o) => {
      const id = o.equipement_id || 'sans';
      const eq = equipementParId(o.equipement_id);
      map[id] ||= { id, nom: eq ? (eq.immatriculation || eq.code) : 'Non rattaché', interventions: 0, pieces: 0, mo: 0, prestation: 0, total: 0 };
      map[id].interventions += 1;
      map[id].pieces += Number(o.cout_pieces || 0);
      map[id].mo += Number(o.cout_main_oeuvre || 0);
      map[id].prestation += Number(o.cout_prestation || 0) + Number(o.cout_autres || 0);
      map[id].total += Number(o.cout_total || 0);
    });
    return Object.values(map).sort((a, b) => b.total - a.total);
  }, [filtres, equipementParId]);

  const lignesExport = () =>
    parEquipement.map((r) => ({
      Équipement: r.nom,
      Interventions: r.interventions,
      'Pièces (GNF)': Math.round(r.pieces),
      'Main-d’œuvre (GNF)': Math.round(r.mo),
      'Prestations (GNF)': Math.round(r.prestation),
      'Total (GNF)': Math.round(r.total),
    }));

  return (
    <div className="space-y-6">
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Coût pièces" valeur={fmtMontant(totaux.pieces)} icon={Package} ton="info" />
        <KpiCard label="Coût main-d'œuvre" valeur={fmtMontant(totaux.mo)} icon={Users} ton="neutre" />
        <KpiCard label="Prestations externes" valeur={fmtMontant(totaux.prestation + totaux.autres)} icon={Building2} ton="alerte" />
        <KpiCard label="Coût total" valeur={fmtMontant(totaux.total)} icon={Coins} ton="succes" detail={`${filtres.length} intervention(s)`} />
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <CardTitle className="text-base">Analyse des coûts de maintenance</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => exporterExcel(lignesExport(), 'gmao-couts', 'Coûts')}>
              <FileSpreadsheet className="mr-2 h-4 w-4" /> Excel
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const l = lignesExport();
                exporterPdf('Coûts de maintenance', Object.keys(l[0] || { Équipement: '' }), l.map((r) => Object.values(r) as any), 'gmao-couts',
                  `Période : ${dateDebut ? fmtDate(dateDebut) : 'début'} → ${dateFin ? fmtDate(dateFin) : "aujourd'hui"}`);
              }}
            >
              <FileText className="mr-2 h-4 w-4" /> PDF
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 rounded-lg border border-border/60 bg-muted/30 p-3 md:grid-cols-3 xl:grid-cols-6">
            <Input type="date" value={dateDebut} onChange={(e) => setDateDebut(e.target.value)} />
            <Input type="date" value={dateFin} onChange={(e) => setDateFin(e.target.value)} />
            <Select value={equipement} onValueChange={setEquipement}>
              <SelectTrigger><SelectValue placeholder="Équipement" /></SelectTrigger>
              <SelectContent className="max-h-72">
                <SelectItem value="tous">Tous les équipements</SelectItem>
                {equipements.map((e) => <SelectItem key={e.id} value={e.id}>{e.immatriculation || e.code}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="tous">Tous les types</SelectItem>
                {TYPES_MAINTENANCE.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={categorie} onValueChange={setCategorie}>
              <SelectTrigger><SelectValue placeholder="Catégorie de coût" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="toutes">Toutes les catégories</SelectItem>
                <SelectItem value="pieces">Pièces</SelectItem>
                <SelectItem value="main_oeuvre">Main-d'œuvre</SelectItem>
                <SelectItem value="prestation">Prestations</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="ghost" size="sm" onClick={() => { setDateDebut(''); setDateFin(''); setEquipement('tous'); setType('tous'); setCategorie('toutes'); }}>
              <RotateCcw className="mr-2 h-4 w-4" /> Réinitialiser
            </Button>
          </div>

          <div className="h-72">
            {parMois.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucun coût sur la période sélectionnée.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={parMois}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="mois" fontSize={11} />
                  <YAxis fontSize={11} />
                  <Tooltip formatter={(v: number) => fmtMontant(Number(v))} />
                  <Bar dataKey="Pièces" stackId="c" fill="hsl(var(--info))" />
                  <Bar dataKey="Main-d’œuvre" stackId="c" fill="hsl(var(--primary))" />
                  <Bar dataKey="Prestations" stackId="c" fill="hsl(var(--warning))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="overflow-x-auto rounded-lg border border-border">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>Équipement</TableHead>
                  <TableHead className="text-right">Interventions</TableHead>
                  <TableHead className="text-right">Pièces</TableHead>
                  <TableHead className="text-right">Main-d'œuvre</TableHead>
                  <TableHead className="text-right">Prestations</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {parEquipement.length === 0 && (
                  <TableRow><TableCell colSpan={6} className="py-8 text-center text-muted-foreground">Aucune donnée de coût.</TableCell></TableRow>
                )}
                {parEquipement.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.nom}</TableCell>
                    <TableCell className="text-right tabular-nums">{r.interventions}</TableCell>
                    <TableCell className="text-right tabular-nums">{fmtMontant(r.pieces)}</TableCell>
                    <TableCell className="text-right tabular-nums">{fmtMontant(r.mo)}</TableCell>
                    <TableCell className="text-right tabular-nums">{fmtMontant(r.prestation)}</TableCell>
                    <TableCell className="text-right font-semibold tabular-nums">{fmtMontant(r.total)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
