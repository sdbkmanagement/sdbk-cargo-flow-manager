
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
  Calendar
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

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
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Charger les statistiques
      const [
        chauffeursResult,
        vehiculesResult,
        missionsResult,
        facturesResult,
        chargementsResult,
        alertesVehiculesResult,
        alertesChauffeursResult
      ] = await Promise.all([
        supabase.from('chauffeurs').select('id, statut'),
        supabase.from('vehicules').select('id, statut'),
        supabase.from('missions').select('id, statut'),
        supabase.from('factures').select('id, statut'),
        supabase.from('chargements').select('id, created_at').gte('created_at', new Date().toISOString().split('T')[0]),
        supabase.from('alertes_documents_vehicules').select('*'),
        supabase.from('alertes_documents_chauffeurs').select('*')
      ]);

      // Calculer les statistiques
      const chauffeurs = chauffeursResult.data || [];
      const vehicules = vehiculesResult.data || [];
      const missions = missionsResult.data || [];
      const factures = facturesResult.data || [];
      const chargements = chargementsResult.data || [];
      const alertesVehicules = alertesVehiculesResult.data || [];
      const alertesChauffeurs = alertesChauffeursResult.data || [];

      setStats({
        totalChauffeurs: chauffeurs.length,
        chauffeursActifs: chauffeurs.filter((c: any) => c.statut === 'actif').length,
        totalVehicules: vehicules.length,
        vehiculesDisponibles: vehicules.filter((v: any) => v.statut === 'disponible').length,
        missionsEnCours: missions.filter((m: any) => m.statut === 'en_cours').length,
        alertesDocuments: alertesVehicules.length + alertesChauffeurs.length,
        facturesEnAttente: factures.filter((f: any) => f.statut === 'en_attente').length,
        chargementsAujourdhui: chargements.length
      });

      // Fusionner les alertes
      const toutesAlertes = [
        ...alertesVehicules.map((a: any) => ({ ...a, type: 'vehicule' })),
        ...alertesChauffeurs.map((a: any) => ({ ...a, type: 'chauffeur' }))
      ].slice(0, 5);

      setAlertes(toutesAlertes);

    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
      toast.error('Erreur lors du chargement des données du tableau de bord');
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    {
      title: 'Nouvelle Mission',
      description: 'Créer une nouvelle mission de transport',
      icon: Plus,
      color: 'bg-blue-500',
      onClick: () => navigate('/missions')
    },
    {
      title: 'Ajouter Véhicule',
      description: 'Enregistrer un nouveau véhicule',
      icon: Truck,
      color: 'bg-green-500',
      onClick: () => navigate('/fleet')
    },
    {
      title: 'Gérer Chauffeurs',
      description: 'Gestion des chauffeurs et conducteurs',
      icon: Users,
      color: 'bg-orange-500',
      onClick: () => navigate('/drivers')
    },
    {
      title: 'Validations',
      description: 'Processus de validation des véhicules',
      icon: UserCheck,
      color: 'bg-purple-500',
      onClick: () => navigate('/validations')
    }
  ];

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
            <div className="text-2xl font-bold">{stats.alertesDocuments}</div>
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
            {quickActions.map((action, index) => (
              <Button
                key={index}
                variant="outline"
                className="h-auto p-4 flex flex-col items-center justify-center space-y-2 hover:shadow-md transition-shadow"
                onClick={action.onClick}
              >
                <div className={`${action.color} text-white p-2 rounded-full`}>
                  <action.icon className="h-5 w-5" />
                </div>
                <div className="text-center">
                  <div className="font-medium">{action.title}</div>
                  <div className="text-xs text-muted-foreground">{action.description}</div>
                </div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Alertes récentes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Alertes Récentes
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
              {alertes.map((alerte, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${
                      alerte.niveau_alerte === 'expire' ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'
                    }`}>
                      {alerte.niveau_alerte === 'expire' ? (
                        <AlertTriangle className="h-4 w-4" />
                      ) : (
                        <Clock className="h-4 w-4" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">
                        {alerte.type === 'vehicule' ? alerte.vehicule_numero : alerte.chauffeur_nom}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {alerte.document_nom} - {alerte.niveau_alerte === 'expire' ? 'Expiré' : 'À renouveler'}
                      </p>
                    </div>
                  </div>
                  <Badge variant={alerte.niveau_alerte === 'expire' ? 'destructive' : 'secondary'}>
                    {alerte.jours_restants < 0 ? 
                      `Expiré depuis ${Math.abs(alerte.jours_restants)} jours` : 
                      `${alerte.jours_restants} jours restants`
                    }
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
