import React from 'react';
import { ExcelImport } from '@/components/common/ExcelImport';
import vehiculesService from '@/services/vehicules';

interface VehicleTracteurRemorqueImportProps {
  onClose: () => void;
  onSuccess: () => void;
}

export const VehicleTracteurRemorqueImport: React.FC<VehicleTracteurRemorqueImportProps> = ({ onClose, onSuccess }) => {
  const templateColumns = [
    'type_vehicule',
    'base',
    'type_transport',
    'nom_proprietaire',
    'prenom_proprietaire',
    'immatriculation_tracteur',
    'immatriculation_remorque',
    'marque_tracteur',
    'modele_tracteur',
    'configuration_tracteur',
    'numero_chassis_tracteur',
    'date_fabrication_tracteur',
    'date_mise_circulation_tracteur',
    'volume_litres',
    'marque_remorque',
    'modele_remorque',
    'configuration_remorque',
    'numero_chassis_remorque',
    'date_fabrication_remorque',
    'date_mise_circulation_remorque'
  ];

  const handleImport = async (data: any[]) => {
    const results = { success: 0, errors: [] as string[] };

    for (const row of data) {
      try {
        // Validation des champs obligatoires
        if (!row.type_transport || !row.type_vehicule) {
          results.errors.push(`Ligne ${row._row}: Type de transport et type de véhicule sont obligatoires`);
          continue;
        }

        // Générer un numéro automatique si pas fourni
        const numeroGenere = `TR-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;

        // Préparation des données pour véhicule tracteur + remorque
        const vehicleData = {
          numero: numeroGenere,
          type_transport: String(row.type_transport).trim(),
          type_vehicule: String(row.type_vehicule).trim(),
          base: row.base ? String(row.base).trim() : null,
          
          // Données propriétaire
          nom_proprietaire: row.nom_proprietaire ? String(row.nom_proprietaire).trim() : null,
          prenom_proprietaire: row.prenom_proprietaire ? String(row.prenom_proprietaire).trim() : null,
          
          // Immatriculations
          immatriculation: row.immatriculation_tracteur ? String(row.immatriculation_tracteur).trim() : null,
          immatriculation_remorque: row.immatriculation_remorque ? String(row.immatriculation_remorque).trim() : null,
          
          // Données tracteur
          marque: row.marque_tracteur ? String(row.marque_tracteur).trim() : null,
          modele: row.modele_tracteur ? String(row.modele_tracteur).trim() : null,
          configuration_tracteur: row.configuration_tracteur ? String(row.configuration_tracteur).trim() : null,
          numero_chassis: row.numero_chassis_tracteur ? String(row.numero_chassis_tracteur).trim() : null,
          date_fabrication_tracteur: row.date_fabrication_tracteur ? new Date(row.date_fabrication_tracteur).toISOString().split('T')[0] : null,
          date_mise_circulation_tracteur: row.date_mise_circulation_tracteur ? new Date(row.date_mise_circulation_tracteur).toISOString().split('T')[0] : null,
          
          // Volume et données remorque
          capacite_max: row.volume_litres ? Number(row.volume_litres) : null,
          unite_capacite: row.volume_litres ? 'litres' : null,
          marque_remorque: row.marque_remorque ? String(row.marque_remorque).trim() : null,
          modele_remorque: row.modele_remorque ? String(row.modele_remorque).trim() : null,
          configuration_remorque: row.configuration_remorque ? String(row.configuration_remorque).trim() : null,
          numero_chassis_remorque: row.numero_chassis_remorque ? String(row.numero_chassis_remorque).trim() : null,
          date_fabrication_remorque: row.date_fabrication_remorque ? new Date(row.date_fabrication_remorque).toISOString().split('T')[0] : null,
          date_mise_circulation_remorque: row.date_mise_circulation_remorque ? new Date(row.date_mise_circulation_remorque).toISOString().split('T')[0] : null,
          
          statut: 'disponible',
          validation_requise: false
        };

        // Validation des valeurs numériques
        if (vehicleData.capacite_max && isNaN(vehicleData.capacite_max)) {
          results.errors.push(`Ligne ${row._row}: Volume en litres invalide`);
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
      title="Véhicules Tracteur + Remorque"
      description="Importez vos véhicules tracteur + remorque depuis un fichier Excel"
      templateColumns={templateColumns}
      onImport={handleImport}
      onClose={onClose}
    />
  );
};