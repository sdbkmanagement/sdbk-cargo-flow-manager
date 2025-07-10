
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { ProcessusWorkflowCard } from '@/components/fleet/processus-sdbk/ProcessusWorkflowCard';
import { vehiculesService } from '@/services/vehicules';
import { processusSDBKService, type StatutVehicule } from '@/services/processus-sdbk';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const Validations = () => {
  // Récupération des véhicules
  const { data: vehicles = [], isLoading, error } = useQuery({
    queryKey: ['vehicles'],
    queryFn: vehiculesService.getAll,
  });

  // Récupération des statistiques du processus
  const { data: stats = {
    retour_maintenance: 0,
    maintenance_en_cours: 0,
    disponible_maintenance: 0,
    verification_admin: 0,
    controle_obc: 0,
    controle_hsse: 0,
    disponible: 0,
    en_mission: 0,
    bloque: 0
  } } = useQuery({
    queryKey: ['processus-stats'],
    queryFn: processusSDBKService.getStatistiquesProcessus,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p>Chargement des véhicules...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center text-red-500">
          <p>Erreur lors du chargement des véhicules</p>
          <p className="text-sm mt-2">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Processus de Gestion SDBK</h1>
        <p className="text-gray-600 mt-2">
          Suivi complet du processus de validation en 9 étapes pour la flotte de véhicules
        </p>
      </div>

      {/* Statistiques du processus */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-orange-600">{stats.retour_maintenance || 0}</div>
            <p className="text-xs text-muted-foreground">Retour Maintenance</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">{stats.maintenance_en_cours || 0}</div>
            <p className="text-xs text-muted-foreground">En Diagnostic</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-600">{stats.disponible_maintenance || 0}</div>
            <p className="text-xs text-muted-foreground">Maintenance OK</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{stats.verification_admin || 0}</div>
            <p className="text-xs text-muted-foreground">Vérif. Admin</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-600">{stats.controle_obc || 0}</div>
            <p className="text-xs text-muted-foreground">Contrôle OBC</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-indigo-600">{stats.controle_hsse || 0}</div>
            <p className="text-xs text-muted-foreground">Contrôle HSSE</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{stats.disponible || 0}</div>
            <p className="text-xs text-muted-foreground">Disponibles</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{stats.en_mission || 0}</div>
            <p className="text-xs text-muted-foreground">En Mission</p>
          </CardContent>
        </Card>
      </div>

      {/* Liste des véhicules avec leur processus */}
      <div className="space-y-4">
        {vehicles.map((vehicle) => (
          <ProcessusWorkflowCard
            key={vehicle.id}
            vehiculeId={vehicle.id}
            vehiculeNumero={`${vehicle.numero} (${vehicle.immatriculation || vehicle.tracteur_immatriculation || 'N/A'})`}
            vehiculeStatut={vehicle.statut as StatutVehicule}
            userRole="admin" // TODO: Récupérer le vrai rôle utilisateur
          />
        ))}
      </div>
    </div>
  );
};

export default Validations;
