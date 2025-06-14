
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Calendar, 
  Clock, 
  MapPin,
  CheckCircle,
  AlertCircle,
  XCircle
} from 'lucide-react';

interface PlanningStatsProps {
  totalChauffeurs: number;
  chauffeursDisponibles: number;
  missionsAujourdhui: number;
  missionsEnCours: number;
  missionsTerminees: number;
  missionsAnnulees: number;
}

export const PlanningStats = ({
  totalChauffeurs,
  chauffeursDisponibles,
  missionsAujourdhui,
  missionsEnCours,
  missionsTerminees,
  missionsAnnulees
}: PlanningStatsProps) => {
  const stats = [
    {
      title: 'Chauffeurs disponibles',
      value: `${chauffeursDisponibles}/${totalChauffeurs}`,
      icon: Users,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      title: 'Missions aujourd\'hui',
      value: missionsAujourdhui,
      icon: Calendar,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      title: 'En cours',
      value: missionsEnCours,
      icon: Clock,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100'
    },
    {
      title: 'Terminées',
      value: missionsTerminees,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
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
