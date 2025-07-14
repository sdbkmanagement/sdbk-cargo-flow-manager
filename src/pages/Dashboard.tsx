
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { ModernStatCard, StatsGrid } from '@/components/ui/modern-stats';
import { ModernCard, ModernCardHeader, ModernCardTitle, ModernCardContent } from '@/components/ui/modern-card';
import { ModernSkeleton, EmptyState } from '@/components/ui/loading-states';
import { 
  Truck, 
  Users, 
  FileText, 
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  MapPin
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

// Hook optimisé pour les statistiques du dashboard
const useDashboardStats = () => {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const [vehiculesRes, chauffeursRes, missionsRes] = await Promise.all([
        supabase.from('vehicules').select('id, statut'),
        supabase.from('chauffeurs').select('id, statut'),
        supabase.from('missions').select('id, statut')
      ]);

      const vehicules = vehiculesRes.data || [];
      const chauffeurs = chauffeursRes.data || [];
      const missions = missionsRes.data || [];

      return {
        vehicules: {
          total: vehicules.length,
          disponibles: vehicules.filter(v => v.statut === 'disponible').length,
          enMaintenance: vehicules.filter(v => v.statut === 'maintenance').length,
          enMission: vehicules.filter(v => v.statut === 'en_mission').length
        },
        chauffeurs: {
          total: chauffeurs.length,
          actifs: chauffeurs.filter(c => c.statut === 'actif').length,
          enConge: chauffeurs.filter(c => c.statut === 'conge').length,
          disponibles: chauffeurs.filter(c => c.statut === 'actif').length
        },
        missions: {
          total: missions.length,
          enCours: missions.filter(m => m.statut === 'en_cours').length,
          terminees: missions.filter(m => m.statut === 'terminee').length,
          enAttente: missions.filter(m => m.statut === 'en_attente').length
        }
      };
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 5 * 60 * 1000, // Actualisation toutes les 5 minutes
  });
};

// Hook pour les alertes récentes basées sur les vraies données
const useRecentAlerts = () => {
  return useQuery({
    queryKey: ['recent-alerts'],
    queryFn: async () => {
      // Récupérer les vraies alertes depuis la base de données
      const [
        alertesVehiculesRes,
        alertesChauffeursRes,
        alertesRHRes,
        facturesEnRetardRes
      ] = await Promise.all([
        supabase.from('alertes_documents_vehicules').select('*').order('date_expiration', { ascending: true }).limit(3),
        supabase.from('alertes_documents_chauffeurs').select('*').order('date_expiration', { ascending: true }).limit(3),
        supabase.from('alertes_rh').select('*').order('date_echeance', { ascending: true }).limit(3),
        supabase.from('factures').select('*').eq('statut', 'en_retard').order('date_echeance', { ascending: true }).limit(3)
      ]);

      const alertes = [];

      // Ajouter les alertes de véhicules
      (alertesVehiculesRes.data || []).forEach(alerte => {
        alertes.push({
          id: alerte.id,
          type: 'maintenance',
          title: 'Document véhicule à renouveler',
          message: `${alerte.vehicule_numero} - ${alerte.document_nom} (expire dans ${alerte.jours_restants} jours)`,
          priority: alerte.niveau_alerte === 'critique' ? 'danger' : alerte.niveau_alerte === 'urgent' ? 'warning' : 'info',
          timestamp: new Date(alerte.date_expiration)
        });
      });

      // Ajouter les alertes de chauffeurs
      (alertesChauffeursRes.data || []).forEach(alerte => {
        alertes.push({
          id: alerte.id,
          type: 'formation',
          title: 'Document chauffeur à renouveler',
          message: `${alerte.chauffeur_nom} - ${alerte.document_nom} (expire dans ${alerte.jours_restants} jours)`,
          priority: alerte.niveau_alerte === 'critique' ? 'danger' : alerte.niveau_alerte === 'urgent' ? 'warning' : 'info',
          timestamp: new Date(alerte.date_expiration)
        });
      });

      // Ajouter les alertes RH
      (alertesRHRes.data || []).forEach(alerte => {
        alertes.push({
          id: alerte.employe_id,
          type: 'formation',
          title: alerte.type_alerte,
          message: `${alerte.nom_complet} - ${alerte.message}`,
          priority: alerte.priorite === 'critique' ? 'danger' : alerte.priorite === 'important' ? 'warning' : 'info',
          timestamp: new Date(alerte.date_echeance)
        });
      });

      // Ajouter les alertes de factures en retard
      (facturesEnRetardRes.data || []).forEach(facture => {
        alertes.push({
          id: facture.id,
          type: 'mission',
          title: 'Facture en retard',
          message: `Facture ${facture.numero} - ${facture.client_nom}`,
          priority: 'warning',
          timestamp: new Date(facture.date_echeance)
        });
      });

      // Trier par date et prendre les 5 plus récentes
      return alertes.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime()).slice(0, 5);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

const Dashboard: React.FC = () => {
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: alerts, isLoading: alertsLoading } = useRecentAlerts();

  // Calcul du taux de réussite (exemple)
  const successRate = stats ? 
    Math.round((stats.missions.terminees / Math.max(stats.missions.total, 1)) * 100) : 0;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* En-tête de page */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Tableau de bord</h1>
          <p className="page-subtitle">
            Vue d'ensemble de vos opérations de transport
          </p>
        </div>
      </div>

      {/* Statistiques principales */}
      <section>
        {statsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <ModernSkeleton key={i} variant="card" />
            ))}
          </div>
        ) : stats ? (
          <StatsGrid>
            <ModernStatCard
              title="Flotte"
              value={stats.vehicules.disponibles}
              subtitle="Véhicules disponibles"
              icon={Truck}
              color="primary"
              trend={stats.vehicules.total > 0 ? { value: Math.round((stats.vehicules.disponibles / stats.vehicules.total) * 100), isPositive: true } : undefined}
            />
            <ModernStatCard
              title="Chauffeurs"
              value={stats.chauffeurs.disponibles}
              subtitle="Chauffeurs disponibles"
              icon={Users}
              color="success"
              trend={stats.chauffeurs.total > 0 ? { value: Math.round((stats.chauffeurs.actifs / stats.chauffeurs.total) * 100), isPositive: true } : undefined}
            />
            <ModernStatCard
              title="Missions"
              value={stats.missions.enCours}
              subtitle="Missions en cours"
              icon={FileText}
              color="info"
            />
            <ModernStatCard
              title="Performance"
              value={`${successRate}%`}
              subtitle="Taux de réussite"
              icon={TrendingUp}
              color={successRate >= 90 ? "success" : successRate >= 75 ? "warning" : "danger"}
              trend={successRate > 0 ? { value: successRate, isPositive: successRate >= 75 } : undefined}
            />
          </StatsGrid>
        ) : (
          <EmptyState
            title="Aucune donnée disponible"
            description="Impossible de charger les statistiques"
            icon={<AlertTriangle className="w-12 h-12" />}
          />
        )}
      </section>

      {/* Grille de contenu secondaire */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Alertes récentes */}
        <ModernCard>
          <ModernCardHeader>
            <ModernCardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-warning" />
              Alertes récentes
            </ModernCardTitle>
          </ModernCardHeader>
          <ModernCardContent>
            {alertsLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <ModernSkeleton variant="avatar" className="w-10 h-10" />
                    <div className="flex-1 space-y-2">
                      <ModernSkeleton className="h-4 w-3/4" />
                      <ModernSkeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : alerts && alerts.length > 0 ? (
              <div className="space-y-4">
                {alerts.map((alert) => {
                  const icons = {
                    maintenance: Clock,
                    mission: MapPin,
                    formation: CheckCircle
                  };
                  const Icon = icons[alert.type as keyof typeof icons] || AlertTriangle;
                  
                  const colors = {
                    warning: 'text-warning',
                    info: 'text-info',
                    success: 'text-success',
                    danger: 'text-destructive'
                  };

                  return (
                    <div key={alert.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 smooth-transition">
                      <div className={`p-2 rounded-lg bg-muted ${colors[alert.priority as keyof typeof colors]}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm text-foreground">
                          {alert.title}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {alert.message}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {alert.timestamp.toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <EmptyState
                title="Aucune alerte"
                description="Toutes vos opérations fonctionnent normalement"
                icon={<CheckCircle className="w-8 h-8 text-success" />}
              />
            )}
          </ModernCardContent>
        </ModernCard>

        {/* Accès rapide */}
        <ModernCard>
          <ModernCardHeader>
            <ModernCardTitle>Accès rapide</ModernCardTitle>
          </ModernCardHeader>
          <ModernCardContent>
            <div className="grid grid-cols-2 gap-3">
              {[
                { title: 'Nouvelle mission', icon: FileText, href: '/missions', color: 'primary' },
                { title: 'Ajouter véhicule', icon: Truck, href: '/fleet', color: 'success' },
                { title: 'Gérer chauffeurs', icon: Users, href: '/drivers', color: 'info' },
                { title: 'Validations', icon: CheckCircle, href: '/validations', color: 'warning' }
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.title}
                    className="p-4 rounded-lg border border-border hover:border-primary/50 hover:bg-accent smooth-transition text-left group"
                  >
                    <Icon className="w-6 h-6 text-muted-foreground group-hover:text-primary mb-2" />
                    <span className="text-sm font-medium text-foreground">{item.title}</span>
                  </button>
                );
              })}
            </div>
          </ModernCardContent>
        </ModernCard>
      </div>
    </div>
  );
};

export default Dashboard;
