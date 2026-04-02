import { SDBK_TEMPLATE_BG } from './invoiceTemplateAssets';

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

// Styles communs pour le template SDBK (une seule page A4)
const getInvoiceStyles = () => `
  @page { 
    size: A4; 
    margin: 0;
  }
  * { box-sizing: border-box; }
  body { 
    font-family: Arial, sans-serif; 
    margin: 0; 
    padding: 0;
    color: #000;
    font-size: 10pt;
    line-height: 1.3;
    width: 210mm;
    height: 297mm;
    position: relative;
    overflow: hidden;
  }
  .bg-template {
    position: fixed;
    top: 0;
    left: 0;
    width: 210mm;
    height: 297mm;
    z-index: -1;
  }
  .bg-template img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .content-wrapper {
    position: relative;
    z-index: 1;
    padding: 32mm 18mm 30mm 18mm;
    height: 297mm;
    display: flex;
    flex-direction: column;
  }
  .main-title {
    text-align: center;
    font-size: 12pt;
    font-weight: bold;
    margin-bottom: 8px;
    padding: 6px;
    border: 2px solid #000;
  }
  .depot {
    text-align: center;
    font-size: 11pt;
    font-weight: bold;
    margin: 6px 0;
  }
  .facture-number {
    text-align: center;
    font-size: 14pt;
    font-weight: bold;
    margin: 12px 0;
    text-decoration: underline;
  }
  .client-section {
    margin: 10px 0;
  }
  .client-section .title {
    font-size: 11pt;
    font-weight: bold;
    margin-bottom: 4px;
  }
  .client-section .name {
    font-size: 11pt;
    font-weight: bold;
    margin: 3px 0;
  }
  .client-section .address {
    font-size: 10pt;
  }
  .two-col {
    display: flex;
    gap: 20px;
    margin: 10px 0;
  }
  .col-left {
    flex: 1;
  }
  .col-right {
    flex: 1;
  }
  .totals-box {
    border: 2px solid #000;
    padding: 8px;
  }
  .totals-box table {
    width: 100%;
    border-collapse: collapse;
  }
  .totals-box td {
    padding: 5px 4px;
    font-size: 9.5pt;
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
    font-size: 10pt;
  }
  .info-table {
    border-collapse: collapse;
    margin: 4px 0;
  }
  .info-table td {
    padding: 4px 10px;
    border: 1px solid #000;
    font-size: 9.5pt;
  }
  .doit-section {
    margin: 8px 0;
    font-size: 10pt;
    font-weight: bold;
  }
  .designation-table {
    width: 100%;
    border-collapse: collapse;
    margin: 8px 0;
  }
  .designation-table th,
  .designation-table td {
    border: 2px solid #000;
    padding: 8px;
    text-align: center;
    font-size: 10pt;
  }
  .designation-table th {
    background-color: #f0f0f0;
    font-weight: bold;
  }
  .designation-table td.text-left {
    text-align: left;
  }
  .text-section {
    margin: 8px 0;
    text-align: justify;
    font-size: 10pt;
    line-height: 1.4;
  }
  .text-section p {
    margin: 0;
  }
  .amount-letters {
    margin: 6px 0;
    font-size: 10pt;
    font-weight: bold;
  }
  .bank-info {
    font-size: 10pt;
    margin-top: 8px;
  }
  .signature-section {
    text-align: right;
    margin-top: 0;
    padding-right: 30px;
  }
  .signature-date {
    margin-bottom: 4px;
    font-size: 10pt;
  }
  .signature-title {
    font-weight: bold;
    font-size: 10pt;
    margin-top: 25px;
  }
  .spacer {
    flex: 1;
  }
  @media print { 
    body { margin: 0; }
    .no-print { display: none !important; }
    .bg-template { position: fixed; }
  }
  .no-print {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background: white;
    padding: 10px;
    text-align: center;
    z-index: 100;
    border-top: 1px solid #ccc;
  }
`;

// Génère le HTML du contenu de facture (sans le wrapper)
const getInvoiceBody = (params: {
  isMonthly: boolean;
  monthYear: string;
  shortPeriod: string;
  invoiceNumber: string;
  clientNom: string;
  clientAdresse: string;
  clientNif: string;
  montantHT: number;
  montantTVA: number;
  montantTTC: number;
  designation: string;
  blCount?: number;
  dateEmission: string;
  depot?: string;
}) => {
  const {
    isMonthly, monthYear, shortPeriod, invoiceNumber,
    clientNom, clientAdresse, clientNif,
    montantHT, montantTVA, montantTTC,
    designation, blCount, dateEmission, depot
  } = params;

  return `
    ${isMonthly ? `
    <div class="main-title">
      FACTURE TRANSPORT DU MOIS DE ${monthYear} PRODUIT BLANC
    </div>
    <div class="depot">
      DEPOT DE ${depot || 'CONAKRY'}
    </div>
    ` : ''}

    <div class="facture-number">
      ${isMonthly ? `FACTURE SDBK ${invoiceNumber} PB` : `FACTURE ${invoiceNumber}`}
    </div>

    <div class="client-section">
      <div class="title">A l'intention de :</div>
      <div class="name">${clientNom}</div>
      <div class="address">Adresse: Guinée, Conakry${clientAdresse ? ', ' + clientAdresse : ', Coleah'}</div>
    </div>

    <div class="two-col">
      <div class="col-left">
        <table class="info-table">
          <tr>
            <td style="width: 180px; font-weight: bold;">Code transport à Total</td>
            <td>G6</td>
          </tr>
          <tr>
            <td style="font-weight: bold;">Code client à Total</td>
            <td>315</td>
          </tr>
        </table>
      </div>
      <div class="col-right">
        <div class="totals-box">
          <table>
            <tr>
              <td class="label">TOTAL ( HT )</td>
              <td class="amount">${montantHT.toLocaleString('fr-FR')} GNF</td>
            </tr>
            <tr>
              <td class="label">T V A (18 %)</td>
              <td class="amount">${montantTVA.toLocaleString('fr-FR')} GNF</td>
            </tr>
            <tr class="total-row">
              <td class="label">TOTAL ( TTC )</td>
              <td class="amount">${montantTTC.toLocaleString('fr-FR')} GNF</td>
            </tr>
          </table>
        </div>
      </div>
    </div>

    <div class="doit-section">
      Doit: ${clientNom} ${clientNif ? 'NIF : ' + clientNif : 'NIF : 852622687/3Z'}
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
          <td class="text-left">${designation}</td>
          <td>${shortPeriod}</td>
          <td>${montantTTC.toLocaleString('fr-FR')} GNF</td>
        </tr>
      </tbody>
    </table>

    <div class="text-section">
      <p>Suivant relevé de ${blCount ? `<strong>${blCount}</strong> ` : ''}bons de livraison valorisés en annexe pour un montant total ( TTC ) en francs guinéens :</p>
    </div>

    <div class="amount-letters">
      <em>${numberToFrenchWords(montantTTC)}</em>
    </div>

    <div class="bank-info">
      Virement bancaire SGBG N° 01515080003-65
    </div>

    <div class="spacer"></div>

    <div class="signature-section">
      <div class="signature-date">${dateEmission}</div>
      <div class="signature-title">Le Directeur Général</div>
    </div>
  `;
};

// Wrapper HTML complet avec le template SDBK en fond
const buildInvoiceHTML = (title: string, bodyContent: string) => `
  <!DOCTYPE html>
  <html>
  <head>
      <meta charset="utf-8">
      <title>${title}</title>
      <style>${getInvoiceStyles()}</style>
  </head>
  <body>
      <div class="bg-template">
        <img src="${SDBK_TEMPLATE_BG}" alt="Template SDBK" />
      </div>
      <div class="content-wrapper">
        ${bodyContent}
      </div>
      <div class="no-print">
        <button onclick="window.print()" style="padding: 10px 20px; font-size: 14px; cursor: pointer; background: #1a56db; color: white; border: none; border-radius: 4px; margin-right: 10px;">
          Imprimer / Enregistrer en PDF
        </button>
        <button onclick="window.close()" style="padding: 10px 20px; font-size: 14px; cursor: pointer; border: 1px solid #1a56db; background: white; border-radius: 4px;">
          Fermer
        </button>
      </div>
  </body>
  </html>
`;

export const generateInvoicePDF = (invoice: any) => {
  const printWindow = window.open('', '_blank');
  
  if (!printWindow) {
    alert('Veuillez autoriser les pop-ups pour télécharger le PDF');
    return;
  }

  const isMonthly = invoice.numero?.startsWith('FM');
  let monthYear = '';
  let shortPeriod = '';
  if (isMonthly) {
    const match = invoice.numero.match(/FM(\d{4})(\d{2})/);
    if (match) {
      const year = match[1];
      const monthNum = match[2];
      const monthNames = ['', 'JANVIER', 'FÉVRIER', 'MARS', 'AVRIL', 'MAI', 'JUIN', 
                         'JUILLET', 'AOÛT', 'SEPTEMBRE', 'OCTOBRE', 'NOVEMBRE', 'DÉCEMBRE'];
      const shortMonthNames = ['', 'JAN', 'FÉV', 'MARS', 'AVR', 'MAI', 'JUIN', 
                              'JUIL', 'AOÛT', 'SEPT', 'OCT', 'NOV', 'DÉC'];
      monthYear = `${monthNames[parseInt(monthNum)]} ${year}`;
      shortPeriod = `${shortMonthNames[parseInt(monthNum)]}-${year.substring(2)}`;
    }
  }

  const bodyContent = getInvoiceBody({
    isMonthly,
    monthYear,
    shortPeriod: invoice.periode || shortPeriod || new Date(invoice.date_emission).toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' }),
    invoiceNumber: isMonthly ? invoice.numero.replace('FM', '') : invoice.numero,
    clientNom: invoice.client_nom || 'TOTALEnergies GUINEE SA',
    clientAdresse: invoice.client_adresse || '',
    clientNif: invoice.client_nif || '',
    montantHT: invoice.montant_ht,
    montantTVA: invoice.montant_tva,
    montantTTC: invoice.montant_ttc,
    designation: invoice.designation || 'TRANSPORT PRODUIT BLANC',
    dateEmission: new Date(invoice.date_emission).toLocaleDateString('fr-FR'),
  });

  const htmlContent = buildInvoiceHTML(`Facture ${invoice.numero}`, bodyContent);

  printWindow.document.write(htmlContent);
  printWindow.document.close();
  
  setTimeout(() => {
    printWindow.print();
  }, 500);
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
  depot?: string;
  invoiceNumber?: string;
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

  const invoiceNum = data.invoiceNumber || `${data.month.padStart(2, '0')}/${data.year}-989`;

  const bodyContent = getInvoiceBody({
    isMonthly: true,
    monthYear: `${monthName} ${data.year}`,
    shortPeriod: `${shortMonthName}-${shortYear}`,
    invoiceNumber: invoiceNum,
    clientNom: data.clientNom || 'TOTALEnergies GUINEE SA',
    clientAdresse: '',
    clientNif: '',
    montantHT: data.totalHT,
    montantTVA: data.totalTVA,
    montantTTC: data.totalTTC,
    designation: 'TRANSPORT PRODUIT BLANC',
    blCount: data.blCount,
    dateEmission: new Date().toLocaleDateString('fr-FR'),
    depot: data.depot,
  });

  const htmlContent = buildInvoiceHTML(`Facture ${data.month}/${data.year}`, bodyContent);

  printWindow.document.write(htmlContent);
  printWindow.document.close();
  
  setTimeout(() => {
    printWindow.print();
  }, 500);
};
