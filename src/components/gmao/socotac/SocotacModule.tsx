import React, { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import {
  Plus, Upload, FileSpreadsheet, FileText, ShieldCheck, ShieldAlert, ShieldX, CalendarClock,
  Truck, Percent, Pencil, Paperclip, Search, RotateCcw,
} from 'lucide-react';
import { socotacService, SocotacControle } from '@/services/socotac';
import { useGmao } from '../GmaoContext';
import { EtatVide, KpiCard, fmtDate } from '../gmaoUi';
import { exporterExcel, exporterPdf } from '@/utils/gmaoExport';
import { useToast } from '@/hooks/use-toast';
import { SocotacForm } from './SocotacForm';
import { SocotacImport } from './SocotacImport';
import {
  CLASSE_STATUT, LIBELLE_STATUT, MOIS_FR, anneesDisponibles, dernierParEquipement,
  joursRestants, normaliserImmat, statistiquesMensuelles, statutDepuisJours, taux,
} from './socotacUtils';

const TOUS = 'tous';

export const SocotacModule: React.FC = () => {
  const { socotac, rafraichir, chargement } = useGmao();
  const { toast } = useToast();

  const [formOuvert, setFormOuvert] = useState(false);
  const [importOuvert, setImportOuvert] = useState(false);
  const [enEdition, setEnEdition] = useState<SocotacControle | null>(null);

  const [recherche, setRecherche] = useState('');
  const [annee, setAnnee] = useState<string>(String(new Date().getFullYear()));
  const [mois, setMois] = useState<string>(TOUS);
  const [resultat, setResultat] = useState<string>(TOUS);
  const [statutFiltre, setStatutFiltre] = useState<string>(TOUS);
  const [conducteur, setConducteur] = useState<string>('');
  const [du, setDu] = useState('');
  const [au, setAu] = useState('');

  const annees = useMemo(() => anneesDisponibles(socotac), [socotac]);

  const filtres = useMemo(() => {
    const q = recherche.trim().toUpperCase();
    return socotac.filter((c) => {
      const d = new Date(`${c.date_controle}T00:00:00`);
      if (annee !== TOUS && d.getFullYear() !== Number(annee)) return false;
      if (mois !== TOUS && d.getMonth() !== Number(mois)) return false;
      if (du && c.date_controle < du) return false;
      if (au && c.date_controle > au) return false;
      if (resultat !== TOUS && c.resultat !== resultat) return false;
      if (statutFiltre !== TOUS && statutDepuisJours(joursRestants(c.date_prochain_controle)) !== statutFiltre) return false;
      if (conducteur && !(c.conducteur_nom || '').toUpperCase().includes(conducteur.toUpperCase())) return false;
      if (q && !`${c.immatriculation_tracteur || ''} ${c.immatriculation_remorque || ''} ${c.conducteur_nom || ''}`.toUpperCase().includes(q)) return false;
      return true;
    });
  }, [socotac, recherche, annee, mois, resultat, statutFiltre, conducteur, du, au]);

  const derniers = useMemo(() => dernierParEquipement(filtres), [filtres]);

  const kpi = useMemo(() => {
    const parStatut = { conforme: 0, proche: 0, urgent: 0, expire: 0 };
    derniers.forEach((c) => { parStatut[statutDepuisJours(joursRestants(c.date_prochain_controle))] += 1; });
    const total = filtres.length;
    const acceptes = filtres.filter((c) => c.resultat === 'accepte').length;
    const rejetes = filtres.filter((c) => c.resultat === 'rejete').length;
    const maintenant = new Date();
    const prevusMois = derniers.filter((c) => {
      if (!c.date_prochain_controle) return false;
      const d = new Date(`${c.date_prochain_controle}T00:00:00`);
      return d.getFullYear() === maintenant.getFullYear() && d.getMonth() === maintenant.getMonth();
    }).length;
    return {
      equipements: derniers.length,
      conforme: parStatut.conforme,
      proche: parStatut.proche,
      urgent: parStatut.urgent,
      expire: parStatut.expire,
      prevusMois, total, acceptes, rejetes,
      tauxAcceptation: taux(acceptes, total), tauxRejet: taux(rejetes, total),
    };
  }, [derniers, filtres]);

  const anneeStats = annee === TOUS ? new Date().getFullYear() : Number(annee);
  const statsMois = useMemo(
    () => statistiquesMensuelles(annee === TOUS ? socotac : filtres, anneeStats),
    [socotac, filtres, annee, anneeStats]
  );

  const motifs = useMemo(() => {
    const map = new Map<string, number>();
    filtres.filter((c) => c.resultat === 'rejete').forEach((c) => {
      const m = (c.motif_rejet || 'Non précisé').trim();
      map.set(m, (map.get(m) || 0) + 1);
    });
    const total = Array.from(map.values()).reduce((s, n) => s + n, 0);
    return Array.from(map.entries())
      .map(([motif, nombre]) => ({ motif, nombre, part: taux(nombre, total) }))
      .sort((a, b) => b.nombre - a.nombre);
  }, [filtres]);

  const rejets = useMemo(() => filtres.filter((c) => c.resultat === 'rejete'), [filtres]);

  /* Comparaison de périodes */
  const [p1Du, setP1Du] = useState(`${new Date().getFullYear()}-01-01`);
  const [p1Au, setP1Au] = useState(`${new Date().getFullYear()}-06-30`);
  const [p2Du, setP2Du] = useState(`${new Date().getFullYear() - 1}-01-01`);
  const [p2Au, setP2Au] = useState(`${new Date().getFullYear() - 1}-06-30`);

  const bilan = (d: string, f: string) => {
    const l = socotac.filter((c) => c.date_controle >= d && c.date_controle <= f);
    const a = l.filter((c) => c.resultat === 'accepte').length;
    const r = l.filter((c) => c.resultat === 'rejete').length;
    return { total: l.length, acceptes: a, rejetes: r, tauxAcceptation: taux(a, l.length), tauxRejet: taux(r, l.length) };
  };
  const b1 = useMemo(() => bilan(p1Du, p1Au), [socotac, p1Du, p1Au]);
  const b2 = useMemo(() => bilan(p2Du, p2Au), [socotac, p2Du, p2Au]);
  const evolution = (a: number, b: number) => (b ? Math.round(((a - b) / b) * 1000) / 10 : a ? 100 : 0);

  const reinitialiser = () => {
    setRecherche(''); setAnnee(String(new Date().getFullYear())); setMois(TOUS);
    setResultat(TOUS); setStatutFiltre(TOUS); setConducteur(''); setDu(''); setAu('');
  };

  const lignesEtat = () => derniers
    .sort((a, b) => (joursRestants(a.date_prochain_controle) ?? 0) - (joursRestants(b.date_prochain_controle) ?? 0))
    .map((c) => {
      const j = joursRestants(c.date_prochain_controle);
      return {
        'Immat. tracteur': c.immatriculation_tracteur || '—',
        'Immat. remorque': c.immatriculation_remorque || '—',
        Conducteur: c.conducteur_nom || '—',
        'Dernier contrôle': fmtDate(c.date_controle),
        Résultat: c.resultat === 'rejete' ? 'Rejeté' : 'Accepté',
        'Prochaine échéance': fmtDate(c.date_prochain_controle),
        'Jours restants': j ?? '—',
        Statut: LIBELLE_STATUT[statutDepuisJours(j)],
        Observations: c.observations || '',
      };
    });

  const exportEtatExcel = () => exporterExcel(lignesEtat(), 'etat-socotac-parc', 'SOCOTAC');
  const exportEtatPdf = () => {
    const l = lignesEtat();
    exporterPdf(
      'État SOCOTAC du parc',
      Object.keys(l[0] || { Info: '' }),
      l.map((r) => Object.values(r) as (string | number)[]),
      'etat-socotac-parc',
      `${derniers.length} ensemble(s) suivi(s)`
    );
  };

  const exportStatsExcel = () => {
    exporterExcel(
      statsMois.map((m) => ({
        Mois: m.mois, 'Total contrôles': m.total, Acceptés: m.acceptes, Rejetés: m.rejetes,
        '% Acceptation': m.tauxAcceptation, '% Rejet': m.tauxRejet,
      })),
      `statistiques-socotac-${anneeStats}`,
      'Statistiques'
    );
  };
  const exportStatsPdf = () => {
    exporterPdf(
      `Rapport statistique SOCOTAC ${anneeStats}`,
      ['Mois', 'Total', 'Acceptés', 'Rejetés', '% Acceptation', '% Rejet'],
      statsMois.map((m) => [m.mois, m.total, m.acceptes, m.rejetes, `${m.tauxAcceptation} %`, `${m.tauxRejet} %`]),
      `rapport-statistique-socotac-${anneeStats}`,
      `Total ${kpi.total} • Acceptés ${kpi.acceptes} (${kpi.tauxAcceptation} %) • Rejetés ${kpi.rejetes} (${kpi.tauxRejet} %)`
    );
  };
  const exportMotifsPdf = () => {
    exporterPdf(
      'Analyse des rejets SOCOTAC',
      ['Motif', 'Nombre de rejets', '% des rejets'],
      motifs.map((m) => [m.motif, m.nombre, `${m.part} %`]),
      'analyse-rejets-socotac',
      `${rejets.length} rejet(s) sur ${kpi.total} contrôle(s)`
    );
  };

  const supprimer = async (c: SocotacControle) => {
    try {
      await socotacService.remove(c.id);
      toast({ title: 'Contrôle supprimé' });
      rafraichir();
    } catch (e: any) {
      toast({ title: 'Erreur', description: e.message, variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-5">
      {/* Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Contrôles SOCOTAC</h2>
          <p className="text-sm text-muted-foreground">Contrôle réglementaire périodique — échéance automatique à 6 mois.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => setImportOuvert(true)}><Upload className="mr-2 h-4 w-4" />Importer Excel</Button>
          <Button variant="outline" size="sm" onClick={exportEtatExcel}><FileSpreadsheet className="mr-2 h-4 w-4" />État parc (Excel)</Button>
          <Button variant="outline" size="sm" onClick={exportEtatPdf}><FileText className="mr-2 h-4 w-4" />État parc (PDF)</Button>
          <Button size="sm" onClick={() => { setEnEdition(null); setFormOuvert(true); }}><Plus className="mr-2 h-4 w-4" />Nouveau contrôle</Button>
        </div>
      </div>

      {/* KPI */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
        <KpiCard label="Ensembles suivis" valeur={kpi.equipements} icon={Truck} />
        <KpiCard label="Conformes" valeur={kpi.conforme} icon={ShieldCheck} ton="succes" />
        <KpiCard label="Échéance < 40 j" valeur={kpi.proche} icon={CalendarClock} ton="info" />
        <KpiCard label="Urgents < 15 j" valeur={kpi.urgent} icon={ShieldAlert} ton="alerte" />
        <KpiCard label="Expirés" valeur={kpi.expire} icon={ShieldX} ton="danger" />
        <KpiCard label="Prévus ce mois" valeur={kpi.prevusMois} icon={CalendarClock} ton="info" />
      </div>
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-5">
        <KpiCard label="Contrôles réalisés" valeur={kpi.total} icon={FileText} />
        <KpiCard label="Acceptés" valeur={kpi.acceptes} icon={ShieldCheck} ton="succes" />
        <KpiCard label="Rejetés" valeur={kpi.rejetes} icon={ShieldX} ton="danger" />
        <KpiCard label="Taux d'acceptation" valeur={`${kpi.tauxAcceptation} %`} icon={Percent} ton="succes" />
        <KpiCard label="Taux de rejet" valeur={`${kpi.tauxRejet} %`} icon={Percent} ton="danger" />
      </div>

      {/* Filtres */}
      <Card className="border-border/60">
        <CardContent className="grid gap-3 p-4 md:grid-cols-3 xl:grid-cols-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9" placeholder="Immatriculation, conducteur…" value={recherche} onChange={(e) => setRecherche(e.target.value)} />
          </div>
          <Select value={annee} onValueChange={setAnnee}>
            <SelectTrigger><SelectValue placeholder="Année" /></SelectTrigger>
            <SelectContent>
              <SelectItem value={TOUS}>Toutes les années</SelectItem>
              {annees.map((a) => <SelectItem key={a} value={String(a)}>{a}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={mois} onValueChange={setMois}>
            <SelectTrigger><SelectValue placeholder="Mois" /></SelectTrigger>
            <SelectContent>
              <SelectItem value={TOUS}>Tous les mois</SelectItem>
              {MOIS_FR.map((m, i) => <SelectItem key={m} value={String(i)}>{m}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={resultat} onValueChange={setResultat}>
            <SelectTrigger><SelectValue placeholder="Résultat" /></SelectTrigger>
            <SelectContent>
              <SelectItem value={TOUS}>Tous les résultats</SelectItem>
              <SelectItem value="accepte">Accepté</SelectItem>
              <SelectItem value="rejete">Rejeté</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statutFiltre} onValueChange={setStatutFiltre}>
            <SelectTrigger><SelectValue placeholder="Statut" /></SelectTrigger>
            <SelectContent>
              <SelectItem value={TOUS}>Tous les statuts</SelectItem>
              <SelectItem value="conforme">Conforme</SelectItem>
              <SelectItem value="proche">Échéance proche</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
              <SelectItem value="expire">Expiré</SelectItem>
            </SelectContent>
          </Select>
          <Input placeholder="Conducteur" value={conducteur} onChange={(e) => setConducteur(e.target.value)} />
          <div className="flex items-center gap-2">
            <Input type="date" value={du} onChange={(e) => setDu(e.target.value)} />
            <span className="text-muted-foreground">→</span>
            <Input type="date" value={au} onChange={(e) => setAu(e.target.value)} />
          </div>
          <Button variant="outline" onClick={reinitialiser}><RotateCcw className="mr-2 h-4 w-4" />Réinitialiser</Button>
        </CardContent>
      </Card>

      <Tabs defaultValue="etat">
        <TabsList className="flex h-auto flex-wrap">
          <TabsTrigger value="etat">État du parc</TabsTrigger>
          <TabsTrigger value="controles">Contrôles / historique</TabsTrigger>
          <TabsTrigger value="statistiques">Statistiques mensuelles</TabsTrigger>
          <TabsTrigger value="rejets">Analyse des rejets</TabsTrigger>
          <TabsTrigger value="comparaison">Comparaison de périodes</TabsTrigger>
        </TabsList>

        {/* État du parc */}
        <TabsContent value="etat" className="mt-4">
          <Card className="border-border/60">
            <CardHeader className="pb-2"><CardTitle className="text-base">Prochaines échéances par ensemble</CardTitle></CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tracteur</TableHead><TableHead>Remorque</TableHead><TableHead>Conducteur</TableHead>
                    <TableHead>Dernier contrôle</TableHead><TableHead>Résultat</TableHead>
                    <TableHead>Prochaine échéance</TableHead><TableHead>Jours restants</TableHead><TableHead>Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!derniers.length && <TableRow><TableCell colSpan={8}><EtatVide message={chargement ? 'Chargement…' : 'Aucun contrôle enregistré.'} /></TableCell></TableRow>}
                  {derniers
                    .slice()
                    .sort((a, b) => (joursRestants(a.date_prochain_controle) ?? 0) - (joursRestants(b.date_prochain_controle) ?? 0))
                    .map((c) => {
                      const j = joursRestants(c.date_prochain_controle);
                      const s = statutDepuisJours(j);
                      return (
                        <TableRow key={c.id}>
                          <TableCell className="font-medium">{c.immatriculation_tracteur || '—'}</TableCell>
                          <TableCell>{c.immatriculation_remorque || '—'}</TableCell>
                          <TableCell>{c.conducteur_nom || '—'}</TableCell>
                          <TableCell>{fmtDate(c.date_controle)}</TableCell>
                          <TableCell>
                            <Badge className={c.resultat === 'rejete' ? 'bg-destructive text-destructive-foreground' : 'bg-success text-success-foreground'}>
                              {c.resultat === 'rejete' ? 'Rejeté' : 'Accepté'}
                            </Badge>
                          </TableCell>
                          <TableCell>{fmtDate(c.date_prochain_controle)}</TableCell>
                          <TableCell>{j ?? '—'}</TableCell>
                          <TableCell><Badge className={CLASSE_STATUT[s]}>{LIBELLE_STATUT[s]}</Badge></TableCell>
                        </TableRow>
                      );
                    })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Historique complet */}
        <TabsContent value="controles" className="mt-4">
          <Card className="border-border/60">
            <CardHeader className="pb-2"><CardTitle className="text-base">Historique des contrôles ({filtres.length})</CardTitle></CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date contrôle</TableHead><TableHead>Tracteur</TableHead><TableHead>Remorque</TableHead>
                    <TableHead>Conducteur</TableHead><TableHead>Résultat</TableHead><TableHead>Motif / observations</TableHead>
                    <TableHead>Prochaine échéance</TableHead><TableHead>Docs</TableHead><TableHead>Saisi par</TableHead><TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!filtres.length && <TableRow><TableCell colSpan={10}><EtatVide message="Aucun contrôle pour ces filtres." /></TableCell></TableRow>}
                  {filtres.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell>{fmtDate(c.date_controle)}</TableCell>
                      <TableCell className="font-medium">{c.immatriculation_tracteur || '—'}</TableCell>
                      <TableCell>{c.immatriculation_remorque || '—'}</TableCell>
                      <TableCell>{c.conducteur_nom || '—'}</TableCell>
                      <TableCell>
                        <Badge className={c.resultat === 'rejete' ? 'bg-destructive text-destructive-foreground' : 'bg-success text-success-foreground'}>
                          {c.resultat === 'rejete' ? 'Rejeté' : 'Accepté'}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[220px] truncate">{c.motif_rejet || c.observations || '—'}</TableCell>
                      <TableCell>{fmtDate(c.date_prochain_controle)}</TableCell>
                      <TableCell>
                        {c.documents?.length ? (
                          <a href={c.documents[0].url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
                            <Paperclip className="h-3.5 w-3.5" />{c.documents.length}
                          </a>
                        ) : '—'}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {c.created_by_nom || '—'}<br />{new Date(c.created_at).toLocaleString('fr-FR')}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => { setEnEdition(c); setFormOuvert(true); }}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Statistiques */}
        <TabsContent value="statistiques" className="mt-4 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-muted-foreground">Année analysée : <strong>{anneeStats}</strong></p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={exportStatsExcel}><FileSpreadsheet className="mr-2 h-4 w-4" />Excel</Button>
              <Button variant="outline" size="sm" onClick={exportStatsPdf}><FileText className="mr-2 h-4 w-4" />Rapport PDF</Button>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="border-border/60">
              <CardHeader className="pb-2"><CardTitle className="text-base">Nombre de contrôles par mois</CardTitle></CardHeader>
              <CardContent className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={statsMois}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="mois" tick={{ fontSize: 11 }} interval={0} angle={-35} textAnchor="end" height={55} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="total" name="Contrôles" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border-border/60">
              <CardHeader className="pb-2"><CardTitle className="text-base">Acceptés vs rejetés</CardTitle></CardHeader>
              <CardContent className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={statsMois}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="mois" tick={{ fontSize: 11 }} interval={0} angle={-35} textAnchor="end" height={55} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip /><Legend />
                    <Bar dataKey="acceptes" name="Acceptés" stackId="a" fill="hsl(var(--success))" />
                    <Bar dataKey="rejetes" name="Rejetés" stackId="a" fill="hsl(var(--destructive))" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border-border/60 lg:col-span-2">
              <CardHeader className="pb-2"><CardTitle className="text-base">Évolution des taux d'acceptation et de rejet</CardTitle></CardHeader>
              <CardContent className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={statsMois}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="mois" tick={{ fontSize: 11 }} />
                    <YAxis unit="%" tick={{ fontSize: 11 }} domain={[0, 100]} />
                    <Tooltip formatter={(v: any) => `${v} %`} /><Legend />
                    <Line type="monotone" dataKey="tauxAcceptation" name="Taux d'acceptation" stroke="hsl(var(--success))" strokeWidth={2} />
                    <Line type="monotone" dataKey="tauxRejet" name="Taux de rejet" stroke="hsl(var(--destructive))" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card className="border-border/60">
            <CardHeader className="pb-2"><CardTitle className="text-base">Statistiques mensuelles SOCOTAC {anneeStats}</CardTitle></CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Mois</TableHead><TableHead>Total contrôles</TableHead><TableHead>Acceptés</TableHead>
                  <TableHead>Rejetés</TableHead><TableHead>% Acceptation</TableHead><TableHead>% Rejet</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {statsMois.map((m) => (
                    <TableRow key={m.cle}>
                      <TableCell className="font-medium">{m.mois}</TableCell>
                      <TableCell>{m.total}</TableCell>
                      <TableCell>{m.acceptes}</TableCell>
                      <TableCell>{m.rejetes}</TableCell>
                      <TableCell>{m.total ? `${m.tauxAcceptation} %` : 'N/A'}</TableCell>
                      <TableCell>{m.total ? `${m.tauxRejet} %` : 'N/A'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Rejets */}
        <TabsContent value="rejets" className="mt-4 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex gap-3 text-sm">
              <span>Rejets : <strong>{rejets.length}</strong></span>
              <span>Taux de rejet : <strong>{kpi.tauxRejet} %</strong></span>
            </div>
            <Button variant="outline" size="sm" onClick={exportMotifsPdf}><FileText className="mr-2 h-4 w-4" />Exporter l'analyse</Button>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="border-border/60">
              <CardHeader className="pb-2"><CardTitle className="text-base">Classement des motifs de rejet</CardTitle></CardHeader>
              <CardContent className="overflow-x-auto">
                <Table>
                  <TableHeader><TableRow><TableHead>Motif</TableHead><TableHead>Nombre</TableHead><TableHead>% des rejets</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {!motifs.length && <TableRow><TableCell colSpan={3}><EtatVide message="Aucun rejet sur la période." /></TableCell></TableRow>}
                    {motifs.map((m) => (
                      <TableRow key={m.motif}>
                        <TableCell className="font-medium">{m.motif}</TableCell>
                        <TableCell>{m.nombre}</TableCell>
                        <TableCell>{m.part} %</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card className="border-border/60">
              <CardHeader className="pb-2"><CardTitle className="text-base">Évolution des rejets</CardTitle></CardHeader>
              <CardContent className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={statsMois}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="mois" tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="rejetes" name="Rejets" stroke="hsl(var(--destructive))" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card className="border-border/60">
            <CardHeader className="pb-2"><CardTitle className="text-base">Équipements rejetés et actions correctives</CardTitle></CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Date</TableHead><TableHead>Tracteur</TableHead><TableHead>Remorque</TableHead><TableHead>Conducteur</TableHead>
                  <TableHead>Motif</TableHead><TableHead>Action corrective</TableHead><TableHead>Responsable</TableHead>
                  <TableHead>Contre-visite</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {!rejets.length && <TableRow><TableCell colSpan={8}><EtatVide message="Aucun rejet." /></TableCell></TableRow>}
                  {rejets.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell>{fmtDate(c.date_controle)}</TableCell>
                      <TableCell className="font-medium">{c.immatriculation_tracteur || '—'}</TableCell>
                      <TableCell>{c.immatriculation_remorque || '—'}</TableCell>
                      <TableCell>{c.conducteur_nom || '—'}</TableCell>
                      <TableCell>{c.motif_rejet || '—'}</TableCell>
                      <TableCell className="max-w-[220px] truncate">{c.action_corrective || '—'}</TableCell>
                      <TableCell>{c.responsable_action || '—'}</TableCell>
                      <TableCell>{fmtDate(c.date_contre_visite)}{c.resultat_contre_visite ? ` — ${c.resultat_contre_visite === 'accepte' ? 'Acceptée' : 'Rejetée'}` : ''}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Comparaison */}
        <TabsContent value="comparaison" className="mt-4 space-y-4">
          <Card className="border-border/60">
            <CardContent className="grid gap-3 p-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Période 1</Label>
                <div className="flex items-center gap-2">
                  <Input type="date" value={p1Du} onChange={(e) => setP1Du(e.target.value)} />
                  <Input type="date" value={p1Au} onChange={(e) => setP1Au(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Période 2 (référence)</Label>
                <div className="flex items-center gap-2">
                  <Input type="date" value={p2Du} onChange={(e) => setP2Du(e.target.value)} />
                  <Input type="date" value={p2Au} onChange={(e) => setP2Au(e.target.value)} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardContent className="overflow-x-auto p-0">
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Indicateur</TableHead><TableHead>Période 1</TableHead><TableHead>Période 2</TableHead>
                  <TableHead>Écart</TableHead><TableHead>Évolution</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {[
                    ['Nombre de contrôles', b1.total, b2.total, ''],
                    ['Acceptations', b1.acceptes, b2.acceptes, ''],
                    ['Rejets', b1.rejetes, b2.rejetes, ''],
                    ["Taux d'acceptation", b1.tauxAcceptation, b2.tauxAcceptation, ' %'],
                    ['Taux de rejet', b1.tauxRejet, b2.tauxRejet, ' %'],
                  ].map(([label, v1, v2, unite]: any) => (
                    <TableRow key={label}>
                      <TableCell className="font-medium">{label}</TableCell>
                      <TableCell>{v1}{unite}</TableCell>
                      <TableCell>{v2}{unite}</TableCell>
                      <TableCell>{Math.round((v1 - v2) * 10) / 10}{unite}</TableCell>
                      <TableCell className={v1 - v2 >= 0 ? 'text-success' : 'text-destructive'}>
                        {evolution(v1, v2) > 0 ? '+' : ''}{evolution(v1, v2)} %
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <SocotacForm
        open={formOuvert}
        onOpenChange={setFormOuvert}
        controle={enEdition}
        onSaved={rafraichir}
      />
      <SocotacImport open={importOuvert} onOpenChange={setImportOuvert} onImported={rafraichir} />
    </div>
  );
};
