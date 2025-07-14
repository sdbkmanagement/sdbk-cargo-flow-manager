
import React from 'react';
import { StatCard } from '@/components/common/StatCard';
import { 
  Calendar, 
  Clock, 
  CheckCircle, 
  XCircle,
  TrendingUp,
  Truck,
  Package,
  BarChart3
} from 'lucide-react';

interface MissionsStatsProps {
  total: number;
  en_attente: number;
  en_cours: number;
  terminees: number;
  annulees: number;
  ce_mois: number;
  hydrocarbures: number;
  bauxite: number;
  volume_total: number;
}

export const MissionsStats = ({
  total,
  en_attente,
  en_cours,
  terminees,
  annulees,
  ce_mois,
  hydrocarbures,
  bauxite,
  volume_total
}: MissionsStatsProps) => {
  // Calcul des tendances (exemple)
  const completionRate = total > 0 ? Math.round((terminees / total) * 100) : 0;
  const monthlyGrowth = ce_mois > 0 ? Math.round(((ce_mois - (ce_mois * 0.8)) / (ce_mois * 0.8)) * 100) : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-6 mb-8">
      <StatCard
        title="Total des missions"
        value={total}
        subtitle={`${completionRate}% de taux de réussite`}
        icon={Calendar}
        color="blue"
        trend={{
          value: 12,
          label: "vs mois dernier",
          isPositive: true
        }}
      />
      
      <StatCard
        title="En attente"
        value={en_attente}
        subtitle="Missions planifiées"
        icon={Clock}
        color="yellow"
      />
      
      <StatCard
        title="En cours"
        value={en_cours}
        subtitle="Missions actives"
        icon={TrendingUp}
        color="green"
        trend={{
          value: 8,
          label: "vs semaine dernière",
          isPositive: true
        }}
      />
      
      <StatCard
        title="Terminées"
        value={terminees}
        subtitle="Missions accomplies"
        icon={CheckCircle}
        color="green"
      />
      
      <StatCard
        title="Ce mois"
        value={ce_mois}
        subtitle="Missions du mois"
        icon={BarChart3}
        color="purple"
        trend={{
          value: monthlyGrowth,
          label: "croissance mensuelle",
          isPositive: monthlyGrowth >= 0
        }}
      />
      
      <StatCard
        title="Hydrocarbures"
        value={hydrocarbures}
        subtitle="Transport carburant"
        icon={Truck}
        color="red"
      />
      
      <StatCard
        title="Bauxite"
        value={bauxite}
        subtitle="Transport minerai"
        icon={Package}
        color="yellow"
      />
      
      <StatCard
        title="Volume total"
        value={`${Math.round(volume_total)}t`}
        subtitle="Tonnage transporté"
        icon={Package}
        color="blue"
        trend={{
          value: 15,
          label: "vs objectif mensuel",
          isPositive: true
        }}
      />
    </div>
  );
};
