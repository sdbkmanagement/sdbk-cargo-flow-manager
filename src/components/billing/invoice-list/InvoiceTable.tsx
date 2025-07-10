
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { type Facture } from '@/services/billing';
import { InvoiceActionsDropdown } from './InvoiceActionsDropdown';

interface InvoiceTableProps {
  invoices: Facture[];
  onViewDetails: (invoiceId: string) => void;
  onEdit: () => void;
  onDownloadPDF: (invoice: Facture) => void;
  onDeleteClick: (invoiceId: string) => void;
}

export const InvoiceTable = ({ 
  invoices, 
  onViewDetails, 
  onEdit, 
  onDownloadPDF, 
  onDeleteClick 
}: InvoiceTableProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paye': return 'bg-green-100 text-green-800';
      case 'en_attente': return 'bg-yellow-100 text-yellow-800';
      case 'en_retard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'paye': return 'Payé';
      case 'en_attente': return 'En attente';
      case 'en_retard': return 'En retard';
      default: return status;
    }
  };

  if (invoices.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Aucune facture créée pour le moment.
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>N° Facture</TableHead>
          <TableHead>Client</TableHead>
          <TableHead>Mission</TableHead>
          <TableHead>Date émission</TableHead>
          <TableHead>Échéance</TableHead>
          <TableHead>Montant HT</TableHead>
          <TableHead>Montant TTC</TableHead>
          <TableHead>Statut</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {invoices.map((invoice) => (
          <TableRow key={invoice.id}>
            <TableCell className="font-medium">{invoice.numero}</TableCell>
            <TableCell>{invoice.client_nom}</TableCell>
            <TableCell>{invoice.mission_numero || '-'}</TableCell>
            <TableCell>{new Date(invoice.date_emission).toLocaleDateString('fr-FR')}</TableCell>
            <TableCell>{new Date(invoice.date_echeance).toLocaleDateString('fr-FR')}</TableCell>
            <TableCell>{invoice.montant_ht.toLocaleString('fr-FR')} GNF</TableCell>
            <TableCell className="font-medium">{invoice.montant_ttc.toLocaleString('fr-FR')} GNF</TableCell>
            <TableCell>
              <Badge className={getStatusColor(invoice.statut)}>
                {getStatusLabel(invoice.statut)}
              </Badge>
            </TableCell>
            <TableCell>
              <InvoiceActionsDropdown
                invoice={invoice}
                onViewDetails={onViewDetails}
                onEdit={onEdit}
                onDownloadPDF={onDownloadPDF}
                onDeleteClick={onDeleteClick}
              />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
