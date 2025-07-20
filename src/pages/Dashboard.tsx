
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Users, 
  Truck, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Plus,
  FileText,
  UserCheck,
  TrendingUp,
  Calendar,
  XCircle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { alertesService } from '@/services/alertesService';

interface DashboardStats {
  totalChauffeurs: number;
  chauffeursActifs: number;
  totalVehicules: number;
  vehiculesDisponibles: number;
  missionsEnCours: number;
  alertesDocuments: number;
  facturesEnAttente: number;
  chargementsAujourdhui: number;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    totalChauffeurs: 0,
    chauffeursActifs: 0,
    totalVehicules: 0,
    vehiculesDisponibles: 0,
    missionsEnCours: 0,
    alertesDocuments: 0,
    facturesEnAttente: 0,
    chargementsAujourdhui: 0
  });
  const [loading, setLoading] = useState(true);
  const [alertes, setAlertes] = useState<any[]>([]);

  useEffect(() => {
    loadDashboardData();
    
    // Actualiser les données toutes les 30 secondes
    const interval = setInterval(loadDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      console.log('Chargement des données du dashboard...');
      
      // Charger les statistiques
      const [
        chauffeursResult,
        vehiculesResult,
        missionsResult,
        facturesResult,
        chargementsResult
      ] = await Promise.all([
        supabase.from('chauffeurs').select('id, statut'),
        supabase.from('vehicules').select('id, statut'),
        supabase.from('missions').select('id, statut'),
        supabase.from('factures').select('id, statut'),
        supabase.from('chargements').select('id, created_at').gte('created_at', new Date().toISOString().split('T')[0])
      ]);

      // Charger toutes les alertes en utilisant le service
      const toutesAlertes = await alertesService.getToutesAlertes();

      // Calculer les statistiques
      const chauffeurs = chauffeursResult.data || [];
      const vehicules = vehiculesResult.data || [];
      const missions = missionsResult.data || [];
      const factures = facturesResult.data || [];
      const chargements = chargementsResult.data || [];

      console.log('Alertes pour le dashboard:', toutesAlertes);

      setStats({
        totalChauffeurs: chauffeurs.length,
        chauffeursActifs: chauffeurs.filter((c: any) => c.statut === 'actif').length,
        totalVehicules: vehicules.length,
        vehiculesDisponibles: vehicules.filter((v: any) => v.statut === 'disponible').length,
        missionsEnCours: missions.filter((m: any) => m.statut === 'en_cours').length,
        alertesDocuments: toutesAlertes.length,
        facturesEnAttente: factures.filter((f: any) => f.statut === 'en_attente').length,
        chargementsAujourdhui: chargements.length
      });

      // Limiter à 10 alertes pour l'affichage
      setAlertes(toutesAlertes.slice(0, 10));

    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
      toast.error('Erreur lors du chargement des données du tableau de bord');
    } finally {
      setLoading(false);
    }
  };

  const getAlertIcon = (joursRestants: number | null) => {
    if (joursRestants === null) return Clock;
    if (joursRestants < 0) return XCircle;
    if (joursRestants <= 7) return AlertTriangle;
    return Clock;
  };

  const getAlertColor = (joursRestants: number | null) => {
    if (joursRestants === null) return 'text-gray-500';
    if (joursRestants < 0) return 'text-red-600';
    if (joursRestants <= 7) return 'text-red-600';
    return 'text-orange-600';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Chargement du tableau de bord...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* En-tête */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Tableau de Bord</h1>
          <p className="text-muted-foreground">Vue d'ensemble de vos opérations de transport</p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          <span className="text-sm text-muted-foreground">
            {new Date().toLocaleDateString('fr-FR', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </span>
        </div>
      </div>

      {/* Statistiques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Chauffeurs</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalChauffeurs}</div>
            <p className="text-xs text-muted-foreground">
              {stats.chauffeursActifs} actifs
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Véhicules</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalVehicules}</div>
            <p className="text-xs text-muted-foreground">
              {stats.vehiculesDisponibles} disponibles
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Missions en cours</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.missionsEnCours}</div>
            <p className="text-xs text-muted-foreground">
              {stats.chargementsAujourdhui} chargements aujourd'hui
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alertes</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.alertesDocuments}</div>
            <p className="text-xs text-muted-foreground">
              {stats.facturesEnAttente} factures en attente
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Accès rapides */}
      <Card>
        <CardHeader>
          <CardTitle>Accès Rapides</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button
              variant="outline"
              className="h-auto p-4 flex flex-col items-center justify-center space-y-2 hover:shadow-md transition-shadow"
              onClick={() => navigate('/missions')}
            >
              <Plus className="h-5 w-5 text-blue-500" />
              <div className="text-center">
                <div className="font-medium">Nouvelle Mission</div>
                <div className="text-xs text-muted-foreground">Créer une nouvelle mission de transport</div>
              </div>
            </Button>
            <Button
              variant="outline"
              className="h-auto p-4 flex flex-col items-center justify-center space-y-2 hover:shadow-md transition-shadow"
              onClick={() => navigate('/fleet')}
            >
              <Truck className="h-5 w-5 text-green-500" />
              <div className="text-center">
                <div className="font-medium">Ajouter Véhicule</div>
                <div className="text-xs text-muted-foreground">Enregistrer un nouveau véhicule</div>
              </div>
            </Button>
            <Button
              variant="outline"
              className="h-auto p-4 flex flex-col items-center justify-center space-y-2 hover:shadow-md transition-shadow"
              onClick={() => navigate('/drivers')}
            >
              <Users className="h-5 w-5 text-orange-500" />
              <div className="text-center">
                <div className="font-medium">Gérer Chauffeurs</div>
                <div className="text-xs text-muted-foreground">Gestion des chauffeurs et conducteurs</div>
              </div>
            </Button>
            <Button
              variant="outline"
              className="h-auto p-4 flex flex-col items-center justify-center space-y-2 hover:shadow-md transition-shadow"
              onClick={() => navigate('/validations')}
            >
              <UserCheck className="h-5 w-5 text-purple-500" />
              <div className="text-center">
                <div className="font-medium">Validations</div>
                <div className="text-xs text-muted-foreground">Processus de validation des véhicules</div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Alertes récentes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Alertes Documents Récentes
            {stats.alertesDocuments > 0 && (
              <Badge className="bg-orange-500 text-white">
                {stats.alertesDocuments}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {alertes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
              <p className="text-lg font-medium">Aucune alerte récente</p>
              <p className="text-sm">Tous les documents sont à jour</p>
            </div>
          ) : (
            <div className="space-y-4">
              {alertes.map((alerte, index) => {
                const AlertIcon = getAlertIcon(alerte.jours_restants);
                const alertColor = getAlertColor(alerte.jours_restants);
                
                return (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg border-l-4 border-l-orange-500">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${
                        alerte.jours_restants !== null && alerte.jours_restants < 0
                          ? 'bg-red-100' 
                          : alerte.jours_restants !== null && alerte.jours_restants <= 7
                          ? 'bg-red-100'
                          : 'bg-orange-100'
                      }`}>
                        <AlertIcon className={`h-4 w-4 ${alertColor}`} />
                      </div>
                      <div>
                        <p className="font-medium">
                          {alerte.type === 'vehicule' ? alerte.vehicule_numero : alerte.chauffeur_nom}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {alerte.document_nom} - {
                            alerte.jours_restants !== null && alerte.jours_restants < 0 
                              ? 'Expiré' 
                              : alerte.jours_restants !== null && alerte.jours_restants <= 7
                              ? 'Critique'
                              : 'À renouveler'
                          }
                        </p>
                        {alerte.date_expiration && (
                          <p className="text-xs text-muted-foreground">
                            Expiration: {new Date(alerte.date_expiration).toLocaleDateString('fr-FR')}
                          </p>
                        )}
                      </div>
                    </div>
                    <Badge variant={
                      alerte.jours_restants !== null && alerte.jours_restants < 0 
                        ? 'destructive' 
                        : alerte.jours_restants !== null && alerte.jours_restants <= 7
                        ? 'destructive'
                        : 'secondary'
                    }>
                      {alerte.jours_restants !== null && alerte.jours_restants < 0 ? 
                        `Expiré depuis ${Math.abs(alerte.jours_restants)} jours` : 
                        `${alerte.jours_restants} jours restants`
                      }
                    </Badge>
                  </div>
                );
              })}
              {stats.alertesDocuments > alertes.length && (
                <div className="text-center">
                  <Button
                    variant="outline"
                    onClick={() => navigate('/drivers?tab=alertes')}
                    className="text-orange-600 border-orange-600 hover:bg-orange-50"
                  >
                    Voir toutes les alertes ({stats.alertesDocuments})
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
