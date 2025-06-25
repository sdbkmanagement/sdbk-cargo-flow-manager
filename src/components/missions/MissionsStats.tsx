
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Calendar, 
  Clock, 
  CheckCircle, 
  XCircle,
  TrendingUp,
  Truck,
  Package
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
  const stats = [
    {
      title: 'Total missions',
      value: total,
      icon: Calendar,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      title: 'En attente',
      value: en_attente,
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100'
    },
    {
      title: 'En cours',
      value: en_cours,
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      title: 'Terminées',
      value: terminees,
      icon: CheckCircle,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-100'
    },
    {
      title: 'Ce mois',
      value: ce_mois,
      icon: Calendar,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    },
    {
      title: 'Hydrocarbures',
      value: hydrocarbures,
      icon: Truck,
      color: 'text-red-600',
      bgColor: 'bg-red-100'
    },
    {
      title: 'Bauxite',
      value: bauxite,
      icon: Package,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100'
    },
    {
      title: 'Volume total (t)',
      value: Math.round(volume_total),
      icon: Package,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
