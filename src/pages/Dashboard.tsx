import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Truck, Users, CheckCircle, AlertTriangle, Calendar, DollarSign, FileText, BarChart3, TrendingUp, Clock, MapPin, Shield } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AlertesDocuments } from '@/components/common/AlertesDocuments';

const StatCard = ({ title, value, description, icon: Icon, color, bgColor, isLoading, trend }: any) => (
  <Card className="brand-card hover:scale-105 transition-all duration-300 border-l-4 border-l-brand-gold">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
      <CardTitle className="text-sm font-medium text-brand-secondaryText">{title}</CardTitle>
      <div className={`p-3 rounded-lg ${bgColor} shadow-soft`}>
        <Icon className={`h-5 w-5 ${color}`} />
      </div>
    </CardHeader>
    <CardContent>
      <div className="flex items-end justify-between">
        <div>
          <div className="text-3xl font-bold text-brand-darkText mb-1">
            {isLoading ? (
              <div className="animate-pulse bg-gray-200 h-8 w-16 rounded"></div>
            ) : (
              value
            )}
          </div>
          <p className="text-xs text-brand-secondaryText">{description}</p>
        </div>
        {trend && (
          <div className="flex items-center text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
            <TrendingUp className="h-3 w-3 mr-1" />
            {trend}
          </div>
        )}
      </div>
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
      color: "text-brand-blue",
      bgColor: "bg-blue-50",
      isLoading: vehiculesLoading,
      trend: "+12%"
    },
    {
      title: "Chauffeurs disponibles",
      value: `${chauffeursStats?.disponibles || 0}`,
      description: "Prêts pour missions",
      icon: Users,
      color: "text-green-600",
      bgColor: "bg-green-50",
      isLoading: chauffeursLoading,
      trend: "+5%"
    },
    {
      title: "Missions en cours",
      value: `${missionsStats?.enCours || 0}`,
      description: "En cours de livraison",
      icon: Calendar,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      isLoading: missionsLoading
    },
    {
      title: "Validations en attente",
      value: `${validationsStats?.enAttente || 0}`,
      description: "Nécessitent une action",
      icon: AlertTriangle,
      color: "text-red-600",
      bgColor: "bg-red-50",
      isLoading: validationsLoading
    },
    {
      title: "CA mensuel",
      value: `${(facturesStats?.caMensuel || 0).toLocaleString('fr-FR')} GNF`,
      description: "Factures payées ce mois",
      icon: DollarSign,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      isLoading: facturesLoading,
      trend: "+23%"
    },
    {
      title: "Taux de conformité",
      value: `${facturesStats?.tauxConformite || 0}%`,
      description: "Factures payées",
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-50",
      isLoading: facturesLoading,
      trend: "+8%"
    }
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* En-tête de bienvenue modernisé */}
      <div className="relative bg-gradient-to-r from-brand-blue via-blue-700 to-blue-800 rounded-2xl p-8 text-white shadow-elegant overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-gold/10 rounded-full -translate-y-32 translate-x-32" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24" />
        <div className="relative z-10">
          <h1 className="text-4xl font-bold mb-3">
            Bienvenue dans SDBK Cargo Flow Manager
          </h1>
          <p className="text-blue-100 text-lg">
            Bonjour <span className="text-brand-gold font-medium">{user?.prenom} {user?.nom}</span>, 
            vous êtes connecté en tant que <span className="text-brand-gold font-medium capitalize">{user?.role}</span>
          </p>
          <div className="mt-4 flex items-center space-x-4 text-sm text-blue-200">
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-1" />
              {new Date().toLocaleDateString('fr-FR', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Statistiques principales avec grid responsive */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat, index) => (
          <div key={index} className="animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
            <StatCard {...stat} />
          </div>
        ))}
      </div>

      {/* Alertes documentaires */}
      <AlertesDocuments />

      <div className="grid gap-6 md:grid-cols-2">
        {/* Activité récente modernisée */}
        <Card className="brand-card">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-brand-darkText">
              <div className="p-2 bg-blue-50 rounded-lg">
                <BarChart3 className="h-5 w-5 text-brand-blue" />
              </div>
              Activité récente
            </CardTitle>
            <CardDescription>Les dernières actions dans le système</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentActivities?.length > 0 ? (
              recentActivities.map((activity, index) => (
                <div key={index} className="flex items-start space-x-4 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                  <div className={`w-2 h-2 rounded-full mt-2 ${
                    activity.type === 'mission' ? 'bg-brand-blue' :
                    activity.type === 'validation' ? 'bg-green-500' : 'bg-orange-500'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-brand-darkText">{activity.message}</p>
                    <p className="text-xs text-brand-secondaryText mt-1">Le {activity.time}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <Clock className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-brand-secondaryText">Aucune activité récente</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Alertes importantes modernisées */}
        <Card className="brand-card">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-brand-darkText">
              <div className="p-2 bg-orange-50 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
              </div>
              Alertes importantes
            </CardTitle>
            <CardDescription>Actions requises et notifications</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {validationsStats?.enAttente > 0 && (
              <div className="p-4 border-l-4 border-orange-500 bg-orange-50 rounded-r-lg">
                <div className="flex items-center">
                  <AlertTriangle className="h-5 w-5 text-orange-600 mr-2" />
                  <p className="text-sm font-medium text-orange-800">Validations en attente</p>
                </div>
                <p className="text-sm text-orange-700 mt-1">
                  {validationsStats.enAttente} véhicule(s) en attente de validation
                </p>
              </div>
            )}
            {missionsStats?.enCours > 0 && (
              <div className="p-4 border-l-4 border-brand-blue bg-blue-50 rounded-r-lg">
                <div className="flex items-center">
                  <Calendar className="h-5 w-5 text-brand-blue mr-2" />
                  <p className="text-sm font-medium text-blue-800">Missions en cours</p>
                </div>
                <p className="text-sm text-blue-700 mt-1">
                  {missionsStats.enCours} mission(s) en cours de livraison
                </p>
              </div>
            )}
            
            {/* Alertes système avec design moderne */}
            <div className="space-y-3">
              <div className="flex items-start p-4 bg-orange-50 rounded-lg border border-orange-200 hover:shadow-md transition-shadow">
                <div className="p-1 bg-orange-100 rounded-full mr-3 mt-0.5">
                  <Truck className="h-4 w-4 text-orange-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-orange-800">Maintenance programmée</p>
                  <p className="text-xs text-orange-600 mt-1">Véhicule TRK-001 - Échéance dans 2 jours</p>
                </div>
                <span className="brand-status-badge status-warning">Urgent</span>
              </div>
              
              <div className="flex items-start p-4 bg-blue-50 rounded-lg border border-blue-200 hover:shadow-md transition-shadow">
                <div className="p-1 bg-blue-100 rounded-full mr-3 mt-0.5">
                  <MapPin className="h-4 w-4 text-brand-blue" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-800">Nouvelle mission</p>
                  <p className="text-xs text-blue-600 mt-1">Transport vers Dakar - À affecter</p>
                </div>
                <span className="brand-status-badge status-info">Nouveau</span>
              </div>
              
              <div className="flex items-start p-4 bg-green-50 rounded-lg border border-green-200 hover:shadow-md transition-shadow">
                <div className="p-1 bg-green-100 rounded-full mr-3 mt-0.5">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-green-800">Formation terminée</p>
                  <p className="text-xs text-green-600 mt-1">3 chauffeurs certifiés HSE</p>
                </div>
                <span className="brand-status-badge status-success">Terminé</span>
              </div>
            </div>
            
            {(!validationsStats?.enAttente && !missionsStats?.enCours) && (
              <div className="p-4 border-l-4 border-green-500 bg-green-50 rounded-r-lg">
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                  <p className="text-sm font-medium text-green-800">Système opérationnel</p>
                </div>
                <p className="text-sm text-green-700 mt-1">Aucune alerte critique détectée</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Accès rapide modernisé */}
      <Card className="brand-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-brand-darkText">
            <div className="p-2 bg-brand-gold/20 rounded-lg">
              <Shield className="h-5 w-5 text-brand-gold" />
            </div>
            Accès rapide
          </CardTitle>
          <CardDescription>
            Fonctionnalités disponibles selon votre rôle
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {user?.role === 'admin' && (
              <div className="flex items-center p-4 bg-green-50 rounded-lg border border-green-200">
                <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-green-800">Accès administrateur</p>
                  <p className="text-xs text-green-600">Tous les modules disponibles</p>
                </div>
              </div>
            )}
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-brand-secondaryText">
                Utilisez la navigation latérale pour accéder aux différents modules du système SDBK.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
