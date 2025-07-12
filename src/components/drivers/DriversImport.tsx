import React from 'react';
import { ExcelImport } from '@/components/common/ExcelImport';
import { chauffeursService } from '@/services/chauffeurs';

interface DriversImportProps {
  onClose: () => void;
  onSuccess: () => void;
}

export const DriversImport: React.FC<DriversImportProps> = ({ onClose, onSuccess }) => {
  const templateColumns = [
    'nom',
    'prenom',
    'telephone',
    'email',
    'adresse',
    'ville',
    'code_postal',
    'date_naissance',
    'numero_permis',
    'type_permis',
    'date_expiration_permis',
    'statut'
  ];

  const handleImport = async (data: any[]) => {
    const results = { success: 0, errors: [] as string[] };

    for (const row of data) {
      try {
        // Validation des champs obligatoires
        if (!row.nom || !row.prenom || !row.telephone || !row.numero_permis || !row.date_expiration_permis) {
          results.errors.push(`Ligne ${row._row}: Nom, prénom, téléphone, numéro de permis et date d'expiration sont obligatoires`);
          continue;
        }

        // Validation et conversion des dates
        let dateNaissance = null;
        if (row.date_naissance) {
          const parsedDate = new Date(row.date_naissance);
          if (isNaN(parsedDate.getTime())) {
            results.errors.push(`Ligne ${row._row}: Date de naissance invalide`);
            continue;
          }
          dateNaissance = parsedDate.toISOString().split('T')[0];
        }

        const dateExpirationPermis = new Date(row.date_expiration_permis);
        if (isNaN(dateExpirationPermis.getTime())) {
          results.errors.push(`Ligne ${row._row}: Date d'expiration du permis invalide`);
          continue;
        }

        // Traitement des types de permis
        let typePermis = ['B']; // Par défaut
        if (row.type_permis) {
          const types = String(row.type_permis).split(',').map(t => t.trim()).filter(t => t);
          if (types.length > 0) {
            typePermis = types;
          }
        }

        // Préparation des données
        const chauffeurData = {
          nom: String(row.nom).trim(),
          prenom: String(row.prenom).trim(),
          telephone: String(row.telephone).trim(),
          email: row.email ? String(row.email).trim() : null,
          adresse: row.adresse ? String(row.adresse).trim() : null,
          ville: row.ville ? String(row.ville).trim() : null,
          code_postal: row.code_postal ? String(row.code_postal).trim() : null,
          date_naissance: dateNaissance,
          numero_permis: String(row.numero_permis).trim(),
          type_permis: typePermis,
          date_expiration_permis: dateExpirationPermis.toISOString().split('T')[0],
          statut: row.statut ? String(row.statut).trim() : 'actif'
        };

        // Validation de l'email
        if (chauffeurData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(chauffeurData.email)) {
          results.errors.push(`Ligne ${row._row}: Email invalide`);
          continue;
        }

        // Import
        await chauffeursService.create(chauffeurData);
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
      title="Chauffeurs"
      description="Importez vos chauffeurs depuis un fichier Excel"
      templateColumns={templateColumns}
      onImport={handleImport}
      onClose={onClose}
    />
  );
};