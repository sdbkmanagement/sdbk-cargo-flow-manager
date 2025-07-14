import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Search, 
  Filter, 
  Download, 
  Mail, 
  CreditCard,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { billingService, type Facture } from '@/services/billing';
import { exportInvoicesToCSV } from '@/utils/exportUtils';
import { toast } from '@/hooks/use-toast';

export const PaymentTracking = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [invoices, setInvoices] = useState<Facture[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('tous');

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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paye': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'en_attente': return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'en_retard': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default: return <CreditCard className="h-4 w-4 text-gray-600" />;
    }
  };

  const getDaysOverdue = (echeance: string) => {
    const today = new Date();
    const dueDate = new Date(echeance);
    const diffTime = today.getTime() - dueDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const handleStatusChange = async (invoiceId: string, newStatus: string) => {
    try {
      await billingService.updateFacture(invoiceId, { statut: newStatus });
      toast({
        title: "Statut mis à jour",
        description: "Le statut de la facture a été mis à jour.",
      });
      loadInvoices();
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le statut.",
        variant: "destructive"
      });
    }
  };

  const handleSendReminder = (invoice: Facture) => {
    // Simulation d'envoi de relance
    toast({
      title: "Relance envoyée",
      description: `Une relance a été envoyée à ${invoice.client_nom}.`,
    });
  };

  const handleExportFiltered = () => {
    exportInvoicesToCSV(filteredInvoices);
    toast({
      title: "Export réussi",
      description: "Les factures filtrées ont été exportées.",
    });
  };

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = invoice.client_nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.numero.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = selectedStatus === 'tous' || invoice.statut === selectedStatus;
    
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: invoices.length,
    enAttente: invoices.filter(i => i.statut === 'en_attente').length,
    enRetard: invoices.filter(i => i.statut === 'en_retard').length,
    payes: invoices.filter(i => i.statut === 'paye').length,
    montantEnAttente: invoices
      .filter(i => i.statut === 'en_attente')
      .reduce((sum, i) => sum + Number(i.montant_ttc), 0),
    montantEnRetard: invoices
      .filter(i => i.statut === 'en_retard')
      .reduce((sum, i) => sum + Number(i.montant_ttc), 0)
  };

  if (loading) {
    return <div className="flex justify-center p-8">Chargement du suivi des paiements...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CreditCard className="h-4 w-4 text-blue-600" />
              <div>
                <div className="text-2xl font-bold">{stats.total}</div>
                <div className="text-sm text-muted-foreground">Total factures</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-yellow-600" />
              <div>
                <div className="text-2xl font-bold">{stats.enAttente}</div>
                <div className="text-sm text-muted-foreground">En attente</div>
                <div className="text-xs text-muted-foreground">{stats.montantEnAttente.toLocaleString('fr-FR')} GNF</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <div>
                <div className="text-2xl font-bold">{stats.enRetard}</div>
                <div className="text-sm text-muted-foreground">En retard</div>
                <div className="text-xs text-muted-foreground">{stats.montantEnRetard.toLocaleString('fr-FR')} GNF</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <div>
                <div className="text-2xl font-bold">{stats.payes}</div>
                <div className="text-sm text-muted-foreground">Payées</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres et actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher une facture..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          <select 
            value={selectedStatus} 
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 border border-input bg-background rounded-md text-sm"
          >
            <option value="tous">Tous les statuts</option>
            <option value="en_attente">En attente</option>
            <option value="en_retard">En retard</option>
            <option value="paye">Payé</option>
          </select>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExportFiltered}>
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
          <Button variant="outline" size="sm">
            <Mail className="h-4 w-4 mr-2" />
            Relance automatique
          </Button>
        </div>
      </div>

      {/* Tableau des paiements */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Suivi des paiements
          </CardTitle>
          <CardDescription>
            Gestion et suivi des paiements de toutes vos factures
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredInvoices.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm ? 'Aucune facture trouvée pour cette recherche.' : 'Aucune facture trouvée.'}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>N° Facture</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Date émission</TableHead>
                  <TableHead>Échéance</TableHead>
                  <TableHead>Montant TTC</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Retard</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">{invoice.numero}</TableCell>
                    <TableCell>{invoice.client_nom}</TableCell>
                    <TableCell>{new Date(invoice.date_emission).toLocaleDateString('fr-FR')}</TableCell>
                    <TableCell>{new Date(invoice.date_echeance).toLocaleDateString('fr-FR')}</TableCell>
                    <TableCell className="font-medium">{Number(invoice.montant_ttc).toLocaleString('fr-FR')} GNF</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(invoice.statut)}
                        <Badge className={getStatusColor(invoice.statut)}>
                          {getStatusLabel(invoice.statut)}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      {invoice.statut === 'en_retard' && (
                        <span className="text-red-600 font-medium">
                          {getDaysOverdue(invoice.date_echeance)} jour(s)
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {invoice.statut === 'en_attente' && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleStatusChange(invoice.id, 'paye')}
                          >
                            Marquer payé
                          </Button>
                        )}
                        {(invoice.statut === 'en_attente' || invoice.statut === 'en_retard') && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleSendReminder(invoice)}
                          >
                            <Mail className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
