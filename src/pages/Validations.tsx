import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ValidationWorkflowCard } from '@/components/fleet/validation/ValidationWorkflowCard';
import { ValidationStats } from '@/components/fleet/validation/ValidationStats';
import { vehiculesService } from '@/services/vehicules';
import { validationService } from '@/services/validation';

type Vehicule = {
  id: string;
  numero: string;
  immatriculation?: string;
  tracteur_immatriculation?: string;
  marque?: string;
  modele?: string;
  type_transport: string;
  statut: string;
  chauffeur?: {
    nom: string;
    prenom: string;
  } | null;
};

const Validations = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Récupération des véhicules
  const { data: vehicles = [], isLoading, error } = useQuery({
    queryKey: ['vehicles'],
    queryFn: vehiculesService.getAll,
  });

  // Récupération des statistiques de validation
  const { data: stats } = useQuery({
    queryKey: ['validation-stats'],
    queryFn: validationService.getStatistiquesGlobales,
  });

  // Filtrage des véhicules
  const filteredVehicles = vehicles.filter((vehicle: Vehicule) => {
    const matchesSearch = 
      vehicle.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (vehicle.immatriculation && vehicle.immatriculation.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (vehicle.tracteur_immatriculation && vehicle.tracteur_immatriculation.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (vehicle.marque && vehicle.marque.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'en_validation' && vehicle.statut === 'validation_requise') ||
      (statusFilter === 'valide' && vehicle.statut === 'disponible') ||
      (statusFilter === 'rejete' && vehicle.statut === 'validation_requise');
    
    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p>Chargement des workflows de validation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center text-red-500">
          <p>Erreur lors du chargement des workflows</p>
          <p className="text-sm mt-2">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Workflows de Validation</h1>
        <p className="text-gray-600 mt-2">
          Gestion des processus de validation des véhicules
        </p>
      </div>

      {/* Statistiques */}
      <ValidationStats />

      <Card>
        <CardHeader>
          <CardTitle>Validation des véhicules</CardTitle>
          <CardDescription>
            Suivez et gérez les workflows de validation pour chaque véhicule
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filtres */}
          <div className="flex flex-col gap-4 mb-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Rechercher un véhicule..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="w-full sm:w-48">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les statuts</SelectItem>
                    <SelectItem value="en_validation">En validation</SelectItem>
                    <SelectItem value="valide">Validé</SelectItem>
                    <SelectItem value="rejete">Rejeté</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Liste des workflows */}
          <div className="space-y-4">
            {filteredVehicles.length > 0 ? (
              filteredVehicles.map((vehicle) => (
                <ValidationWorkflowCard
                  key={vehicle.id}
                  vehiculeId={vehicle.id}
                  vehiculeNumero={`${vehicle.numero} (${vehicle.immatriculation || vehicle.tracteur_immatriculation || 'N/A'})`}
                  userRole="admin" // TODO: Récupérer le vrai rôle utilisateur
                />
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">Aucun véhicule trouvé pour les critères sélectionnés.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Validations;