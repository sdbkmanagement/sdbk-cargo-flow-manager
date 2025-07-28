
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

  const templateData = [
    {
      'Type de véhicule': 'tracteur_remorque',
      'Base': 'Dakar',
      'Type de transport': 'hydrocarbures',
      'Nom du propriétaire': 'Société DBK',
      'Prénom du propriétaire': '',
      'Plaque d\'immatriculation tracteur': 'DK-1234-AB',
      'Plaque d\'immatriculation remorque': 'DK-5678-CD',
      'Marque tracteur': 'VOLVO',
      'Modèle tracteur': 'FH16',
      'Configuration tracteur': '6x4',
      'Numéro de châssis tracteur': 'YV2A2D28XGA123456',
      'Date de fabrication tracteur': '2022-01-15',
      'Date de mise en circulation tracteur': '2022-03-01',
      'Volume en litres': '35000',
      'Marque remorque': 'TRAILOR',
      'Modèle remorque': 'CITERNE',
      'Configuration remorque': '3 essieux',
      'Numéro de châssis remorque': 'TRA789123456',
      'Date de fabrication remorque': '2022-02-10',
      'Date de mise en circulation remorque': '2022-03-15'
    },
    {
      'Type de véhicule': 'tracteur_remorque',
      'Base': 'Thiès',
      'Type de transport': 'marchandise',
      'Nom du propriétaire': 'Société DBK',
      'Prénom du propriétaire': '',
      'Plaque d\'immatriculation tracteur': 'DK-9876-EF',
      'Plaque d\'immatriculation remorque': 'DK-5432-GH',
      'Marque tracteur': 'SCANIA',
      'Modèle tracteur': 'R450',
      'Configuration tracteur': '4x2',
      'Numéro de châssis tracteur': 'YS2P4X20XGA987654',
      'Date de fabrication tracteur': '2021-06-20',
      'Date de mise en circulation tracteur': '2021-08-05',
      'Volume en litres': '25000',
      'Marque remorque': 'FRUEHAUF',
      'Modèle remorque': 'PLATEAU',
      'Configuration remorque': '2 essieux',
      'Numéro de châssis remorque': 'FRU456789123',
      'Date de fabrication remorque': '2021-07-10',
      'Date de mise en circulation remorque': '2021-08-20'
    },
    {
      'Type de véhicule': 'porteur',
      'Base': 'Saint-Louis',
      'Type de transport': 'hydrocarbures',
      'Nom du propriétaire': 'Société DBK',
      'Prénom du propriétaire': '',
      'Plaque d\'immatriculation tracteur': 'DK-1111-IJ',
      'Plaque d\'immatriculation remorque': '',
      'Marque tracteur': 'MERCEDES',
      'Modèle tracteur': 'ACTROS',
      'Configuration tracteur': '8x4',
      'Numéro de châssis tracteur': 'WDB9340341L123789',
      'Date de fabrication tracteur': '2023-03-12',
      'Date de mise en circulation tracteur': '2023-05-01',
      'Volume en litres': '',
      'Marque remorque': '',
      'Modèle remorque': '',
      'Configuration remorque': '',
      'Numéro de châssis remorque': '',
      'Date de fabrication remorque': '',
      'Date de mise en circulation remorque': ''
    }
  ];

  // Fonction pour normaliser le type de transport
  const normalizeTypeTransport = (typeTransport: string): string => {
    const normalizedType = String(typeTransport).trim().toLowerCase();
    
    // Mapping des valeurs communes vers les valeurs autorisées
    const typeMapping: { [key: string]: string } = {
      'hydrocarbures': 'hydrocarbures',
      'hydrocarbure': 'hydrocarbures',
      'petrole': 'hydrocarbures',
      'essence': 'hydrocarbures',
      'gasoil': 'hydrocarbures',
      'carburant': 'hydrocarbures',
      'marchandise': 'marchandise',
      'marchandises': 'marchandise',
      'bauxite': 'marchandise',
      'ciment': 'marchandise',
      'materiaux': 'marchandise',
      'general': 'marchandise',
      'divers': 'marchandise'
    };

    const mappedType = typeMapping[normalizedType];
    
    if (!mappedType) {
      console.warn(`Type de transport non reconnu: "${typeTransport}". Utilisation de "marchandise" par défaut.`);
      return 'marchandise';
    }
    
    return mappedType;
  };

  const handleImport = async (data: any[]) => {
    const results = { success: 0, errors: [] as string[] };

    for (const row of data) {
      try {
        // Validation des champs obligatoires
        if (!row['Type de transport'] || !row['Type de véhicule']) {
          results.errors.push(`Ligne ${row._row}: Type de transport et type de véhicule sont obligatoires`);
          continue;
        }

        // Normaliser le type de transport
        const rawTypeTransport = String(row['Type de transport']).trim();
        const normalizedTypeTransport = normalizeTypeTransport(rawTypeTransport);
        
        console.log(`Ligne ${row._row}: Type de transport original: "${rawTypeTransport}" -> normalisé: "${normalizedTypeTransport}"`);

        const typeVehicule = String(row['Type de véhicule']).trim().toLowerCase();
        const normalizedTypeVehicule = typeVehicule === 'porteur' ? 'porteur' : 'tracteur_remorque';

        // Validation spécifique pour les véhicules de type "porteur"
        if (normalizedTypeVehicule === 'porteur') {
          const marqueValue = row['Marque tracteur'] ? String(row['Marque tracteur']).trim() : '';
          const modeleValue = row['Modèle tracteur'] ? String(row['Modèle tracteur']).trim() : '';
          const immatriculationValue = row['Plaque d\'immatriculation tracteur'] ? String(row['Plaque d\'immatriculation tracteur']).trim() : '';
          
          if (!marqueValue || !modeleValue || !immatriculationValue) {
            results.errors.push(`Ligne ${row._row}: Pour un véhicule de type "porteur", la marque, le modèle et la plaque d'immatriculation sont obligatoires`);
            continue;
          }
        }

        // Générer un numéro automatique
        const numeroGenere = `V-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
        
        // Fonction pour parser les dates
        const parseDate = (value: any): string | null => {
          if (!value) return null;
          try {
            // Si c'est un nombre (format Excel), convertir depuis l'époque Excel
            if (typeof value === 'number') {
              const excelEpoch = new Date(1899, 11, 30);
              const date = new Date(excelEpoch.getTime() + value * 24 * 60 * 60 * 1000);
              return date.toISOString().split('T')[0];
            }
            // Si c'est une chaîne ou un objet Date
            const date = new Date(value);
            if (!isNaN(date.getTime())) {
              return date.toISOString().split('T')[0];
            }
          } catch (error) {
            console.error('Erreur parsing date:', error);
          }
          return null;
        };

        // Préparer les données selon le type de véhicule
        const vehicleData: any = {
          numero: numeroGenere,
          type_transport: normalizedTypeTransport, // Utiliser le type normalisé
          type_vehicule: normalizedTypeVehicule,
          base: row['Base'] ? String(row['Base']).trim() : null,
          proprietaire_nom: row['Nom du propriétaire'] ? String(row['Nom du propriétaire']).trim() : null,
          proprietaire_prenom: row['Prénom du propriétaire'] ? String(row['Prénom du propriétaire']).trim() : null,
          statut: 'disponible',
          validation_requise: false
        };

        // Pour les véhicules de type "porteur", utiliser les données du tracteur comme données principales
        if (normalizedTypeVehicule === 'porteur') {
          vehicleData.marque = String(row['Marque tracteur']).trim();
          vehicleData.modele = String(row['Modèle tracteur']).trim();
          vehicleData.immatriculation = String(row['Plaque d\'immatriculation tracteur']).trim();
          vehicleData.configuration = row['Configuration tracteur'] ? String(row['Configuration tracteur']).trim() : null;
          vehicleData.numero_chassis = row['Numéro de châssis tracteur'] ? String(row['Numéro de châssis tracteur']).trim() : null;
          vehicleData.date_fabrication = parseDate(row['Date de fabrication tracteur']);
          vehicleData.date_mise_circulation = parseDate(row['Date de mise en circulation tracteur']);
        } else {
          // Pour tracteur+remorque, utiliser la structure avec préfixes
          vehicleData.tracteur_immatriculation = row['Plaque d\'immatriculation tracteur'] ? String(row['Plaque d\'immatriculation tracteur']).trim() : null;
          vehicleData.remorque_immatriculation = row['Plaque d\'immatriculation remorque'] ? String(row['Plaque d\'immatriculation remorque']).trim() : null;
          
          // Données tracteur
          vehicleData.tracteur_marque = row['Marque tracteur'] ? String(row['Marque tracteur']).trim() : null;
          vehicleData.tracteur_modele = row['Modèle tracteur'] ? String(row['Modèle tracteur']).trim() : null;
          vehicleData.tracteur_configuration = row['Configuration tracteur'] ? String(row['Configuration tracteur']).trim() : null;
          vehicleData.tracteur_numero_chassis = row['Numéro de châssis tracteur'] ? String(row['Numéro de châssis tracteur']).trim() : null;
          vehicleData.tracteur_date_fabrication = parseDate(row['Date de fabrication tracteur']);
          vehicleData.tracteur_date_mise_circulation = parseDate(row['Date de mise en circulation tracteur']);
          
          // Données remorque
          vehicleData.remorque_volume_litres = row['Volume en litres'] ? Number(row['Volume en litres']) : null;
          vehicleData.remorque_marque = row['Marque remorque'] ? String(row['Marque remorque']).trim() : null;
          vehicleData.remorque_modele = row['Modèle remorque'] ? String(row['Modèle remorque']).trim() : null;
          vehicleData.remorque_configuration = row['Configuration remorque'] ? String(row['Configuration remorque']).trim() : null;
          vehicleData.remorque_numero_chassis = row['Numéro de châssis remorque'] ? String(row['Numéro de châssis remorque']).trim() : null;
          vehicleData.remorque_date_fabrication = parseDate(row['Date de fabrication remorque']);
          vehicleData.remorque_date_mise_circulation = parseDate(row['Date de mise en circulation remorque']);
        }

        // Validation des valeurs numériques
        if (vehicleData.remorque_volume_litres && isNaN(vehicleData.remorque_volume_litres)) {
          results.errors.push(`Ligne ${row._row}: Volume en litres invalide`);
          continue;
        }

        console.log('Données à importer:', vehicleData);

        // Import
        await vehiculesService.create(vehicleData);
        results.success++;

      } catch (error: any) {
        console.error('Erreur lors de l\'import:', error);
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
      templateData={templateData}
      onImport={handleImport}
      onClose={onClose}
    />
  );
};
