const numberToFrenchWords = (num: number): string => {
  if (num === 0) return 'zéro';
  
  const units = ['', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf'];
  const teens = ['dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf'];
  const tens = ['', '', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante', 'soixante', 'quatre-vingt', 'quatre-vingt'];
  
  const convert = (n: number): string => {
    if (n < 10) return units[n];
    if (n >= 10 && n < 20) return teens[n - 10];
    if (n >= 20 && n < 100) {
      const ten = Math.floor(n / 10);
      const unit = n % 10;
      
      if (ten === 7 || ten === 9) {
        if (unit === 0) return tens[ten];
        return tens[ten] + '-' + (unit === 1 && ten === 7 ? 'et-onze' : (unit === 1 ? teens[1] : teens[unit]));
      }
      
      if (unit === 0) return tens[ten] + (ten === 8 ? 's' : '');
      if (unit === 1 && ten !== 8) return tens[ten] + ' et un';
      return tens[ten] + (ten === 8 ? '-' : '-') + units[unit];
    }
    return '';
  };
  
  const convertBlock = (n: number): string => {
    if (n === 0) return '';
    if (n < 100) return convert(n);
    
    const hundred = Math.floor(n / 100);
    const rest = n % 100;
    
    let result = '';
    if (hundred === 1) {
      result = 'cent';
    } else {
      result = units[hundred] + ' cent';
    }
    if (rest === 0 && hundred > 1) result += 's';
    if (rest > 0) result += ' ' + convert(rest);
    
    return result;
  };
  
  const billions = Math.floor(num / 1000000000);
  const millions = Math.floor((num % 1000000000) / 1000000);
  const thousands = Math.floor((num % 1000000) / 1000);
  const remainder = num % 1000;
  
  let words = '';
  
  if (billions > 0) {
    words += (billions === 1 ? 'un milliard' : convertBlock(billions) + ' milliards');
  }
  
  if (millions > 0) {
    if (words) words += ' ';
    words += (millions === 1 ? 'un million' : convertBlock(millions) + ' millions');
  }
  
  if (thousands > 0) {
    if (words) words += ' ';
    if (thousands === 1) {
      words += 'mille';
    } else {
      words += convertBlock(thousands) + ' mille';
    }
  }
  
  if (remainder > 0) {
    if (words) words += ' ';
    words += convertBlock(remainder);
  }
  
  return words.charAt(0).toUpperCase() + words.slice(1);
};

export const generateInvoicePDF = (invoice: any) => {
  const printWindow = window.open('', '_blank');
  
  if (!printWindow) {
    alert('Veuillez autoriser les pop-ups pour télécharger le PDF');
    return;
  }

  // Extraire le mois/année du numéro de facture si c'est une facture mensuelle
  const isMonthly = invoice.numero?.startsWith('FM');
  let monthYear = '';
  if (isMonthly) {
    const match = invoice.numero.match(/FM(\d{4})(\d{2})/);
    if (match) {
      const year = match[1];
      const monthNum = match[2];
      const monthNames = ['', 'JANVIER', 'FÉVRIER', 'MARS', 'AVRIL', 'MAI', 'JUIN', 
                         'JUILLET', 'AOÛT', 'SEPTEMBRE', 'OCTOBRE', 'NOVEMBRE', 'DÉCEMBRE'];
      monthYear = `${monthNames[parseInt(monthNum)]} ${year}`;
    }
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Facture ${invoice.numero}</title>
        <style>
            @page { 
              size: A4; 
              margin: 0;
            }
            body { 
              font-family: Arial, sans-serif; 
              margin: 0; 
              padding: 0;
              color: #000;
              font-size: 11pt;
              line-height: 1.4;
              background-image: url('/templates/facture-template.jpg');
              background-size: cover;
              background-position: center top;
              background-repeat: no-repeat;
              min-height: 297mm;
              position: relative;
            }
            .content-wrapper {
              padding: 70mm 15mm 15mm 15mm;
              position: relative;
            }
            .main-title {
              text-align: center;
              font-size: 14pt;
              font-weight: bold;
              margin-bottom: 20px;
              padding: 8px;
              border: 2px solid #000;
            }
            .depot {
              text-align: center;
              font-size: 13pt;
              font-weight: bold;
              margin: 15px 0;
            }
            .facture-number {
              text-align: center;
              font-size: 18pt;
              font-weight: bold;
              margin: 25px 0;
              text-decoration: underline;
            }
            .client-section {
              margin: 25px 0;
            }
            .client-section .title {
              font-size: 14pt;
              font-weight: bold;
              margin-bottom: 10px;
            }
            .client-section .name {
              font-size: 13pt;
              font-weight: bold;
              margin: 5px 0;
            }
            .totals-box {
              float: right;
              width: 45%;
              margin: 20px 0;
              border: 2px solid #000;
              padding: 15px;
            }
            .totals-box table {
              width: 100%;
              border-collapse: collapse;
            }
            .totals-box td {
              padding: 8px 5px;
              font-size: 11pt;
            }
            .totals-box .label {
              text-align: left;
              font-weight: bold;
            }
            .totals-box .amount {
              text-align: right;
              font-weight: bold;
            }
            .totals-box .total-row {
              background-color: #e0e0e0;
              font-size: 12pt;
            }
            .info-section {
              clear: both;
              margin: 30px 0;
            }
            .info-section table {
              border-collapse: collapse;
              margin: 10px 0;
            }
            .info-section td {
              padding: 6px 12px;
              border: 1px solid #000;
            }
            .doit-section {
              margin: 15px 0;
              font-size: 12pt;
              font-weight: bold;
            }
            .designation-table {
              width: 100%;
              border-collapse: collapse;
              margin: 20px 0;
            }
            .designation-table th,
            .designation-table td {
              border: 2px solid #000;
              padding: 12px;
              text-align: center;
              font-size: 11pt;
            }
            .designation-table th {
              background-color: #f0f0f0;
              font-weight: bold;
            }
            .designation-table td.text-left {
              text-align: left;
            }
            .text-section {
              margin: 25px 0;
              text-align: justify;
              line-height: 1.6;
            }
            .amount-letters {
              margin: 20px 0;
              font-size: 11pt;
              font-style: italic;
            }
            .footer-info {
              margin-top: 30px;
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
            }
            .bank-info {
              font-size: 11pt;
            }
            .signature-section {
              text-align: center;
              margin-top: 50px;
            }
            .signature-date {
              margin-bottom: 10px;
            }
            .signature-title {
              font-weight: bold;
              margin-top: 40px;
            }
            @media print { 
              body { margin: 0; padding: 10mm; }
              .no-print { display: none; }
            }
        </style>
    </head>
    <body>
        <div class="content-wrapper">
        ${isMonthly ? `
        <div class="main-title">
          FACTURE TRANSPORT DU MOIS DE ${monthYear} PRODUIT BLANC
        </div>
        <div class="depot">
          DEPOT DE CONAKRY
        </div>
        ` : ''}

        <div class="facture-number">
          ${isMonthly ? `FACTURE SDBK ${invoice.numero.replace('FM', '')} PB` : `FACTURE ${invoice.numero}`}
        </div>

        <div class="client-section">
          <div class="title">A l'intention de :</div>
          <div class="name">${invoice.client_nom || 'TOTALEnergies GUINEE SA'}</div>
          <div>Adresse: Guinée, Conakry${invoice.client_adresse ? ', ' + invoice.client_adresse : ', Coleah'}</div>
        </div>

        <div class="totals-box">
          <table>
            <tr>
              <td class="label">TOTAL ( HT )</td>
              <td class="amount">${invoice.montant_ht.toLocaleString('fr-FR')} GNF</td>
            </tr>
            <tr>
              <td class="label">T V A (18 % )</td>
              <td class="amount">${invoice.montant_tva.toLocaleString('fr-FR')} GNF</td>
            </tr>
            <tr class="total-row">
              <td class="label">TOTAL DE LA FACTURE ( TTC )</td>
              <td class="amount">${invoice.montant_ttc.toLocaleString('fr-FR')} GNF</td>
            </tr>
          </table>
        </div>

        <div class="info-section">
          <table>
            <tr>
              <td style="width: 250px; font-weight: bold;">Code transport à Total</td>
              <td>G6</td>
            </tr>
            <tr>
              <td style="font-weight: bold;">Code client à Total</td>
              <td>315</td>
            </tr>
          </table>
        </div>

        <div class="doit-section">
          Doit: ${invoice.client_nom || 'TOTAL GUINEE SA'} ${invoice.client_nif ? 'NIF : ' + invoice.client_nif : 'NIF : 852622687/3Z'}
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
              <td class="text-left">${invoice.designation || 'TRANSPORT PRODUIT BLANC'}</td>
              <td>${invoice.periode || monthYear || new Date(invoice.date_emission).toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' })}</td>
              <td>${invoice.montant_ttc.toLocaleString('fr-FR')} GNF</td>
            </tr>
          </tbody>
        </table>

        <div class="text-section">
          <p>Suivant relevé de bons de livraison valorisés en annexe pour un montant total ( TTC ) en francs guinéens :</p>
        </div>

        <div class="amount-letters">
          <em>${numberToFrenchWords(invoice.montant_ttc)}</em>
        </div>

        <div class="footer-info">
          <div class="bank-info">
            Virement bancaire SGBG N° 01515080003-65
          </div>
        </div>

        <div class="signature-section">
          <div class="signature-date">${new Date(invoice.date_emission).toLocaleDateString('fr-FR')}</div>
          <div class="signature-title">Le Directeur Général</div>
        </div>

        <div class="no-print" style="margin-top: 40px; text-align: center; padding: 20px;">
          <button onclick="window.print()" style="padding: 12px 24px; font-size: 14px; cursor: pointer; background: #000; color: white; border: none; border-radius: 4px; margin-right: 10px;">
            Imprimer / Enregistrer en PDF
          </button>
          <button onclick="window.close()" style="padding: 12px 24px; font-size: 14px; cursor: pointer; border: 1px solid #000; background: white; border-radius: 4px;">
            Fermer
          </button>
        </div>
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
  const shortMonthNames = ['', 'JAN', 'FÉV', 'MARS', 'AVR', 'MAI', 'JUIN', 
                          'JUIL', 'AOÛT', 'SEPT', 'OCT', 'NOV', 'DÉC'];
  const shortMonthName = shortMonthNames[parseInt(data.month)];
  const shortYear = data.year.substring(2);

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Facture ${data.month}/${data.year}</title>
        <style>
            @page { 
              size: A4; 
              margin: 0;
            }
            body { 
              font-family: Arial, sans-serif; 
              margin: 0; 
              padding: 0;
              color: #000;
              font-size: 11pt;
              line-height: 1.4;
              background-image: url('/templates/facture-template.jpg');
              background-size: cover;
              background-position: center top;
              background-repeat: no-repeat;
              min-height: 297mm;
              position: relative;
            }
            .content-wrapper {
              padding: 70mm 15mm 15mm 15mm;
              position: relative;
            }
            .main-title {
              text-align: center;
              font-size: 14pt;
              font-weight: bold;
              margin-bottom: 20px;
              padding: 8px;
              border: 2px solid #000;
            }
            .depot {
              text-align: center;
              font-size: 13pt;
              font-weight: bold;
              margin: 15px 0;
            }
            .facture-number {
              text-align: center;
              font-size: 18pt;
              font-weight: bold;
              margin: 25px 0;
              text-decoration: underline;
            }
            .client-section {
              margin: 25px 0;
            }
            .client-section .title {
              font-size: 14pt;
              font-weight: bold;
              margin-bottom: 10px;
            }
            .client-section .name {
              font-size: 13pt;
              font-weight: bold;
              margin: 5px 0;
            }
            .totals-box {
              float: right;
              width: 45%;
              margin: 20px 0;
              border: 2px solid #000;
              padding: 15px;
            }
            .totals-box table {
              width: 100%;
              border-collapse: collapse;
            }
            .totals-box td {
              padding: 8px 5px;
              font-size: 11pt;
            }
            .totals-box .label {
              text-align: left;
              font-weight: bold;
            }
            .totals-box .amount {
              text-align: right;
              font-weight: bold;
            }
            .totals-box .total-row {
              background-color: #e0e0e0;
              font-size: 12pt;
            }
            .info-section {
              clear: both;
              margin: 30px 0;
            }
            .info-section table {
              border-collapse: collapse;
              margin: 10px 0;
            }
            .info-section td {
              padding: 6px 12px;
              border: 1px solid #000;
            }
            .doit-section {
              margin: 15px 0;
              font-size: 12pt;
              font-weight: bold;
            }
            .designation-table {
              width: 100%;
              border-collapse: collapse;
              margin: 20px 0;
            }
            .designation-table th,
            .designation-table td {
              border: 2px solid #000;
              padding: 12px;
              text-align: center;
              font-size: 11pt;
            }
            .designation-table th {
              background-color: #f0f0f0;
              font-weight: bold;
            }
            .designation-table td.text-left {
              text-align: left;
            }
            .text-section {
              margin: 25px 0;
              text-align: justify;
              line-height: 1.6;
            }
            .amount-letters {
              margin: 20px 0;
              font-size: 12pt;
              font-weight: bold;
            }
            .footer-info {
              margin-top: 30px;
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
            }
            .bank-info {
              font-size: 11pt;
            }
            .signature-section {
              text-align: center;
              margin-top: 50px;
            }
            .signature-date {
              margin-bottom: 10px;
            }
            .signature-title {
              font-weight: bold;
              margin-top: 40px;
            }
            @media print { 
              body { margin: 0; padding: 10mm; }
              .no-print { display: none; }
            }
        </style>
    </head>
    <body>
        <div class="content-wrapper">
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
          <div class="title">A l'intention de :</div>
          <div class="name">${data.clientNom || 'TOTALEnergies GUINEE SA'}</div>
          <div>Adresse: Guinée, Conakry, Coleah</div>
        </div>

        <div class="totals-box">
          <table>
            <tr>
              <td class="label">TOTAL ( HT )</td>
              <td class="amount">${data.totalHT.toLocaleString('fr-FR')} GNF</td>
            </tr>
            <tr>
              <td class="label">T V A (18 % )</td>
              <td class="amount">${data.totalTVA.toLocaleString('fr-FR')} GNF</td>
            </tr>
            <tr class="total-row">
              <td class="label">TOTAL DE LA FACTURE ( TTC )</td>
              <td class="amount">${data.totalTTC.toLocaleString('fr-FR')} GNF</td>
            </tr>
          </table>
        </div>

        <div class="info-section">
          <table>
            <tr>
              <td style="width: 250px; font-weight: bold;">Code transport à Total</td>
              <td>G6</td>
            </tr>
            <tr>
              <td style="font-weight: bold;">Code client à Total</td>
              <td>315</td>
            </tr>
          </table>
        </div>

        <div class="doit-section">
          Doit: TOTAL GUINEE SA NIF : 852622687/3Z
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
              <td class="text-left">TRANSPORT PRODUIT BLANC</td>
              <td>${shortMonthName}-${shortYear}</td>
              <td>${data.totalTTC.toLocaleString('fr-FR')} GNF</td>
            </tr>
          </tbody>
        </table>

        <div class="text-section">
          <p>Suivant relevé de <strong>${data.blCount}</strong> bons de livraison valorisés en annexe pour un montant total ( TTC ) en francs guinéens :</p>
        </div>

        <div class="amount-letters">
          <em>${numberToFrenchWords(data.totalTTC)}</em>
        </div>

        <div class="footer-info">
          <div class="bank-info">
            Virement bancaire SGBG N° 01515080003-65
          </div>
        </div>

        <div class="signature-section">
          <div class="signature-date">${new Date().toLocaleDateString('fr-FR')}</div>
          <div class="signature-title">Le Directeur Général</div>
        </div>

        <div class="no-print" style="margin-top: 40px; text-align: center; padding: 20px;">
          <button onclick="window.print()" style="padding: 12px 24px; font-size: 14px; cursor: pointer; background: #000; color: white; border: none; border-radius: 4px; margin-right: 10px;">
            Imprimer / Enregistrer en PDF
          </button>
          <button onclick="window.close()" style="padding: 12px 24px; font-size: 14px; cursor: pointer; border: 1px solid #000; background: white; border-radius: 4px;">
            Fermer
          </button>
        </div>
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
