import * as XLSX from 'xlsx';

export const exportRHService = {
  exportToExcel: (employes: any[], filename = 'employes_rh') => {
    if (!employes || employes.length === 0) {
      throw new Error('Aucun employé à exporter');
    }

    const data = employes.map(emp => ({
      'Nom': emp.nom || '',
      'Prénom': emp.prenom || '',
      'Poste': emp.poste || '',
      'Service': emp.service || '',
      'Type contrat': emp.type_contrat || '',
      'Statut': emp.statut || '',
      'Téléphone': emp.telephone || '',
      'Email': emp.email || '',
      'Date embauche': emp.date_embauche ? new Date(emp.date_embauche).toLocaleDateString('fr-FR') : '',
      'Date fin contrat': emp.date_fin_contrat ? new Date(emp.date_fin_contrat).toLocaleDateString('fr-FR') : '',
      'Remarques': emp.remarques || '',
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Employés');

    const colWidths = [
      { wch: 15 }, { wch: 15 }, { wch: 20 }, { wch: 15 },
      { wch: 12 }, { wch: 10 }, { wch: 15 }, { wch: 25 },
      { wch: 15 }, { wch: 15 }, { wch: 30 },
    ];
    worksheet['!cols'] = colWidths;

    XLSX.writeFile(workbook, `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`);
  },

  exportToCSV: (employes: any[], filename = 'employes_rh') => {
    if (!employes || employes.length === 0) {
      throw new Error('Aucun employé à exporter');
    }

    const data = employes.map(emp => ({
      'Nom': emp.nom || '',
      'Prénom': emp.prenom || '',
      'Poste': emp.poste || '',
      'Service': emp.service || '',
      'Type contrat': emp.type_contrat || '',
      'Statut': emp.statut || '',
      'Téléphone': emp.telephone || '',
      'Email': emp.email || '',
      'Date embauche': emp.date_embauche ? new Date(emp.date_embauche).toLocaleDateString('fr-FR') : '',
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Employés');

    XLSX.writeFile(workbook, `${filename}_${new Date().toISOString().split('T')[0]}.csv`, { bookType: 'csv' });
  },
};
