import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ShieldAlert, Users, TrendingUp, Repeat, FileSpreadsheet, FileText, Gauge } from 'lucide-react';
import { format, startOfMonth, startOfYear, subDays } from 'date-fns';
import { OBC_VIOLATION_LABELS, ObcViolationType, ObcViolation, ObcChauffeurPoints } from '@/services/obcService';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, LineChart, Line, Cell,
} from 'recharts';

interface Props {
  chauffeurs: any[];
  violations: ObcViolation[];
  points: ObcChauffeurPoints[];
}

const TYPES = Object.keys(OBC_VIOLATION_LABELS) as ObcViolationType[];

const Kpi: React.FC<{ title: string; value: React.ReactNode; sub?: string; icon: React.ReactNode }> = ({ title, value, sub, icon }) => (
  <Card>
    <CardContent className="p-4 flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="text-xs uppercase tracking-wide text-muted-foreground truncate">{title}</p>
        <p className="text-2xl font-bold">{value}</p>
        {sub && <p className="text-xs text-muted-foreground truncate">{sub}</p>}
      </div>
      <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">{icon}</div>
    </CardContent>
  </Card>
);

export const ObcStatistiques: React.FC<Props> = ({ chauffeurs, violations, points }) => {
  const today = new Date();
  const [preset, setPreset] = useState<string>('annee');
  const [debut, setDebut] = useState<string>(format(startOfYear(today), 'yyyy-MM-dd'));
  const [fin, setFin] = useState<string>(format(today, 'yyyy-MM-dd'));

  const applyPreset = (p: string) => {
    setPreset(p);
    const now = new Date();
    if (p === 'mois') setDebut(format(startOfMonth(now), 'yyyy-MM-dd'));
    else if (p === '30j') setDebut(format(subDays(now, 30), 'yyyy-MM-dd'));
    else if (p === '90j') setDebut(format(subDays(now, 90), 'yyyy-MM-dd'));
    else if (p === 'annee') setDebut(format(startOfYear(now), 'yyyy-MM-dd'));
    if (p !== 'custom') setFin(format(now, 'yyyy-MM-dd'));
  };

  const nom = (id: string) => {
    const c = chauffeurs.find((x: any) => x.id === id);
    return c ? `${c.prenom} ${c.nom}` : '—';
  };

  const filtered = useMemo(
    () => violations.filter(v => {
      const d = v.date_violation.slice(0, 10);
      return (!debut || d >= debut) && (!fin || d <= fin);
    }),
    [violations, debut, fin]
  );

  const parType = useMemo(() => {
    const m: Record<string, number> = {};
    TYPES.forEach(t => (m[t] = 0));
    filtered.forEach(v => { m[v.type_violation] = (m[v.type_violation] || 0) + 1; });
    return m;
  }, [filtered]);

  const parChauffeur = useMemo(() => {
    const m = new Map<string, { total: number; points: number; types: Record<string, number>; derniere: string }>();
    filtered.forEach(v => {
      const e = m.get(v.chauffeur_id) || { total: 0, points: 0, types: {}, derniere: v.date_violation };
      e.total += 1;
      e.points += Number(v.points_retires || 0);
      e.types[v.type_violation] = (e.types[v.type_violation] || 0) + 1;
      if (v.date_violation > e.derniere) e.derniere = v.date_violation;
      m.set(v.chauffeur_id, e);
    });
    return [...m.entries()]
      .map(([id, e]) => ({ id, nom: nom(id), ...e }))
      .sort((a, b) => b.total - a.total);
  }, [filtered, chauffeurs]);

  const evolution = useMemo(() => {
    const m: Record<string, number> = {};
    filtered.forEach(v => {
      const k = v.date_violation.slice(0, 7);
      m[k] = (m[k] || 0) + 1;
    });
    return Object.entries(m).sort().map(([mois, total]) => ({ mois, total }));
  }, [filtered]);

  const kpis = useMemo(() => {
    const concernes = parChauffeur.length;
    const pointsRetires = filtered.reduce((s, v) => s + Number(v.points_retires || 0), 0);
    const recidivistes = parChauffeur.filter(c => c.total > 1).length;
    const typeTop = Object.entries(parType).sort((a, b) => b[1] - a[1])[0];
    const bloques = points.filter(p => p.points_actuels === 0).length;
    const risque = points.filter(p => p.points_actuels > 0 && p.points_actuels <= 6).length;
    const moyennePoints = points.length
      ? (points.reduce((s, p) => s + p.points_actuels, 0) / points.length).toFixed(1)
      : '—';
    return {
      total: filtered.length,
      concernes,
      sansViolation: Math.max(chauffeurs.length - concernes, 0),
      pointsRetires,
      recidivistes,
      tauxRecidive: concernes ? Math.round((recidivistes / concernes) * 100) : 0,
      moyenneParChauffeur: concernes ? (filtered.length / concernes).toFixed(1) : '0',
      typeTop: typeTop && typeTop[1] > 0 ? OBC_VIOLATION_LABELS[typeTop[0] as ObcViolationType] : '—',
      typeTopCount: typeTop ? typeTop[1] : 0,
      bloques,
      risque,
      moyennePoints,
    };
  }, [filtered, parChauffeur, parType, points, chauffeurs]);

  const chartType = TYPES.map(t => ({ nom: OBC_VIOLATION_LABELS[t], total: parType[t] || 0 })).filter(d => d.total > 0);
  const topChauffeurs = parChauffeur.slice(0, 10).map(c => ({ nom: c.nom, total: c.total }));

  const exportExcel = async () => {
    const XLSX = await import('xlsx');
    const rows = parChauffeur.map(c => {
      const base: Record<string, any> = { Chauffeur: c.nom };
      TYPES.forEach(t => { base[OBC_VIOLATION_LABELS[t]] = c.types[t] || 0; });
      base['Total violations'] = c.total;
      base['Points retirés'] = c.points;
      base['Points restants'] = points.find(p => p.chauffeur_id === c.id)?.points_actuels ?? '';
      base['Dernière violation'] = format(new Date(c.derniere), 'dd/MM/yyyy');
      return base;
    });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), 'Par chauffeur');
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(TYPES.map(t => ({ Type: OBC_VIOLATION_LABELS[t], Total: parType[t] || 0 }))),
      'Par type'
    );
    XLSX.writeFile(wb, `obc_statistiques_${debut}_${fin}.xlsx`);
  };

  const exportPdf = async () => {
    const { default: jsPDF } = await import('jspdf');
    const autoTable = (await import('jspdf-autotable')).default;
    const doc = new jsPDF({ orientation: 'landscape' });
    doc.setFontSize(14);
    doc.text('SDBK - AMS — Statistiques OBC', 14, 14);
    doc.setFontSize(10);
    doc.text(`Période : ${format(new Date(debut), 'dd/MM/yyyy')} au ${format(new Date(fin), 'dd/MM/yyyy')}`, 14, 21);
    doc.text(
      `Violations : ${kpis.total} • Chauffeurs concernés : ${kpis.concernes} • Points retirés : ${kpis.pointsRetires} • Taux de récidive : ${kpis.tauxRecidive}%`,
      14, 27
    );
    autoTable(doc, {
      startY: 33,
      head: [['Chauffeur', ...TYPES.map(t => OBC_VIOLATION_LABELS[t]), 'Total', 'Pts retirés', 'Pts restants']],
      body: parChauffeur.map(c => [
        c.nom,
        ...TYPES.map(t => String(c.types[t] || 0)),
        String(c.total),
        String(c.points),
        String(points.find(p => p.chauffeur_id === c.id)?.points_actuels ?? '-'),
      ]),
      styles: { fontSize: 7 },
      headStyles: { fillColor: [234, 88, 12] },
    });
    doc.save(`obc_statistiques_${debut}_${fin}.pdf`);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <Label className="text-xs">Période</Label>
              <Select value={preset} onValueChange={applyPreset}>
                <SelectTrigger className="w-[170px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="mois">Mois en cours</SelectItem>
                  <SelectItem value="30j">30 derniers jours</SelectItem>
                  <SelectItem value="90j">Trimestre glissant</SelectItem>
                  <SelectItem value="annee">Année en cours</SelectItem>
                  <SelectItem value="custom">Personnalisée</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Du</Label>
              <Input type="date" value={debut} onChange={e => { setPreset('custom'); setDebut(e.target.value); }} className="w-[160px]" />
            </div>
            <div>
              <Label className="text-xs">Au</Label>
              <Input type="date" value={fin} onChange={e => { setPreset('custom'); setFin(e.target.value); }} className="w-[160px]" />
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={exportExcel}><FileSpreadsheet className="h-4 w-4 mr-2" />Excel</Button>
            <Button variant="outline" onClick={exportPdf}><FileText className="h-4 w-4 mr-2" />PDF</Button>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Kpi title="Violations" value={kpis.total} sub={`${kpis.moyenneParChauffeur} / chauffeur concerné`} icon={<ShieldAlert className="h-5 w-5" />} />
        <Kpi title="Chauffeurs concernés" value={kpis.concernes} sub={`${kpis.sansViolation} sans violation`} icon={<Users className="h-5 w-5" />} />
        <Kpi title="Points retirés" value={kpis.pointsRetires} sub={`Moyenne actuelle : ${kpis.moyennePoints} pts`} icon={<Gauge className="h-5 w-5" />} />
        <Kpi title="Taux de récidive" value={`${kpis.tauxRecidive}%`} sub={`${kpis.recidivistes} récidivistes`} icon={<Repeat className="h-5 w-5" />} />
        <Kpi title="Type dominant" value={<span className="text-base">{kpis.typeTop}</span>} sub={`${kpis.typeTopCount} occurrence(s)`} icon={<TrendingUp className="h-5 w-5" />} />
        <Kpi title="Chauffeurs bloqués" value={kpis.bloques} sub="0 point restant" icon={<ShieldAlert className="h-5 w-5" />} />
        <Kpi title="Chauffeurs à risque" value={kpis.risque} sub="≤ 6 points restants" icon={<ShieldAlert className="h-5 w-5" />} />
        <Kpi title="Types distincts" value={chartType.length} sub={`sur ${TYPES.length} types suivis`} icon={<TrendingUp className="h-5 w-5" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-base">Violations par type</CardTitle></CardHeader>
          <CardContent className="h-[300px]">
            {chartType.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucune violation sur la période.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartType} layout="vertical" margin={{ left: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" allowDecimals={false} fontSize={11} />
                  <YAxis type="category" dataKey="nom" width={140} fontSize={10} />
                  <Tooltip />
                  <Bar dataKey="total" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Top 10 chauffeurs</CardTitle></CardHeader>
          <CardContent className="h-[300px]">
            {topChauffeurs.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucune donnée.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topChauffeurs} layout="vertical" margin={{ left: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" allowDecimals={false} fontSize={11} />
                  <YAxis type="category" dataKey="nom" width={140} fontSize={10} />
                  <Tooltip />
                  <Bar dataKey="total" radius={[0, 4, 4, 0]}>
                    {topChauffeurs.map((_, i) => (
                      <Cell key={i} fill={i < 3 ? 'hsl(var(--destructive))' : 'hsl(var(--primary))'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Évolution mensuelle</CardTitle></CardHeader>
        <CardContent className="h-[260px]">
          {evolution.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucune donnée.</p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={evolution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mois" fontSize={11} />
                <YAxis allowDecimals={false} fontSize={11} />
                <Tooltip />
                <Line type="monotone" dataKey="total" stroke="hsl(var(--primary))" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Détail par chauffeur et par type</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="sticky left-0 bg-background">Chauffeur</TableHead>
                {TYPES.map(t => <TableHead key={t} className="text-center text-[10px]">{OBC_VIOLATION_LABELS[t]}</TableHead>)}
                <TableHead className="text-center">Total</TableHead>
                <TableHead className="text-center">Pts retirés</TableHead>
                <TableHead className="text-center">Pts restants</TableHead>
                <TableHead>Dernière</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {parChauffeur.length === 0 && (
                <TableRow><TableCell colSpan={TYPES.length + 5} className="text-center text-muted-foreground">Aucune violation sur la période</TableCell></TableRow>
              )}
              {parChauffeur.map(c => {
                const restants = points.find(p => p.chauffeur_id === c.id)?.points_actuels;
                return (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium sticky left-0 bg-background whitespace-nowrap">{c.nom}</TableCell>
                    {TYPES.map(t => (
                      <TableCell key={t} className="text-center">{c.types[t] ? c.types[t] : <span className="text-muted-foreground">–</span>}</TableCell>
                    ))}
                    <TableCell className="text-center font-semibold">{c.total}</TableCell>
                    <TableCell className="text-center">{c.points}</TableCell>
                    <TableCell className="text-center">
                      {restants === undefined ? '—' : (
                        <Badge variant={restants === 0 ? 'destructive' : restants <= 6 ? 'secondary' : 'outline'}>{restants}</Badge>
                      )}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">{format(new Date(c.derniere), 'dd/MM/yyyy')}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
