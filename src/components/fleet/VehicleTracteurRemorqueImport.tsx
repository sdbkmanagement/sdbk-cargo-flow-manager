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
    'Marque tracteur',
    'Modèle tracteur',
    'Configuration tracteur',
    'Numéro de châssis tracteur',
    'Date de fabrication tracteur',
    'Date de mise en circulation tracteur',
    'Volume en litres',
    'Marque remorque',
    'Modèle remorque',
    'Configuration remorque',
    'Numéro de châssis remorque',
    'Date de fabrication remorque',
    'Date de mise en circulation remorque'
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
          proprietaire_nom: row['Nom du propriétaire'] ? String(row['Nom du propriétaire']).trim() : null,
          proprietaire_prenom: row['Prénom du propriétaire'] ? String(row['Prénom du propriétaire']).trim() : null,
          
          // Immatriculations
          tracteur_immatriculation: row['Plaque d\'immatriculation tracteur'] ? String(row['Plaque d\'immatriculation tracteur']).trim() : null,
          remorque_immatriculation: row['Plaque d\'immatriculation remorque'] ? String(row['Plaque d\'immatriculation remorque']).trim() : null,
          
          // Données tracteur
          tracteur_marque: row['Marque tracteur'] ? String(row['Marque tracteur']).trim() : null,
          tracteur_modele: row['Modèle tracteur'] ? String(row['Modèle tracteur']).trim() : null,
          tracteur_configuration: row['Configuration tracteur'] ? String(row['Configuration tracteur']).trim() : null,
          tracteur_numero_chassis: row['Numéro de châssis tracteur'] ? String(row['Numéro de châssis tracteur']).trim() : null,
          tracteur_date_fabrication: row['Date de fabrication tracteur'] ? new Date(row['Date de fabrication tracteur']).toISOString().split('T')[0] : null,
          tracteur_date_mise_circulation: row['Date de mise en circulation tracteur'] ? new Date(row['Date de mise en circulation tracteur']).toISOString().split('T')[0] : null,
          
          // Volume et données remorque
          remorque_volume_litres: row['Volume en litres'] ? Number(row['Volume en litres']) : null,
          remorque_marque: row['Marque remorque'] ? String(row['Marque remorque']).trim() : null,
          remorque_modele: row['Modèle remorque'] ? String(row['Modèle remorque']).trim() : null,
          remorque_configuration: row['Configuration remorque'] ? String(row['Configuration remorque']).trim() : null,
          remorque_numero_chassis: row['Numéro de châssis remorque'] ? String(row['Numéro de châssis remorque']).trim() : null,
          remorque_date_fabrication: row['Date de fabrication remorque'] ? new Date(row['Date de fabrication remorque']).toISOString().split('T')[0] : null,
          remorque_date_mise_circulation: row['Date de mise en circulation remorque'] ? new Date(row['Date de mise en circulation remorque']).toISOString().split('T')[0] : null,
          
          statut: 'disponible',
          validation_requise: false
        };

        // Validation des valeurs numériques
        if (vehicleData.remorque_volume_litres && isNaN(vehicleData.remorque_volume_litres)) {
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