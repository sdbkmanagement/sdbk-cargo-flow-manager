import React from 'react';
import { ExcelImport } from '@/components/common/ExcelImport';
import vehiculesService from '@/services/vehicules';

interface VehicleTracteurRemorqueImportProps {
  onClose: () => void;
  onSuccess: () => void;
}

export const VehicleTracteurRemorqueImport: React.FC<VehicleTracteurRemorqueImportProps> = ({ onClose, onSuccess }) => {
  const templateColumns = [
    'Type de véhicule',
    'Base',
    'Type de transport',
    'Nom du propriétaire',
    'Prénom du propriétaire',
    'Plaque d\'immatriculation tracteur',
    'Plaque d\'immatriculation remorque',
    'Marque',
    'Modèle',
    'Configuration',
    'Numéro de châssis',
    'Date de fabrication',
    'Date de mise en circulation',
    'Volume en litres',
    'Marque',
    'Modèle',
    'Configuration',
    'Numéro de châssis',
    'Date de fabrication',
    'Date de mise en circulation'
  ];

  const handleImport = async (data: any[]) => {
    const results = { success: 0, errors: [] as string[] };

    for (const row of data) {
      try {
        // Validation des champs obligatoires
        if (!row['Type de transport'] || !row['Type de véhicule']) {
          results.errors.push(`Ligne ${row._row}: Type de transport et type de véhicule sont obligatoires`);
          continue;
        }

        // Générer un numéro automatique si pas fourni
        const numeroGenere = `TR-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;

        // Préparation des données pour véhicule tracteur + remorque
        const vehicleData = {
          numero: numeroGenere,
          type_transport: String(row['Type de transport']).trim(),
          type_vehicule: String(row['Type de véhicule']).trim(),
          base: row['Base'] ? String(row['Base']).trim() : null,
          
          // Données propriétaire
          nom_proprietaire: row['Nom du propriétaire'] ? String(row['Nom du propriétaire']).trim() : null,
          prenom_proprietaire: row['Prénom du propriétaire'] ? String(row['Prénom du propriétaire']).trim() : null,
          
          // Immatriculations
          immatriculation: row['Plaque d\'immatriculation tracteur'] ? String(row['Plaque d\'immatriculation tracteur']).trim() : null,
          immatriculation_remorque: row['Plaque d\'immatriculation remorque'] ? String(row['Plaque d\'immatriculation remorque']).trim() : null,
          
          // Données tracteur - utilise les premières colonnes Marque, Modèle, etc.
          marque: row['Marque'] ? String(row['Marque']).trim() : null,
          modele: row['Modèle'] ? String(row['Modèle']).trim() : null,
          configuration_tracteur: row['Configuration'] ? String(row['Configuration']).trim() : null,
          numero_chassis: row['Numéro de châssis'] ? String(row['Numéro de châssis']).trim() : null,
          date_fabrication_tracteur: row['Date de fabrication'] ? new Date(row['Date de fabrication']).toISOString().split('T')[0] : null,
          date_mise_circulation_tracteur: row['Date de mise en circulation'] ? new Date(row['Date de mise en circulation']).toISOString().split('T')[0] : null,
          
          // Volume et données remorque - utilise les dernières colonnes
          capacite_max: row['Volume en litres'] ? Number(row['Volume en litres']) : null,
          unite_capacite: row['Volume en litres'] ? 'litres' : null,
          // Pour les colonnes dupliquées, on récupère les dernières valeurs (colonnes 15-20)
          marque_remorque: row['Marque'] ? String(row['Marque']).trim() : null,
          modele_remorque: row['Modèle'] ? String(row['Modèle']).trim() : null,
          configuration_remorque: row['Configuration'] ? String(row['Configuration']).trim() : null,
          numero_chassis_remorque: row['Numéro de châssis'] ? String(row['Numéro de châssis']).trim() : null,
          date_fabrication_remorque: row['Date de fabrication'] ? new Date(row['Date de fabrication']).toISOString().split('T')[0] : null,
          date_mise_circulation_remorque: row['Date de mise en circulation'] ? new Date(row['Date de mise en circulation']).toISOString().split('T')[0] : null,
          
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