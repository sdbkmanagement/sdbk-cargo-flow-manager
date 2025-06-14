
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Truck, Users, CheckCircle, AlertTriangle, Calendar, DollarSign } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const StatCard = ({ title, value, description, icon: Icon, color }: any) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className={`h-4 w-4 ${color}`} />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      <p className="text-xs text-muted-foreground">{description}</p>
    </CardContent>
  </Card>
);

const Dashboard = () => {
  const { user } = useAuth();

  const stats = [
    {
      title: "Véhicules actifs",
      value: "24",
      description: "Sur 28 véhicules total",
      icon: Truck,
      color: "text-blue-500"
    },
    {
      title: "Chauffeurs disponibles",
      value: "18",
      description: "Prêts pour missions",
      icon: Users,
      color: "text-green-500"
    },
    {
      title: "Missions en cours",
      value: "12",
      description: "En cours de livraison",
      icon: Calendar,
      color: "text-orange-500"
    },
    {
      title: "Validations en attente",
      value: "5",
      description: "Nécessitent une action",
      icon: AlertTriangle,
      color: "text-red-500"
    },
    {
      title: "CA mensuel",
      value: "€125,430",
      description: "+12% vs mois dernier",
      icon: DollarSign,
      color: "text-purple-500"
    },
    {
      title: "Taux de conformité",
      value: "98%",
      description: "Objectif : 95%",
      icon: CheckCircle,
      color: "text-green-500"
    }
  ];

  const recentActivities = [
    { type: 'mission', message: 'Mission M-2024-001 terminée avec succès', time: 'Il y a 2h' },
    { type: 'validation', message: 'Véhicule V-045 validé par HSECQ', time: 'Il y a 3h' },
    { type: 'alert', message: 'Maintenance préventive due pour V-023', time: 'Il y a 5h' },
    { type: 'mission', message: 'Nouvelle mission M-2024-002 planifiée', time: 'Il y a 6h' }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Tableau de bord</h1>
        <p className="text-muted-foreground">
          Bienvenue {user?.prenom}, voici un aperçu de votre activité
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Activité récente</CardTitle>
            <CardDescription>Les dernières actions dans le système</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentActivities.map((activity, index) => (
              <div key={index} className="flex items-center space-x-4">
                <div className={`w-2 h-2 rounded-full ${
                  activity.type === 'mission' ? 'bg-blue-500' :
                  activity.type === 'validation' ? 'bg-green-500' : 'bg-orange-500'
                }`} />
                <div className="flex-1">
                  <p className="text-sm">{activity.message}</p>
                  <p className="text-xs text-muted-foreground">{activity.time}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Alertes importantes</CardTitle>
            <CardDescription>Actions requises</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 border-l-4 border-red-500 bg-red-50">
              <p className="text-sm font-medium">Maintenance urgente</p>
              <p className="text-sm text-gray-600">Véhicule V-023 - Échéance dépassée</p>
            </div>
            <div className="p-4 border-l-4 border-orange-500 bg-orange-50">
              <p className="text-sm font-medium">Document expiré</p>
              <p className="text-sm text-gray-600">Permis chauffeur C-012 - Renouvellement requis</p>
            </div>
            <div className="p-4 border-l-4 border-yellow-500 bg-yellow-50">
              <p className="text-sm font-medium">Validation en attente</p>
              <p className="text-sm text-gray-600">5 véhicules en attente de validation HSECQ</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
