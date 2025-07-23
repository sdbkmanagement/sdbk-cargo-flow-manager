
import { useState, useEffect } from 'react';
import { billingService, type Facture } from '@/services/billing';
import { generateInvoicePDF } from '@/utils/pdfGenerator';
import { exportInvoicesToCSV } from '@/utils/exportUtils';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

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

  const handleExportAll = async () => {
    try {
      // Récupérer les bons de livraison livrés pour l'export
      const { data: bonsLivraison, error } = await supabase
        .from('bons_livraison')
        .select(`
          *,
          vehicules!inner(numero, immatriculation),
          chauffeurs!inner(nom, prenom),
          missions!inner(numero, site_depart, site_arrivee)
        `)
        .eq('statut', 'livre')
        .order('date_chargement_reelle', { ascending: false });

      if (error) throw error;

      const exportData = bonsLivraison?.map(bl => ({
        date_chargement_reelle: bl.date_chargement_reelle,
        numero_tournee: bl.numero_tournee,
        vehicule: `${bl.vehicules?.numero} - ${bl.vehicules?.immatriculation}`,
        lieu_depart: bl.lieu_depart || bl.missions?.site_depart,
        numero: bl.numero,
        client_nom: bl.destination, // Le client est stocké dans destination pour les BL
        destination: bl.lieu_arrivee || bl.missions?.site_arrivee,
        produit: bl.produit,
        quantite_livree: bl.quantite_livree,
        prix_unitaire: bl.prix_unitaire,
        montant_total: bl.montant_total,
        manquant_total: bl.manquant_total,
        manquant_compteur: bl.manquant_compteur,
        manquant_cuve: bl.manquant_cuve,
        client_code: bl.client_code
      })) || [];
      
      exportInvoicesToCSV(exportData);
      toast({
        title: "Export réussi",
        description: `${exportData.length} bons de livraison exportés au format mouvement.`,
      });
    } catch (error) {
      console.error('Erreur lors de l\'export:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'exporter les données.",
        variant: "destructive"
      });
    }
  };

  const handleExportByDates = async (dateDebut: Date, dateFin: Date) => {
    try {
      const dateDebutStr = dateDebut.toISOString().split('T')[0];
      const dateFinStr = dateFin.toISOString().split('T')[0];

      // Récupérer les bons de livraison pour la période
      const { data: bonsLivraison, error } = await supabase
        .from('bons_livraison')
        .select(`
          *,
          vehicules!inner(numero, immatriculation),
          chauffeurs!inner(nom, prenom),
          missions!inner(numero, site_depart, site_arrivee)
        `)
        .eq('statut', 'livre')
        .gte('date_chargement_reelle', dateDebutStr)
        .lte('date_chargement_reelle', dateFinStr)
        .order('date_chargement_reelle', { ascending: false });

      if (error) throw error;

      const exportData = bonsLivraison?.map(bl => ({
        date_chargement_reelle: bl.date_chargement_reelle,
        numero_tournee: bl.numero_tournee,
        vehicule: `${bl.vehicules?.numero} - ${bl.vehicules?.immatriculation}`,
        lieu_depart: bl.lieu_depart || bl.missions?.site_depart,
        numero: bl.numero,
        client_nom: bl.destination,
        destination: bl.lieu_arrivee || bl.missions?.site_arrivee,
        produit: bl.produit,
        quantite_livree: bl.quantite_livree,
        prix_unitaire: bl.prix_unitaire,
        montant_total: bl.montant_total,
        manquant_total: bl.manquant_total,
        manquant_compteur: bl.manquant_compteur,
        manquant_cuve: bl.manquant_cuve,
        client_code: bl.client_code
      })) || [];
      
      exportInvoicesToCSV(exportData);
      toast({
        title: "Export réussi",
        description: `${exportData.length} bons de livraison exportés pour la période sélectionnée.`,
      });
    } catch (error) {
      console.error('Erreur lors de l\'export:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'exporter les données pour cette période.",
        variant: "destructive"
      });
    }
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
