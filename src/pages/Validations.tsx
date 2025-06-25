
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { ValidationTab } from '@/components/fleet/ValidationTab';
import { vehiculesService } from '@/services/vehicules';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const Validations = () => {
  // Récupération des véhicules
  const { data: vehicles = [], isLoading, error } = useQuery({
    queryKey: ['vehicles'],
    queryFn: vehiculesService.getAll,
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
        <h1 className="text-3xl font-bold text-gray-900">Workflows de Validation</h1>
        <p className="text-gray-600 mt-2">
          Gérez les validations interservices de vos véhicules
        </p>
      </div>

      <ValidationTab vehicles={vehicles} />
    </div>
  );
};

export default Validations;
