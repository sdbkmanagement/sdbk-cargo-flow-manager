
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, UserCheck, UserX, Calendar, GraduationCap, AlertTriangle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const StatCard = ({ title, value, description, icon: Icon, color, isLoading }: any) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className={`h-4 w-4 ${color}`} />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">
        {isLoading ? (
          <div className="animate-pulse bg-gray-200 h-8 w-16 rounded"></div>
        ) : (
          value
        )}
      </div>
      <p className="text-xs text-muted-foreground">{description}</p>
    </CardContent>
  </Card>
);

export const RHStats = () => {
  // Fetch stats employés
  const { data: employesStats, isLoading: employesLoading } = useQuery({
    queryKey: ['rh-stats-employes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employes')
        .select('statut, service');
      
      if (error) throw error;
      
      const total = data?.length || 0;
      const actifs = data?.filter(e => e.statut === 'actif').length || 0;
      const inactifs = data?.filter(e => e.statut === 'inactif').length || 0;
      const transport = data?.filter(e => e.service === 'Transport').length || 0;
      
      return { total, actifs, inactifs, transport };
    }
  });

  // Fetch stats absences
  const { data: absencesStats, isLoading: absencesLoading } = useQuery({
    queryKey: ['rh-stats-absences'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('absences')
        .select('statut, date_debut, date_fin')
        .eq('statut', 'approuve');
      
      if (error) throw error;
      
      const today = new Date();
      const enCours = data?.filter(a => {
        const debut = new Date(a.date_debut);
        const fin = new Date(a.date_fin);
        return debut <= today && fin >= today;
      }).length || 0;
      
      return { enCours };
    }
  });

  // Fetch stats formations
  const { data: formationsStats, isLoading: formationsLoading } = useQuery({
    queryKey: ['rh-stats-formations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('formations_employes')
        .select('date_expiration, obligatoire');
      
      if (error) throw error;
      
      const today = new Date();
      const aRenouveler = data?.filter(f => {
        if (!f.date_expiration || !f.obligatoire) return false;
        const expiration = new Date(f.date_expiration);
        const diffTime = expiration.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays <= 30;
      }).length || 0;
      
      return { aRenouveler };
    }
  });

  // Fetch alertes count depuis les tables directes
  const { data: alertesCount, isLoading: alertesLoading } = useQuery({
    queryKey: ['rh-stats-alertes'],
    queryFn: async () => {
      // Compter les documents qui expirent bientôt (employés/chauffeurs)
      const { data, error } = await supabase
        .from('documents')
        .select('date_expiration')
        .eq('entity_type', 'chauffeur')
        .not('date_expiration', 'is', null)
        .lte('date_expiration', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
      
      if (error) throw error;
      
      const critiques = data?.length || 0;
      
      return { critiques };
    }
  });

  const stats = [
    {
      title: "Personnel total",
      value: `${employesStats?.total || 0}`,
      description: `${employesStats?.actifs || 0} actifs`,
      icon: Users,
      color: "text-blue-500",
      isLoading: employesLoading
    },
    {
      title: "Personnel actif",
      value: `${employesStats?.actifs || 0}`,
      description: "En service",
      icon: UserCheck,
      color: "text-green-500",
      isLoading: employesLoading
    },
    {
      title: "Équipe Transport",
      value: `${employesStats?.transport || 0}`,
      description: "Chauffeurs et superviseurs",
      icon: Users,
      color: "text-purple-500",
      isLoading: employesLoading
    },
    {
      title: "Absences en cours",
      value: `${absencesStats?.enCours || 0}`,
      description: "Personnel absent",
      icon: Calendar,
      color: "text-orange-500",
      isLoading: absencesLoading
    },
    {
      title: "Formations à renouveler",
      value: `${formationsStats?.aRenouveler || 0}`,
      description: "Expiration < 30 jours",
      icon: GraduationCap,
      color: "text-yellow-500",
      isLoading: formationsLoading
    },
    {
      title: "Alertes critiques",
      value: `${alertesCount?.critiques || 0}`,
      description: "Nécessitent une action",
      icon: AlertTriangle,
      color: "text-red-500",
      isLoading: alertesLoading
    }
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {stats.map((stat, index) => (
        <StatCard key={index} {...stat} />
      ))}
    </div>
  );
};
