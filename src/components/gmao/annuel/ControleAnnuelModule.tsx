import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
import { controlesAnnuelsService, ControleAnnuel } from '@/services/controlesAnnuels';
import { EtatVide, KpiCard, fmtDate } from '../gmaoUi';
import { exporterExcel, exporterPdf } from '@/utils/gmaoExport';
import { useToast } from '@/hooks/use-toast';
import { ControleAnnuelForm } from './ControleAnnuelForm';
import { ControleAnnuelImport } from './ControleAnnuelImport';
import { MOIS_FR, anneesDisponibles, joursRestants, statistiquesMensuelles, taux } from '../socotac/socotacUtils';
import {
  CLASSE_STATUT_ANNUEL, LIBELLE_STATUT_ANNUEL, SEUIL_PROCHE, SEUIL_URGENT,
  dernierAnnuelParEquipement, statutAnnuel,
} from './annuelUtils';

const TOUS = 'tous';

export const ControleAnnuelModule: React.FC = () => {
  const { toast } = useToast();
  const [controles, setControles] = useState<ControleAnnuel[]>([]);
  const [chargement, setChargement] = useState(true);

  const charger = useCallback(async () => {
    setChargement(true);
    try {
      setControles(await controlesAnnuelsService.getAll());
    } catch (e: any) {
      toast({ title: 'Erreur de chargement', description: e.message, variant: 'destructive' });
    } finally {
      setChargement(false);
    }
  }, [toast]);

  useEffect(() => { charger(); }, [charger]);

  const [formOuvert, setFormOuvert] = useState(false);
  const [importOuvert, setImportOuvert] = useState(false);
  const [enEdition, setEnEdition] = useState<ControleAnnuel | null>(null);

  const [recherche, setRecherche] = useState('');
  const [annee, setAnnee] = useState<string>(TOUS);
  const [mois, setMois] = useState<string>(TOUS);
  const [resultat, setResultat] = useState<string>(TOUS);
  const [statutFiltre, setStatutFiltre] = useState<string>(TOUS);
  const [du, setDu] = useState('');
  const [au, setAu] = useState('');

  const annees = useMemo(() => anneesDisponibles(controles as any), [controles]);

  const filtres = useMemo(() => {
    const q = recherche.trim().toUpperCase();
    return controles.filter((c) => {
      const d = new Date(`${c.date_controle}T00:00:00`);
      if (annee !== TOUS && d.getFullYear() !== Number(annee)) return false;
      if (mois !== TOUS && d.getMonth() !== Number(mois)) return false;
      if (du && c.date_controle < du) return false;
      if (au && c.date_controle > au) return false;
      if (resultat !== TOUS && c.resultat !== resultat) return false;
      if (statutFiltre !== TOUS && statutAnnuel(joursRestants(c.date_prochain_controle)) !== statutFiltre) return false;
      if (q && !`${c.immatriculation_tracteur || ''} ${c.immatriculation_remorque || ''} ${c.conducteur_nom || ''}`.toUpperCase().includes(q)) return false;
      return true;
    });
  }, [controles, recherche, annee, mois, resultat, statutFiltre, du, au]);

  const derniers = useMemo(() => dernierAnnuelParEquipement(filtres), [filtres]);

  const kpi = useMemo(() => {
    const parStatut = { conforme: 0, proche: 0, urgent: 0, expire: 0 };
    derniers.forEach((c) => { parStatut[statutAnnuel(joursRestants(c.date_prochain_controle))] += 1; });
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
      equipements: derniers.length, ...parStatut, prevusMois, total, acceptes, rejetes,
      tauxAcceptation: taux(acceptes, total), tauxRejet: taux(rejetes, total),
    };
  }, [derniers, filtres]);

  const anneeStats = annee === TOUS ? new Date().getFullYear() : Number(annee);
  const statsMois = useMemo(
    () => statistiquesMensuelles((annee === TOUS ? controles : filtres) as any, anneeStats),
    [controles, filtres, annee, anneeStats]
  );

  const reinitialiser = () => {
    setRecherche(''); setAnnee(TOUS); setMois(TOUS); setResultat(TOUS); setStatutFiltre(TOUS); setDu(''); setAu('');
  };

  const lignesEtat = () => derniers
    .slice()
    .sort((a, b) => (joursRestants(a.date_prochain_controle) ?? 0) - (joursRestants(b.date_prochain_controle) ?? 0))
    .map((c) => {
      const j = joursRestants(c.date_prochain_controle);
      return {
        'Immat. tracteur': c.immatriculation_tracteur || '—',
        'Immat. remorque': c.immatriculation_remorque || '—',
        Opérateur: c.conducteur_nom || '—',
        'Dernier contrôle': fmtDate(c.date_controle),
        Résultat: c.resultat === 'rejete' ? 'Rejeté' : 'Accepté',
        'Prochaine échéance': fmtDate(c.date_prochain_controle),
        'Jours restants': j ?? '—',
        Statut: LIBELLE_STATUT_ANNUEL[statutAnnuel(j)],
        Observations: c.observations || '',
      };
    });

  const exportEtatExcel = () => exporterExcel(lignesEtat(), 'etat-controle-annuel', 'Contrôle annuel');
  const exportEtatPdf = () => {
    const l = lignesEtat();
    exporterPdf(
      'État du contrôle annuel du parc',
      Object.keys(l[0] || { Info: '' }),
      l.map((r) => Object.values(r) as (string | number)[]),
      'etat-controle-annuel',
      `${derniers.length} ensemble(s) suivi(s)`
    );
  };
  const exportStatsExcel = () => exporterExcel(
    statsMois.map((m) => ({
      Mois: m.mois, 'Total contrôles': m.total, Acceptés: m.acceptes, Rejetés: m.rejetes,
      '% Acceptation': m.tauxAcceptation, '% Rejet': m.tauxRejet,
    })),
    `statistiques-controle-annuel-${anneeStats}`,
    'Statistiques'
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Contrôle Annuel</h2>
          <p className="text-sm text-muted-foreground">
            Contrôle technique annuel — échéance automatique à 12 mois. Alertes à J-{SEUIL_PROCHE} puis J-{SEUIL_URGENT}.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => setImportOuvert(true)}><Upload className="mr-2 h-4 w-4" />Importer Excel</Button>
          <Button variant="outline" size="sm" onClick={exportEtatExcel}><FileSpreadsheet className="mr-2 h-4 w-4" />État parc (Excel)</Button>
          <Button variant="outline" size="sm" onClick={exportEtatPdf}><FileText className="mr-2 h-4 w-4" />État parc (PDF)</Button>
          <Button size="sm" onClick={() => { setEnEdition(null); setFormOuvert(true); }}><Plus className="mr-2 h-4 w-4" />Nouveau contrôle</Button>
        </div>
      </div>

      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
        <KpiCard label="Ensembles suivis" valeur={kpi.equipements} icon={Truck} />
        <KpiCard label="Conformes" valeur={kpi.conforme} icon={ShieldCheck} ton="succes" />
        <KpiCard label={`Échéance < ${SEUIL_PROCHE} j`} valeur={kpi.proche} icon={CalendarClock} ton="info" />
        <KpiCard label={`Urgents < ${SEUIL_URGENT} j`} valeur={kpi.urgent} icon={ShieldAlert} ton="alerte" />
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

      <Card className="border-border/60">
        <CardContent className="grid gap-3 p-4 md:grid-cols-3 xl:grid-cols-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9" placeholder="Immatriculation, opérateur…" value={recherche} onChange={(e) => setRecherche(e.target.value)} />
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
        </TabsList>

        <TabsContent value="etat" className="mt-4">
          <Card className="border-border/60">
            <CardHeader className="pb-2"><CardTitle className="text-base">Prochaines échéances annuelles par ensemble</CardTitle></CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tracteur</TableHead><TableHead>Remorque</TableHead><TableHead>Opérateur</TableHead>
                    <TableHead>Dernier contrôle</TableHead><TableHead>Résultat</TableHead>
                    <TableHead>Prochaine échéance</TableHead><TableHead>Jours restants</TableHead><TableHead>Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!derniers.length && <TableRow><TableCell colSpan={8}><EtatVide message={chargement ? 'Chargement…' : 'Aucun contrôle annuel enregistré.'} /></TableCell></TableRow>}
                  {derniers
                    .slice()
                    .sort((a, b) => (joursRestants(a.date_prochain_controle) ?? 0) - (joursRestants(b.date_prochain_controle) ?? 0))
                    .map((c) => {
                      const j = joursRestants(c.date_prochain_controle);
                      const s = statutAnnuel(j);
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
                          <TableCell><Badge className={CLASSE_STATUT_ANNUEL[s]}>{LIBELLE_STATUT_ANNUEL[s]}</Badge></TableCell>
                        </TableRow>
                      );
                    })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="controles" className="mt-4">
          <Card className="border-border/60">
            <CardHeader className="pb-2"><CardTitle className="text-base">Historique des contrôles annuels ({filtres.length})</CardTitle></CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date contrôle</TableHead><TableHead>Tracteur</TableHead><TableHead>Remorque</TableHead>
                    <TableHead>Opérateur</TableHead><TableHead>Résultat</TableHead><TableHead>Motif / observations</TableHead>
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

        <TabsContent value="statistiques" className="mt-4 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-muted-foreground">Année analysée : <strong>{anneeStats}</strong></p>
            <Button variant="outline" size="sm" onClick={exportStatsExcel}><FileSpreadsheet className="mr-2 h-4 w-4" />Excel</Button>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="border-border/60">
              <CardHeader className="pb-2"><CardTitle className="text-base">Contrôles annuels par mois</CardTitle></CardHeader>
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
              <CardHeader className="pb-2"><CardTitle className="text-base">Évolution des taux</CardTitle></CardHeader>
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
            <CardHeader className="pb-2"><CardTitle className="text-base">Statistiques mensuelles {anneeStats}</CardTitle></CardHeader>
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
      </Tabs>

      <ControleAnnuelForm open={formOuvert} onOpenChange={setFormOuvert} controle={enEdition} onSaved={charger} />
      <ControleAnnuelImport open={importOuvert} onOpenChange={setImportOuvert} onImported={charger} />
    </div>
  );
};
