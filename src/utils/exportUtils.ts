
export const exportInvoicesToCSV = (invoices: any[]) => {
  const headers = [
    'Date Chargement',
    'N°Tournée',
    'Camions',
    'Dépôt',
    'BL',
    'Client',
    'Destination',
    'Produit',
    'Quantité',
    'Prix Unitaire',
    'Montant',
    'Manquants (Total)',
    'Manquant Compteur',
    'Manquant Cuve',
    'Numéros Clients'
  ];

  const csvContent = [
    headers.join(','),
    ...invoices.map(invoice => [
      invoice.date_chargement_reelle ? new Date(invoice.date_chargement_reelle).toLocaleDateString('fr-FR') : '',
      invoice.numero_tournee || '',
      invoice.vehicule || '',
      invoice.lieu_depart || '',
      invoice.numero || '',
      invoice.client_nom || '',
      invoice.destination || '',
      invoice.produit || '',
      invoice.quantite_livree?.toLocaleString('fr-FR') || '0',
      invoice.prix_unitaire?.toLocaleString('fr-FR', { minimumFractionDigits: 2 }) || '0,00',
      invoice.montant_total?.toLocaleString('fr-FR') || '0',
      invoice.manquant_total?.toLocaleString('fr-FR') || '0',
      invoice.manquant_compteur?.toLocaleString('fr-FR') || '0',
      invoice.manquant_cuve?.toLocaleString('fr-FR') || '0',
      invoice.client_code || ''
    ].map(field => `"${field}"`).join(','))
  ].join('\n');

  // Ajouter BOM UTF-8 pour Excel
  const bom = '\uFEFF';
  const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `mouvement_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportQuotesToCSV = (quotes: any[]) => {
  const headers = [
    'Numéro',
    'Client',
    'Société',
    'Description',
    'Date création',
    'Date validité',
    'Montant HT (GNF)',
    'TVA (GNF)',
    'Montant TTC (GNF)',
    'Statut'
  ];

  const csvContent = [
    headers.join(','),
    ...quotes.map(quote => [
      quote.numero || '',
      quote.client_nom || '',
      quote.client_societe || '',
      quote.description || '',
      new Date(quote.date_creation).toLocaleDateString('fr-FR'),
      new Date(quote.date_validite).toLocaleDateString('fr-FR'),
      quote.montant_ht?.toLocaleString('fr-FR') || '0',
      quote.montant_tva?.toLocaleString('fr-FR') || '0',
      quote.montant_ttc?.toLocaleString('fr-FR') || '0',
      quote.statut || ''
    ].map(field => `"${field}"`).join(','))
  ].join('\n');

  const bom = '\uFEFF';
  const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `devis_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportMovementToExcel = async (dateDebut: string, dateFin: string) => {
  // Cette fonction sera appelée par le service d'export pour générer le fichier Excel
  // avec le format exact du screenshot (colonnes spécialisées pour hydrocarbures)
  console.log('Export Excel format mouvement:', { dateDebut, dateFin });
};
