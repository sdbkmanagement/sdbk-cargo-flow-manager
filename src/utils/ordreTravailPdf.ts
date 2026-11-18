import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { supabase } from '@/integrations/supabase/client';

const fmtD = (v?: string | null) => {
  if (!v) return '—';
  const d = new Date(v);
  return isNaN(d.getTime()) ? '—' : d.toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: v.length > 10 ? 'short' : undefined });
};
const fmtM = (n: any) => `${Number(n || 0).toLocaleString('fr-FR').replace(/\u202f|\u00a0/g, ' ')} GNF`;
const nom = (t: any) => [t?.prenom, t?.nom].filter(Boolean).join(' ').trim();

async function chargerLogo(): Promise<string | null> {
  try {
    const blob = await (await fetch('/images/logo-sdbk.png')).blob();
    return await new Promise((r) => { const fr = new FileReader(); fr.onload = () => r(fr.result as string); fr.readAsDataURL(blob); });
  } catch { return null; }
}

export async function genererOrdreTravailPdf(otId: string, equipement?: any) {
  const { data: o, error } = await (supabase as any)
    .from('gmao_ordres_travail')
    .select(`*, gmao_fournisseurs(nom),
      gmao_demandes_intervention(numero, titre, description, demandeur_nom, date_demande, date_traitement, traite_par_nom, commentaire_validation, statut),
      gmao_ot_pieces(quantite, prix_unitaire, montant, gmao_pieces(reference, designation)),
      gmao_ot_techniciens(heures, role, gmao_techniciens(nom, prenom)),
      gmao_ot_taches(libelle, fait, ordre, commentaire)`)
    .eq('id', otId).single();
  if (error) throw error;

  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();
  const logo = await chargerLogo();
  if (logo) doc.addImage(logo, 'PNG', 14, 10, 28, 14);
  doc.setFontSize(15).setFont('helvetica', 'bold');
  doc.text('ORDRE DE TRAVAIL', W / 2, 17, { align: 'center' });
  doc.setFontSize(10).setFont('helvetica', 'normal');
  doc.text(`N° ${o.numero || '—'}`, W / 2, 23, { align: 'center' });
  doc.text(o.cloture ? 'VALIDÉ' : String(o.statut || '').toUpperCase(), W - 14, 17, { align: 'right' });

  const head = { fillColor: [30, 64, 120] as [number, number, number], textColor: 255, fontStyle: 'bold' as const };
  const opts = { theme: 'grid' as const, styles: { fontSize: 8.5, cellPadding: 2 }, headStyles: head, margin: { left: 14, right: 14 } };
  let y = 30;
  const titre = (t: string) => { doc.setFontSize(10).setFont('helvetica', 'bold').text(t, 14, y); y += 2; };
  const suite = () => { y = (doc as any).lastAutoTable.finalY + 7; if (y > 260) { doc.addPage(); y = 18; } };

  const eq = equipement || {};
  titre('Détail de l\'intervention');
  autoTable(doc, { ...opts, startY: y, body: [
    ['Intitulé', o.titre || '—', 'Équipement', [eq.code, eq.designation].filter(Boolean).join(' - ') || '—'],
    ['Type', o.type_maintenance || '—', 'Immatriculation', eq.immatriculation || '—'],
    ['Priorité', o.priorite || '—', 'Prestataire', o.gmao_fournisseurs?.nom || '—'],
    ['Date planifiée', fmtD(o.date_planifiee), 'Immobilisation', `${Number(o.duree_immobilisation_heures || 0)} h`],
    ['Description', { content: o.description || '—', colSpan: 3 }],
    ['Diagnostic', { content: o.diagnostic || '—', colSpan: 3 }],
    ['Travaux réalisés', { content: o.travaux_realises || '—', colSpan: 3 }],
  ] as any, columnStyles: { 0: { fontStyle: 'bold', cellWidth: 32 }, 2: { fontStyle: 'bold', cellWidth: 32 } } });
  suite();

  const taches = (o.gmao_ot_taches || []).sort((a: any, b: any) => a.ordre - b.ordre);
  if (taches.length) {
    titre('Tâches');
    autoTable(doc, { ...opts, startY: y, head: [['Tâche', 'Fait', 'Commentaire']],
      body: taches.map((t: any) => [t.libelle, t.fait ? 'Oui' : 'Non', t.commentaire || '']) });
    suite();
  }
  const techs = o.gmao_ot_techniciens || [];
  if (techs.length) {
    titre('Intervenants');
    autoTable(doc, { ...opts, startY: y, head: [['Technicien', 'Rôle', 'Heures']],
      body: techs.map((t: any) => [nom(t.gmao_techniciens) || '—', t.role || '—', String(t.heures ?? 0)]) });
    suite();
  }
  const pieces = o.gmao_ot_pieces || [];
  titre('Pièces utilisées');
  autoTable(doc, { ...opts, startY: y, head: [['Référence', 'Désignation', 'Qté', 'P.U.', 'Montant']],
    body: pieces.length ? pieces.map((p: any) => [p.gmao_pieces?.reference || '—', p.gmao_pieces?.designation || '—', String(p.quantite), fmtM(p.prix_unitaire), fmtM(p.montant)])
      : [[{ content: 'Aucune pièce', colSpan: 5, styles: { halign: 'center' } }]] as any,
    columnStyles: { 2: { halign: 'right' }, 3: { halign: 'right' }, 4: { halign: 'right' } } });
  suite();

  titre('Coûts');
  autoTable(doc, { ...opts, startY: y, body: [
    ['Pièces', fmtM(o.cout_pieces)], ['Main d\'œuvre', fmtM(o.cout_main_oeuvre)],
    ['Prestation', fmtM(o.cout_prestation)], ['Autres', fmtM(o.cout_autres)],
    [{ content: 'TOTAL', styles: { fontStyle: 'bold' } }, { content: fmtM(o.cout_total), styles: { fontStyle: 'bold' } }],
  ] as any, columnStyles: { 0: { cellWidth: 60, fontStyle: 'bold' }, 1: { halign: 'right' } } });
  suite();

  const d = o.gmao_demandes_intervention;
  const histo: string[][] = [];
  if (d) {
    histo.push([fmtD(d.date_demande), `Demande d'intervention ${d.numero || ''} créée`, d.demandeur_nom || '—', d.titre || '']);
    if (d.date_traitement) histo.push([fmtD(d.date_traitement), 'Demande validée et transformée en OT', d.traite_par_nom || '—', d.commentaire_validation || '']);
  }
  if (o.date_debut) histo.push([fmtD(o.date_debut), 'Intervention démarrée', '—', '']);
  if (o.date_fin) histo.push([fmtD(o.date_fin), 'Intervention terminée', '—', '']);
  if (o.cloture) histo.push([fmtD(o.date_cloture), 'Intervention validée et clôturée', o.cloture_par || '—', '']);
  titre('Historique de validation');
  autoTable(doc, { ...opts, startY: y, head: [['Date', 'Étape', 'Par', 'Commentaire']], body: histo,
    columnStyles: { 0: { cellWidth: 30 } } });
  suite();

  if (y > 245) { doc.addPage(); y = 20; }
  doc.setFontSize(9).setFont('helvetica', 'bold');
  ['Le technicien', 'Le responsable maintenance', 'Le responsable QHSE'].forEach((s, i) => {
    const x = 14 + i * ((W - 28) / 3);
    doc.text(s, x, y + 4);
    doc.line(x, y + 22, x + 50, y + 22);
  });

  const n = doc.getNumberOfPages();
  for (let i = 1; i <= n; i++) {
    doc.setPage(i); doc.setFontSize(7).setFont('helvetica', 'normal');
    doc.text(`SDBK - Imprimé le ${new Date().toLocaleString('fr-FR')} - Page ${i}/${n}`, W / 2, 290, { align: 'center' });
  }
  doc.save(`ordre-travail-${o.numero || o.id}.pdf`);
}
