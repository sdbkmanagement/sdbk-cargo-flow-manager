
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { BillingDashboard } from '@/components/billing/BillingDashboard';
import { InvoiceList } from '@/components/billing/InvoiceList';
import { QuoteList } from '@/components/billing/QuoteList';
import { PaymentTracking } from '@/components/billing/PaymentTracking';
import { InvoiceForm } from '@/components/billing/InvoiceForm';
import { QuoteForm } from '@/components/billing/QuoteForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, FileText, Calculator } from 'lucide-react';

const Billing = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [showQuoteForm, setShowQuoteForm] = useState(false);

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
              <QuoteForm onClose={() => setShowQuoteForm(false)} />
            </DialogContent>
          </Dialog>
          
          <Dialog open={showInvoiceForm} onOpenChange={setShowInvoiceForm}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Nouvelle facture
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Créer une nouvelle facture</DialogTitle>
              </DialogHeader>
              <InvoiceForm onClose={() => setShowInvoiceForm(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dashboard">Tableau de bord</TabsTrigger>
          <TabsTrigger value="invoices">Factures</TabsTrigger>
          <TabsTrigger value="quotes">Devis</TabsTrigger>
          <TabsTrigger value="payments">Suivi paiements</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          <BillingDashboard />
        </TabsContent>

        <TabsContent value="invoices" className="space-y-6">
          <InvoiceList />
        </TabsContent>

        <TabsContent value="quotes" className="space-y-6">
          <QuoteList />
        </TabsContent>

        <TabsContent value="payments" className="space-y-6">
          <PaymentTracking />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Billing;
