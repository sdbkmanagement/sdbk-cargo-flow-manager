
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Package, 
  CheckCircle, 
  XCircle,
  Calendar,
  Truck,
  Droplets,
  Mountain
} from 'lucide-react';

interface ChargementsStatsProps {
  total: number;
  charges: number;
  livres: number;
  annules: number;
  ce_mois: number;
  hydrocarbures: number;
  bauxite: number;
  volume_total: number;
}

export const ChargementsStats = ({
  total,
  charges,
  livres,
  annules,
  ce_mois,
  hydrocarbures,
  bauxite,
  volume_total
}: ChargementsStatsProps) => {
  const stats = [
    {
      title: 'Total chargements',
      value: total,
      icon: Package,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      title: 'Chargés',
      value: charges,
      icon: Truck,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100'
    },
    {
      title: 'Livrés',
      value: livres,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      title: 'Annulés',
      value: annules,
      icon: XCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-100'
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
      icon: Droplets,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100'
    },
    {
      title: 'Bauxite',
      value: bauxite,
      icon: Mountain,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100'
    },
    {
      title: 'Volume total (t)',
      value: Math.round(volume_total),
      icon: Package,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-100'
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
