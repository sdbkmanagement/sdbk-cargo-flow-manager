import React from 'react';
import { ExcelImport } from '@/components/common/ExcelImport';
import { rhService } from '@/services/rh';

interface EmployeesImportProps {
  onClose: () => void;
  onSuccess: () => void;
}

export const EmployeesImport: React.FC<EmployeesImportProps> = ({ onClose, onSuccess }) => {
  const templateColumns = [
    'nom',
    'prenom',
    'poste',
    'service',
    'date_embauche',
    'type_contrat',
    'telephone',
    'email',
    'statut',
    'date_fin_contrat',
    'remarques'
  ];

  const handleImport = async (data: any[]) => {
    const results = { success: 0, errors: [] as string[] };

    for (const row of data) {
      try {
        // Validation des champs obligatoires
        if (!row.nom || !row.prenom || !row.poste || !row.service || !row.date_embauche) {
          results.errors.push(`Ligne ${row._row}: Nom, prénom, poste, service et date d'embauche sont obligatoires`);
          continue;
        }

        // Validation et conversion des dates
        const dateEmbauche = new Date(row.date_embauche);
        if (isNaN(dateEmbauche.getTime())) {
          results.errors.push(`Ligne ${row._row}: Date d'embauche invalide`);
          continue;
        }

        let dateFinContrat = null;
        if (row.date_fin_contrat) {
          const parsedDate = new Date(row.date_fin_contrat);
          if (isNaN(parsedDate.getTime())) {
            results.errors.push(`Ligne ${row._row}: Date de fin de contrat invalide`);
            continue;
          }
          dateFinContrat = parsedDate.toISOString().split('T')[0];
        }

        // Validation des valeurs énumérées avant la création
        const typeContrat = row.type_contrat ? String(row.type_contrat).trim() : 'CDI';
        const statut = row.statut ? String(row.statut).trim() : 'actif';
        
        const validStatuts = ['actif', 'inactif', 'en_arret'];
        if (!validStatuts.includes(statut)) {
          results.errors.push(`Ligne ${row._row}: Statut invalide (doit être: ${validStatuts.join(', ')})`);
          continue;
        }

        const validTypeContrats = ['CDI', 'CDD', 'Stage', 'Interim'];
        if (!validTypeContrats.includes(typeContrat)) {
          results.errors.push(`Ligne ${row._row}: Type de contrat invalide (doit être: ${validTypeContrats.join(', ')})`);
          continue;
        }

        // Préparation des données
        const employeData = {
          nom: String(row.nom).trim(),
          prenom: String(row.prenom).trim(),
          poste: String(row.poste).trim(),
          service: String(row.service).trim(),
          date_embauche: dateEmbauche.toISOString().split('T')[0],
          type_contrat: typeContrat as 'CDI' | 'CDD' | 'Stage' | 'Interim',
          telephone: row.telephone ? String(row.telephone).trim() : null,
          email: row.email ? String(row.email).trim() : null,
          statut: statut as 'actif' | 'inactif' | 'en_arret',
          date_fin_contrat: dateFinContrat,
          remarques: row.remarques ? String(row.remarques).trim() : null
        };

        // Validation de l'email
        if (employeData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(employeData.email)) {
          results.errors.push(`Ligne ${row._row}: Email invalide`);
          continue;
        }

        // Import
        await rhService.createEmploye(employeData);
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
      title="Employés"
      description="Importez vos employés depuis un fichier Excel"
      templateColumns={templateColumns}
      onImport={handleImport}
      onClose={onClose}
    />
  );
};