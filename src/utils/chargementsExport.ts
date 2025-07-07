
export const exportChargementsToCSV = (chargements: any[]) => {
  const headers = [
    'Numéro',
    'Mission',
    'Type',
    'Volume/Poids',
    'Unité',
    'Véhicule',
    'Chauffeur',
    'Client',
    'Lieu chargement',
    'Lieu livraison',
    'Date chargement',
    'Statut',
    'Observations'
  ];

  const csvContent = [
    headers.join(','),
    ...chargements.map(chargement => [
      chargement.numero || '',
      chargement.missions?.numero || '',
      chargement.type_chargement || '',
      chargement.volume_poids || '',
      chargement.unite_mesure || '',
      `${chargement.vehicules?.marque} ${chargement.vehicules?.modele} (${chargement.vehicules?.immatriculation})` || '',
      `${chargement.chauffeurs?.prenom} ${chargement.chauffeurs?.nom}` || '',
      chargement.client_nom || '',
      chargement.lieu_chargement || '',
      chargement.lieu_livraison || '',
      new Date(chargement.date_heure_chargement).toLocaleDateString('fr-FR') || '',
      chargement.statut || '',
      chargement.observations || ''
    ].map(field => `"${field}"`).join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `chargements_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
