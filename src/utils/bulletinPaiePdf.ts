import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Tables } from '@/integrations/supabase/types';

export type BulletinPdf = Tables<'bulletins_paie'> & {
  employe: Pick<Tables<'employes'>, 'nom' | 'prenom' | 'poste' | 'matricule' | 'immatricule_cnss' | 'adresse'> | null;
  periode: { mois: number; annee: number } | null;
};

export const moisPaie = ['', 'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
const montant = (value: number | null | undefined) => Number(value ?? 0).toLocaleString('fr-FR').replace(/[\u202f\u00a0]/g, ' ');

export function creerBulletinPdf(b: BulletinPdf, logo?: string | null) {
  if (!b.employe || !b.periode || !moisPaie[b.periode.mois]) {
    throw new Error('Le collaborateur ou la période du bulletin est manquant.');
  }
  const doc = new jsPDF({ format: 'a4', unit: 'mm' });
  doc.setProperties({ title: `Bulletin de paie - ${b.employe.prenom} ${b.employe.nom} - ${moisPaie[b.periode.mois]} ${b.periode.annee}` });
  if (logo) doc.addImage(logo, 'PNG', 14, 10, 20, 20);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('SDBK - AMS', logo ? 40 : 14, 18);
  doc.setFontSize(12);
  doc.text('BULLETIN DE PAIE', 196, 18, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`${moisPaie[b.periode.mois]} ${b.periode.annee}`, 196, 25, { align: 'right' });
  autoTable(doc, {
    startY: 35, theme: 'plain', styles: { fontSize: 9, cellPadding: 2, overflow: 'linebreak' },
    body: [
      ['Collaborateur', `${b.employe.prenom} ${b.employe.nom}`, 'Fonction', b.employe.poste || '-'],
      ['Matricule', b.employe.matricule || 'Non renseigné', 'N° CNSS', b.employe.immatricule_cnss || 'Non renseigné'],
      ['Adresse', { content: b.employe.adresse || 'Non renseignée', colSpan: 3 }],
      ['N° bulletin', b.numero || '-', 'Statut', b.statut === 'paye' ? 'Payé' : b.statut === 'valide' ? 'Validé' : 'Brouillon'],
    ], columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 30 }, 1: { cellWidth: 61 },
      2: { fontStyle: 'bold', cellWidth: 30 }, 3: { cellWidth: 61 },
    },
  });
  let y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6;
  const row = (label: string, gain?: number | null, retenue?: number | null) => [label, gain == null ? '' : montant(gain), retenue == null ? '' : montant(retenue)];
  autoTable(doc, {
    startY: y, theme: 'grid',
    head: [['Rubrique', 'Gains (GNF)', 'Retenues (GNF)']],
    body: [
      row('Salaire de base', b.salaire_base),
      row('Prime de transport', b.prime_transport ?? 0),
      row('Prime de logement', b.prime_logement ?? 0),
      row('Prime de cherté de vie', b.prime_cherete_vie ?? 0),
      row('Autres primes', b.autres_primes ?? 0),
      row('Indemnités', b.total_indemnites ?? 0),
      row('Salaire brut', b.salaire_brut),
      row('CNSS salarié', null, b.cotisation_cnss_employe ?? 0),
      row('RTS', null, b.rts ?? b.irg ?? 0),
      row('Avance sur salaire', null, b.avance_salaire ?? 0),
      row('Manquant', null, b.manquant ?? 0),
      row('Remboursement de prêt', null, b.retenue_pret ?? 0),
      row('Autres retenues', null, b.autres_retenues ?? 0),
      row('Complément du mois précédent', b.complement_mois_precedent ?? 0),
      row('Total des retenues', null, b.total_retenues ?? 0),
    ],
    foot: [['NET À PAYER', montant(b.net_a_payer), '']],
    styles: { fontSize: 9, cellPadding: 2 },
    columnStyles: { 0: { cellWidth: 104 }, 1: { halign: 'right' }, 2: { halign: 'right' } },
    headStyles: { fillColor: 40 }, footStyles: { fillColor: 235, textColor: 20, fontStyle: 'bold' },
  });
  y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6;
  autoTable(doc, {
    startY: y, theme: 'grid',
    head: [['Bases de cotisation / imposition', 'GNF', 'Charges patronales', 'GNF']],
    body: [
      ['Base CNSS', montant(b.base_cnss), 'CNSS employeur', montant(b.cotisation_cnss_employeur)],
      ['Base RTS', montant(b.base_rts), 'ONFPP', montant(b.onfpp)],
      ['', '', 'Versement forfaitaire', montant(b.versement_forfaitaire)],
      ['', '', 'Total charges patronales', montant(b.total_charges_patronales)],
    ], styles: { fontSize: 8, cellPadding: 2 }, headStyles: { fillColor: 40 },
    columnStyles: { 1: { halign: 'right' }, 3: { halign: 'right' } },
  });
  y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
  doc.setFontSize(9);
  doc.text('Signature employeur', 14, y);
  doc.text('Signature collaborateur', 125, y);
  const nom = `${b.employe.prenom}-${b.employe.nom}`.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9-]/g, '-');
  return {
    blob: doc.output('blob'),
    filename: `bulletin-paie-${nom}-${b.periode.annee}-${String(b.periode.mois).padStart(2, '0')}.pdf`,
  };
}

export async function telechargerBulletin(file: { blob: Blob; filename: string }) {
  const partage = new File([file.blob], file.filename, { type: 'application/pdf' });
  if (matchMedia('(pointer: coarse)').matches && navigator.canShare?.({ files: [partage] })) {
    try { await navigator.share({ files: [partage], title: file.filename }); return; }
    catch (error) { if ((error as DOMException).name === 'AbortError') return; }
  }
  const url = URL.createObjectURL(file.blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = file.filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}