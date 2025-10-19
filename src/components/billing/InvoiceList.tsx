
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText } from 'lucide-react';
import { InvoiceDetail } from './InvoiceDetail';
import { InvoiceListHeader } from './invoice-list/InvoiceListHeader';
import { InvoiceTable } from './invoice-list/InvoiceTable';
import { DeleteConfirmDialog } from './invoice-list/DeleteConfirmDialog';
import { useInvoiceList } from './invoice-list/useInvoiceList';
import { toast } from '@/hooks/use-toast';
import { billingService } from '@/services/billing';

export const InvoiceList = () => {
  const {
    invoices,
    loading,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    monthFilter,
    setMonthFilter,
    handleDownloadPDF,
    handleExportAll,
    handleExportByDates,
    handleDeleteConfirm
  } = useInvoiceList();

  const [selectedInvoice, setSelectedInvoice] = useState<string | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState<string | null>(null);

  // Calculer les mois disponibles à partir de toutes les factures
  const [allInvoices, setAllInvoices] = useState<any[]>([]);
  
  React.useEffect(() => {
    const loadAllInvoices = async () => {
      try {
        const data = await billingService.getFactures();
        setAllInvoices(data);
      } catch (error) {
        console.error('Erreur lors du chargement des factures:', error);
      }
    };
    loadAllInvoices();
  }, []);

  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    allInvoices.forEach(invoice => {
      const date = new Date(invoice.date_emission);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      months.add(monthKey);
    });
    return Array.from(months).sort((a, b) => b.localeCompare(a)); // Trier du plus récent au plus ancien
  }, [allInvoices]);

  const handleViewDetails = (invoiceId: string) => {
    setSelectedInvoice(invoiceId);
    setShowDetail(true);
  };

  const handleEdit = () => {
    setShowDetail(false);
    toast({
      title: "Fonctionnalité à venir",
      description: "La modification de factures sera disponible prochainement.",
    });
  };

  const handleDeleteClick = (invoiceId: string) => {
    setInvoiceToDelete(invoiceId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirmAction = async () => {
    if (invoiceToDelete) {
      await handleDeleteConfirm(invoiceToDelete);
    }
    setDeleteDialogOpen(false);
    setInvoiceToDelete(null);
    setShowDetail(false);
  };

  if (loading) {
    return <div className="flex justify-center p-8">Chargement des factures...</div>;
  }

  return (
    <div className="space-y-6">
      <InvoiceListHeader
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onExportAll={handleExportAll}
        onExportByDates={handleExportByDates}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        monthFilter={monthFilter}
        onMonthFilterChange={setMonthFilter}
        availableMonths={availableMonths}
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Liste des factures
          </CardTitle>
          <CardDescription>
            Gestion de toutes vos factures émises
          </CardDescription>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 && searchTerm ? (
            <div className="text-center py-8 text-muted-foreground">
              Aucune facture trouvée pour cette recherche.
            </div>
          ) : (
            <InvoiceTable
              invoices={invoices}
              onViewDetails={handleViewDetails}
              onEdit={handleEdit}
              onDownloadPDF={handleDownloadPDF}
              onDeleteClick={handleDeleteClick}
            />
          )}
        </CardContent>
      </Card>

      {selectedInvoice && (
        <InvoiceDetail
          invoiceId={selectedInvoice}
          open={showDetail}
          onClose={() => setShowDetail(false)}
          onEdit={handleEdit}
          onDelete={() => handleDeleteClick(selectedInvoice)}
        />
      )}

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteConfirmAction}
      />
    </div>
  );
};
