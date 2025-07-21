
import React from 'react';
import { StatCard } from '@/components/common/StatCard';
import { 
  Calendar, 
  Clock, 
  CheckCircle, 
  TrendingUp
} from 'lucide-react';

interface MissionsStatsProps {
  total: number;
  en_attente: number;
  en_cours: number;
  terminees: number;
  annulees: number;
}

export const MissionsStats = ({
  total,
  en_attente,
  en_cours,
  terminees,
  annulees
}: MissionsStatsProps) => {
  // Calcul du taux de réussite
  const completionRate = total > 0 ? Math.round((terminees / total) * 100) : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
    </div>
  );
};
