import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { InterventionHistorique, synthese } from '@/services/gmaoHistorique';

const fmtDate = (d?: string | null) => {
  if (!d) return '—';
  const date = new Date(d);
  return isNaN(date.getTime()) ? '—' : date.toLocaleDateString('fr-FR');
};

const fmtMontant = (n: number) => `${Number(n || 0).toLocaleString('fr-FR')} GNF`;

async function chargerLogo(): Promise<string | null> {
  try {
    const res = await fetch('/images/logo-sdbk.png');
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export type EntetePdf = {
  immatriculation: string;
  type: string;
  designation?: string | null;
  marque?: string | null;
  compteurKm?: number | null;
  miseCirculation?: string | null;
  prochaineEcheance?: string | null;
};

export async function exporterHistoriquePdf(
  equipement: EntetePdf,
  interventions: InterventionHistorique[],
  periode: { debut?: string; fin?: string },
  complet = false
) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const largeur = doc.internal.pageSize.getWidth();
  const logo = await chargerLogo();

  if (logo) {
    try { doc.addImage(logo, 'PNG', 12, 8, 22, 22); } catch { /* logo optionnel */ }
  }

  doc.setFontSize(15);
  doc.setFont('helvetica', 'bold');
  doc.text('SDBK - AMS', 38, 15);
  doc.setFontSize(12);
  doc.text(
    complet ? "Carnet de maintenance — Rapport complet de vie de l'équipement" : 'Historique des interventions de maintenance',
    38,
    22
  );

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  const periodeTxt = complet
    ? "Depuis la mise en service dans SDBK AMS"
    : `Du ${periode.debut ? fmtDate(periode.debut) : '—'} au ${periode.fin ? fmtDate(periode.fin) : '—'}`;
  doc.text(
    [
      `Équipement : ${equipement.immatriculation}  |  Type : ${equipement.type}`,
      `${equipement.designation || ''}${equipement.marque ? ` — ${equipement.marque}` : ''}`,
      `Période : ${periodeTxt}`,
      `Généré le ${new Date().toLocaleString('fr-FR')}`,
    ],
    38,
    28
  );

  const s = synthese(interventions);
  autoTable(doc, {
    startY: 46,
    head: [['Interventions', 'Préventives', 'Correctives', 'Coût pièces', 'Coût main-d’œuvre', 'Coût total', 'Immobilisation', 'Dernière intervention', 'Prochaine maintenance']],
    body: [[
      String(s.total),
      String(s.preventif),
      String(s.correctif),
      fmtMontant(s.coutPieces),
      fmtMontant(s.coutMO),
      fmtMontant(s.coutTotal),
      `${s.immobilisation} h`,
      fmtDate(s.derniere),
      fmtDate(equipement.prochaineEcheance),
    ]],
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [15, 76, 129], textColor: 255 },
    theme: 'grid',
  });

  autoTable(doc, {
    startY: ((doc as any).lastAutoTable?.finalY || 60) + 6,
    head: [['Date', 'N°', 'Type', 'Intervention', 'Travaux réalisés', 'Pièces', 'Coût total', 'Immob.', 'Responsable', 'Statut']],
    body: interventions.map((i) => [
      fmtDate(i.date_intervention),
      i.numero || '—',
      i.type_maintenance === 'preventif' ? 'Préventive' : i.type_maintenance === 'correctif' ? 'Corrective' : i.type_maintenance,
      i.titre,
      i.travaux_realises || i.description || '—',
      i.pieces.length ? i.pieces.map((p) => `${p.designation} x${p.quantite}`).join(', ') : '—',
      fmtMontant(i.cout_total),
      `${i.duree_immobilisation_heures} h`,
      i.techniciens.join(', ') || i.fournisseur || '—',
      i.statut,
    ]),
    styles: { fontSize: 7, cellPadding: 1.6, overflow: 'linebreak' },
    headStyles: { fillColor: [15, 76, 129], textColor: 255 },
    columnStyles: { 3: { cellWidth: 40 }, 4: { cellWidth: 55 }, 5: { cellWidth: 40 } },
    theme: 'grid',
    foot: [[
      'TOTAUX', '', '', '', '',
      fmtMontant(s.coutPieces),
      fmtMontant(s.coutTotal),
      `${s.immobilisation} h`,
      '', '',
    ]],
    footStyles: { fillColor: [235, 240, 245], textColor: 20, fontStyle: 'bold' },
  });

  const pages = doc.getNumberOfPages();
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p);
    doc.setFontSize(8);
    doc.text(`SDBK - AMS — Carnet de maintenance ${equipement.immatriculation}`, 12, doc.internal.pageSize.getHeight() - 6);
    doc.text(`Page ${p}/${pages}`, largeur - 25, doc.internal.pageSize.getHeight() - 6);
  }

  doc.save(
    `${complet ? 'carnet-maintenance' : 'historique-interventions'}-${equipement.immatriculation}-${new Date().toISOString().slice(0, 10)}.pdf`
  );
}
