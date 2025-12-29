import * as XLSX from 'xlsx';
import { SafeToLoadControl, NonConformite, HSEQStats } from '@/types/hseq';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

// =====================================================
// EXPORT EXCEL
// =====================================================

export const exportSTLControlsToExcel = (controls: SafeToLoadControl[], filename?: string) => {
  const data = controls.map(control => ({
    'Date contrôle': format(new Date(control.date_controle), 'dd/MM/yyyy HH:mm', { locale: fr }),
    'Véhicule': control.vehicule?.numero || '',
    'Immatriculation': control.vehicule?.immatriculation || '',
    'Chauffeur': control.chauffeur ? `${control.chauffeur.prenom} ${control.chauffeur.nom}` : '',
    'Statut': control.statut.toUpperCase(),
    'Bloquant': control.is_blocking ? 'OUI' : 'NON',
    'Lieu': control.lieu_controle || '',
    'Latitude': control.latitude || '',
    'Longitude': control.longitude || '',
    'Signature contrôleur': control.confirmation_controleur ? 'OUI' : 'NON',
    'Signature chauffeur': control.confirmation_chauffeur ? 'OUI' : 'NON',
    'Observations': control.observations || '',
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Contrôles SAFE TO LOAD');

  // Ajuster les largeurs de colonnes
  ws['!cols'] = [
    { wch: 18 }, // Date
    { wch: 12 }, // Véhicule
    { wch: 15 }, // Immatriculation
    { wch: 25 }, // Chauffeur
    { wch: 15 }, // Statut
    { wch: 10 }, // Bloquant
    { wch: 20 }, // Lieu
    { wch: 12 }, // Lat
    { wch: 12 }, // Long
    { wch: 18 }, // Signature ctrl
    { wch: 18 }, // Signature chauff
    { wch: 40 }, // Observations
  ];

  const fileName = filename || `stl_controles_${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
  XLSX.writeFile(wb, fileName);
};

export const exportNCToExcel = (nonConformites: NonConformite[], filename?: string) => {
  const data = nonConformites.map(nc => ({
    'Numéro': nc.numero,
    'Date détection': format(new Date(nc.date_detection), 'dd/MM/yyyy', { locale: fr }),
    'Type': nc.type_nc.toUpperCase(),
    'Catégorie': nc.categorie || '',
    'Véhicule': nc.vehicule?.numero || '',
    'Chauffeur': nc.chauffeur ? `${nc.chauffeur.prenom} ${nc.chauffeur.nom}` : '',
    'Description': nc.description,
    'Statut': nc.statut.toUpperCase(),
    'Service responsable': nc.service_responsable || '',
    'Date échéance': nc.date_echeance ? format(new Date(nc.date_echeance), 'dd/MM/yyyy', { locale: fr }) : '',
    'Date résolution': nc.date_resolution ? format(new Date(nc.date_resolution), 'dd/MM/yyyy', { locale: fr }) : '',
    'Action corrective': nc.action_corrective || '',
    'Action préventive': nc.action_preventive || '',
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Non-Conformités');

  ws['!cols'] = [
    { wch: 15 }, // Numéro
    { wch: 15 }, // Date
    { wch: 12 }, // Type
    { wch: 20 }, // Catégorie
    { wch: 12 }, // Véhicule
    { wch: 25 }, // Chauffeur
    { wch: 50 }, // Description
    { wch: 12 }, // Statut
    { wch: 20 }, // Service
    { wch: 15 }, // Échéance
    { wch: 15 }, // Résolution
    { wch: 40 }, // Action corrective
    { wch: 40 }, // Action préventive
  ];

  const fileName = filename || `non_conformites_${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
  XLSX.writeFile(wb, fileName);
};

export const exportHSEQStatsToExcel = (stats: HSEQStats, controls: SafeToLoadControl[], ncs: NonConformite[], filename?: string) => {
  const wb = XLSX.utils.book_new();

  // Feuille 1: Statistiques globales
  const statsData = [
    ['RAPPORT HSEQ', ''],
    ['Date génération', format(new Date(), 'dd/MM/yyyy HH:mm', { locale: fr })],
    ['', ''],
    ['STATISTIQUES SAFE TO LOAD', ''],
    ['Total contrôles', stats.totalControles],
    ['Conformes', stats.conformes],
    ['Non conformes', stats.nonConformes],
    ['Refusés (bloquants)', stats.refuses],
    ['Taux de conformité', `${stats.tauxConformite.toFixed(1)}%`],
    ['', ''],
    ['STATISTIQUES NON-CONFORMITÉS', ''],
    ['NC ouvertes', stats.ncOuvertes],
    ['NC critiques', stats.ncCritiques],
    ['NC en cours', stats.ncEnCours],
  ];

  const wsStats = XLSX.utils.aoa_to_sheet(statsData);
  wsStats['!cols'] = [{ wch: 30 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(wb, wsStats, 'Statistiques');

  // Feuille 2: Contrôles
  if (controls.length > 0) {
    const controlsData = controls.map(c => ({
      'Date': format(new Date(c.date_controle), 'dd/MM/yyyy HH:mm'),
      'Véhicule': c.vehicule?.numero || '',
      'Chauffeur': c.chauffeur ? `${c.chauffeur.prenom} ${c.chauffeur.nom}` : '',
      'Statut': c.statut.toUpperCase(),
      'Bloquant': c.is_blocking ? 'OUI' : 'NON',
    }));
    const wsControls = XLSX.utils.json_to_sheet(controlsData);
    XLSX.utils.book_append_sheet(wb, wsControls, 'Contrôles');
  }

  // Feuille 3: Non-conformités
  if (ncs.length > 0) {
    const ncData = ncs.map(nc => ({
      'Numéro': nc.numero,
      'Date': format(new Date(nc.date_detection), 'dd/MM/yyyy'),
      'Type': nc.type_nc.toUpperCase(),
      'Description': nc.description,
      'Statut': nc.statut.toUpperCase(),
    }));
    const wsNC = XLSX.utils.json_to_sheet(ncData);
    XLSX.utils.book_append_sheet(wb, wsNC, 'Non-Conformités');
  }

  const fileName = filename || `rapport_hseq_${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
  XLSX.writeFile(wb, fileName);
};

// =====================================================
// EXPORT PDF
// =====================================================

export const generateSTLReportPDF = (control: SafeToLoadControl) => {
  const printWindow = window.open('', '_blank');
  
  if (!printWindow) {
    alert('Veuillez autoriser les pop-ups pour générer le PDF');
    return;
  }

  const itemsByCategory: Record<string, typeof control.items> = {};
  control.items?.forEach(item => {
    if (!itemsByCategory[item.categorie]) {
      itemsByCategory[item.categorie] = [];
    }
    itemsByCategory[item.categorie]!.push(item);
  });

  const getStatusColor = (isConforme: boolean | null | undefined) => {
    if (isConforme === true) return '#16a34a';
    if (isConforme === false) return '#dc2626';
    return '#6b7280';
  };

  const getStatusText = (isConforme: boolean | null | undefined) => {
    if (isConforme === true) return 'CONFORME';
    if (isConforme === false) return 'NON CONFORME';
    return 'NON VÉRIFIÉ';
  };

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>SAFE TO LOAD - ${control.vehicule?.numero}</title>
      <style>
        @page { size: A4; margin: 15mm; }
        body { 
          font-family: Arial, sans-serif; 
          margin: 0; 
          padding: 20px;
          font-size: 10pt;
          line-height: 1.4;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          border-bottom: 3px solid #1e40af;
          padding-bottom: 15px;
          margin-bottom: 20px;
        }
        .logo-section {
          display: flex;
          align-items: center;
          gap: 15px;
        }
        .company-name {
          font-size: 18pt;
          font-weight: bold;
          color: #1e40af;
        }
        .report-title {
          text-align: center;
          background: ${control.statut === 'conforme' ? '#16a34a' : control.statut === 'refuse' ? '#dc2626' : '#f59e0b'};
          color: white;
          padding: 15px;
          font-size: 16pt;
          font-weight: bold;
          margin: 20px 0;
          border-radius: 8px;
        }
        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
          margin-bottom: 20px;
        }
        .info-box {
          border: 1px solid #e5e7eb;
          padding: 12px;
          border-radius: 6px;
        }
        .info-label {
          font-size: 9pt;
          color: #6b7280;
          margin-bottom: 4px;
        }
        .info-value {
          font-weight: bold;
          font-size: 11pt;
        }
        .category-title {
          background: #f3f4f6;
          padding: 8px 12px;
          font-weight: bold;
          margin: 15px 0 10px 0;
          border-left: 4px solid #1e40af;
        }
        .check-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 15px;
        }
        .check-table th, .check-table td {
          border: 1px solid #e5e7eb;
          padding: 8px;
          text-align: left;
          font-size: 9pt;
        }
        .check-table th {
          background: #f9fafb;
          font-weight: bold;
        }
        .status-badge {
          display: inline-block;
          padding: 3px 8px;
          border-radius: 4px;
          font-size: 8pt;
          font-weight: bold;
          color: white;
        }
        .critical-marker {
          color: #dc2626;
          font-weight: bold;
        }
        .signatures-section {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-top: 30px;
          border-top: 2px solid #e5e7eb;
          padding-top: 20px;
        }
        .signature-box {
          text-align: center;
          padding: 15px;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
        }
        .signature-title {
          font-weight: bold;
          margin-bottom: 10px;
        }
        .signature-image {
          max-width: 150px;
          max-height: 60px;
          margin: 10px auto;
        }
        .signature-date {
          font-size: 9pt;
          color: #6b7280;
        }
        .footer {
          margin-top: 30px;
          text-align: center;
          font-size: 9pt;
          color: #6b7280;
          border-top: 1px solid #e5e7eb;
          padding-top: 15px;
        }
        .observations {
          margin-top: 20px;
          padding: 15px;
          background: #f9fafb;
          border-radius: 8px;
        }
        .no-print { margin-top: 30px; text-align: center; }
        @media print { .no-print { display: none; } }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo-section">
          <img src="/templates/sdbk-logo.jpg" alt="SDBK" style="height: 50px;" onerror="this.style.display='none'">
          <div>
            <div class="company-name">SDBK CARGO</div>
            <div style="color: #6b7280;">Transport & Logistique</div>
          </div>
        </div>
        <div style="text-align: right;">
          <div style="font-weight: bold;">CONTRÔLE SAFE TO LOAD</div>
          <div style="color: #6b7280; font-size: 9pt;">
            ${format(new Date(control.date_controle), 'PPPp', { locale: fr })}
          </div>
        </div>
      </div>

      <div class="report-title">
        STATUT: ${control.statut.toUpperCase()}
        ${control.is_blocking ? ' - CHARGEMENT INTERDIT' : ''}
      </div>

      <div class="info-grid">
        <div class="info-box">
          <div class="info-label">Véhicule</div>
          <div class="info-value">${control.vehicule?.numero || 'N/A'} - ${control.vehicule?.immatriculation || ''}</div>
        </div>
        <div class="info-box">
          <div class="info-label">Chauffeur</div>
          <div class="info-value">${control.chauffeur?.prenom || ''} ${control.chauffeur?.nom || ''}</div>
        </div>
        <div class="info-box">
          <div class="info-label">Lieu de contrôle</div>
          <div class="info-value">${control.lieu_controle || 'Non spécifié'}</div>
        </div>
        <div class="info-box">
          <div class="info-label">Position GPS</div>
          <div class="info-value">${control.latitude && control.longitude ? `${control.latitude.toFixed(4)}, ${control.longitude.toFixed(4)}` : 'Non disponible'}</div>
        </div>
      </div>

      ${Object.entries(itemsByCategory).map(([category, items]) => `
        <div class="category-title">${category}</div>
        <table class="check-table">
          <thead>
            <tr>
              <th style="width: 50%;">Point de contrôle</th>
              <th style="width: 15%;">Statut</th>
              <th style="width: 35%;">Commentaire</th>
            </tr>
          </thead>
          <tbody>
            ${items?.map(item => `
              <tr>
                <td>
                  ${item.is_critical ? '<span class="critical-marker">*</span> ' : ''}
                  ${item.libelle}
                  ${item.is_critical ? '<span class="critical-marker"> (BLOQUANT)</span>' : ''}
                </td>
                <td>
                  <span class="status-badge" style="background: ${getStatusColor(item.is_conforme)}">
                    ${getStatusText(item.is_conforme)}
                  </span>
                </td>
                <td>${item.commentaire || '-'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `).join('')}

      ${control.observations ? `
        <div class="observations">
          <strong>Observations générales:</strong>
          <p>${control.observations}</p>
        </div>
      ` : ''}

      <div class="signatures-section">
        <div class="signature-box">
          <div class="signature-title">Agent HSEQ</div>
          ${control.signature_controleur_url ? `
            <img src="${control.signature_controleur_url}" class="signature-image" alt="Signature contrôleur">
          ` : '<div style="height: 60px; border-bottom: 1px solid #000; margin: 20px;"></div>'}
          <div class="signature-date">
            ${control.signature_controleur_date 
              ? `Signé le ${format(new Date(control.signature_controleur_date), 'Pp', { locale: fr })}` 
              : 'Non signé'}
          </div>
        </div>
        <div class="signature-box">
          <div class="signature-title">Chauffeur</div>
          ${control.signature_chauffeur_url ? `
            <img src="${control.signature_chauffeur_url}" class="signature-image" alt="Signature chauffeur">
          ` : '<div style="height: 60px; border-bottom: 1px solid #000; margin: 20px;"></div>'}
          <div class="signature-date">
            ${control.signature_chauffeur_date 
              ? `Signé le ${format(new Date(control.signature_chauffeur_date), 'Pp', { locale: fr })}` 
              : 'Non signé'}
          </div>
        </div>
      </div>

      <div class="footer">
        <p>Document généré automatiquement par SDBK CARGO - Module HSEQ</p>
        <p>* Points critiques bloquants pour l'autorisation de chargement</p>
      </div>

      <div class="no-print">
        <button onclick="window.print()" style="padding: 12px 24px; font-size: 14px; cursor: pointer; background: #1e40af; color: white; border: none; border-radius: 6px; margin-right: 10px;">
          Imprimer / Enregistrer en PDF
        </button>
        <button onclick="window.close()" style="padding: 12px 24px; font-size: 14px; cursor: pointer; border: 1px solid #1e40af; background: white; border-radius: 6px;">
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
  }, 500);
};

export const generateNCReportPDF = (nc: NonConformite) => {
  const printWindow = window.open('', '_blank');
  
  if (!printWindow) {
    alert('Veuillez autoriser les pop-ups pour générer le PDF');
    return;
  }

  const typeColors: Record<string, string> = {
    critique: '#dc2626',
    majeure: '#f59e0b',
    mineure: '#3b82f6',
  };

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>NC ${nc.numero}</title>
      <style>
        @page { size: A4; margin: 15mm; }
        body { 
          font-family: Arial, sans-serif; 
          margin: 0; 
          padding: 20px;
          font-size: 11pt;
          line-height: 1.5;
        }
        .header {
          display: flex;
          justify-content: space-between;
          border-bottom: 3px solid ${typeColors[nc.type_nc] || '#1e40af'};
          padding-bottom: 15px;
          margin-bottom: 20px;
        }
        .nc-number {
          font-size: 20pt;
          font-weight: bold;
          color: ${typeColors[nc.type_nc] || '#1e40af'};
        }
        .type-badge {
          background: ${typeColors[nc.type_nc] || '#1e40af'};
          color: white;
          padding: 8px 16px;
          border-radius: 6px;
          font-weight: bold;
          text-transform: uppercase;
        }
        .section {
          margin: 20px 0;
          padding: 15px;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
        }
        .section-title {
          font-weight: bold;
          color: #374151;
          margin-bottom: 10px;
          font-size: 12pt;
        }
        .info-row {
          display: flex;
          margin: 8px 0;
        }
        .info-label {
          width: 150px;
          color: #6b7280;
        }
        .info-value {
          flex: 1;
          font-weight: 500;
        }
        .description-box {
          background: #f9fafb;
          padding: 15px;
          border-radius: 6px;
          margin-top: 10px;
        }
        .footer {
          margin-top: 40px;
          text-align: center;
          font-size: 9pt;
          color: #6b7280;
        }
        .no-print { margin-top: 30px; text-align: center; }
        @media print { .no-print { display: none; } }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <div class="nc-number">${nc.numero}</div>
          <div style="color: #6b7280;">Fiche de Non-Conformité</div>
        </div>
        <div class="type-badge">${nc.type_nc}</div>
      </div>

      <div class="section">
        <div class="section-title">Informations générales</div>
        <div class="info-row">
          <span class="info-label">Date de détection:</span>
          <span class="info-value">${format(new Date(nc.date_detection), 'PPP', { locale: fr })}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Catégorie:</span>
          <span class="info-value">${nc.categorie || 'Non spécifiée'}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Statut:</span>
          <span class="info-value">${nc.statut.toUpperCase()}</span>
        </div>
        ${nc.vehicule ? `
          <div class="info-row">
            <span class="info-label">Véhicule:</span>
            <span class="info-value">${nc.vehicule.numero} - ${nc.vehicule.immatriculation}</span>
          </div>
        ` : ''}
        ${nc.chauffeur ? `
          <div class="info-row">
            <span class="info-label">Chauffeur:</span>
            <span class="info-value">${nc.chauffeur.prenom} ${nc.chauffeur.nom}</span>
          </div>
        ` : ''}
      </div>

      <div class="section">
        <div class="section-title">Description de la non-conformité</div>
        <div class="description-box">${nc.description}</div>
      </div>

      ${nc.service_responsable || nc.date_echeance ? `
        <div class="section">
          <div class="section-title">Affectation</div>
          ${nc.service_responsable ? `
            <div class="info-row">
              <span class="info-label">Service responsable:</span>
              <span class="info-value">${nc.service_responsable}</span>
            </div>
          ` : ''}
          ${nc.date_echeance ? `
            <div class="info-row">
              <span class="info-label">Date d'échéance:</span>
              <span class="info-value">${format(new Date(nc.date_echeance), 'PPP', { locale: fr })}</span>
            </div>
          ` : ''}
        </div>
      ` : ''}

      ${nc.action_corrective || nc.action_preventive ? `
        <div class="section">
          <div class="section-title">Plan d'action</div>
          ${nc.action_corrective ? `
            <div style="margin-bottom: 15px;">
              <strong>Action corrective:</strong>
              <div class="description-box">${nc.action_corrective}</div>
            </div>
          ` : ''}
          ${nc.action_preventive ? `
            <div>
              <strong>Action préventive:</strong>
              <div class="description-box">${nc.action_preventive}</div>
            </div>
          ` : ''}
        </div>
      ` : ''}

      <div class="footer">
        <p>Document généré par SDBK CARGO - Module HSEQ</p>
        <p>Généré le ${format(new Date(), 'PPPp', { locale: fr })}</p>
      </div>

      <div class="no-print">
        <button onclick="window.print()" style="padding: 12px 24px; cursor: pointer; background: ${typeColors[nc.type_nc]}; color: white; border: none; border-radius: 6px; margin-right: 10px;">
          Imprimer / Enregistrer en PDF
        </button>
        <button onclick="window.close()" style="padding: 12px 24px; cursor: pointer; border: 1px solid #374151; background: white; border-radius: 6px;">
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
  }, 500);
};
