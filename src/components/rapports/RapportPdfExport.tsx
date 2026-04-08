import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileDown, Loader2 } from 'lucide-react';
import { MonthlyReportData } from '@/services/rapportsService';
import { SectionComments } from './autoComments';
import { toast } from 'sonner';

const MONTHS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
const formatCurrency = (n: number) => new Intl.NumberFormat('fr-GN', { style: 'currency', currency: 'GNF', maximumFractionDigits: 0 }).format(n);

interface Props {
  data: MonthlyReportData;
  comments: SectionComments;
}

export const RapportPdfExport: React.FC<Props> = ({ data, comments }) => {
  const [exporting, setExporting] = useState(false);

  const exportPdf = async () => {
    setExporting(true);
    try {
      const monthName = MONTHS[data.month - 1];
      const title = `Rapport Mensuel SDBK - ${monthName} ${data.year}`;
      const html = buildReportHtml(data, comments, title, monthName);

      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        toast.error('Popup bloqué. Autorisez les popups pour exporter.');
        return;
      }
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.onload = () => { setTimeout(() => { printWindow.print(); }, 500); };
      toast.success('Rapport prêt pour impression/PDF');
    } catch (err) {
      toast.error("Erreur lors de l'export");
      console.error(err);
    } finally {
      setExporting(false);
    }
  };

  return (
    <Button onClick={exportPdf} disabled={exporting} className="gap-2">
      {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
      Télécharger Rapport PDF
    </Button>
  );
};

function buildReportHtml(data: MonthlyReportData, comments: SectionComments, title: string, monthName: string): string {
  const section = (title: string, content: string, comment?: string) => `
    <div class="section">
      <h2>${title}</h2>
      ${content}
      ${comment ? `<div class="comment"><strong>Commentaire :</strong> ${comment}</div>` : ''}
    </div>
  `;

  const kpiRow = (items: { label: string; value: string }[]) =>
    `<div class="kpi-row">${items.map(i => `<div class="kpi"><div class="kpi-value">${i.value}</div><div class="kpi-label">${i.label}</div></div>`).join('')}</div>`;

  const tableHtml = (headers: string[], rows: string[][]) => `
    <table>
      <thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>
      <tbody>${rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody>
    </table>
  `;

  const alertsHtml = data.alerts.length > 0
    ? data.alerts.map(a => `<div class="alert alert-${a.type}"><strong>${a.message}</strong><br/><small>💡 ${a.recommendation}</small></div>`).join('')
    : '<p>Aucune alerte ce mois.</p>';

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<title>${title}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', Tahoma, sans-serif; color: #1a1a1a; padding: 20px; font-size: 11px; }
  h1 { font-size: 20px; text-align: center; margin-bottom: 4px; color: #1e3a5f; }
  .subtitle { text-align: center; color: #666; margin-bottom: 20px; font-size: 12px; }
  .section { margin-bottom: 18px; page-break-inside: avoid; }
  h2 { font-size: 14px; color: #1e3a5f; border-bottom: 2px solid #e0e7ef; padding-bottom: 4px; margin-bottom: 10px; }
  .kpi-row { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 10px; }
  .kpi { flex: 1; min-width: 120px; border: 1px solid #e0e7ef; border-radius: 6px; padding: 10px; text-align: center; }
  .kpi-value { font-size: 18px; font-weight: bold; color: #1e3a5f; }
  .kpi-label { font-size: 9px; color: #666; margin-top: 2px; }
  table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 10px; }
  th { background: #f0f4f8; padding: 6px 8px; text-align: left; border: 1px solid #ddd; font-weight: 600; }
  td { padding: 5px 8px; border: 1px solid #ddd; }
  tr:nth-child(even) { background: #f8fafc; }
  .comment { margin-top: 10px; padding: 10px 14px; background: #f0f7ff; border-left: 4px solid #3b82f6; border-radius: 4px; font-size: 10px; line-height: 1.5; color: #1e3a5f; }
  .alert { padding: 8px 12px; border-radius: 6px; margin-bottom: 6px; border-left: 4px solid; }
  .alert-danger { background: #fef2f2; border-color: #ef4444; }
  .alert-warning { background: #fffbeb; border-color: #f59e0b; }
  .alert-info { background: #eff6ff; border-color: #3b82f6; }
  .conclusion { margin-top: 20px; padding: 14px 18px; background: #f0f4f8; border: 2px solid #1e3a5f; border-radius: 8px; font-size: 11px; line-height: 1.6; }
  .conclusion h2 { border: none; margin-bottom: 8px; }
  .footer { text-align: center; color: #999; font-size: 9px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 10px; }
  @media print { body { padding: 10px; } .section { page-break-inside: avoid; } }
</style>
</head>
<body>
<h1>📊 RAPPORT MENSUEL DE GESTION</h1>
<p class="subtitle">SDBK Transport — ${monthName} ${data.year}</p>

${section('1. Résumé Exécutif', kpiRow([
  { label: "Chiffre d'affaires", value: formatCurrency(data.executive.total_revenue) },
  { label: 'Missions', value: String(data.executive.total_missions) },
  { label: 'Bons de livraison', value: String(data.executive.total_bl) },
  { label: "Taux d'utilisation", value: `${data.executive.fleet_utilization_rate.toFixed(0)}%` },
]) + kpiRow([
  { label: 'Véhicules actifs', value: `${data.executive.active_vehicles}/${data.executive.total_vehicles}` },
  { label: 'Chauffeurs actifs', value: String(data.executive.total_drivers) },
  { label: 'Incidents', value: String(data.executive.total_incidents) },
  { label: 'Coût maintenance', value: formatCurrency(data.executive.total_maintenance_cost) },
]), comments.executive)}

${section('2. Opérations', kpiRow([
  { label: 'Volume total', value: `${data.operations.total_tonnage.toLocaleString()} L/T` },
  { label: 'Hydrocarbures', value: `${data.operations.breakdown_hydrocarbures} BL` },
  { label: 'Bauxite', value: `${data.operations.breakdown_bauxite} BL` },
  { label: 'Autres', value: `${data.operations.breakdown_autres} BL` },
]), comments.operations)}

${section('3. Performance Flotte', `
  <p>Rotation moyenne: <strong>${data.fleet.avg_rotations.toFixed(1)}</strong> missions/véhicule</p>
  <h3 style="margin: 8px 0 4px; font-size: 11px;">Top 5 Véhicules</h3>
  ${tableHtml(['#', 'Véhicule', 'Missions/BL'], data.fleet.top5_vehicles.map((v, i) => [String(i + 1), v.numero, String(v.missions)]))}
  <h3 style="margin: 8px 0 4px; font-size: 11px;">Flop 5 Véhicules</h3>
  ${tableHtml(['#', 'Véhicule', 'Missions/BL'], data.fleet.flop5_vehicles.map((v, i) => [String(i + 1), v.numero, String(v.missions)]))}
`, comments.fleet)}

${section('4. Maintenance', kpiRow([
  { label: 'Pannes', value: String(data.maintenance.total_breakdowns) },
  { label: 'Durée totale (h)', value: String(data.maintenance.total_downtime) },
  { label: 'Coût total', value: formatCurrency(data.maintenance.total_cost) },
]) + (data.maintenance.by_type.length > 0 ? tableHtml(['Type', 'Nombre', 'Coût'], data.maintenance.by_type.map(m => [m.type, String(m.count), formatCurrency(m.cost)])) : ''), comments.maintenance)}

${section('5. Performance Chauffeurs', `
  <h3 style="margin-bottom: 4px; font-size: 11px;">Top 5 Chauffeurs</h3>
  ${tableHtml(['#', 'Chauffeur', 'Missions', 'Score'], data.drivers.top5.map((d, i) => [String(i + 1), `${d.nom} ${d.prenom}`, String(d.missions), String(d.score)]))}
  ${data.drivers.worst_incidents.length > 0 ? `
    <h3 style="margin: 8px 0 4px; font-size: 11px;">Chauffeurs avec incidents</h3>
    ${tableHtml(['Chauffeur', 'Incidents'], data.drivers.worst_incidents.map(d => [`${d.nom} ${d.prenom}`, String(d.incidents)]))}
  ` : ''}
`, comments.drivers)}

${section('6. Résumé Financier', kpiRow([
  { label: 'Revenus', value: formatCurrency(data.financial.revenue) },
  { label: 'Coûts maintenance', value: formatCurrency(data.financial.maintenance_cost) },
  { label: 'Profit estimé', value: formatCurrency(data.financial.estimated_profit) },
]), comments.financial)}

${section('7. HSE', kpiRow([
  { label: 'Total contrôles', value: String(data.hse.total_controls) },
  { label: 'Conformes', value: String(data.hse.conformes) },
  { label: 'Non conformes', value: String(data.hse.non_conformes) },
  { label: 'Non-conformités', value: String(data.hse.non_conformites) },
]), comments.hse)}

${section('8. Alertes & Recommandations', alertsHtml)}

<div class="conclusion">
  <h2>9. Conclusion</h2>
  <p>${comments.conclusion}</p>
</div>

<div class="footer">
  Rapport généré automatiquement — SDBK Transport © ${data.year} — ${new Date().toLocaleDateString('fr-FR')}
</div>
</body>
</html>`;
}
