
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Truck, Users, CheckCircle, AlertTriangle, Calendar, DollarSign, FileText, BarChart3 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
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

const Dashboard = () => {
  const { user } = useAuth();

  // Fetch vehicules stats
  const { data: vehiculesStats, isLoading: vehiculesLoading } = useQuery({
    queryKey: ['dashboard-vehicules'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vehicules')
        .select('statut');
      
      if (error) throw error;
      
      const total = data?.length || 0;
      const actifs = data?.filter(v => v.statut === 'disponible' || v.statut === 'en_mission').length || 0;
      
      return { total, actifs };
    }
  });

  // Fetch chauffeurs stats
  const { data: chauffeursStats, isLoading: chauffeursLoading } = useQuery({
    queryKey: ['dashboard-chauffeurs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('chauffeurs')
        .select('statut');
      
      if (error) throw error;
      
      const disponibles = data?.filter(c => c.statut === 'actif').length || 0;
      
      return { disponibles };
    }
  });

  // Fetch missions stats
  const { data: missionsStats, isLoading: missionsLoading } = useQuery({
    queryKey: ['dashboard-missions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('missions')
        .select('statut');
      
      if (error) throw error;
      
      const enCours = data?.filter(m => m.statut === 'en_cours').length || 0;
      
      return { enCours };
    }
  });

  // Fetch validations stats
  const { data: validationsStats, isLoading: validationsLoading } = useQuery({
    queryKey: ['dashboard-validations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('validation_workflows')
        .select('statut_global');
      
      if (error) throw error;
      
      const enAttente = data?.filter(v => v.statut_global === 'en_validation').length || 0;
      
      return { enAttente };
    }
  });

  // Fetch factures stats
  const { data: facturesStats, isLoading: facturesLoading } = useQuery({
    queryKey: ['dashboard-factures'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('factures')
        .select('montant_ttc, statut, created_at');
      
      if (error) throw error;
      
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      
      const caMensuel = data?.filter(f => {
        const factureDate = new Date(f.created_at);
        return factureDate.getMonth() === currentMonth && 
               factureDate.getFullYear() === currentYear &&
               f.statut === 'payee';
      }).reduce((sum, f) => sum + (f.montant_ttc || 0), 0) || 0;
      
      const totalFactures = data?.length || 0;
      const tauxConformite = totalFactures > 0 ? 
        Math.round((data?.filter(f => f.statut === 'payee').length / totalFactures) * 100) : 0;
      
      return { caMensuel, tauxConformite };
    }
  });

  // Fetch recent activities
  const { data: recentActivities } = useQuery({
    queryKey: ['dashboard-activities'],
    queryFn: async () => {
      const [missionsHist, validationsHist] = await Promise.all([
        supabase
          .from('missions_historique')
          .select('action, details, created_at')
          .order('created_at', { ascending: false })
          .limit(2),
        supabase
          .from('validation_historique')
          .select('etape, nouveau_statut, created_at')
          .order('created_at', { ascending: false })
          .limit(2)
      ]);

      const activities = [];
      
      if (missionsHist.data) {
        activities.push(...missionsHist.data.map(h => ({
          type: 'mission',
          message: h.details || `Mission ${h.action}`,
          time: new Date(h.created_at).toLocaleString('fr-FR', { 
            hour: '2-digit', 
            minute: '2-digit',
            day: '2-digit',
            month: '2-digit'
          })
        })));
      }
      
      if (validationsHist.data) {
        activities.push(...validationsHist.data.map(h => ({
          type: 'validation',
          message: `Validation ${h.etape} : ${h.nouveau_statut}`,
          time: new Date(h.created_at).toLocaleString('fr-FR', { 
            hour: '2-digit', 
            minute: '2-digit',
            day: '2-digit',
            month: '2-digit'
          })
        })));
      }

      return activities.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 4);
    }
  });

  const stats = [
    {
      title: "Véhicules actifs",
      value: `${vehiculesStats?.actifs || 0}`,
      description: `Sur ${vehiculesStats?.total || 0} véhicules total`,
      icon: Truck,
      color: "text-blue-500",
      isLoading: vehiculesLoading
    },
    {
      title: "Chauffeurs disponibles",
      value: `${chauffeursStats?.disponibles || 0}`,
      description: "Prêts pour missions",
      icon: Users,
      color: "text-green-500",
      isLoading: chauffeursLoading
    },
    {
      title: "Missions en cours",
      value: `${missionsStats?.enCours || 0}`,
      description: "En cours de livraison",
      icon: Calendar,
      color: "text-orange-500",
      isLoading: missionsLoading
    },
    {
      title: "Validations en attente",
      value: `${validationsStats?.enAttente || 0}`,
      description: "Nécessitent une action",
      icon: AlertTriangle,
      color: "text-red-500",
      isLoading: validationsLoading
    },
    {
      title: "CA mensuel",
      value: `€${(facturesStats?.caMensuel || 0).toLocaleString('fr-FR')}`,
      description: "Factures payées ce mois",
      icon: DollarSign,
      color: "text-purple-500",
      isLoading: facturesLoading
    },
    {
      title: "Taux de conformité",
      value: `${facturesStats?.tauxConformite || 0}%`,
      description: "Factures payées",
      icon: CheckCircle,
      color: "text-green-500",
      isLoading: facturesLoading
    }
  ];

  return (
    <div className="space-y-6">
      {/* En-tête de bienvenue */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Bienvenue dans SDBK Cargo Flow Manager
        </h1>
        <p className="text-gray-600">
          Bonjour {user?.prenom} {user?.nom}, vous êtes connecté en tant que {user?.role}
        </p>
      </div>

      {/* Statistiques principales */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Activité récente */}
        <Card>
          <CardHeader>
            <CardTitle>Activité récente</CardTitle>
            <CardDescription>Les dernières actions dans le système</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentActivities?.length > 0 ? (
              recentActivities.map((activity, index) => (
                <div key={index} className="flex items-center space-x-4">
                  <div className={`w-2 h-2 rounded-full ${
                    activity.type === 'mission' ? 'bg-blue-500' :
                    activity.type === 'validation' ? 'bg-green-500' : 'bg-orange-500'
                  }`} />
                  <div className="flex-1">
                    <p className="text-sm">{activity.message}</p>
                    <p className="text-xs text-muted-foreground">Le {activity.time}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground">Aucune activité récente</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Alertes importantes */}
        <Card>
          <CardHeader>
            <CardTitle>Alertes importantes</CardTitle>
            <CardDescription>Actions requises et notifications</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {validationsStats?.enAttente > 0 && (
              <div className="p-4 border-l-4 border-orange-500 bg-orange-50">
                <p className="text-sm font-medium">Validations en attente</p>
                <p className="text-sm text-gray-600">
                  {validationsStats.enAttente} véhicule(s) en attente de validation
                </p>
              </div>
            )}
            {missionsStats?.enCours > 0 && (
              <div className="p-4 border-l-4 border-blue-500 bg-blue-50">
                <p className="text-sm font-medium">Missions en cours</p>
                <p className="text-sm text-gray-600">
                  {missionsStats.enCours} mission(s) en cours de livraison
                </p>
              </div>
            )}
            
            {/* Alertes système basées sur le contenu d'origine */}
            <div className="space-y-3">
              <div className="flex items-center p-3 bg-orange-50 rounded-lg border border-orange-200">
                <div className="flex-1">
                  <p className="text-sm font-medium">Maintenance programmée</p>
                  <p className="text-xs text-muted-foreground">Véhicule TRK-001 - Échéance dans 2 jours</p>
                </div>
              </div>
              <div className="flex items-center p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex-1">
                  <p className="text-sm font-medium">Nouvelle mission</p>
                  <p className="text-xs text-muted-foreground">Transport vers Dakar - À affecter</p>
                </div>
              </div>
              <div className="flex items-center p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="flex-1">
                  <p className="text-sm font-medium">Formation terminée</p>
                  <p className="text-xs text-muted-foreground">3 chauffeurs certifiés HSE</p>
                </div>
              </div>
            </div>
            
            {(!validationsStats?.enAttente && !missionsStats?.enCours) && (
              <div className="p-4 border-l-4 border-green-500 bg-green-50">
                <p className="text-sm font-medium">Système opérationnel</p>
                <p className="text-sm text-gray-600">Aucune alerte critique détectée</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Accès rapide */}
      <Card>
        <CardHeader>
          <CardTitle>Accès rapide</CardTitle>
          <CardDescription>
            Fonctionnalités disponibles selon votre rôle
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {user?.role === 'admin' && (
              <p className="text-sm text-green-600 font-medium">
                ✓ Accès administrateur - Tous les modules disponibles
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Utilisez la navigation latérale pour accéder aux différents modules du système SDBK.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
