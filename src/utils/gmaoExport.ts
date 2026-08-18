import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/** Export générique Excel pour le module GMAO */
export function exporterExcel(lignes: Record<string, any>[], nomFichier: string, feuille = 'GMAO') {
  const ws = XLSX.utils.json_to_sheet(lignes);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, feuille.slice(0, 30));
  XLSX.writeFile(wb, `${nomFichier}-${new Date().toISOString().slice(0, 10)}.xlsx`);
}

/** Export générique PDF (tableau paysage avec en-tête SDBK - AMS) */
export function exporterPdf(
  titre: string,
  entetes: string[],
  lignes: (string | number)[][],
  nomFichier: string,
  sousTitre?: string
) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('SDBK - AMS', 14, 14);
  doc.setFontSize(11);
  doc.text(titre, 14, 21);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(
    [sousTitre, `Généré le ${new Date().toLocaleString('fr-FR')}`].filter(Boolean).join('  |  '),
    14,
    27
  );

  autoTable(doc, {
    startY: 32,
    head: [entetes],
    body: lignes,
    styles: { fontSize: 8, cellPadding: 2, overflow: 'linebreak' },
    headStyles: { fillColor: [15, 76, 129], textColor: 255 },
    theme: 'grid',
  });

  const pages = doc.getNumberOfPages();
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p);
    doc.setFontSize(8);
    doc.text(`Page ${p}/${pages}`, doc.internal.pageSize.getWidth() - 25, doc.internal.pageSize.getHeight() - 6);
  }

  doc.save(`${nomFichier}-${new Date().toISOString().slice(0, 10)}.pdf`);
}
