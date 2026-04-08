import { supabase } from '@/integrations/supabase/client';

export interface MonthlyReportData {
  month: number;
  year: number;
  // Executive Summary
  executive: {
    total_revenue: number;
    total_missions: number;
    total_bl: number;
    fleet_utilization_rate: number;
    fleet_availability_rate: number;
    total_incidents: number;
    total_maintenance_cost: number;
    active_vehicles: number;
    total_vehicles: number;
    total_drivers: number;
  };
  // Operations
  operations: {
    total_tonnage: number;
    breakdown_hydrocarbures: number;
    breakdown_bauxite: number;
    breakdown_autres: number;
    bl_par_jour: { date: string; count: number }[];
  };
  // Fleet Performance
  fleet: {
    top5_vehicles: { id: string; numero: string; missions: number }[];
    flop5_vehicles: { id: string; numero: string; missions: number }[];
    avg_rotations: number;
  };
  // Maintenance
  maintenance: {
    total_breakdowns: number;
    total_downtime: number;
    total_cost: number;
    by_type: { type: string; count: number; cost: number }[];
  };
  // Drivers
  drivers: {
    top5: { id: string; nom: string; prenom: string; score: number; missions: number }[];
    worst_incidents: { id: string; nom: string; prenom: string; incidents: number }[];
  };
  // Financial
  financial: {
    revenue: number;
    maintenance_cost: number;
    estimated_profit: number;
    revenue_trend: { month: string; revenue: number }[];
  };
  // HSE
  hse: {
    total_controls: number;
    conformes: number;
    non_conformes: number;
    non_conformites: number;
  };
  // Alerts
  alerts: { type: 'warning' | 'danger' | 'info'; message: string; recommendation: string }[];
}

export const rapportsService = {
  async getMonthlyReport(month: number, year: number): Promise<MonthlyReportData> {
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = month === 12
      ? `${year + 1}-01-01`
      : `${year}-${String(month + 1).padStart(2, '0')}-01`;

    // Fetch all data in parallel
    const [
      missionsRes,
      blRes,
      vehiculesRes,
      chauffeursRes,
      maintenanceRes,
      ncRes,
      controlesRes,
      controlesInopinesRes,
      prevMonthBlRes,
      prevMonthMaintenanceRes,
    ] = await Promise.all([
      supabase.from('missions').select('*').gte('created_at', startDate).lt('created_at', endDate),
      supabase.from('bons_livraison').select('*').gte('created_at', startDate).lt('created_at', endDate),
      supabase.from('vehicules').select('*'),
      supabase.from('chauffeurs').select('*'),
      supabase.from('diagnostics_maintenance').select('*').gte('created_at', startDate).lt('created_at', endDate),
      supabase.from('non_conformites').select('*').gte('created_at', startDate).lt('created_at', endDate),
      supabase.from('controles_hsse').select('*').gte('created_at', startDate).lt('created_at', endDate),
      supabase.from('controles_inopines').select('*').gte('created_at', startDate).lt('created_at', endDate),
      // Previous month for trends
      supabase.from('bons_livraison').select('montant_total').gte('created_at',
        month === 1 ? `${year - 1}-12-01` : `${year}-${String(month - 1).padStart(2, '0')}-01`
      ).lt('created_at', startDate),
      supabase.from('diagnostics_maintenance').select('cout_reparation').gte('created_at',
        month === 1 ? `${year - 1}-12-01` : `${year}-${String(month - 1).padStart(2, '0')}-01`
      ).lt('created_at', startDate),
    ]);

    const missions = missionsRes.data || [];
    const bls = blRes.data || [];
    const vehicules = vehiculesRes.data || [];
    const chauffeurs = chauffeursRes.data || [];
    const maintenances = maintenanceRes.data || [];
    const ncs = ncRes.data || [];
    const controles = controlesRes.data || [];
    const controlesInopines = controlesInopinesRes.data || [];
    const prevBls = prevMonthBlRes.data || [];
    const prevMaintenances = prevMonthMaintenanceRes.data || [];

    // Executive Summary
    const total_revenue = bls.reduce((s, bl) => s + (bl.montant_total || 0), 0);
    const active_vehicles = vehicules.filter(v => v.statut === 'disponible' || v.statut === 'en_mission').length;
    const total_vehicles = vehicules.length;
    const total_maintenance_cost = maintenances.reduce((s, m) => s + (m.cout_reparation || 0), 0);

    // Operations - breakdown by product type
    const hydroBls = bls.filter(bl => {
      const prod = (bl.produit || '').toLowerCase();
      return prod.includes('gasoil') || prod.includes('essence') || prod.includes('fuel') || prod.includes('hydro') || prod.includes('go') || prod.includes('sp');
    });
    const bauxiteBls = bls.filter(bl => {
      const prod = (bl.produit || '').toLowerCase();
      return prod.includes('baux');
    });

    // BL par jour
    const blByDay: Record<string, number> = {};
    bls.forEach(bl => {
      const day = bl.created_at?.split('T')[0] || '';
      if (day) blByDay[day] = (blByDay[day] || 0) + 1;
    });
    const bl_par_jour = Object.entries(blByDay)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Fleet performance - missions per vehicle
    const missionsByVehicle: Record<string, number> = {};
    missions.forEach(m => {
      missionsByVehicle[m.vehicule_id] = (missionsByVehicle[m.vehicule_id] || 0) + 1;
    });
    // Also count BLs per vehicle
    bls.forEach(bl => {
      missionsByVehicle[bl.vehicule_id] = (missionsByVehicle[bl.vehicule_id] || 0) + 1;
    });

    const vehiclePerf = vehicules.map(v => ({
      id: v.id,
      numero: v.numero || v.immatriculation || 'N/A',
      missions: missionsByVehicle[v.id] || 0
    })).sort((a, b) => b.missions - a.missions);

    // Driver performance
    const missionsByDriver: Record<string, number> = {};
    missions.forEach(m => {
      missionsByDriver[m.chauffeur_id] = (missionsByDriver[m.chauffeur_id] || 0) + 1;
    });
    bls.forEach(bl => {
      missionsByDriver[bl.chauffeur_id] = (missionsByDriver[bl.chauffeur_id] || 0) + 1;
    });
    const incidentsByDriver: Record<string, number> = {};
    ncs.forEach(nc => {
      if (nc.chauffeur_id) incidentsByDriver[nc.chauffeur_id] = (incidentsByDriver[nc.chauffeur_id] || 0) + 1;
    });

    const driverPerf = chauffeurs.map(c => ({
      id: c.id,
      nom: c.nom,
      prenom: c.prenom,
      missions: missionsByDriver[c.id] || 0,
      incidents: incidentsByDriver[c.id] || 0,
      score: (missionsByDriver[c.id] || 0) * 2 - (incidentsByDriver[c.id] || 0) * 5
    })).sort((a, b) => b.score - a.score);

    // Maintenance by type
    const maintenanceByType: Record<string, { count: number; cost: number }> = {};
    maintenances.forEach(m => {
      const type = m.type_panne || 'Autre';
      if (!maintenanceByType[type]) maintenanceByType[type] = { count: 0, cost: 0 };
      maintenanceByType[type].count++;
      maintenanceByType[type].cost += m.cout_reparation || 0;
    });

    // Financial
    const prev_revenue = prevBls.reduce((s: number, bl: any) => s + (bl.montant_total || 0), 0);
    const prev_maintenance = prevMaintenances.reduce((s: number, m: any) => s + (m.cout_reparation || 0), 0);

    // HSE
    const conformes = controles.filter(c => c.conforme === true).length;
    const nonConformes = controles.filter(c => c.conforme === false).length;

    // Alerts
    const alerts: MonthlyReportData['alerts'] = [];
    const utilizationRate = total_vehicles > 0 ? (active_vehicles / total_vehicles) * 100 : 0;

    if (utilizationRate < 70) {
      alerts.push({
        type: 'warning',
        message: `Taux d'utilisation flotte bas: ${utilizationRate.toFixed(0)}%`,
        recommendation: 'Optimiser la planification et réduire les temps d\'immobilisation'
      });
    }
    if (total_maintenance_cost > prev_maintenance * 1.2 && prev_maintenance > 0) {
      alerts.push({
        type: 'danger',
        message: `Coûts maintenance en hausse: ${((total_maintenance_cost / prev_maintenance - 1) * 100).toFixed(0)}%`,
        recommendation: 'Renforcer la maintenance préventive et analyser les pannes récurrentes'
      });
    }
    if (ncs.length > 5) {
      alerts.push({
        type: 'danger',
        message: `${ncs.length} non-conformités ce mois`,
        recommendation: 'Renforcer les contrôles HSEQ et les formations chauffeurs'
      });
    }
    if (bls.length === 0) {
      alerts.push({
        type: 'info',
        message: 'Aucun BL enregistré ce mois',
        recommendation: 'Vérifier la saisie des bons de livraison'
      });
    }
    if (total_revenue > prev_revenue * 1.1 && prev_revenue > 0) {
      alerts.push({
        type: 'info',
        message: `CA en hausse de ${((total_revenue / prev_revenue - 1) * 100).toFixed(0)}% vs mois précédent`,
        recommendation: 'Maintenir la dynamique commerciale'
      });
    }

    // Revenue trend (last 6 months)
    const revenueTrend: { month: string; revenue: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      let m = month - i;
      let y = year;
      while (m <= 0) { m += 12; y--; }
      const mStart = `${y}-${String(m).padStart(2, '0')}-01`;
      const mEnd = m === 12 ? `${y + 1}-01-01` : `${y}-${String(m + 1).padStart(2, '0')}-01`;
      const { data } = await supabase.from('bons_livraison').select('montant_total').gte('created_at', mStart).lt('created_at', mEnd);
      const rev = (data || []).reduce((s: number, bl: any) => s + (bl.montant_total || 0), 0);
      const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
      revenueTrend.push({ month: `${monthNames[m - 1]} ${y}`, revenue: rev });
    }

    const totalTonnage = bls.reduce((s, bl) => s + (bl.quantite_livree || bl.quantite_prevue || 0), 0);

    return {
      month,
      year,
      executive: {
        total_revenue,
        total_missions: missions.length,
        total_bl: bls.length,
        fleet_utilization_rate: utilizationRate,
        fleet_availability_rate: total_vehicles > 0 ? ((vehicules.filter(v => v.statut === 'disponible').length) / total_vehicles) * 100 : 0,
        total_incidents: ncs.length,
        total_maintenance_cost,
        active_vehicles,
        total_vehicles,
        total_drivers: chauffeurs.filter(c => c.statut === 'actif').length,
      },
      operations: {
        total_tonnage: totalTonnage,
        breakdown_hydrocarbures: hydroBls.length,
        breakdown_bauxite: bauxiteBls.length,
        breakdown_autres: bls.length - hydroBls.length - bauxiteBls.length,
        bl_par_jour,
      },
      fleet: {
        top5_vehicles: vehiclePerf.slice(0, 5),
        flop5_vehicles: vehiclePerf.slice(-5).reverse(),
        avg_rotations: active_vehicles > 0 ? (missions.length + bls.length) / active_vehicles : 0,
      },
      maintenance: {
        total_breakdowns: maintenances.length,
        total_downtime: maintenances.reduce((s, m) => s + (m.duree_reparation_reelle || m.duree_reparation_estimee || 0), 0),
        total_cost: total_maintenance_cost,
        by_type: Object.entries(maintenanceByType).map(([type, data]) => ({ type, ...data })),
      },
      drivers: {
        top5: driverPerf.slice(0, 5),
        worst_incidents: driverPerf.filter(d => d.incidents > 0).sort((a, b) => b.incidents - a.incidents).slice(0, 5),
      },
      financial: {
        revenue: total_revenue,
        maintenance_cost: total_maintenance_cost,
        estimated_profit: total_revenue - total_maintenance_cost,
        revenue_trend: revenueTrend,
      },
      hse: {
        total_controls: controles.length + controlesInopines.length,
        conformes,
        non_conformes: nonConformes,
        non_conformites: ncs.length,
      },
      alerts,
    };
  },
};
