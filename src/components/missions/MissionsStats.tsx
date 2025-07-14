
import React from 'react';
import { StatCard } from '@/components/common/StatCard';
import { 
  Calendar, 
  Clock, 
  CheckCircle, 
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
  // Calcul du taux de réussite
  const completionRate = total > 0 ? Math.round((terminees / total) * 100) : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-6 mb-8">
      <StatCard
        title="Total des missions"
        value={total}
        subtitle={`${completionRate}% de taux de réussite`}
        icon={Calendar}
        color="blue"
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
        value={volume_total > 0 ? `${Math.round(volume_total)}t` : '0t'}
        subtitle="Tonnage transporté"
        icon={Package}
        color="blue"
      />
    </div>
  );
};
