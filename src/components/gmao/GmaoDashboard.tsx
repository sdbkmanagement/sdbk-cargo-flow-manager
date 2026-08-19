import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  LineChart, Line, Legend, PieChart, Pie, Cell,
} from 'recharts';
import {
  Truck, CheckCircle2, Wrench, AlertOctagon, ClipboardList, Clock,
  CalendarClock, Coins, Bell, ChevronRight,
} from 'lucide-react';
import { useGmao } from './GmaoContext';
import { CLASSE_STATUT, LIBELLE_STATUT, dernierParEquipement, joursRestants, statutDepuisJours, taux } from './socotac/socotacUtils';
import { fmtMontant, fmtNombre, KpiCard, libelle, moisCle, STATUTS_OT } from './gmaoUi';
import { cn } from '@/lib/utils';

const COULEURS = ['hsl(var(--primary))', 'hsl(var(--info))', 'hsl(var(--warning))', 'hsl(var(--success))', 'hsl(var(--destructive))'];

export const GmaoDashboard: React.FC = () => {
  const { chargement, equipements, ots, plans, socotac, alertes, statsParEquipement, allerA, libelleEquipement } = useGmao();

  const kpis = useMemo(() => {
    const maintenant = Date.now();
    const debutMois = new Date();
    debutMois.setDate(1);
    debutMois.setHours(0, 0, 0, 0);

    const ouverts = ots.filter((o) => !o.cloture);
    const coutMois = ots
      .filter((o) => {
        const d = o.date_fin || o.date_debut || o.date_planifiee || o.created_at;
        return d && new Date(d) >= debutMois;
      })
      .reduce((s, o) => s + Number(o.cout_total || 0), 0);

    return {
      total: equipements.length,
      disponibles: equipements.filter((e) => e.statut === 'operationnel').length,
      enMaintenance: equipements.filter((e) => e.statut === 'en_maintenance').length,
      immobilises: equipements.filter((e) => e.statut === 'immobilise' || e.statut === 'hors_service').length,
      enCours: ouverts.filter((o) => o.statut === 'en_cours' || o.statut === 'attente_piece').length,
      enRetard: ouverts.filter((o) => o.date_planifiee && new Date(o.date_planifiee).getTime() < maintenant).length,
      preventifsAVenir: plans.filter((p) => {
        if (!p.prochaine_echeance) return false;
        const ecart = (new Date(p.prochaine_echeance).getTime() - maintenant) / (24 * 3600 * 1000);
        return ecart >= 0 && ecart <= 30;
      }).length,
      coutMois,
    };
  }, [equipements, ots, plans]);

  const evolution = useMemo(() => {
    const map: Record<string, { mois: string; Correctives: number; Préventives: number; cout: number }> = {};
    ots.forEach((o) => {
      const k = moisCle(o.date_fin || o.date_debut || o.date_planifiee || o.created_at);
      if (!k) return;
      map[k] ||= { mois: k, Correctives: 0, Préventives: 0, cout: 0 };
      if (o.type_maintenance === 'preventif') map[k].Préventives += 1;
      else map[k].Correctives += 1;
      map[k].cout += Number(o.cout_total || 0);
    });
    return Object.values(map).sort((a, b) => a.mois.localeCompare(b.mois)).slice(-12);
  }, [ots]);

  const topCouts = useMemo(
    () =>
      Object.entries(statsParEquipement)
        .map(([id, s]) => ({ nom: libelleEquipement(id).split(' — ')[0], cout: s.coutTotal, id }))
        .filter((x) => x.cout > 0)
        .sort((a, b) => b.cout - a.cout)
        .slice(0, 10),
    [statsParEquipement, libelleEquipement]
  );

  const topImmobilisation = useMemo(
    () =>
      Object.entries(statsParEquipement)
        .map(([id, s]) => ({ nom: libelleEquipement(id).split(' — ')[0], heures: s.immobilisationHeures, id }))
        .filter((x) => x.heures > 0)
        .sort((a, b) => b.heures - a.heures)
        .slice(0, 10),
    [statsParEquipement, libelleEquipement]
  );

  const repartitionStatut = useMemo(() => {
    const map: Record<string, number> = {};
    ots.forEach((o) => {
      const k = o.cloture ? 'cloture' : o.statut || 'planifie';
      map[k] = (map[k] || 0) + 1;
    });
    return Object.entries(map).map(([k, v]) => ({ nom: libelle(STATUTS_OT, k), valeur: v }));
  }, [ots]);

  if (chargement) {
    return (
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
    );
  }

  const socotacKpi = (() => {
    const derniers = dernierParEquipement(socotac);
    const parStatut = { conforme: 0, proche: 0, urgent: 0, expire: 0 };
    derniers.forEach((c) => { parStatut[statutDepuisJours(joursRestants(c.date_prochain_controle))] += 1; });
    const acceptes = socotac.filter((c) => c.resultat === 'accepte').length;
    const rejetes = socotac.filter((c) => c.resultat === 'rejete').length;
    const prochains = derniers
      .filter((c) => (joursRestants(c.date_prochain_controle) ?? 999) <= 40)
      .sort((a, b) => (joursRestants(a.date_prochain_controle) ?? 0) - (joursRestants(b.date_prochain_controle) ?? 0))
      .slice(0, 10);
    return {
      total: socotac.length, acceptes, rejetes,
      tauxAcceptation: taux(acceptes, socotac.length), tauxRejet: taux(rejetes, socotac.length),
      ...parStatut, prochains,
    };
  })();

  const vide = ots.length === 0;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Total équipements" valeur={fmtNombre(kpis.total)} icon={Truck} onClick={() => allerA('equipements')} />
        <KpiCard label="Disponibles" valeur={fmtNombre(kpis.disponibles)} icon={CheckCircle2} ton="succes" onClick={() => allerA('equipements')} />
        <KpiCard label="En maintenance" valeur={fmtNombre(kpis.enMaintenance)} icon={Wrench} ton="alerte" onClick={() => allerA('equipements')} />
        <KpiCard label="Immobilisés" valeur={fmtNombre(kpis.immobilises)} icon={AlertOctagon} ton="danger" onClick={() => allerA('equipements')} />
        <KpiCard label="Interventions en cours" valeur={fmtNombre(kpis.enCours)} icon={ClipboardList} ton="info" onClick={() => allerA('interventions')} />
        <KpiCard label="Interventions en retard" valeur={fmtNombre(kpis.enRetard)} icon={Clock} ton="danger" onClick={() => allerA('interventions')} />
        <KpiCard label="Préventif à venir (30 j)" valeur={fmtNombre(kpis.preventifsAVenir)} icon={CalendarClock} ton="alerte" onClick={() => allerA('preventif')} />
        <KpiCard label="Coût maintenance du mois" valeur={fmtMontant(kpis.coutMois)} icon={Coins} onClick={() => allerA('couts')} />
      </div>

      {/* Synthèse SOCOTAC */}
      <Card className="border-border/60">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base">Contrôles SOCOTAC</CardTitle>
          <Button variant="outline" size="sm" onClick={() => allerA('socotac')}>Ouvrir le suivi</Button>
        </CardHeader>
        <CardContent>
          {socotac.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun contrôle SOCOTAC enregistré.</p>
          ) : (
            <div className="grid gap-3 grid-cols-2 lg:grid-cols-6">
              <div><p className="text-xs uppercase text-muted-foreground">Total réalisés</p><p className="text-xl font-bold">{socotacKpi.total}</p></div>
              <div><p className="text-xs uppercase text-muted-foreground">Acceptés</p><p className="text-xl font-bold text-success">{socotacKpi.acceptes} — {socotacKpi.tauxAcceptation} %</p></div>
              <div><p className="text-xs uppercase text-muted-foreground">Rejetés</p><p className="text-xl font-bold text-destructive">{socotacKpi.rejetes} — {socotacKpi.tauxRejet} %</p></div>
              <div><p className="text-xs uppercase text-muted-foreground">Échéance &lt; 40 j</p><p className="text-xl font-bold">{socotacKpi.proche}</p></div>
              <div><p className="text-xs uppercase text-muted-foreground">Urgents &lt; 15 j</p><p className="text-xl font-bold text-warning">{socotacKpi.urgent}</p></div>
              <div><p className="text-xs uppercase text-muted-foreground">Expirés</p><p className="text-xl font-bold text-destructive">{socotacKpi.expire}</p></div>
              <div className="col-span-2 lg:col-span-6 flex flex-wrap gap-2 pt-2">
                {socotacKpi.prochains.map((c) => {
                  const j = joursRestants(c.date_prochain_controle);
                  const st = statutDepuisJours(j);
                  return (
                    <Badge key={c.id} className={cn('font-medium', CLASSE_STATUT[st])}>
                      {c.immatriculation_tracteur} • {LIBELLE_STATUT[st]} ({j} j)
                    </Badge>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Évolution des interventions</CardTitle></CardHeader>
          <CardContent className="h-72">
            {vide ? <p className="text-sm text-muted-foreground">Aucune intervention enregistrée.</p> : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={evolution}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="mois" fontSize={11} />
                  <YAxis allowDecimals={false} fontSize={11} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="Correctives" stroke="hsl(var(--destructive))" strokeWidth={2} />
                  <Line type="monotone" dataKey="Préventives" stroke="hsl(var(--success))" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Coût de maintenance par mois</CardTitle></CardHeader>
          <CardContent className="h-72">
            {vide ? <p className="text-sm text-muted-foreground">Aucun coût enregistré.</p> : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={evolution}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="mois" fontSize={11} />
                  <YAxis fontSize={11} />
                  <Tooltip formatter={(v: number) => fmtMontant(Number(v))} />
                  <Bar dataKey="cout" name="Coût" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Top 10 des équipements les plus coûteux</CardTitle></CardHeader>
          <CardContent className="h-80">
            {topCouts.length === 0 ? <p className="text-sm text-muted-foreground">Aucun coût rattaché à un équipement.</p> : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topCouts} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis type="number" fontSize={11} />
                  <YAxis type="category" dataKey="nom" width={110} fontSize={11} />
                  <Tooltip formatter={(v: number) => fmtMontant(Number(v))} />
                  <Bar dataKey="cout" name="Coût" fill="hsl(var(--warning))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Temps d'immobilisation par équipement</CardTitle></CardHeader>
          <CardContent className="h-80">
            {topImmobilisation.length === 0 ? <p className="text-sm text-muted-foreground">Aucune immobilisation enregistrée.</p> : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topImmobilisation} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis type="number" fontSize={11} />
                  <YAxis type="category" dataKey="nom" width={110} fontSize={11} />
                  <Tooltip formatter={(v: number) => `${fmtNombre(Number(v))} h`} />
                  <Bar dataKey="heures" name="Heures" fill="hsl(var(--info))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Répartition des interventions par statut</CardTitle></CardHeader>
          <CardContent className="h-72">
            {vide ? <p className="text-sm text-muted-foreground">Aucune intervention.</p> : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={repartitionStatut} dataKey="valeur" nameKey="nom" outerRadius={90} label>
                    {repartitionStatut.map((_, i) => <Cell key={i} fill={COULEURS[i % COULEURS.length]} />)}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Bell className="h-4 w-4" /> Alertes maintenance
            </CardTitle>
            <Badge variant={alertes.length ? 'destructive' : 'secondary'}>{alertes.length}</Badge>
          </CardHeader>
          <CardContent>
            {alertes.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">Aucune alerte : le parc est à jour.</p>
            ) : (
              <ScrollArea className="h-64 pr-3">
                <div className="space-y-2">
                  {alertes.map((a) => (
                    <button
                      key={a.id}
                      onClick={() => allerA(a.section, a.equipementId || undefined)}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-muted/60',
                        a.gravite === 'danger' ? 'border-destructive/30 bg-destructive/5' : 'border-warning/30 bg-warning/5'
                      )}
                    >
                      <span className={cn('h-2 w-2 shrink-0 rounded-full', a.gravite === 'danger' ? 'bg-destructive' : 'bg-warning')} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">{a.titre}</span>
                        <span className="block truncate text-xs text-muted-foreground">{a.detail}</span>
                      </span>
                      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                    </button>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
