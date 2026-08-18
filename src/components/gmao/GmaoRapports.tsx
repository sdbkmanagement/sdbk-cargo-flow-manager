import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileSpreadsheet, FileText, BarChart3 } from 'lucide-react';
import { useGmao } from './GmaoContext';
import { fmtDate, fmtMontant, KpiCard, libelle, STATUTS_EQUIPEMENT, TYPES_MAINTENANCE } from './gmaoUi';
import { exporterExcel, exporterPdf } from '@/utils/gmaoExport';
import { Gauge, Timer, Wrench, Coins } from 'lucide-react';

type Rapport = 'interventions' | 'preventif' | 'correctif' | 'couts' | 'pieces' | 'immobilisation' | 'parc';

const RAPPORTS: { value: Rapport; label: string; description: string }[] = [
  { value: 'interventions', label: 'Toutes les interventions', description: 'Liste détaillée des interventions sur la période' },
  { value: 'preventif', label: 'Maintenance préventive', description: 'Interventions préventives réalisées et planifiées' },
  { value: 'correctif', label: 'Pannes et correctif', description: 'Interventions correctives par équipement' },
  { value: 'couts', label: 'Coûts par équipement', description: 'Synthèse financière par immatriculation' },
  { value: 'pieces', label: 'Pièces et stock', description: 'État du stock, seuils et valorisation' },
  { value: 'immobilisation', label: 'Immobilisation & disponibilité', description: "Temps d'immobilisation par équipement" },
  { value: 'parc', label: 'Parc d\'équipements', description: 'Inventaire complet des immatriculations' },
];

export const GmaoRapports: React.FC = () => {
  const { ots, equipements, pieces, statsParEquipement, equipementParId } = useGmao();
  const [rapport, setRapport] = useState<Rapport>('interventions');
  const [debut, setDebut] = useState('');
  const [fin, setFin] = useState('');

  const otsPeriode = useMemo(
    () =>
      ots.filter((o) => {
        const d = o.date_fin || o.date_debut || o.date_planifiee || o.created_at;
        if (debut && (!d || new Date(d) < new Date(`${debut}T00:00:00`))) return false;
        if (fin && (!d || new Date(d) > new Date(`${fin}T23:59:59`))) return false;
        return true;
      }),
    [ots, debut, fin]
  );

  const kpis = useMemo(() => {
    const total = otsPeriode.length;
    const preventif = otsPeriode.filter((o) => o.type_maintenance === 'preventif').length;
    const cout = otsPeriode.reduce((s, o) => s + Number(o.cout_total || 0), 0);
    const immobilisation = otsPeriode.reduce((s, o) => s + Number(o.duree_immobilisation_heures || 0), 0);
    const clotures = otsPeriode.filter((o) => o.cloture);
    const mttr = clotures.length ? immobilisation / clotures.length : 0;
    return {
      total,
      tauxPreventif: total ? Math.round((preventif / total) * 100) : 0,
      cout,
      immobilisation,
      mttr,
      coutMoyen: total ? cout / total : 0,
    };
  }, [otsPeriode]);

  const donnees = useMemo((): Record<string, any>[] => {
    const nomEq = (id?: string | null) => {
      const e = equipementParId(id);
      return e ? (e.immatriculation || e.code) : 'Non rattaché';
    };

    switch (rapport) {
      case 'preventif':
      case 'correctif':
      case 'interventions':
        return otsPeriode
          .filter((o) =>
            rapport === 'interventions' ? true :
            rapport === 'preventif' ? o.type_maintenance === 'preventif' : o.type_maintenance === 'correctif'
          )
          .map((o) => ({
            'N°': o.numero || '—',
            Immatriculation: nomEq(o.equipement_id),
            Intervention: o.titre,
            Type: libelle(TYPES_MAINTENANCE, o.type_maintenance),
            Date: fmtDate(o.date_fin || o.date_debut || o.date_planifiee),
            'Immobilisation (h)': Number(o.duree_immobilisation_heures || 0),
            'Coût total (GNF)': Math.round(Number(o.cout_total || 0)),
            Statut: o.cloture ? 'Validée' : o.statut,
          }));
      case 'couts':
        return equipements.map((e) => {
          const s = statsParEquipement[e.id];
          return {
            Immatriculation: e.immatriculation || e.code,
            Interventions: s?.interventions || 0,
            'Pièces (GNF)': Math.round(s?.coutPieces || 0),
            'Main-d’œuvre (GNF)': Math.round(s?.coutMainOeuvre || 0),
            'Prestations (GNF)': Math.round(s?.coutPrestation || 0),
            'Total (GNF)': Math.round(s?.coutTotal || 0),
          };
        }).sort((a, b) => Number(b['Total (GNF)']) - Number(a['Total (GNF)']));
      case 'pieces':
        return pieces.map((p) => ({
          Référence: p.reference,
          Désignation: p.designation,
          Catégorie: p.categorie || '—',
          Stock: Number(p.quantite_stock),
          'Seuil mini': Number(p.seuil_mini),
          'Prix unitaire (GNF)': Math.round(Number(p.prix_unitaire || 0)),
          'Valeur stock (GNF)': Math.round(Number(p.quantite_stock) * Number(p.prix_unitaire || 0)),
          État: Number(p.quantite_stock) === 0 ? 'Indisponible' : Number(p.quantite_stock) <= Number(p.seuil_mini) ? 'Sous seuil' : 'OK',
        }));
      case 'immobilisation':
        return equipements.map((e) => {
          const s = statsParEquipement[e.id];
          return {
            Immatriculation: e.immatriculation || e.code,
            Statut: libelle(STATUTS_EQUIPEMENT, e.statut),
            Interventions: s?.interventions || 0,
            Pannes: s?.pannes || 0,
            'Immobilisation (h)': Math.round(s?.immobilisationHeures || 0),
            'Dernière maintenance': fmtDate(s?.derniereMaintenance),
          };
        }).sort((a, b) => Number(b['Immobilisation (h)']) - Number(a['Immobilisation (h)']));
      default:
        return equipements.map((e) => {
          const s = statsParEquipement[e.id];
          return {
            Immatriculation: e.immatriculation || e.code,
            Code: e.code,
            Type: e.type_equipement,
            'Marque / modèle': [e.marque, e.modele].filter(Boolean).join(' ') || '—',
            Kilométrage: Number(e.compteur_km || 0),
            Statut: libelle(STATUTS_EQUIPEMENT, e.statut),
            'Prochaine maintenance': fmtDate(s?.prochaineEcheance),
            'Coût cumulé (GNF)': Math.round(s?.coutTotal || 0),
          };
        });
    }
  }, [rapport, otsPeriode, equipements, pieces, statsParEquipement, equipementParId]);

  const titre = RAPPORTS.find((r) => r.value === rapport)?.label || 'Rapport GMAO';
  const periode = `Période : ${debut ? fmtDate(debut) : 'origine'} → ${fin ? fmtDate(fin) : "aujourd'hui"}`;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Interventions" valeur={kpis.total} icon={Wrench} />
        <KpiCard label="Taux de préventif" valeur={`${kpis.tauxPreventif} %`} icon={Gauge} ton="succes" />
        <KpiCard label="MTTR (h / intervention)" valeur={Math.round(kpis.mttr)} icon={Timer} ton="info" />
        <KpiCard label="Coût moyen" valeur={fmtMontant(kpis.coutMoyen)} icon={Coins} ton="alerte" detail={`Total ${fmtMontant(kpis.cout)}`} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><BarChart3 className="h-4 w-4" /> Générateur de rapports</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-4">
            <div className="md:col-span-2">
              <Label>Type de rapport</Label>
              <Select value={rapport} onValueChange={(v) => setRapport(v as Rapport)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{RAPPORTS.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}</SelectContent>
              </Select>
              <p className="mt-1 text-xs text-muted-foreground">{RAPPORTS.find((r) => r.value === rapport)?.description}</p>
            </div>
            <div><Label>Du</Label><Input type="date" value={debut} onChange={(e) => setDebut(e.target.value)} /></div>
            <div><Label>Au</Label><Input type="date" value={fin} onChange={(e) => setFin(e.target.value)} /></div>
          </div>

          <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-muted/30 p-3">
            <span className="text-sm text-muted-foreground">{donnees.length} ligne(s) — {periode}</span>
            <div className="ml-auto flex gap-2">
              <Button variant="outline" size="sm" disabled={!donnees.length} onClick={() => exporterExcel(donnees, `gmao-${rapport}`, titre)}>
                <FileSpreadsheet className="mr-2 h-4 w-4" /> Exporter Excel
              </Button>
              <Button size="sm" disabled={!donnees.length} onClick={() =>
                exporterPdf(titre, Object.keys(donnees[0] || {}), donnees.map((r) => Object.values(r) as any), `gmao-${rapport}`, periode)
              }>
                <FileText className="mr-2 h-4 w-4" /> Exporter PDF
              </Button>
            </div>
          </div>

          <div className="max-h-[28rem] overflow-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-muted/80 backdrop-blur">
                <tr>
                  {Object.keys(donnees[0] || {}).map((c) => (
                    <th key={c} className="whitespace-nowrap px-3 py-2 text-left font-medium">{c}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {donnees.length === 0 && (
                  <tr><td className="px-3 py-8 text-center text-muted-foreground">Aucune donnée pour ce rapport.</td></tr>
                )}
                {donnees.slice(0, 300).map((r, i) => (
                  <tr key={i} className="border-t border-border/60 hover:bg-muted/40">
                    {Object.values(r).map((v, j) => (
                      <td key={j} className="whitespace-nowrap px-3 py-2">{String(v)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {donnees.length > 300 && (
            <p className="text-xs text-muted-foreground">Aperçu limité à 300 lignes — l'export contient la totalité des {donnees.length} lignes.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
