import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ChauffeurInfo {
  nom?: string | null;
  prenom?: string | null;
  matricule?: string | null;
  statut?: string | null;
}

interface FormationLigne {
  theme: string;
  obligatoire?: boolean;
  date_formation?: string | null;
  date_recyclage?: string | null;
  formateur_nom?: string | null;
  note_obtenue?: number | null;
  statut?: string | null;
}

const fmtDate = (d?: string | null) => {
  if (!d) return '—';
  const dt = new Date(d);
  return isNaN(dt.getTime()) ? '—' : dt.toLocaleDateString('fr-FR');
};

const labelStatut = (s?: string | null) => {
  switch (s) {
    case 'valide': return 'Valide';
    case 'a_renouveler': return 'À renouveler';
    case 'expire': return 'Expiré';
    default: return '—';
  }
};

const slug = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_|_$/g, '');

const entete = (doc: jsPDF, titre: string, chauffeur: ChauffeurInfo) => {
  const w = doc.internal.pageSize.getWidth();
  doc.setFillColor(15, 42, 74);
  doc.rect(0, 0, w, 24, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('SDBK - AMS', 14, 11);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Service Formation / HSEQ', 14, 18);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(titre, w - 14, 14, { align: 'right' });

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  const nomComplet = `${chauffeur.prenom || ''} ${chauffeur.nom || ''}`.trim() || '—';
  autoTable(doc, {
    startY: 30,
    theme: 'grid',
    styles: { fontSize: 9, cellPadding: 2.5 },
    body: [
      ['Chauffeur', nomComplet, 'Matricule', chauffeur.matricule || '—'],
      ['Statut', chauffeur.statut || '—', 'Date d\'édition', new Date().toLocaleDateString('fr-FR')],
    ],
    columnStyles: {
      0: { fontStyle: 'bold', fillColor: [240, 243, 247], cellWidth: 32 },
      2: { fontStyle: 'bold', fillColor: [240, 243, 247], cellWidth: 32 },
    },
  });
};

const signatures = (doc: jsPDF, y: number) => {
  const w = doc.internal.pageSize.getWidth();
  const top = Math.min(y + 10, doc.internal.pageSize.getHeight() - 45);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Signature du chauffeur', 18, top);
  doc.text('Signature du formateur', w / 2 + 6, top);
  doc.setDrawColor(150);
  doc.rect(14, top + 3, w / 2 - 22, 28);
  doc.rect(w / 2 + 2, top + 3, w / 2 - 16, 28);
};

export const genererFicheTheorique = (chauffeur: ChauffeurInfo, lignes: FormationLigne[], noteGlobale?: number | null) => {
  const doc = new jsPDF({ format: 'a4', unit: 'mm' });
  entete(doc, "FICHE D'ÉVALUATION THÉORIQUE", chauffeur);

  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 6,
    head: [['N°', 'Thème de formation', 'Obligatoire', 'Date formation', 'Recyclage', 'Formateur', 'Note (%)', 'Statut']],
    body: lignes.map((l, i) => [
      String(i + 1),
      l.theme,
      l.obligatoire ? 'Oui' : 'Non',
      fmtDate(l.date_formation),
      fmtDate(l.date_recyclage),
      l.formateur_nom || '—',
      l.note_obtenue != null ? `${l.note_obtenue}` : '',
      labelStatut(l.statut),
    ]),
    theme: 'grid',
    headStyles: { fillColor: [15, 42, 74], fontSize: 8 },
    styles: { fontSize: 8, cellPadding: 2 },
  });

  let y = (doc as any).lastAutoTable.finalY + 6;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(`Note globale : ${noteGlobale != null ? noteGlobale + ' %' : '________'}`, 14, y);
  doc.setFont('helvetica', 'normal');
  doc.text('Appréciation générale :', 14, y + 7);
  doc.setDrawColor(150);
  doc.rect(14, y + 9, doc.internal.pageSize.getWidth() - 28, 20);

  signatures(doc, y + 29);
  doc.save(`Fiche_Evaluation_Theorique_${slug(`${chauffeur.nom || ''}_${chauffeur.prenom || ''}`)}.pdf`);
};

const CRITERES_PRATIQUES = [
  'Contrôle avant départ (tour du véhicule, niveaux, pneumatiques)',
  'Vérification des documents de bord et EPI',
  'Mise en route et démarrage en sécurité',
  'Maîtrise de la trajectoire et positionnement sur la route',
  'Respect des limitations de vitesse et de la signalisation',
  'Anticipation et conduite défensive',
  'Éco-conduite (régime moteur, freinage, consommation)',
  'Manœuvres (marche arrière, créneau, accostage à quai)',
  'Procédure de chargement en sécurité',
  'Procédure de dépotage / livraison',
  'Mise à la terre et prévention électricité statique',
  'Arrimage et contrôle de l\'étanchéité',
  'Conduite à tenir en cas d\'incident / urgence',
  'Comportement général et communication',
];

export const genererFichePratique = (chauffeur: ChauffeurInfo, infos?: { formateur?: string | null; date?: string | null }) => {
  const doc = new jsPDF({ format: 'a4', unit: 'mm' });
  entete(doc, "FICHE D'ÉVALUATION PRATIQUE", chauffeur);

  let y = (doc as any).lastAutoTable.finalY + 6;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Formateur : ${infos?.formateur || '____________________'}`, 14, y);
  doc.text(`Date de l'évaluation : ${infos?.date ? fmtDate(infos.date) : '____________'}`, doc.internal.pageSize.getWidth() / 2 + 6, y);

  autoTable(doc, {
    startY: y + 4,
    head: [['N°', 'Critère évalué', 'Acquis', 'À améliorer', 'Non acquis', 'Note /20', 'Observations']],
    body: CRITERES_PRATIQUES.map((c, i) => [String(i + 1), c, '', '', '', '', '']),
    theme: 'grid',
    headStyles: { fillColor: [15, 42, 74], fontSize: 8 },
    styles: { fontSize: 8, cellPadding: 2.2, minCellHeight: 7 },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 68 },
      2: { cellWidth: 16, halign: 'center' },
      3: { cellWidth: 20, halign: 'center' },
      4: { cellWidth: 20, halign: 'center' },
      5: { cellWidth: 16, halign: 'center' },
    },
  });

  y = (doc as any).lastAutoTable.finalY + 6;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('Résultat global :   □ APTE        □ APTE SOUS RÉSERVE        □ INAPTE', 14, y);
  doc.setFont('helvetica', 'normal');
  doc.text('Commentaires du formateur :', 14, y + 7);
  doc.setDrawColor(150);
  doc.rect(14, y + 9, doc.internal.pageSize.getWidth() - 28, 18);

  signatures(doc, y + 27);
  doc.save(`Fiche_Evaluation_Pratique_${slug(`${chauffeur.nom || ''}_${chauffeur.prenom || ''}`)}.pdf`);
};
