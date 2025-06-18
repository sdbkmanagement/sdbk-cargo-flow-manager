
export const exportInvoicesToCSV = (invoices: any[]) => {
  const headers = [
    'Numéro',
    'Client',
    'Société',
    'Mission',
    'Date émission',
    'Date échéance',
    'Montant HT',
    'TVA',
    'Montant TTC',
    'Statut',
    'Chauffeur',
    'Véhicule'
  ];

  const csvContent = [
    headers.join(','),
    ...invoices.map(invoice => [
      invoice.numero || '',
      invoice.client_nom || '',
      invoice.client_societe || '',
      invoice.mission_numero || '',
      new Date(invoice.date_emission).toLocaleDateString('fr-FR'),
      new Date(invoice.date_echeance).toLocaleDateString('fr-FR'),
      invoice.montant_ht?.toFixed(2) || '0.00',
      invoice.montant_tva?.toFixed(2) || '0.00',
      invoice.montant_ttc?.toFixed(2) || '0.00',
      invoice.statut || '',
      invoice.chauffeur || '',
      invoice.vehicule || ''
    ].map(field => `"${field}"`).join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `factures_${new Date().toISOString().split('T')[0]}.csv`);
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
    'Montant HT',
    'TVA',
    'Montant TTC',
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
      quote.montant_ht?.toFixed(2) || '0.00',
      quote.montant_tva?.toFixed(2) || '0.00',
      quote.montant_ttc?.toFixed(2) || '0.00',
      quote.statut || ''
    ].map(field => `"${field}"`).join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `devis_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
