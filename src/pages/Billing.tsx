
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { BillingDashboard } from '@/components/billing/BillingDashboard';
import { InvoiceList } from '@/components/billing/InvoiceList';
import { QuoteList } from '@/components/billing/QuoteList';
import { PaymentTracking } from '@/components/billing/PaymentTracking';
import { ExportFactures } from '@/components/billing/ExportFactures';
import { InvoiceForm } from '@/components/billing/InvoiceForm';
import { QuoteForm } from '@/components/billing/QuoteForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Calculator, Fuel } from 'lucide-react';
import { TarifsHydrocarburesManagement } from '@/components/billing/TarifsHydrocarburesManagement';

const Billing = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [showQuoteForm, setShowQuoteForm] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleInvoiceCreated = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handleQuoteCreated = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Module Facturation</h1>
          <p className="text-muted-foreground">Gestion complète de la facturation et des devis</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={showQuoteForm} onOpenChange={setShowQuoteForm}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Calculator className="h-4 w-4" />
                Nouveau devis
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Créer un nouveau devis</DialogTitle>
              </DialogHeader>
              <QuoteForm 
                onClose={() => setShowQuoteForm(false)} 
                onQuoteCreated={handleQuoteCreated}
              />
            </DialogContent>
          </Dialog>
          
          <Dialog open={showInvoiceForm} onOpenChange={setShowInvoiceForm}>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-orange-500 hover:bg-orange-600 text-white">
                <Plus className="h-4 w-4" />
                Nouvelle facture
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Créer une nouvelle facture</DialogTitle>
              </DialogHeader>
              <InvoiceForm 
                onClose={() => setShowInvoiceForm(false)} 
                onInvoiceCreated={handleInvoiceCreated}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="dashboard">Tableau de bord</TabsTrigger>
          <TabsTrigger value="invoices">Factures</TabsTrigger>
          <TabsTrigger value="quotes">Devis</TabsTrigger>
          <TabsTrigger value="tarifs" className="flex items-center gap-2">
            <Fuel className="h-4 w-4" />
            Tarifs Hydrocarbures
          </TabsTrigger>
          <TabsTrigger value="payments">Suivi paiements</TabsTrigger>
          <TabsTrigger value="export">Export</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          <BillingDashboard key={refreshKey} />
        </TabsContent>

        <TabsContent value="invoices" className="space-y-6">
          <InvoiceList key={refreshKey} />
        </TabsContent>

        <TabsContent value="quotes" className="space-y-6">
          <QuoteList key={refreshKey} />
        </TabsContent>

        <TabsContent value="tarifs" className="space-y-6">
          <TarifsHydrocarburesManagement />
        </TabsContent>

        <TabsContent value="payments" className="space-y-6">
          <PaymentTracking />
        </TabsContent>

        <TabsContent value="export" className="space-y-6">
          <ExportFactures />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Billing;
