
import { useState, useEffect, useMemo } from 'react';
import { billingService, type Facture } from '@/services/billing';
import { generateInvoicePDF } from '@/utils/pdfGenerator';
import { exportInvoicesToCSV } from '@/utils/exportUtils';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export const useInvoiceList = (type: 'individual' | 'monthly' = 'individual') => {
  const [invoices, setInvoices] = useState<Facture[]>([]);
  const [allInvoices, setAllInvoices] = useState<Facture[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [monthFilter, setMonthFilter] = useState<string>('all');

  useEffect(() => {
    loadInvoices();
  }, [type]);

  const loadInvoices = async () => {
    try {
      const data = await billingService.getFactures();
      setAllInvoices(data);
      
      // Filtrer selon le type
      const filteredData = data.filter(invoice => {
        if (type === 'monthly') {
          // Factures mensuelles : celles sans mission_numero ou avec "-GROUPE" dans le numéro
          return !invoice.mission_numero || invoice.numero.includes('-GROUPE');
        } else {
          // Factures individuelles : celles avec un mission_numero
          return invoice.mission_numero && !invoice.numero.includes('-GROUPE');
        }
      });
      
      setInvoices(filteredData);
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

  // Calculer tous les mois disponibles à partir de toutes les factures
  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    allInvoices.forEach(invoice => {
      const date = new Date(invoice.date_emission);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      months.add(monthKey);
    });
    return Array.from(months).sort((a, b) => b.localeCompare(a));
  }, [allInvoices]);

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
          vehicules!inner(numero, immatriculation, remorque_immatriculation, type_vehicule),
          chauffeurs!inner(nom, prenom),
          missions!inner(numero, site_depart, site_arrivee)
        `)
        .eq('statut', 'livre')
        .order('date_chargement_reelle', { ascending: false });

      if (error) throw error;

      const exportData = bonsLivraison?.map(bl => ({
        date_chargement_reelle: bl.date_chargement_reelle,
        numero_tournee: bl.numero_tournee,
        vehicule: bl.vehicules?.remorque_immatriculation || bl.vehicules?.immatriculation || bl.vehicules?.numero || '',
        lieu_depart: bl.lieu_depart || bl.missions?.site_depart,
        numero: bl.numero,
        client_nom: bl.missions?.site_arrivee || bl.destination,
        destination: bl.lieu_arrivee,
        produit: bl.produit,
        quantite_livree: (bl.quantite_livree ?? bl.quantite_prevue) || 0,
        prix_unitaire: bl.prix_unitaire || 0,
        montant_total: bl.montant_total || (((bl.quantite_livree ?? bl.quantite_prevue) || 0) * (bl.prix_unitaire || 0)),
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
          vehicules!inner(numero, immatriculation, remorque_immatriculation, type_vehicule),
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
        vehicule: bl.vehicules?.remorque_immatriculation || bl.vehicules?.immatriculation || bl.vehicules?.numero || '',
        lieu_depart: bl.lieu_depart || bl.missions?.site_depart,
        numero: bl.numero,
        client_nom: bl.missions?.site_arrivee || bl.destination,
        destination: bl.lieu_arrivee,
        produit: bl.produit,
        quantite_livree: (bl.quantite_livree ?? bl.quantite_prevue) || 0,
        prix_unitaire: bl.prix_unitaire || 0,
        montant_total: bl.montant_total || (((bl.quantite_livree ?? bl.quantite_prevue) || 0) * (bl.prix_unitaire || 0)),
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

  const filteredInvoices = invoices.filter(invoice => {
    // Filtre de recherche
    const matchesSearch = invoice.client_nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (invoice.mission_numero && invoice.mission_numero.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Filtre de statut
    const matchesStatus = statusFilter === 'all' || invoice.statut === statusFilter;
    
    // Filtre de mois
    let matchesMonth = true;
    if (monthFilter !== 'all') {
      const invoiceDate = new Date(invoice.date_emission);
      const invoiceMonth = `${invoiceDate.getFullYear()}-${String(invoiceDate.getMonth() + 1).padStart(2, '0')}`;
      matchesMonth = invoiceMonth === monthFilter;
    }
    
    return matchesSearch && matchesStatus && matchesMonth;
  });

  return {
    invoices: filteredInvoices,
    loading,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    monthFilter,
    setMonthFilter,
    loadInvoices,
    handleDownloadPDF,
    handleExportAll,
    handleExportByDates,
    handleDeleteConfirm,
    availableMonths
  };
};
