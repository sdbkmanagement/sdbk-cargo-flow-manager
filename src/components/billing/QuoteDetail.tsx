
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Download, Edit, Trash2, ArrowRight } from 'lucide-react';
import { billingService, type Devis } from '@/services/billing';
import { generateQuotePDF } from '@/utils/pdfGenerator';
import { toast } from '@/hooks/use-toast';

interface QuoteDetailProps {
  quoteId: string;
  open: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onConvert: () => void;
}

export const QuoteDetail = ({ quoteId, open, onClose, onEdit, onDelete, onConvert }: QuoteDetailProps) => {
  const [quote, setQuote] = useState<Devis | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (quoteId && open) {
      loadQuoteDetails();
    }
  }, [quoteId, open]);

  const loadQuoteDetails = async () => {
    try {
      setLoading(true);
      // Utiliser getDevis() puis filtrer par ID car nous n'avons pas de getDevis(id) dans le service
      const quotes = await billingService.getDevis();
      const quote = quotes.find(q => q.id === quoteId);
      setQuote(quote || null);
    } catch (error) {
      console.error('Erreur lors du chargement des détails:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les détails du devis.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepte': return 'bg-green-100 text-green-800';
      case 'en_attente': return 'bg-yellow-100 text-yellow-800';
      case 'refuse': return 'bg-red-100 text-red-800';
      case 'expire': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'accepte': return 'Accepté';
      case 'en_attente': return 'En attente';
      case 'refuse': return 'Refusé';
      case 'expire': return 'Expiré';
      default: return status;
    }
  };

  const handleDownload = () => {
    if (quote) {
      generateQuotePDF(quote);
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

  if (!quote) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="text-center p-8">Devis non trouvé</div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex justify-between items-center">
            <DialogTitle>Détails du devis {quote.numero}</DialogTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleDownload}>
                <Download className="h-4 w-4 mr-2" />
                PDF
              </Button>
              <Button variant="outline" size="sm" onClick={onEdit}>
                <Edit className="h-4 w-4 mr-2" />
                Modifier
              </Button>
              {quote.statut === 'en_attente' && (
                <Button variant="outline" size="sm" onClick={onConvert}>
                  <ArrowRight className="h-4 w-4 mr-2" />
                  Convertir
                </Button>
              )}
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
                <div><strong>Nom:</strong> {quote.client_nom}</div>
                {quote.client_societe && <div><strong>Société:</strong> {quote.client_societe}</div>}
                {quote.client_email && <div><strong>Email:</strong> {quote.client_email}</div>}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Informations devis</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div><strong>N° Devis:</strong> {quote.numero}</div>
                <div><strong>Date création:</strong> {new Date(quote.date_creation).toLocaleDateString('fr-FR')}</div>
                <div><strong>Date validité:</strong> {new Date(quote.date_validite).toLocaleDateString('fr-FR')}</div>
                <div>
                  <strong>Statut:</strong>{' '}
                  <Badge className={getStatusColor(quote.statut)}>
                    {getStatusLabel(quote.statut)}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Description du service</CardTitle>
            </CardHeader>
            <CardContent>
              <p>{quote.description}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Détails financiers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-sm text-muted-foreground">Montant HT</div>
                    <div className="text-lg font-semibold">{quote.montant_ht.toFixed(2)} €</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">TVA (18%)</div>
                    <div className="text-lg font-semibold">{quote.montant_tva.toFixed(2)} €</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Total TTC</div>
                    <div className="text-xl font-bold text-primary">{quote.montant_ttc.toFixed(2)} €</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {quote.observations && (
            <Card>
              <CardHeader>
                <CardTitle>Observations</CardTitle>
              </CardHeader>
              <CardContent>
                <p>{quote.observations}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
