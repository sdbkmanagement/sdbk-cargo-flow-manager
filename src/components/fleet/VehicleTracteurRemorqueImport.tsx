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

        const typeVehicule = String(row['Type de véhicule']).trim().toLowerCase();

        // Validation spécifique pour les véhicules de type "porteur"
        if (typeVehicule === 'porteur') {
          const marqueValue = row['Marque tracteur'] ? String(row['Marque tracteur']).trim() : '';
          const modeleValue = row['Modèle tracteur'] ? String(row['Modèle tracteur']).trim() : '';
          const immatriculationValue = row['Plaque d\'immatriculation tracteur'] ? String(row['Plaque d\'immatriculation tracteur']).trim() : '';
          
          if (!marqueValue || !modeleValue || !immatriculationValue) {
            results.errors.push(`Ligne ${row._row}: Pour un véhicule de type "porteur", la marque tracteur ("${marqueValue}"), le modèle tracteur ("${modeleValue}") et la plaque d'immatriculation tracteur ("${immatriculationValue}") sont obligatoires et ne peuvent pas être vides`);
            continue;
          }
        }

        // Générer un numéro automatique si pas fourni
        const numeroGenere = `TR-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
        
        // Préparer les données selon le type de véhicule
        const vehicleData: any = {
          numero: numeroGenere,
          type_transport: String(row['Type de transport']).trim(),
          type_vehicule: typeVehicule === 'porteur' ? 'porteur' : 'tracteur_remorque', // Normaliser la valeur
          base: row['Base'] ? String(row['Base']).trim() : null,
          
          // Données propriétaire
          proprietaire_nom: row['Nom du propriétaire'] ? String(row['Nom du propriétaire']).trim() : null,
          proprietaire_prenom: row['Prénom du propriétaire'] ? String(row['Prénom du propriétaire']).trim() : null,
          
          statut: 'disponible',
          validation_requise: false
        };

        // Pour les véhicules de type "porteur", utiliser les données du tracteur comme données principales
        if (typeVehicule === 'porteur') {
          // S'assurer que les valeurs ne sont jamais null pour respecter la contrainte
          vehicleData.marque = String(row['Marque tracteur']).trim();
          vehicleData.modele = String(row['Modèle tracteur']).trim();
          vehicleData.immatriculation = String(row['Plaque d\'immatriculation tracteur']).trim();
          vehicleData.configuration = row['Configuration tracteur'] ? String(row['Configuration tracteur']).trim() : null;
          vehicleData.numero_chassis = row['Numéro de châssis tracteur'] ? String(row['Numéro de châssis tracteur']).trim() : null;
          vehicleData.date_fabrication = row['Date de fabrication tracteur'] ? new Date(row['Date de fabrication tracteur']).toISOString().split('T')[0] : null;
          vehicleData.date_mise_circulation = row['Date de mise en circulation tracteur'] ? new Date(row['Date de mise en circulation tracteur']).toISOString().split('T')[0] : null;
        } else {
          // Pour tracteur+remorque, garder la structure existante
          vehicleData.tracteur_immatriculation = row['Plaque d\'immatriculation tracteur'] ? String(row['Plaque d\'immatriculation tracteur']).trim() : null;
          vehicleData.remorque_immatriculation = row['Plaque d\'immatriculation remorque'] ? String(row['Plaque d\'immatriculation remorque']).trim() : null;
          
          // Données tracteur
          vehicleData.tracteur_marque = row['Marque tracteur'] ? String(row['Marque tracteur']).trim() : null;
          vehicleData.tracteur_modele = row['Modèle tracteur'] ? String(row['Modèle tracteur']).trim() : null;
          vehicleData.tracteur_configuration = row['Configuration tracteur'] ? String(row['Configuration tracteur']).trim() : null;
          vehicleData.tracteur_numero_chassis = row['Numéro de châssis tracteur'] ? String(row['Numéro de châssis tracteur']).trim() : null;
          vehicleData.tracteur_date_fabrication = row['Date de fabrication tracteur'] ? new Date(row['Date de fabrication tracteur']).toISOString().split('T')[0] : null;
          vehicleData.tracteur_date_mise_circulation = row['Date de mise en circulation tracteur'] ? new Date(row['Date de mise en circulation tracteur']).toISOString().split('T')[0] : null;
          
          // Volume et données remorque
          vehicleData.remorque_volume_litres = row['Volume en litres'] ? Number(row['Volume en litres']) : null;
          vehicleData.remorque_marque = row['Marque remorque'] ? String(row['Marque remorque']).trim() : null;
          vehicleData.remorque_modele = row['Modèle remorque'] ? String(row['Modèle remorque']).trim() : null;
          vehicleData.remorque_configuration = row['Configuration remorque'] ? String(row['Configuration remorque']).trim() : null;
          vehicleData.remorque_numero_chassis = row['Numéro de châssis remorque'] ? String(row['Numéro de châssis remorque']).trim() : null;
          vehicleData.remorque_date_fabrication = row['Date de fabrication remorque'] ? new Date(row['Date de fabrication remorque']).toISOString().split('T')[0] : null;
          vehicleData.remorque_date_mise_circulation = row['Date de mise en circulation remorque'] ? new Date(row['Date de mise en circulation remorque']).toISOString().split('T')[0] : null;
        }

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