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

function buildSvgLineChart(data: { month: string; revenue: number }[], width = 500, height = 200): string {
  if (data.length === 0) return '';
  const maxVal = Math.max(...data.map(d => d.revenue), 1);
  const padL = 70, padR = 20, padT = 20, padB = 40;
  const chartW = width - padL - padR;
  const chartH = height - padT - padB;
  
  const points = data.map((d, i) => {
    const x = padL + (i / Math.max(data.length - 1, 1)) * chartW;
    const y = padT + chartH - (d.revenue / maxVal) * chartH;
    return { x, y, ...d };
  });

  const polyline = points.map(p => `${p.x},${p.y}`).join(' ');
  const gridLines = [0, 0.25, 0.5, 0.75, 1].map(frac => {
    const y = padT + chartH - frac * chartH;
    const val = (frac * maxVal / 1e6).toFixed(0) + 'M';
    return `<line x1="${padL}" y1="${y}" x2="${width - padR}" y2="${y}" stroke="#e5e7eb" stroke-width="1"/>
            <text x="${padL - 8}" y="${y + 4}" text-anchor="end" font-size="9" fill="#666">${val}</text>`;
  }).join('');

  const labels = points.map(p => 
    `<text x="${p.x}" y="${height - 8}" text-anchor="middle" font-size="8" fill="#666">${p.month}</text>`
  ).join('');

  const dots = points.map(p => `<circle cx="${p.x}" cy="${p.y}" r="3.5" fill="#1e3a5f" stroke="white" stroke-width="1.5"/>`).join('');

  return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    ${gridLines}
    <polyline points="${polyline}" fill="none" stroke="#1e3a5f" stroke-width="2"/>
    ${dots}
    ${labels}
  </svg>`;
}

function buildSvgBarChart(data: { date: string; count: number }[], width = 500, height = 200): string {
  if (data.length === 0) return '';
  const maxVal = Math.max(...data.map(d => d.count), 1);
  const padL = 40, padR = 10, padT = 15, padB = 40;
  const chartW = width - padL - padR;
  const chartH = height - padT - padB;
  const barW = Math.min(Math.max(chartW / data.length - 2, 4), 20);

  const bars = data.map((d, i) => {
    const x = padL + (i + 0.5) * (chartW / data.length) - barW / 2;
    const barH = (d.count / maxVal) * chartH;
    const y = padT + chartH - barH;
    const label = d.date.slice(5).replace('-', '/');
    return `<rect x="${x}" y="${y}" width="${barW}" height="${barH}" fill="#3b82f6" rx="2"/>
            <text x="${x + barW / 2}" y="${height - 8}" text-anchor="middle" font-size="7" fill="#666">${label}</text>`;
  }).join('');

  const gridLines = [0, 0.5, 1].map(frac => {
    const y = padT + chartH - frac * chartH;
    const val = Math.round(frac * maxVal);
    return `<line x1="${padL}" y1="${y}" x2="${width - padR}" y2="${y}" stroke="#e5e7eb" stroke-width="1"/>
            <text x="${padL - 6}" y="${y + 4}" text-anchor="end" font-size="9" fill="#666">${val}</text>`;
  }).join('');

  return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    ${gridLines}
    ${bars}
  </svg>`;
}

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

  const caChart = buildSvgLineChart(data.financial.revenue_trend);
  const blChart = buildSvgBarChart(data.operations.bl_par_jour);

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
  .charts-row { display: flex; gap: 20px; margin: 15px 0; }
  .chart-box { flex: 1; border: 1px solid #e0e7ef; border-radius: 8px; padding: 12px; text-align: center; }
  .chart-box h3 { font-size: 11px; color: #1e3a5f; margin-bottom: 8px; }
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
  { label: 'Non-Conformités (NC)', value: String(data.executive.total_incidents) },
  { label: 'Coût maintenance', value: formatCurrency(data.executive.total_maintenance_cost) },
]), comments.executive)}

<div class="charts-row">
  <div class="chart-box">
    <h3>📈 Évolution CA (6 mois)</h3>
    ${caChart}
  </div>
  <div class="chart-box">
    <h3>📊 BL saisis par jour</h3>
    ${blChart}
  </div>
</div>

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
    <h3 style="margin: 8px 0 4px; font-size: 11px;">Chauffeurs avec NC</h3>
    ${tableHtml(['Chauffeur', 'NC'], data.drivers.worst_incidents.map(d => [`${d.nom} ${d.prenom}`, String(d.incidents)]))}
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
  { label: 'Non-Conformités (NC)', value: String(data.hse.non_conformites) },
]) + (data.hse.non_conformites > 0 ? `
  <h3 style="margin: 8px 0 4px; font-size: 11px;">Détail NC par gravité</h3>
  ${tableHtml(['Gravité', 'Nombre'], [
    ['Critiques', String(data.hse.nc_details.critiques)],
    ['Majeures', String(data.hse.nc_details.majeures)],
    ['Mineures', String(data.hse.nc_details.mineures)],
  ])}
  ${data.hse.nc_details.par_categorie.length > 0 ? `
    <h3 style="margin: 8px 0 4px; font-size: 11px;">NC par catégorie</h3>
    ${tableHtml(['Catégorie', 'Nombre'], data.hse.nc_details.par_categorie.map(c => [c.categorie.replace('Contrôle inopiné - ', ''), String(c.count)]))}
  ` : ''}
` : ''), comments.hse)}

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
