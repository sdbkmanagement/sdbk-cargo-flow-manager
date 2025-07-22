
import { useState, useEffect } from 'react';
import { billingService, type Facture } from '@/services/billing';
import { generateInvoicePDF } from '@/utils/pdfGenerator';
import { exportInvoicesToCSV } from '@/utils/exportUtils';
import { toast } from '@/hooks/use-toast';

export const useInvoiceList = () => {
  const [invoices, setInvoices] = useState<Facture[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = async () => {
    try {
      const data = await billingService.getFactures();
      setInvoices(data);
    } catch (error) {
      console.error('Erreur lors du chargement des factures:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les factures.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = (invoice: Facture) => {
    generateInvoicePDF(invoice);
  };

  const handleExportAll = () => {
    const filteredInvoices = invoices.filter(invoice =>
      invoice.client_nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (invoice.mission_numero && invoice.mission_numero.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    
    exportInvoicesToCSV(filteredInvoices);
    toast({
      title: "Export réussi",
      description: "Les factures ont été exportées en CSV.",
    });
  };

  const handleExportByDates = (dateDebut: Date, dateFin: Date) => {
    const filteredInvoices = invoices.filter(invoice => {
      const invoiceDate = new Date(invoice.date_emission);
      return invoiceDate >= dateDebut && invoiceDate <= dateFin;
    });
    
    exportInvoicesToCSV(filteredInvoices);
    toast({
      title: "Export réussi",
      description: `${filteredInvoices.length} factures exportées pour la période sélectionnée.`,
    });
  };

  const handleDeleteConfirm = async (invoiceId: string) => {
    try {
      await billingService.deleteFacture(invoiceId);
      toast({
        title: "Facture supprimée",
        description: "La facture a été supprimée avec succès.",
      });
      loadInvoices();
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la facture.",
        variant: "destructive"
      });
    }
  };

  const filteredInvoices = invoices.filter(invoice =>
    invoice.client_nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    invoice.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (invoice.mission_numero && invoice.mission_numero.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return {
    invoices: filteredInvoices,
    loading,
    searchTerm,
    setSearchTerm,
    loadInvoices,
    handleDownloadPDF,
    handleExportAll,
    handleExportByDates,
    handleDeleteConfirm
  };
};
