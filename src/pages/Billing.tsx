
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
import { MonthlyInvoiceGenerator } from '@/components/billing/MonthlyInvoiceGenerator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Calculator } from 'lucide-react';

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
          <MonthlyInvoiceGenerator onInvoiceCreated={handleInvoiceCreated} />
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dashboard">Tableau de bord</TabsTrigger>
          <TabsTrigger value="monthly-invoices">Factures mensuelles</TabsTrigger>
          <TabsTrigger value="payments">Suivi paiements</TabsTrigger>
          <TabsTrigger value="export">Export</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          <BillingDashboard key={refreshKey} />
        </TabsContent>

        <TabsContent value="monthly-invoices" className="space-y-6">
          <InvoiceList key={refreshKey} type="monthly" />
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
