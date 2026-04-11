import { MonthlyReportData } from '@/services/rapportsService';

const MONTHS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
const formatCurrency = (n: number) => new Intl.NumberFormat('fr-GN', { style: 'currency', currency: 'GNF', maximumFractionDigits: 0 }).format(n);

export interface SectionComments {
  executive: string;
  operations: string;
  fleet: string;
  maintenance: string;
  drivers: string;
  financial: string;
  hse: string;
  conclusion: string;
}

export function generateAutoComments(data: MonthlyReportData): SectionComments {
  const monthName = MONTHS[data.month - 1];

  // Executive
  const execParts: string[] = [];
  if (data.executive.total_bl > 0) {
    execParts.push(`Au cours du mois de ${monthName} ${data.year}, ${data.executive.total_bl} bons de livraison ont été enregistrés pour un chiffre d'affaires de ${formatCurrency(data.executive.total_revenue)}.`);
  } else {
    execParts.push(`Aucun bon de livraison n'a été enregistré au cours du mois de ${monthName} ${data.year}.`);
  }
  if (data.executive.total_missions > 0) {
    execParts.push(`${data.executive.total_missions} missions ont été réalisées.`);
  }
  execParts.push(`Le taux d'utilisation de la flotte est de ${data.executive.fleet_utilization_rate.toFixed(0)}% avec ${data.executive.active_vehicles} véhicules actifs sur ${data.executive.total_vehicles}.`);
  if (data.executive.total_incidents > 0) {
    execParts.push(`${data.executive.total_incidents} non-conformité(s) (NC) ont été enregistrées ce mois.`);
  }

  // Operations
  const opsParts: string[] = [];
  if (data.operations.total_tonnage > 0) {
    opsParts.push(`Le volume total transporté s'élève à ${data.operations.total_tonnage.toLocaleString()} unités.`);
  }
  if (data.operations.breakdown_hydrocarbures > 0) {
    opsParts.push(`L'activité hydrocarbures représente ${data.operations.breakdown_hydrocarbures} BL.`);
  }
  if (data.operations.breakdown_bauxite > 0) {
    opsParts.push(`L'activité bauxite représente ${data.operations.breakdown_bauxite} BL.`);
  }
  const avgBlPerDay = data.operations.bl_par_jour.length > 0
    ? (data.operations.bl_par_jour.reduce((s, d) => s + d.count, 0) / data.operations.bl_par_jour.length).toFixed(1)
    : '0';
  opsParts.push(`La moyenne de BL saisis par jour est de ${avgBlPerDay}.`);

  // Fleet
  const fleetParts: string[] = [];
  fleetParts.push(`La rotation moyenne est de ${data.fleet.avg_rotations.toFixed(1)} missions par véhicule.`);
  if (data.fleet.top5_vehicles.length > 0 && data.fleet.top5_vehicles[0].missions > 0) {
    fleetParts.push(`Le véhicule le plus performant est ${data.fleet.top5_vehicles[0].numero} avec ${data.fleet.top5_vehicles[0].missions} rotations.`);
  }
  if (data.fleet.flop5_vehicles.length > 0) {
    const worst = data.fleet.flop5_vehicles[0];
    if (worst.missions === 0) {
      fleetParts.push(`Certains véhicules comme ${worst.numero} n'ont enregistré aucune mission ce mois — une analyse de leur disponibilité est recommandée.`);
    }
  }

  // Maintenance
  const maintParts: string[] = [];
  if (data.maintenance.total_breakdowns > 0) {
    maintParts.push(`${data.maintenance.total_breakdowns} intervention(s) de maintenance ont été enregistrées pour un coût total de ${formatCurrency(data.maintenance.total_cost)}.`);
    if (data.maintenance.total_downtime > 0) {
      maintParts.push(`La durée d'immobilisation totale est de ${data.maintenance.total_downtime} heures.`);
    }
    if (data.maintenance.by_type.length > 0) {
      const topType = data.maintenance.by_type.sort((a, b) => b.count - a.count)[0];
      maintParts.push(`Le type de panne le plus fréquent est "${topType.type}" (${topType.count} occurrences).`);
    }
  } else {
    maintParts.push(`Aucune intervention de maintenance n'a été enregistrée ce mois.`);
  }

  // Drivers
  const driverParts: string[] = [];
  driverParts.push(`${data.executive.total_drivers} chauffeurs étaient actifs ce mois.`);
  if (data.drivers.top5.length > 0 && data.drivers.top5[0].missions > 0) {
    const best = data.drivers.top5[0];
    driverParts.push(`Le chauffeur le plus performant est ${best.nom} ${best.prenom} avec ${best.missions} missions (score: ${best.score}).`);
  }
  if (data.drivers.worst_incidents.length > 0) {
    driverParts.push(`${data.drivers.worst_incidents.length} chauffeur(s) ont été associés à des non-conformités ce mois.`);
  }

  // Financial
  const finParts: string[] = [];
  finParts.push(`Le chiffre d'affaires du mois s'établit à ${formatCurrency(data.financial.revenue)}.`);
  finParts.push(`Les coûts de maintenance s'élèvent à ${formatCurrency(data.financial.maintenance_cost)}.`);
  if (data.financial.estimated_profit >= 0) {
    finParts.push(`Le profit estimé est positif à ${formatCurrency(data.financial.estimated_profit)}.`);
  } else {
    finParts.push(`Le résultat estimé est négatif (${formatCurrency(data.financial.estimated_profit)}), une attention particulière doit être portée aux coûts.`);
  }
  // Trend analysis
  const trend = data.financial.revenue_trend;
  if (trend.length >= 2) {
    const last = trend[trend.length - 1].revenue;
    const prev = trend[trend.length - 2].revenue;
    if (prev > 0) {
      const pct = ((last - prev) / prev * 100).toFixed(0);
      finParts.push(`Par rapport au mois précédent, le CA est ${Number(pct) >= 0 ? 'en hausse' : 'en baisse'} de ${Math.abs(Number(pct))}%.`);
    }
  }

  // HSE
  const hseParts: string[] = [];
  if (data.hse.total_controls > 0) {
    hseParts.push(`${data.hse.total_controls} contrôles HSE ont été réalisés ce mois.`);
    if (data.hse.conformes > 0) {
      const pctConforme = ((data.hse.conformes / data.hse.total_controls) * 100).toFixed(0);
      hseParts.push(`Le taux de conformité est de ${pctConforme}% (${data.hse.conformes} conformes sur ${data.hse.total_controls}).`);
    }
    if (data.hse.non_conformites > 0) {
      hseParts.push(`${data.hse.non_conformites} non-conformités ont été relevées, nécessitant un suivi correctif.`);
    }
  } else {
    hseParts.push(`Aucun contrôle HSE n'a été enregistré ce mois.`);
  }

  // Conclusion
  const conclusionParts: string[] = [];
  conclusionParts.push(`Le mois de ${monthName} ${data.year} se caractérise par `);
  if (data.executive.total_bl > 0 && data.executive.fleet_utilization_rate >= 70) {
    conclusionParts[0] += `une activité soutenue avec un bon taux d'utilisation de la flotte.`;
  } else if (data.executive.total_bl > 0) {
    conclusionParts[0] += `une activité en cours de développement. L'optimisation du taux d'utilisation de la flotte reste un axe d'amélioration prioritaire.`;
  } else {
    conclusionParts[0] += `une activité limitée. Des mesures correctives doivent être envisagées.`;
  }
  if (data.alerts.length > 0) {
    conclusionParts.push(`${data.alerts.length} alerte(s) ont été identifiées et doivent faire l'objet d'un suivi particulier.`);
  }

  return {
    executive: execParts.join(' '),
    operations: opsParts.join(' '),
    fleet: fleetParts.join(' '),
    maintenance: maintParts.join(' '),
    drivers: driverParts.join(' '),
    financial: finParts.join(' '),
    hse: hseParts.join(' '),
    conclusion: conclusionParts.join(' '),
  };
}
