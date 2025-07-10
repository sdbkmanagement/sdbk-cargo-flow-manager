
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Download, Edit, Trash2 } from 'lucide-react';
import { billingService, type Facture, type FactureLigne } from '@/services/billing';
import { generateInvoicePDF } from '@/utils/pdfGenerator';
import { toast } from '@/hooks/use-toast';

interface InvoiceDetailProps {
  invoiceId: string;
  open: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export const InvoiceDetail = ({ invoiceId, open, onClose, onEdit, onDelete }: InvoiceDetailProps) => {
  const [invoice, setInvoice] = useState<(Facture & { facture_lignes: FactureLigne[] }) | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (invoiceId && open) {
      loadInvoiceDetails();
    }
  }, [invoiceId, open]);

  const loadInvoiceDetails = async () => {
    try {
      setLoading(true);
      const data = await billingService.getFacture(invoiceId);
      setInvoice(data);
    } catch (error) {
      console.error('Erreur lors du chargement des détails:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les détails de la facture.",
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

  const handleDownload = () => {
    if (invoice) {
      generateInvoicePDF(invoice);
    }
  };

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="flex justify-center p-8">Chargement des détails...</div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!invoice) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="text-center p-8">Facture non trouvée</div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex justify-between items-center">
            <DialogTitle>Détails de la facture {invoice.numero}</DialogTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleDownload}>
                <Download className="h-4 w-4 mr-2" />
                PDF
              </Button>
              <Button variant="outline" size="sm" onClick={onEdit}>
                <Edit className="h-4 w-4 mr-2" />
                Modifier
              </Button>
              <Button variant="destructive" size="sm" onClick={onDelete}>
                <Trash2 className="h-4 w-4 mr-2" />
                Supprimer
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Informations client</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div><strong>Nom:</strong> {invoice.client_nom}</div>
                {invoice.client_societe && <div><strong>Société:</strong> {invoice.client_societe}</div>}
                {invoice.client_contact && <div><strong>Contact:</strong> {invoice.client_contact}</div>}
                {invoice.client_email && <div><strong>Email:</strong> {invoice.client_email}</div>}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Informations facture</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div><strong>N° Facture:</strong> {invoice.numero}</div>
                <div><strong>Date émission:</strong> {new Date(invoice.date_emission).toLocaleDateString('fr-FR')}</div>
                <div><strong>Date échéance:</strong> {new Date(invoice.date_echeance).toLocaleDateString('fr-FR')}</div>
                <div>
                  <strong>Statut:</strong>{' '}
                  <Badge className={getStatusColor(invoice.statut)}>
                    {getStatusLabel(invoice.statut)}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {invoice.mission_numero && (
            <Card>
              <CardHeader>
                <CardTitle>Détails mission</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div><strong>N° Mission:</strong> {invoice.mission_numero}</div>
                {invoice.chauffeur && <div><strong>Chauffeur:</strong> {invoice.chauffeur}</div>}
                {invoice.vehicule && <div><strong>Véhicule:</strong> {invoice.vehicule}</div>}
                {invoice.type_transport && <div><strong>Type transport:</strong> {invoice.type_transport}</div>}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Détails financiers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-sm text-muted-foreground">Montant HT</div>
                    <div className="text-lg font-semibold">{invoice.montant_ht.toLocaleString('fr-FR')} GNF</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">TVA (18%)</div>
                    <div className="text-lg font-semibold">{invoice.montant_tva.toLocaleString('fr-FR')} GNF</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Total TTC</div>
                    <div className="text-xl font-bold text-primary">{invoice.montant_ttc.toLocaleString('fr-FR')} GNF</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {invoice.observations && (
            <Card>
              <CardHeader>
                <CardTitle>Observations</CardTitle>
              </CardHeader>
              <CardContent>
                <p>{invoice.observations}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
