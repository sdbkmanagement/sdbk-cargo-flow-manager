
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, UserCheck, UserX, Calendar, AlertTriangle } from 'lucide-react';

interface DriversStatsProps {
  total: number;
  disponibles: number;
  enConge: number;
  enArretMaladie: number;
  indisponibles: number;
  alertes: number;
}

export const DriversStats = ({ 
  total, 
  disponibles, 
  enConge, 
  enArretMaladie, 
  indisponibles, 
  alertes 
}: DriversStatsProps) => {
  const stats = [
    {
      title: 'Total chauffeurs',
      value: total,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Disponibles',
      value: disponibles,
      icon: UserCheck,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'En congé',
      value: enConge,
      icon: Calendar,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
    {
      title: 'Arrêt maladie',
      value: enArretMaladie,
      icon: UserX,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    },
    {
      title: 'Indisponibles',
      value: indisponibles,
      icon: UserX,
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
    },
    {
      title: 'Alertes documents',
      value: alertes,
      icon: AlertTriangle,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.title}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
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
