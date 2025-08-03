
import * as XLSX from 'xlsx';

interface ChauffeurExport {
  id: string;
  nom: string;
  prenom: string;
  matricule?: string;
  telephone: string;
  numero_permis: string;
  type_permis?: string[];
  statut: string;
  base?: string;
  vehicule_assigne?: string;
  created_at: string;
  updated_at: string;
}

export const exportDriversService = {
  exportToExcel: (chauffeurs: ChauffeurExport[], filename = 'chauffeurs') => {
    const data = chauffeurs.map(chauffeur => ({
      'Matricule': chauffeur.matricule || '',
      'Nom': chauffeur.nom,
      'Prénom': chauffeur.prenom,
      'Téléphone': chauffeur.telephone,
      'Numéro permis': chauffeur.numero_permis,
      'Types de permis': chauffeur.type_permis?.join(', ') || '',
      'Statut': chauffeur.statut,
      'Base': chauffeur.base || '',
      'Véhicule assigné': chauffeur.vehicule_assigne || 'Non assigné',
      'Date création': new Date(chauffeur.created_at).toLocaleDateString('fr-FR'),
      'Dernière mise à jour': new Date(chauffeur.updated_at).toLocaleDateString('fr-FR')
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Chauffeurs');
    
    // Ajuster la largeur des colonnes
    const colWidths = [
      { wch: 12 }, // Matricule
      { wch: 15 }, // Nom
      { wch: 15 }, // Prénom
      { wch: 15 }, // Téléphone
      { wch: 15 }, // Numéro permis
      { wch: 20 }, // Types de permis
      { wch: 12 }, // Statut
      { wch: 12 }, // Base
      { wch: 15 }, // Véhicule assigné
      { wch: 12 }, // Date création
      { wch: 12 }  // Dernière MAJ
    ];
    worksheet['!cols'] = colWidths;

    const fileName = `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  },

  exportToCSV: (chauffeurs: ChauffeurExport[], filename = 'chauffeurs') => {
    const headers = [
      'Matricule',
      'Nom',
      'Prénom',
      'Téléphone',
      'Numéro permis',
      'Types de permis',
      'Statut',
      'Base',
      'Véhicule assigné',
      'Date création',
      'Dernière mise à jour'
    ];

    const csvData = chauffeurs.map(chauffeur => [
      chauffeur.matricule || '',
      chauffeur.nom,
      chauffeur.prenom,
      chauffeur.telephone,
      chauffeur.numero_permis,
      chauffeur.type_permis?.join(', ') || '',
      chauffeur.statut,
      chauffeur.base || '',
      chauffeur.vehicule_assigne || 'Non assigné',
      new Date(chauffeur.created_at).toLocaleDateString('fr-FR'),
      new Date(chauffeur.updated_at).toLocaleDateString('fr-FR')
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(field => `"${field}"`).join(','))
    ].join('\n');

    // Ajouter BOM UTF-8 pour Excel
    const bom = '\uFEFF';
    const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  exportAlertsToExcel: (chauffeurs: ChauffeurExport[], filename = 'alertes_chauffeurs') => {
    // Pour les alertes, on pourrait filtrer les chauffeurs avec des statuts particuliers
    const alertes = chauffeurs.filter(c => 
      c.statut === 'inactif' || c.statut === 'suspendu' || !c.numero_permis
    );

    const data = alertes.map(chauffeur => ({
      'Matricule': chauffeur.matricule || '',
      'Nom complet': `${chauffeur.prenom} ${chauffeur.nom}`,
      'Téléphone': chauffeur.telephone,
      'Statut': chauffeur.statut,
      'Type alerte': chauffeur.statut === 'inactif' ? 'Chauffeur inactif' :
                    chauffeur.statut === 'suspendu' ? 'Chauffeur suspendu' :
                    !chauffeur.numero_permis ? 'Permis manquant' : 'Autre',
      'Base': chauffeur.base || '',
      'Date dernière MAJ': new Date(chauffeur.updated_at).toLocaleDateString('fr-FR')
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Alertes Chauffeurs');
    
    const colWidths = [
      { wch: 12 }, // Matricule
      { wch: 20 }, // Nom complet
      { wch: 15 }, // Téléphone
      { wch: 12 }, // Statut
      { wch: 20 }, // Type alerte
      { wch: 12 }, // Base
      { wch: 15 }  // Date MAJ
    ];
    worksheet['!cols'] = colWidths;

    const fileName = `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  }
};
