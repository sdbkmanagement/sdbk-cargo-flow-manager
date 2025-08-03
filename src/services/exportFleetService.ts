
import * as XLSX from 'xlsx';
import type { Vehicule } from '@/services/vehicules';

export const exportFleetService = {
  exportToExcel: (vehicles: Vehicule[], filename = 'flotte') => {
    const data = vehicles.map(vehicle => ({
      'Numéro': vehicle.numero,
      'Type véhicule': vehicle.type_vehicule,
      'Immatriculation': vehicle.type_vehicule === 'tracteur_remorque' 
        ? vehicle.remorque_immatriculation || vehicle.tracteur_immatriculation || ''
        : vehicle.immatriculation || '',
      'Immatriculation tracteur': vehicle.tracteur_immatriculation || '',
      'Immatriculation remorque': vehicle.remorque_immatriculation || '',
      'Marque': vehicle.type_vehicule === 'tracteur_remorque' 
        ? vehicle.tracteur_marque || ''
        : vehicle.marque || '',
      'Modèle': vehicle.type_vehicule === 'tracteur_remorque' 
        ? vehicle.tracteur_modele || ''
        : vehicle.modele || '',
      'Type transport': vehicle.type_transport === 'hydrocarbures' ? 'Hydrocarbures' : 'Bauxite',
      'Statut': vehicle.statut,
      'Base': vehicle.base || '',
      'Validation requise': vehicle.validation_requise ? 'Oui' : 'Non',
      'Propriétaire nom': vehicle.proprietaire_nom || '',
      'Propriétaire prénom': vehicle.proprietaire_prenom || '',
      'Kilométrage': vehicle.kilometrage || 0,
      'Volume (litres)': vehicle.type_vehicule === 'tracteur_remorque' 
        ? vehicle.remorque_volume_litres || ''
        : '',
      'Volume (tonnes)': vehicle.volume_tonnes || '',
      'Dernière maintenance': vehicle.derniere_maintenance ? new Date(vehicle.derniere_maintenance).toLocaleDateString('fr-FR') : '',
      'Prochaine maintenance': vehicle.prochaine_maintenance ? new Date(vehicle.prochaine_maintenance).toLocaleDateString('fr-FR') : '',
      'Numéro chassis': vehicle.type_vehicule === 'tracteur_remorque'
        ? vehicle.tracteur_numero_chassis || ''
        : vehicle.numero_chassis || '',
      'Date création': new Date(vehicle.created_at).toLocaleDateString('fr-FR'),
      'Dernière mise à jour': new Date(vehicle.updated_at).toLocaleDateString('fr-FR')
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Flotte');
    
    // Ajuster la largeur des colonnes
    const colWidths = [
      { wch: 10 }, // Numéro
      { wch: 15 }, // Type véhicule
      { wch: 15 }, // Immatriculation
      { wch: 15 }, // Immat tracteur
      { wch: 15 }, // Immat remorque
      { wch: 12 }, // Marque
      { wch: 12 }, // Modèle
      { wch: 12 }, // Type transport
      { wch: 15 }, // Statut
      { wch: 10 }, // Base
      { wch: 15 }, // Validation
      { wch: 15 }, // Proprio nom
      { wch: 15 }, // Proprio prénom
      { wch: 12 }, // Kilométrage
      { wch: 15 }, // Volume litres
      { wch: 15 }, // Volume tonnes
      { wch: 15 }, // Dernière maintenance
      { wch: 15 }, // Prochaine maintenance
      { wch: 20 }, // Numéro chassis
      { wch: 12 }, // Date création
      { wch: 12 }  // Dernière MAJ
    ];
    worksheet['!cols'] = colWidths;

    const fileName = `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  },

  exportToCSV: (vehicles: Vehicule[], filename = 'flotte') => {
    const headers = [
      'Numéro',
      'Type véhicule',
      'Immatriculation',
      'Immatriculation tracteur',
      'Immatriculation remorque',
      'Marque',
      'Modèle',
      'Type transport',
      'Statut',
      'Base',
      'Validation requise',
      'Propriétaire nom',
      'Propriétaire prénom',
      'Kilométrage',
      'Volume (litres)',
      'Volume (tonnes)',
      'Dernière maintenance',
      'Prochaine maintenance',
      'Numéro chassis',
      'Date création',
      'Dernière mise à jour'
    ];

    const csvData = vehicles.map(vehicle => [
      vehicle.numero,
      vehicle.type_vehicule,
      vehicle.type_vehicule === 'tracteur_remorque' 
        ? vehicle.remorque_immatriculation || vehicle.tracteur_immatriculation || ''
        : vehicle.immatriculation || '',
      vehicle.tracteur_immatriculation || '',
      vehicle.remorque_immatriculation || '',
      vehicle.type_vehicule === 'tracteur_remorque' 
        ? vehicle.tracteur_marque || ''
        : vehicle.marque || '',
      vehicle.type_vehicule === 'tracteur_remorque' 
        ? vehicle.tracteur_modele || ''
        : vehicle.modele || '',
      vehicle.type_transport === 'hydrocarbures' ? 'Hydrocarbures' : 'Bauxite',
      vehicle.statut,
      vehicle.base || '',
      vehicle.validation_requise ? 'Oui' : 'Non',
      vehicle.proprietaire_nom || '',
      vehicle.proprietaire_prenom || '',
      vehicle.kilometrage || 0,
      vehicle.type_vehicule === 'tracteur_remorque' 
        ? vehicle.remorque_volume_litres || ''
        : '',
      vehicle.volume_tonnes || '',
      vehicle.derniere_maintenance ? new Date(vehicle.derniere_maintenance).toLocaleDateString('fr-FR') : '',
      vehicle.prochaine_maintenance ? new Date(vehicle.prochaine_maintenance).toLocaleDateString('fr-FR') : '',
      vehicle.type_vehicule === 'tracteur_remorque'
        ? vehicle.tracteur_numero_chassis || ''
        : vehicle.numero_chassis || '',
      new Date(vehicle.created_at).toLocaleDateString('fr-FR'),
      new Date(vehicle.updated_at).toLocaleDateString('fr-FR')
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
  }
};
