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
    <Button onClick={exportPdf} disabled={exporting} className="gap-2 bg-orange-500 hover:bg-orange-600 text-white">
      {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
      Télécharger Rapport PDF
    </Button>
  );
};

function buildSvgLineChart(data: { month: string; revenue: number }[], width = 460, height = 200): string {
  if (data.length === 0) return '<p style="text-align:center;color:#999;">Aucune donnée</p>';
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
  // Area fill
  const areaPoints = `${padL},${padT + chartH} ${polyline} ${padL + chartW},${padT + chartH}`;

  const gridLines = [0, 0.25, 0.5, 0.75, 1].map(frac => {
    const y = padT + chartH - frac * chartH;
    const val = (frac * maxVal / 1e6).toFixed(0) + 'M';
    return `<line x1="${padL}" y1="${y}" x2="${width - padR}" y2="${y}" stroke="#e5e7eb" stroke-width="1" stroke-dasharray="4,3"/>
            <text x="${padL - 8}" y="${y + 4}" text-anchor="end" font-size="9" fill="#94a3b8">${val}</text>`;
  }).join('');

  const labels = points.map(p =>
    `<text x="${p.x}" y="${height - 8}" text-anchor="middle" font-size="8" fill="#94a3b8">${p.month}</text>`
  ).join('');

  const dots = points.map(p => `<circle cx="${p.x}" cy="${p.y}" r="4" fill="#f97316" stroke="white" stroke-width="2"/>`).join('');

  return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg" style="display:block;margin:0 auto;">
    <defs>
      <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#f97316" stop-opacity="0.2"/>
        <stop offset="100%" stop-color="#f97316" stop-opacity="0.02"/>
      </linearGradient>
    </defs>
    ${gridLines}
    <polygon points="${areaPoints}" fill="url(#areaGrad)"/>
    <polyline points="${polyline}" fill="none" stroke="#f97316" stroke-width="2.5"/>
    ${dots}
    ${labels}
  </svg>`;
}

function buildSvgBarChart(data: { date: string; count: number }[], width = 460, height = 200): string {
  if (data.length === 0) return '<p style="text-align:center;color:#999;">Aucune donnée</p>';
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
    return `<rect x="${x}" y="${y}" width="${barW}" height="${barH}" fill="#f97316" rx="3" opacity="0.85"/>
            <text x="${x + barW / 2}" y="${height - 8}" text-anchor="middle" font-size="7" fill="#94a3b8">${label}</text>`;
  }).join('');

  const gridLines = [0, 0.5, 1].map(frac => {
    const y = padT + chartH - frac * chartH;
    const val = Math.round(frac * maxVal);
    return `<line x1="${padL}" y1="${y}" x2="${width - padR}" y2="${y}" stroke="#e5e7eb" stroke-width="1" stroke-dasharray="4,3"/>
            <text x="${padL - 6}" y="${y + 4}" text-anchor="end" font-size="9" fill="#94a3b8">${val}</text>`;
  }).join('');

  return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg" style="display:block;margin:0 auto;">
    ${gridLines}
    ${bars}
  </svg>`;
}

function buildSvgHorizBarChart(data: { type: string; cost: number }[], width = 460, height = 200): string {
  if (data.length === 0) return '';
  const maxVal = Math.max(...data.map(d => d.cost), 1);
  const padL = 140, padR = 20, padT = 10, padB = 10;
  const chartW = width - padL - padR;
  const barH = Math.min(Math.max((height - padT - padB) / data.length - 4, 12), 28);

  const bars = data.map((d, i) => {
    const y = padT + i * ((height - padT - padB) / data.length) + ((height - padT - padB) / data.length - barH) / 2;
    const w = (d.cost / maxVal) * chartW;
    return `<text x="${padL - 8}" y="${y + barH / 2 + 4}" text-anchor="end" font-size="9" fill="#64748b">${d.type}</text>
            <rect x="${padL}" y="${y}" width="${w}" height="${barH}" fill="#ef4444" rx="4" opacity="0.8"/>`;
  }).join('');

  return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg" style="display:block;margin:0 auto;">${bars}</svg>`;
}

// SVG icons matching the dashboard
const svgIcons = {
  dollar: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>`,
  fileText: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>`,
  truck: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9333ea" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="3" width="15" height="13"/><polygon points="16,8 20,8 23,11 23,16 16,16"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>`,
  activity: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ea580c" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22,12 18,12 15,21 9,3 6,12 2,12"/></svg>`,
  users: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0891b2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
  wrench: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>`,
  alertTriangle: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#d97706" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
  shield: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9,12 12,15 16,10"/></svg>`,
  trendUp: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f97316" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23,6 13.5,15.5 8.5,10.5 1,18"/><polyline points="17,6 23,6 23,12"/></svg>`,
  barChart: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f97316" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>`,
  award: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#eab308" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="7"/><polyline points="8.21,13.89 7,23 12,20 17,23 15.79,13.88"/></svg>`,
  message: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`,
};

function buildReportHtml(data: MonthlyReportData, comments: SectionComments, title: string, monthName: string): string {
  const kpiCard = (icon: string, label: string, value: string, bgColor: string) => `
    <div class="kpi-card">
      <div class="kpi-icon" style="background:${bgColor};">${icon}</div>
      <div class="kpi-text">
        <div class="kpi-label">${label}</div>
        <div class="kpi-value">${value}</div>
      </div>
    </div>`;

  const commentBlock = (section: keyof SectionComments) => {
    if (!comments[section]) return '';
    return `<div class="comment-block">
      <div class="comment-header">${svgIcons.message} <span>Commentaire — ${sectionLabel(section)}</span></div>
      <p>${comments[section]}</p>
    </div>`;
  };

  const sectionLabel = (s: keyof SectionComments) => {
    const labels: Record<string, string> = { executive: 'Résumé Exécutif', operations: 'Opérations', fleet: 'Performance Flotte', maintenance: 'Maintenance', drivers: 'Chauffeurs', financial: 'Finances', hse: 'HSE', conclusion: 'Conclusion' };
    return labels[s] || s;
  };

  const tableHtml = (headers: string[], rows: string[][], opts?: { badges?: number[] }) => `
    <table>
      <thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>
      <tbody>${rows.map(r => `<tr>${r.map((c, ci) => {
        if (opts?.badges?.includes(ci)) {
          const isNeg = c.startsWith('-');
          const color = isNeg ? '#dc2626' : '#f97316';
          return `<td><span class="badge" style="background:${isNeg ? '#fef2f2' : '#fff7ed'};color:${color};border:1px solid ${isNeg ? '#fecaca' : '#fed7aa'};">${c}</span></td>`;
        }
        return `<td>${c}</td>`;
      }).join('')}</tr>`).join('')}</tbody>
    </table>`;

  const alertsHtml = data.alerts.length > 0
    ? data.alerts.map(a => {
      const styles = a.type === 'danger'
        ? 'background:#fef2f2;border-color:#ef4444;'
        : a.type === 'warning'
        ? 'background:#fffbeb;border-color:#f59e0b;'
        : 'background:#eff6ff;border-color:#3b82f6;';
      const badgeStyle = a.type === 'danger'
        ? 'background:#dc2626;color:white;'
        : a.type === 'warning'
        ? 'background:#f59e0b;color:white;'
        : 'background:#3b82f6;color:white;';
      const badgeText = a.type === 'danger' ? 'Critique' : a.type === 'warning' ? 'Attention' : 'Info';
      return `<div class="alert-item" style="${styles}">
        <div class="alert-content">
          <p class="alert-msg">${a.message}</p>
          <p class="alert-rec">💡 ${a.recommendation}</p>
        </div>
        <span class="alert-badge" style="${badgeStyle}">${badgeText}</span>
      </div>`;
    }).join('')
    : '<p style="color:#94a3b8;text-align:center;">Aucune alerte ce mois.</p>';

  const caChart = buildSvgLineChart(data.financial.revenue_trend);
  const blChart = buildSvgBarChart(data.operations.bl_par_jour);
  const maintChart = buildSvgHorizBarChart(data.maintenance.by_type);

  const pieData = [
    { name: 'Hydrocarbures', value: data.operations.breakdown_hydrocarbures, color: '#f97316' },
    { name: 'Bauxite', value: data.operations.breakdown_bauxite, color: '#3b82f6' },
    { name: 'Autres', value: data.operations.breakdown_autres, color: '#eab308' },
  ].filter(d => d.value > 0);

  const pieSvg = buildSvgPieChart(pieData, 200);

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<title>${title}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Plus Jakarta Sans', 'Segoe UI', sans-serif; color: #1e293b; padding: 24px; font-size: 11px; background: #f8fafc; }
  
  .header { text-align: center; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 2px solid #f1f5f9; }
  .header h1 { font-size: 22px; font-weight: 700; color: #0f172a; margin-bottom: 4px; }
  .header .subtitle { color: #64748b; font-size: 13px; font-weight: 500; }
  
  /* KPI Cards Grid */
  .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 16px; }
  .kpi-card { display: flex; align-items: center; gap: 10px; background: white; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px 14px; box-shadow: 0 1px 3px rgba(0,0,0,0.04); }
  .kpi-icon { width: 36px; height: 36px; border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .kpi-text { flex: 1; }
  .kpi-label { font-size: 10px; color: #94a3b8; font-weight: 500; text-transform: uppercase; letter-spacing: 0.02em; }
  .kpi-value { font-size: 17px; font-weight: 700; color: #0f172a; margin-top: 2px; }
  
  /* Cards */
  .card { background: white; border: 1px solid #e2e8f0; border-radius: 12px; margin-bottom: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.04); overflow: hidden; page-break-inside: avoid; }
  .card-header { padding: 14px 18px 10px; display: flex; align-items: center; gap: 8px; border-bottom: 1px solid #f1f5f9; }
  .card-header h2 { font-size: 14px; font-weight: 600; color: #0f172a; }
  .card-body { padding: 14px 18px 16px; }
  
  /* Charts row */
  .charts-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }
  .chart-title { font-size: 11px; font-weight: 600; color: #64748b; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 0.03em; }
  
  /* Tables */
  table { width: 100%; border-collapse: collapse; font-size: 10px; }
  thead { background: #f8fafc; }
  th { padding: 8px 10px; text-align: left; font-weight: 600; color: #64748b; border-bottom: 2px solid #e2e8f0; font-size: 9px; text-transform: uppercase; letter-spacing: 0.04em; }
  td { padding: 7px 10px; border-bottom: 1px solid #f1f5f9; color: #334155; }
  tr:hover { background: #f8fafc; }
  .font-medium { font-weight: 600; color: #0f172a; }
  .text-right { text-align: right; }
  
  /* Badge */
  .badge { display: inline-block; padding: 2px 8px; border-radius: 9999px; font-size: 9px; font-weight: 600; }
  
  /* Comment block */
  .comment-block { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px 16px; margin: 12px 0 16px; }
  .comment-header { display: flex; align-items: center; gap: 6px; font-size: 10px; color: #94a3b8; font-weight: 500; margin-bottom: 6px; }
  .comment-block p { font-size: 10.5px; color: #475569; line-height: 1.6; }
  
  /* Alert items */
  .alert-item { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; padding: 10px 14px; border-radius: 10px; border-left: 4px solid; margin-bottom: 8px; }
  .alert-content { flex: 1; }
  .alert-msg { font-size: 11px; font-weight: 600; color: #0f172a; }
  .alert-rec { font-size: 10px; color: #64748b; margin-top: 3px; }
  .alert-badge { padding: 3px 10px; border-radius: 9999px; font-size: 9px; font-weight: 600; white-space: nowrap; }
  
  /* HSE stat boxes */
  .hse-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 14px; }
  .hse-box { padding: 12px; border-radius: 10px; text-align: center; }
  .hse-box .val { font-size: 22px; font-weight: 700; }
  .hse-box .lbl { font-size: 9px; color: #64748b; margin-top: 2px; }
  
  /* NC detail boxes */
  .nc-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-bottom: 12px; }
  .nc-box { padding: 8px; border-radius: 8px; text-align: center; }
  .nc-box .val { font-size: 18px; font-weight: 700; }
  .nc-box .lbl { font-size: 8px; color: #64748b; }
  
  /* Financial summary */
  .fin-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
  .fin-box { padding: 16px; border-radius: 10px; text-align: center; }
  .fin-box .lbl { font-size: 10px; color: #64748b; margin-bottom: 4px; }
  .fin-box .val { font-size: 18px; font-weight: 700; }
  
  /* Conclusion */
  .conclusion-card { border: 2px solid rgba(249,115,22,0.2); }
  
  /* Footer */
  .footer { text-align: center; color: #94a3b8; font-size: 9px; margin-top: 24px; padding-top: 12px; border-top: 1px solid #e2e8f0; }
  
  /* Pie legend */
  .pie-legend { display: flex; gap: 16px; justify-content: center; margin-top: 8px; }
  .pie-legend-item { display: flex; align-items: center; gap: 5px; font-size: 10px; color: #64748b; }
  .pie-dot { width: 10px; height: 10px; border-radius: 50%; }
  
  @media print {
    body { padding: 12px; background: white; }
    .card { box-shadow: none; }
    .kpi-card { box-shadow: none; }
  }
</style>
</head>
<body>

<div class="header">
  <h1>📊 RAPPORT MENSUEL DE GESTION</h1>
  <div class="subtitle">SDBK Transport — ${monthName} ${data.year}</div>
</div>

<!-- KPI Cards -->
<div class="kpi-grid">
  ${kpiCard(svgIcons.dollar, "Chiffre d'affaires", formatCurrency(data.executive.total_revenue), '#f0fdf4')}
  ${kpiCard(svgIcons.fileText, "Bons de livraison", String(data.executive.total_bl), '#eff6ff')}
  ${kpiCard(svgIcons.truck, "Taux utilisation", `${data.executive.fleet_utilization_rate.toFixed(0)}%`, '#faf5ff')}
  ${kpiCard(svgIcons.activity, "Missions", String(data.executive.total_missions), '#fff7ed')}
  ${kpiCard(svgIcons.users, "Chauffeurs actifs", String(data.executive.total_drivers), '#ecfeff')}
  ${kpiCard(svgIcons.wrench, "Coût maintenance", formatCurrency(data.executive.total_maintenance_cost), '#fef2f2')}
  ${kpiCard(svgIcons.alertTriangle, "Non-Conformités (NC)", String(data.executive.total_incidents), '#fffbeb')}
  ${kpiCard(svgIcons.shield, "Contrôles HSE", String(data.hse.total_controls), '#ecfdf5')}
</div>

${commentBlock('executive')}

<!-- Alerts -->
${data.alerts.length > 0 ? `
<div class="card">
  <div class="card-header">${svgIcons.alertTriangle} <h2>Alertes & Recommandations</h2></div>
  <div class="card-body">${alertsHtml}</div>
</div>` : ''}

<!-- Charts -->
<div class="charts-row">
  <div class="card">
    <div class="card-header">${svgIcons.trendUp} <h2>Évolution CA (6 mois)</h2></div>
    <div class="card-body">${caChart}</div>
  </div>
  <div class="card">
    <div class="card-header">${svgIcons.barChart} <h2>BL saisis par jour</h2></div>
    <div class="card-body">${blChart}</div>
  </div>
</div>

<!-- Operations -->
<div class="card">
  <div class="card-header"><h2>Opérations</h2></div>
  <div class="card-body">
    <div class="kpi-grid" style="grid-template-columns: repeat(4, 1fr);">
      ${kpiCard('', 'Volume total', `${data.operations.total_tonnage.toLocaleString()} L/T`, '#f0fdf4')}
      ${kpiCard('', 'Hydrocarbures', `${data.operations.breakdown_hydrocarbures} BL`, '#fff7ed')}
      ${kpiCard('', 'Bauxite', `${data.operations.breakdown_bauxite} BL`, '#eff6ff')}
      ${kpiCard('', 'Autres', `${data.operations.breakdown_autres} BL`, '#f8fafc')}
    </div>
    ${pieData.length > 0 ? `<div style="text-align:center;margin-top:12px;">${pieSvg}</div>` : ''}
  </div>
</div>

${commentBlock('operations')}

<!-- Fleet Performance -->
<div class="charts-row">
  <div class="card">
    <div class="card-header">${svgIcons.award} <h2>Top 5 Véhicules</h2></div>
    <div class="card-body">
      ${tableHtml(['#', 'Véhicule', 'Missions/BL'], data.fleet.top5_vehicles.map((v, i) => [String(i + 1), `<span class="font-medium">${v.numero}</span>`, `<span class="text-right">${v.missions}</span>`]))}
      ${data.fleet.top5_vehicles.length === 0 ? '<p style="text-align:center;color:#94a3b8;padding:12px;">Aucune donnée</p>' : ''}
    </div>
  </div>
  <div class="card">
    <div class="card-header">${svgIcons.users} <h2>Top 5 Chauffeurs</h2></div>
    <div class="card-body">
      ${tableHtml(['#', 'Chauffeur', 'Missions', 'Score'], data.drivers.top5.map((d, i) => [String(i + 1), `<span class="font-medium">${d.nom} ${d.prenom}</span>`, String(d.missions), String(d.score)]), { badges: [3] })}
      ${data.drivers.top5.length === 0 ? '<p style="text-align:center;color:#94a3b8;padding:12px;">Aucune donnée</p>' : ''}
    </div>
  </div>
</div>

<div class="charts-row">
  <div class="card">
    <div class="card-header">${svgIcons.truck} <h2>Flop 5 Véhicules</h2></div>
    <div class="card-body">
      ${tableHtml(['#', 'Véhicule', 'Missions/BL'], data.fleet.flop5_vehicles.map((v, i) => [String(i + 1), `<span class="font-medium">${v.numero}</span>`, String(v.missions)]))}
    </div>
  </div>
  <div class="card">
    <div class="card-header">${svgIcons.shield} <h2>Bilan HSE</h2></div>
    <div class="card-body">
      <div class="hse-grid">
        <div class="hse-box" style="background:#ecfdf5;"><div class="val" style="color:#059669;">${data.hse.conformes}</div><div class="lbl">Conformes</div></div>
        <div class="hse-box" style="background:#fef2f2;"><div class="val" style="color:#dc2626;">${data.hse.non_conformes}</div><div class="lbl">Non conformes</div></div>
        <div class="hse-box" style="background:#eff6ff;"><div class="val" style="color:#2563eb;">${data.hse.total_controls}</div><div class="lbl">Total contrôles</div></div>
        <div class="hse-box" style="background:#fffbeb;"><div class="val" style="color:#d97706;">${data.hse.non_conformites}</div><div class="lbl">NC</div></div>
      </div>
      ${data.hse.non_conformites > 0 ? `
        <div class="nc-grid">
          <div class="nc-box" style="background:#fef2f2;"><div class="val" style="color:#dc2626;">${data.hse.nc_details.critiques}</div><div class="lbl">Critiques</div></div>
          <div class="nc-box" style="background:#fff7ed;"><div class="val" style="color:#ea580c;">${data.hse.nc_details.majeures}</div><div class="lbl">Majeures</div></div>
          <div class="nc-box" style="background:#fefce8;"><div class="val" style="color:#ca8a04;">${data.hse.nc_details.mineures}</div><div class="lbl">Mineures</div></div>
        </div>
        ${data.hse.nc_details.par_categorie.length > 0 ? `
          <p style="font-size:10px;font-weight:600;color:#64748b;margin-bottom:6px;">Par catégorie</p>
          ${data.hse.nc_details.par_categorie.map(c => `
            <div style="display:flex;justify-content:space-between;align-items:center;padding:4px 8px;margin-bottom:3px;background:#f8fafc;border-radius:6px;font-size:10px;">
              <span style="color:#475569;">${c.categorie.replace('Contrôle inopiné - ', '')}</span>
              <span style="font-weight:700;color:#0f172a;">${c.count}</span>
            </div>
          `).join('')}
        ` : ''}
        ${data.hse.nc_details.vehicules.length > 0 ? `
          <p style="font-size:10px;font-weight:600;color:#64748b;margin:10px 0 6px;">Véhicules concernés</p>
          ${tableHtml(
            ['N° NC', 'Citerne', 'Chauffeur', 'Type', 'Date'],
            data.hse.nc_details.vehicules.map(v => [v.numero_nc, `<span class="font-medium">${v.citerne}</span>`, v.chauffeur, v.type_nc, v.date]),
            { badges: [3] }
          )}
        ` : ''}
      ` : ''}
    </div>
  </div>
</div>

${commentBlock('fleet')}

<!-- Maintenance -->
${data.maintenance.by_type.length > 0 ? `
<div class="card">
  <div class="card-header">${svgIcons.wrench} <h2>Maintenance par type</h2></div>
  <div class="card-body">
    <div class="kpi-grid" style="grid-template-columns: repeat(3, 1fr); margin-bottom: 14px;">
      ${kpiCard('', 'Pannes', String(data.maintenance.total_breakdowns), '#fef2f2')}
      ${kpiCard('', 'Durée totale (h)', String(data.maintenance.total_downtime), '#fffbeb')}
      ${kpiCard('', 'Coût total', formatCurrency(data.maintenance.total_cost), '#fef2f2')}
    </div>
    ${maintChart}
    ${tableHtml(['Type', 'Nombre', 'Coût'], data.maintenance.by_type.map(m => [m.type, String(m.count), formatCurrency(m.cost)]))}
  </div>
</div>` : `
<div class="card">
  <div class="card-header">${svgIcons.wrench} <h2>Maintenance</h2></div>
  <div class="card-body">
    <div class="kpi-grid" style="grid-template-columns: repeat(3, 1fr);">
      ${kpiCard('', 'Pannes', String(data.maintenance.total_breakdowns), '#fef2f2')}
      ${kpiCard('', 'Durée totale (h)', String(data.maintenance.total_downtime), '#fffbeb')}
      ${kpiCard('', 'Coût total', formatCurrency(data.maintenance.total_cost), '#fef2f2')}
    </div>
  </div>
</div>`}

${commentBlock('maintenance')}
${commentBlock('drivers')}

<!-- Financial Summary -->
<div class="card">
  <div class="card-header">${svgIcons.dollar} <h2>Résumé Financier</h2></div>
  <div class="card-body">
    <div class="fin-grid">
      <div class="fin-box" style="background:#f0fdf4;">
        <div class="lbl">Revenus</div>
        <div class="val" style="color:#16a34a;">${formatCurrency(data.financial.revenue)}</div>
      </div>
      <div class="fin-box" style="background:#fef2f2;">
        <div class="lbl">Coûts maintenance</div>
        <div class="val" style="color:#dc2626;">${formatCurrency(data.financial.maintenance_cost)}</div>
      </div>
      <div class="fin-box" style="background:#eff6ff;">
        <div class="lbl">Profit estimé</div>
        <div class="val" style="color:${data.financial.estimated_profit >= 0 ? '#2563eb' : '#dc2626'};">${formatCurrency(data.financial.estimated_profit)}</div>
      </div>
    </div>
  </div>
</div>

${commentBlock('financial')}
${commentBlock('hse')}

<!-- Conclusion -->
<div class="card conclusion-card">
  <div class="card-header">${svgIcons.message} <h2>Conclusion du rapport</h2></div>
  <div class="card-body">
    <p style="font-size:11px;line-height:1.7;color:#334155;">${comments.conclusion}</p>
  </div>
</div>

<div class="footer">
  Rapport généré automatiquement — SDBK Transport © ${data.year} — ${new Date().toLocaleDateString('fr-FR')}
</div>

</body>
</html>`;
}

function buildSvgPieChart(data: { name: string; value: number; color: string }[], size = 200): string {
  if (data.length === 0) return '';
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) return '';
  const cx = size / 2, cy = size / 2, r = size / 2 - 10;
  let startAngle = -Math.PI / 2;

  const slices = data.map(d => {
    const angle = (d.value / total) * 2 * Math.PI;
    const endAngle = startAngle + angle;
    const x1 = cx + r * Math.cos(startAngle);
    const y1 = cy + r * Math.sin(startAngle);
    const x2 = cx + r * Math.cos(endAngle);
    const y2 = cy + r * Math.sin(endAngle);
    const largeArc = angle > Math.PI ? 1 : 0;
    const midAngle = startAngle + angle / 2;
    const labelR = r * 0.65;
    const lx = cx + labelR * Math.cos(midAngle);
    const ly = cy + labelR * Math.sin(midAngle);
    const pct = Math.round((d.value / total) * 100);
    const path = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;
    startAngle = endAngle;
    return { path, color: d.color, name: d.name, pct, lx, ly };
  });

  const svg = slices.map(s =>
    `<path d="${s.path}" fill="${s.color}" opacity="0.85"/>
     <text x="${s.lx}" y="${s.ly}" text-anchor="middle" dominant-baseline="middle" font-size="10" fill="white" font-weight="600">${s.pct}%</text>`
  ).join('');

  const legend = data.map(d =>
    `<span class="pie-legend-item"><span class="pie-dot" style="background:${d.color};"></span>${d.name} (${d.value})</span>`
  ).join('');

  return `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg" style="display:block;margin:0 auto;">${svg}</svg>
  <div class="pie-legend">${legend}</div>`;
}
