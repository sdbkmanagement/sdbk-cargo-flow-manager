
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Truck, CheckCircle, Wrench, Clock } from 'lucide-react';

interface FleetStatsProps {
  stats: {
    total: number;
    disponibles: number;
    en_mission: number;
    maintenance: number;
    validation_requise: number;
  };
}

export const FleetStats = ({ stats }: FleetStatsProps) => {
  const statCards = [
    {
      title: 'Total véhicules',
      value: stats.total,
      icon: Truck,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Disponibles',
      value: stats.disponibles,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'En mission',
      value: stats.en_mission,
      icon: Clock,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    },
    {
      title: 'Maintenance',
      value: stats.maintenance,
      icon: Wrench,
      color: 'text-red-600',
      bgColor: 'bg-red-50'
    },
    {
      title: 'Validation requise',
      value: stats.validation_requise,
      icon: CheckCircle,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      {statCards.map((stat, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {stat.title}
            </CardTitle>
            <stat.icon className={`h-4 w-4 ${stat.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
