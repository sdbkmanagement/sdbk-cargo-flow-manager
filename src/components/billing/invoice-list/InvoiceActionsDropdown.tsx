
import React from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Eye, Edit, Download, Mail, Trash2 } from 'lucide-react';
import { type Facture } from '@/services/billing';

interface InvoiceActionsDropdownProps {
  invoice: Facture;
  onViewDetails: (invoiceId: string) => void;
  onEdit: () => void;
  onDownloadPDF: (invoice: Facture) => void;
  onDeleteClick: (invoiceId: string) => void;
}

export const InvoiceActionsDropdown = ({ 
  invoice, 
  onViewDetails, 
  onEdit, 
  onDownloadPDF, 
  onDeleteClick 
}: InvoiceActionsDropdownProps) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-white border shadow-md z-50">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => onViewDetails(invoice.id)}>
          <Eye className="mr-2 h-4 w-4" />
          Voir détails
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onEdit}>
          <Edit className="mr-2 h-4 w-4" />
          Modifier
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => onDownloadPDF(invoice)}>
          <Download className="mr-2 h-4 w-4" />
          Télécharger PDF
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Mail className="mr-2 h-4 w-4" />
          Envoyer par email
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          onClick={() => onDeleteClick(invoice.id)}
          className="text-red-600"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Supprimer
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
