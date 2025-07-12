
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Truck, Calendar, AlertTriangle, CheckCircle, Clock, XCircle } from 'lucide-react';
import { ROLE_LABELS } from '@/types/user';

const Dashboard = () => {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Chargement...</h2>
        </div>
      </div>
    );
  }

  // Statistiques simulées pour l'exemple
  const stats = {
    vehicules: { total: 15, disponibles: 12, maintenance: 2, mission: 1 },
    chauffeurs: { total: 18, actifs: 16, repos: 2 },
    missions: { en_cours: 5, en_attente: 3, terminees: 12 },
    validations: { en_attente: 4, validees: 8, rejetees: 1 }
  };

  return (
    <div className="space-y-6">
      {/* En-tête avec informations utilisateur */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Tableau de bord
          </h1>
          <p className="text-gray-600 mt-2">
            Bienvenue {user.first_name} {user.last_name} - {ROLE_LABELS[user.roles[0]]}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {user.roles.map(role => (
            <Badge 
              key={role} 
              variant={role === 'admin' ? 'default' : 'outline'}
              className={role === 'admin' ? 'bg-blue-600 text-white' : ''}
            >
              {ROLE_LABELS[role]}
            </Badge>
          ))}
        </div>
      </div>

      {/* Cartes de statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Véhicules */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Véhicules</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.vehicules.total}</div>
            <div className="flex gap-4 mt-2 text-xs">
              <span className="text-green-600">{stats.vehicules.disponibles} disponibles</span>
              <span className="text-orange-600">{stats.vehicules.maintenance} maintenance</span>
            </div>
          </CardContent>
        </Card>

        {/* Chauffeurs */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Chauffeurs</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.chauffeurs.total}</div>
            <div className="flex gap-4 mt-2 text-xs">
              <span className="text-green-600">{stats.chauffeurs.actifs} actifs</span>
              <span className="text-gray-600">{stats.chauffeurs.repos} repos</span>
            </div>
          </CardContent>
        </Card>

        {/* Missions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Missions</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.missions.en_cours}</div>
            <div className="flex gap-4 mt-2 text-xs">
              <span className="text-blue-600">{stats.missions.en_attente} en attente</span>
              <span className="text-green-600">{stats.missions.terminees} terminées</span>
            </div>
          </CardContent>
        </Card>

        {/* Validations */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Validations</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.validations.en_attente}</div>
            <div className="flex gap-4 mt-2 text-xs">
              <span className="text-green-600">{stats.validations.validees} validées</span>
              <span className="text-red-600">{stats.validations.rejetees} rejetées</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alertes et actions rapides selon les rôles */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Mes tâches */}
        <Card>
          <CardHeader>
            <CardTitle>Mes tâches</CardTitle>
            <CardDescription>
              Actions en attente selon vos rôles
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {user.roles.includes('maintenance') && (
              <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                <div>
                  <p className="font-medium text-orange-900">2 validations maintenance</p>
                  <p className="text-sm text-orange-700">Véhicules en attente de contrôle technique</p>
                </div>
              </div>
            )}
            
            {user.roles.includes('administratif') && (
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                <Clock className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-medium text-blue-900">1 validation administrative</p>
                  <p className="text-sm text-blue-700">Documents en attente de vérification</p>
                </div>
              </div>
            )}
            
            {user.roles.includes('hsecq') && (
              <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium text-green-900">1 contrôle HSECQ</p>
                  <p className="text-sm text-green-700">Vérification sécurité et environnement</p>
                </div>
              </div>
            )}

            {user.roles.includes('obc') && (
              <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                <Truck className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="font-medium text-purple-900">Aucune validation OBC</p>
                  <p className="text-sm text-purple-700">Toutes les validations sont à jour</p>
                </div>
              </div>
            )}

            {!user.roles.some(role => ['maintenance', 'administratif', 'hsecq', 'obc'].includes(role)) && (
              <div className="text-center py-4 text-gray-500">
                <p>Aucune tâche de validation en attente</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Activité récente */}
        <Card>
          <CardHeader>
            <CardTitle>Activité récente</CardTitle>
            <CardDescription>
              Dernières actions dans le système
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <div className="flex-1">
                <p className="text-sm font-medium">Mission M2025-001-003 terminée</p>
                <p className="text-xs text-gray-500">Il y a 2 heures</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <div className="flex-1">
                <p className="text-sm font-medium">Véhicule V-015 en maintenance</p>
                <p className="text-xs text-gray-500">Il y a 4 heures</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Users className="h-4 w-4 text-blue-600" />
              <div className="flex-1">
                <p className="text-sm font-medium">Nouveau chauffeur ajouté</p>
                <p className="text-xs text-gray-500">Hier</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
