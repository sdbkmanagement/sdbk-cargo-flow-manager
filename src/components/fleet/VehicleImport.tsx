import React from 'react';
import { ExcelImport } from '@/components/common/ExcelImport';
import vehiculesService from '@/services/vehicules';

interface VehicleImportProps {
  onClose: () => void;
  onSuccess: () => void;
}

export const VehicleImport: React.FC<VehicleImportProps> = ({ onClose, onSuccess }) => {
  const templateColumns = [
    'numero',
    'marque',
    'modele',
    'immatriculation',
    'type_transport',
    'type_vehicule',
    'capacite_max',
    'unite_capacite',
    'annee_fabrication',
    'numero_chassis',
    'base',
    'statut'
  ];

  const handleImport = async (data: any[]) => {
    const results = { success: 0, errors: [] as string[] };

    for (const row of data) {
      try {
        // Validation des champs obligatoires
        if (!row.numero || !row.type_transport) {
          results.errors.push(`Ligne ${row._row}: Numéro et type de transport sont obligatoires`);
          continue;
        }

        // Préparation des données
        const vehicleData = {
          numero: String(row.numero).trim(),
          marque: row.marque ? String(row.marque).trim() : null,
          modele: row.modele ? String(row.modele).trim() : null,
          immatriculation: row.immatriculation ? String(row.immatriculation).trim() : null,
          type_transport: String(row.type_transport).trim(),
          type_vehicule: row.type_vehicule ? String(row.type_vehicule).trim() : 'porteur',
          capacite_max: row.capacite_max ? Number(row.capacite_max) : null,
          unite_capacite: row.unite_capacite ? String(row.unite_capacite).trim() : null,
          annee_fabrication: row.annee_fabrication ? Number(row.annee_fabrication) : null,
          numero_chassis: row.numero_chassis ? String(row.numero_chassis).trim() : null,
          base: row.base ? String(row.base).trim() : null,
          statut: row.statut ? String(row.statut).trim() : 'disponible'
        };

        // Validation des valeurs
        if (vehicleData.capacite_max && isNaN(vehicleData.capacite_max)) {
          results.errors.push(`Ligne ${row._row}: Capacité max invalide`);
          continue;
        }

        if (vehicleData.annee_fabrication && (isNaN(vehicleData.annee_fabrication) || vehicleData.annee_fabrication < 1900)) {
          results.errors.push(`Ligne ${row._row}: Année de fabrication invalide`);
          continue;
        }

        // Import
        await vehiculesService.create(vehicleData);
        results.success++;

      } catch (error: any) {
        const errorMessage = error?.message || 'Erreur inconnue';
        results.errors.push(`Ligne ${row._row}: ${errorMessage}`);
      }
    }

    if (results.success > 0) {
      onSuccess();
    }

    return results;
  };

  return (
    <ExcelImport
      title="Véhicules"
      description="Importez vos véhicules depuis un fichier Excel"
      templateColumns={templateColumns}
      onImport={handleImport}
      onClose={onClose}
    />
  );
};
