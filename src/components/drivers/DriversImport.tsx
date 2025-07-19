
import React from 'react';
import { ExcelImport } from '@/components/common/ExcelImport';
import { chauffeursService } from '@/services/chauffeurs';

interface DriversImportProps {
  onClose: () => void;
  onSuccess: () => void;
}

export const DriversImport: React.FC<DriversImportProps> = ({ onClose, onSuccess }) => {
  const templateColumns = [
    'matricule',
    'id_conducteur',
    'immatricule_cnss',
    'nom',
    'prenom',
    'date_naissance',
    'lieu_naissance',
    'nationalite',
    'groupe_sanguin',
    'statut_matrimonial',
    'filiation',
    'fonction',
    'base_chauffeur',
    'date_embauche',
    'type_contrat',
    'telephone',
    'email',
    'adresse',
    'ville',
    'urgence_nom',
    'urgence_prenom',
    'urgence_telephone',
    'numero_permis',
    'date_obtention_permis',
    'date_expiration_permis',
    'type_permis'
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

        let dateEmbauche = null;
        if (row.date_embauche) {
          const parsedDate = new Date(row.date_embauche);
          if (isNaN(parsedDate.getTime())) {
            results.errors.push(`Ligne ${row._row}: Date d'embauche invalide`);
            continue;
          }
          dateEmbauche = parsedDate.toISOString().split('T')[0];
        }

        let dateObtentionPermis = null;
        if (row.date_obtention_permis) {
          const parsedDate = new Date(row.date_obtention_permis);
          if (isNaN(parsedDate.getTime())) {
            results.errors.push(`Ligne ${row._row}: Date d'obtention du permis invalide`);
            continue;
          }
          dateObtentionPermis = parsedDate.toISOString().split('T')[0];
        }

        const dateExpirationPermis = new Date(row.date_expiration_permis);
        if (isNaN(dateExpirationPermis.getTime())) {
          results.errors.push(`Ligne ${row._row}: Date d'expiration du permis invalide`);
          continue;
        }

        // Validation de la fonction si fournie
        if (row.fonction && !['titulaire', 'reserve', 'doublon'].includes(row.fonction)) {
          results.errors.push(`Ligne ${row._row}: Fonction invalide (doit être: titulaire, reserve, ou doublon)`);
          continue;
        }

        // Validation de la base chauffeur si fournie
        if (row.base_chauffeur && !['conakry', 'kankan', 'nzerekore'].includes(row.base_chauffeur)) {
          results.errors.push(`Ligne ${row._row}: Base chauffeur invalide (doit être: conakry, kankan, ou nzerekore)`);
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
          matricule: row.matricule ? String(row.matricule).trim() : null,
          id_conducteur: row.id_conducteur ? String(row.id_conducteur).trim() : null,
          immatricule_cnss: row.immatricule_cnss ? String(row.immatricule_cnss).trim() : null,
          nom: String(row.nom).trim(),
          prenom: String(row.prenom).trim(),
          date_naissance: dateNaissance,
          lieu_naissance: row.lieu_naissance ? String(row.lieu_naissance).trim() : null,
          nationalite: row.nationalite ? String(row.nationalite).trim() : null,
          groupe_sanguin: row.groupe_sanguin ? String(row.groupe_sanguin).trim() : null,
          statut_matrimonial: row.statut_matrimonial ? String(row.statut_matrimonial).trim() : null,
          filiation: row.filiation ? String(row.filiation).trim() : null,
          fonction: row.fonction ? String(row.fonction).trim() : null,
          base_chauffeur: row.base_chauffeur ? String(row.base_chauffeur).trim() : null,
          date_embauche: dateEmbauche,
          type_contrat: row.type_contrat ? String(row.type_contrat).trim() : 'CDI',
          telephone: String(row.telephone).trim(),
          email: row.email ? String(row.email).trim() : null,
          adresse: row.adresse ? String(row.adresse).trim() : null,
          ville: row.ville ? String(row.ville).trim() : null,
          urgence_nom: row.urgence_nom ? String(row.urgence_nom).trim() : null,
          urgence_prenom: row.urgence_prenom ? String(row.urgence_prenom).trim() : null,
          urgence_telephone: row.urgence_telephone ? String(row.urgence_telephone).trim() : null,
          numero_permis: String(row.numero_permis).trim(),
          date_obtention_permis: dateObtentionPermis,
          date_expiration_permis: dateExpirationPermis.toISOString().split('T')[0],
          type_permis: typePermis,
          statut: 'actif'
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
        if (errorMessage.includes('duplicate key') || errorMessage.includes('unique constraint')) {
          if (errorMessage.includes('matricule')) {
            results.errors.push(`Ligne ${row._row}: Matricule déjà existant`);
          } else if (errorMessage.includes('id_conducteur')) {
            results.errors.push(`Ligne ${row._row}: ID conducteur déjà existant`);
          } else {
            results.errors.push(`Ligne ${row._row}: Doublon détecté`);
          }
        } else {
          results.errors.push(`Ligne ${row._row}: ${errorMessage}`);
        }
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
