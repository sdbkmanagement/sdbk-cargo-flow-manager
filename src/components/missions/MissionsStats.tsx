
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Truck, 
  Clock, 
  CheckCircle, 
  XCircle,
  Calendar,
  TrendingUp
} from 'lucide-react';

interface MissionsStatsProps {
  totalMissions: number;
  missionsEnAttente: number;
  missionsEnCours: number;
  missionsTerminees: number;
  missionsAnnulees: number;
  missionsAujourdhui: number;
}

export const MissionsStats = ({
  totalMissions,
  missionsEnAttente,
  missionsEnCours,
  missionsTerminees,
  missionsAnnulees,
  missionsAujourdhui
}: MissionsStatsProps) => {
  const stats = [
    {
      title: 'Total missions',
      value: totalMissions,
      icon: Truck,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      title: 'Aujourd\'hui',
      value: missionsAujourdhui,
      icon: Calendar,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    },
    {
      title: 'En attente',
      value: missionsEnAttente,
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100'
    },
    {
      title: 'En cours',
      value: missionsEnCours,
      icon: TrendingUp,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100'
    },
    {
      title: 'Terminées',
      value: missionsTerminees,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      title: 'Annulées',
      value: missionsAnnulees,
      icon: XCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-100'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card key={index}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className={`p-2 rounded-full ${stat.bgColor}`}>
                  <Icon className={`w-5 h-5 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
