
export const generateInvoicePDF = (invoice: any) => {
  const printWindow = window.open('', '_blank');
  
  if (!printWindow) {
    alert('Veuillez autoriser les pop-ups pour télécharger le PDF');
    return;
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Facture ${invoice.numero}</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 40px; color: #333; }
            .header { display: flex; justify-content: space-between; margin-bottom: 40px; border-bottom: 2px solid #333; padding-bottom: 20px; }
            .company-info { flex: 1; }
            .company-name { font-size: 24px; font-weight: bold; color: #2563eb; margin-bottom: 10px; }
            .invoice-info { text-align: right; }
            .invoice-number { font-size: 20px; font-weight: bold; margin-bottom: 10px; }
            .client-info { margin: 30px 0; padding: 20px; background-color: #f8f9fa; border-radius: 8px; }
            .details-table { width: 100%; border-collapse: collapse; margin: 30px 0; }
            .details-table th, .details-table td { border: 1px solid #ddd; padding: 12px; text-align: left; }
            .details-table th { background-color: #f8f9fa; font-weight: bold; }
            .totals { margin-top: 30px; text-align: right; }
            .totals table { margin-left: auto; }
            .totals td { padding: 8px 15px; }
            .total-final { font-size: 18px; font-weight: bold; background-color: #2563eb; color: white; }
            .footer { margin-top: 50px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
            @media print { body { margin: 0; } }
        </style>
    </head>
    <body>
        <div class="header">
            <div class="company-info">
                <div class="company-name">SDBK CARGO</div>
                <div>Transport et Logistique</div>
                <div>Conakry, Guinée</div>
                <div>Tél: +224 XXX XXX XXX</div>
                <div>Email: contact@sdbkcargo.com</div>
            </div>
            <div class="invoice-info">
                <div class="invoice-number">FACTURE ${invoice.numero}</div>
                <div>Date: ${new Date(invoice.date_emission).toLocaleDateString('fr-FR')}</div>
                <div>Échéance: ${new Date(invoice.date_echeance).toLocaleDateString('fr-FR')}</div>
            </div>
        </div>

        <div class="client-info">
            <h3>Facturé à:</h3>
            <div><strong>${invoice.client_nom}</strong></div>
            ${invoice.client_societe ? `<div>${invoice.client_societe}</div>` : ''}
            ${invoice.client_contact ? `<div>Contact: ${invoice.client_contact}</div>` : ''}
            ${invoice.client_email ? `<div>Email: ${invoice.client_email}</div>` : ''}
        </div>

        <table class="details-table">
            <thead>
                <tr>
                    <th>Description</th>
                    <th>Mission</th>
                    <th>Chauffeur</th>
                    <th>Véhicule</th>
                    <th>Montant</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>${invoice.type_transport || 'Transport de marchandises'}</td>
                    <td>${invoice.mission_numero || '-'}</td>
                    <td>${invoice.chauffeur || '-'}</td>
                    <td>${invoice.vehicule || '-'}</td>
                    <td>${invoice.montant_ht.toLocaleString('fr-FR')} GNF</td>
                </tr>
            </tbody>
        </table>

        <div class="totals">
            <table>
                <tr>
                    <td>Sous-total HT:</td>
                    <td>${invoice.montant_ht.toLocaleString('fr-FR')} GNF</td>
                </tr>
                <tr>
                    <td>TVA (18%):</td>
                    <td>${invoice.montant_tva.toLocaleString('fr-FR')} GNF</td>
                </tr>
                <tr class="total-final">
                    <td><strong>Total TTC:</strong></td>
                    <td><strong>${invoice.montant_ttc.toLocaleString('fr-FR')} GNF</strong></td>
                </tr>
            </table>
        </div>

        ${invoice.observations ? `
        <div style="margin-top: 30px;">
            <h4>Observations:</h4>
            <p>${invoice.observations}</p>
        </div>
        ` : ''}

        <div class="footer">
            <p>Conditions de paiement: Paiement à réception de facture</p>
            <p>SDBK CARGO - RC: XXXXX - NIF: XXXXX</p>
        </div>
    </body>
    </html>
  `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();
  
  // Attendre que le contenu soit chargé avant d'imprimer
  printWindow.onload = () => {
    printWindow.print();
  };
};

export const generateQuotePDF = (quote: any) => {
  const printWindow = window.open('', '_blank');
  
  if (!printWindow) {
    alert('Veuillez autoriser les pop-ups pour télécharger le PDF');
    return;
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Devis ${quote.numero}</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 40px; color: #333; }
            .header { display: flex; justify-content: space-between; margin-bottom: 40px; border-bottom: 2px solid #333; padding-bottom: 20px; }
            .company-info { flex: 1; }
            .company-name { font-size: 24px; font-weight: bold; color: #2563eb; margin-bottom: 10px; }
            .quote-info { text-align: right; }
            .quote-number { font-size: 20px; font-weight: bold; margin-bottom: 10px; }
            .client-info { margin: 30px 0; padding: 20px; background-color: #f8f9fa; border-radius: 8px; }
            .description { margin: 30px 0; padding: 20px; border-left: 4px solid #2563eb; background-color: #f8f9fa; }
            .totals { margin-top: 30px; text-align: right; }
            .totals table { margin-left: auto; }
            .totals td { padding: 8px 15px; }
            .total-final { font-size: 18px; font-weight: bold; background-color: #2563eb; color: white; }
            .footer { margin-top: 50px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
            .validity { color: #e11d48; font-weight: bold; margin-top: 20px; }
            @media print { body { margin: 0; } }
        </style>
    </head>
    <body>
        <div class="header">
            <div class="company-info">
                <div class="company-name">SDBK CARGO</div>
                <div>Transport et Logistique</div>
                <div>Conakry, Guinée</div>
                <div>Tél: +224 XXX XXX XXX</div>
                <div>Email: contact@sdbkcargo.com</div>
            </div>
            <div class="quote-info">
                <div class="quote-number">DEVIS ${quote.numero}</div>
                <div>Date: ${new Date(quote.date_creation).toLocaleDateString('fr-FR')}</div>
                <div class="validity">Valide jusqu'au: ${new Date(quote.date_validite).toLocaleDateString('fr-FR')}</div>
            </div>
        </div>

        <div class="client-info">
            <h3>Devis pour:</h3>
            <div><strong>${quote.client_nom}</strong></div>
            ${quote.client_societe ? `<div>${quote.client_societe}</div>` : ''}
            ${quote.client_email ? `<div>Email: ${quote.client_email}</div>` : ''}
        </div>

        <div class="description">
            <h4>Description du service:</h4>
            <p>${quote.description}</p>
        </div>

        <div class="totals">
            <table>
                <tr>
                    <td>Montant HT:</td>
                    <td>${quote.montant_ht.toLocaleString('fr-FR')} GNF</td>
                </tr>
                <tr>
                    <td>TVA (18%):</td>
                    <td>${quote.montant_tva.toLocaleString('fr-FR')} GNF</td>
                </tr>
                <tr class="total-final">
                    <td><strong>Total TTC:</strong></td>
                    <td><strong>${quote.montant_ttc.toLocaleString('fr-FR')} GNF</strong></td>
                </tr>
            </table>
        </div>

        ${quote.observations ? `
        <div style="margin-top: 30px;">
            <h4>Observations:</h4>
            <p>${quote.observations}</p>
        </div>
        ` : ''}

        <div class="footer">
            <p><strong>Ce devis est valable ${Math.ceil((new Date(quote.date_validite).getTime() - new Date(quote.date_creation).getTime()) / (1000 * 60 * 60 * 24))} jours à compter de sa date d'émission.</strong></p>
            <p>SDBK CARGO - RC: XXXXX - NIF: XXXXX</p>
        </div>
    </body>
    </html>
  `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();
  
  printWindow.onload = () => {
    printWindow.print();
  };
};

export const generateMonthlyInvoicePDF = (data: {
  month: string;
  year: string;
  clientNom: string;
  totalHT: number;
  totalTVA: number;
  totalTTC: number;
  blCount: number;
}) => {
  const printWindow = window.open('', '_blank');
  
  if (!printWindow) {
    alert('Veuillez autoriser les pop-ups pour générer le PDF');
    return;
  }

  const monthNames = ['', 'JANVIER', 'FÉVRIER', 'MARS', 'AVRIL', 'MAI', 'JUIN', 
                     'JUILLET', 'AOÛT', 'SEPTEMBRE', 'OCTOBRE', 'NOVEMBRE', 'DÉCEMBRE'];
  const monthName = monthNames[parseInt(data.month)];
  const shortMonthName = monthName.substring(0, 3);
  const shortYear = data.year.substring(2);

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Facture ${data.month}/${data.year}</title>
        <style>
            @page { size: A4; margin: 20mm; }
            body { 
              font-family: Arial, sans-serif; 
              margin: 0; 
              padding: 20px; 
              color: #000;
              font-size: 12pt;
            }
            .main-title {
              text-align: center;
              font-size: 16pt;
              font-weight: bold;
              margin-bottom: 30px;
              border: 2px solid #000;
              padding: 10px;
            }
            .depot {
              text-align: center;
              font-size: 14pt;
              font-weight: bold;
              margin: 20px 0;
            }
            .facture-number {
              text-align: center;
              font-size: 13pt;
              font-weight: bold;
              margin: 20px 0;
            }
            .client-section {
              margin: 30px 0;
              text-align: right;
            }
            .client-section div {
              margin: 5px 0;
            }
            .totals-section {
              margin: 30px 0;
            }
            .totals-table {
              width: 100%;
              margin: 20px 0;
            }
            .totals-table td {
              padding: 8px;
              font-size: 12pt;
            }
            .totals-table .label {
              width: 70%;
              text-align: left;
              font-weight: bold;
            }
            .totals-table .amount {
              width: 30%;
              text-align: right;
              font-weight: bold;
            }
            .info-section {
              margin: 20px 0;
            }
            .info-section table {
              border-collapse: collapse;
              margin: 10px 0;
            }
            .info-section td {
              padding: 5px 10px;
              border: 1px solid #000;
            }
            .designation-table {
              width: 100%;
              border-collapse: collapse;
              margin: 20px 0;
            }
            .designation-table th,
            .designation-table td {
              border: 1px solid #000;
              padding: 10px;
              text-align: center;
            }
            .designation-table th {
              background-color: #f0f0f0;
              font-weight: bold;
            }
            .text-section {
              margin: 20px 0;
              text-align: justify;
            }
            .footer-section {
              margin-top: 40px;
            }
            .signature-section {
              margin-top: 30px;
              text-align: right;
            }
            @media print { 
              body { margin: 0; padding: 15px; }
              .no-print { display: none; }
            }
        </style>
    </head>
    <body>
        <div class="main-title">
          FACTURE TRANSPORT DU MOIS DE ${monthName} ${data.year} PRODUIT BLANC
        </div>

        <div class="depot">
          DEPOT DE CONAKRY
        </div>

        <div class="facture-number">
          FACTURE SDBK ${data.month.padStart(2, '0')}/${data.year}-989 PB
        </div>

        <div class="client-section">
          <div><strong>A l'intention de :</strong></div>
          <div><strong>${data.clientNom || 'TOTALEnergies GUINEE SA'}</strong></div>
          <div>Adresse: Guinée, Conakry, Coleah</div>
        </div>

        <div class="totals-section">
          <table class="totals-table">
            <tr>
              <td class="label">TOTAL ( HT )</td>
              <td class="amount">${data.totalHT.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} GNF</td>
            </tr>
            <tr>
              <td class="label">T V A (18 % )</td>
              <td class="amount">${data.totalTVA.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} GNF</td>
            </tr>
            <tr style="background-color: #f0f0f0;">
              <td class="label">TOTAL DE LA FACTURE ( TTC )</td>
              <td class="amount">${data.totalTTC.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} GNF</td>
            </tr>
          </table>
        </div>

        <div class="info-section">
          <table>
            <tr>
              <td style="width: 200px;"><strong>Code transport à Total</strong></td>
              <td>G6</td>
            </tr>
            <tr>
              <td><strong>Code client à Total</strong></td>
              <td>315</td>
            </tr>
          </table>
          <div style="margin: 10px 0;"><strong>Doit: TOTAL GUINEE SA NIF : 852622687/3Z</strong></div>
        </div>

        <table class="designation-table">
          <thead>
            <tr>
              <th>DESIGNATION</th>
              <th>PERIODE</th>
              <th>MONTANT</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="text-align: left;">TRANSPORT PRODUIT BLANC</td>
              <td>${shortMonthName}-${shortYear}</td>
              <td>${data.totalTTC.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} GNF</td>
            </tr>
          </tbody>
        </table>

        <div class="text-section">
          <p>Suivant relevé de <strong>${data.blCount}</strong> bons de livraison valorisés en annexe pour un montant total ( TTC ) en francs guinéens</p>
        </div>

        <div class="footer-section">
          <table style="width: 100%;">
            <tr>
              <td style="width: 50%;"><strong>${data.totalTTC.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} GNF</strong></td>
              <td style="text-align: right;">Virement bancaire SGBG N° 01515080003-65</td>
            </tr>
          </table>
        </div>

        <div class="signature-section">
          <div>${new Date().toLocaleDateString('fr-FR')}</div>
          <div style="margin-top: 10px;"><strong>Le Directeur Général</strong></div>
        </div>

        <div class="no-print" style="margin-top: 30px; text-align: center;">
          <button onclick="window.print()" style="padding: 10px 20px; font-size: 14px; cursor: pointer; background: #2563eb; color: white; border: none; border-radius: 4px;">
            Imprimer / Enregistrer en PDF
          </button>
          <button onclick="window.close()" style="padding: 10px 20px; font-size: 14px; cursor: pointer; margin-left: 10px;">
            Fermer
          </button>
        </div>
    </body>
    </html>
  `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();
  
  setTimeout(() => {
    printWindow.print();
  }, 250);
};
