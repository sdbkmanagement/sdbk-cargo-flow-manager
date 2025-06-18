
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calculator, Eye, Edit, ArrowRight, Download } from 'lucide-react';
import { billingService, type Devis } from '@/services/billing';
import { generateQuotePDF } from '@/utils/pdfGenerator';
import { toast } from '@/hooks/use-toast';

export const QuoteList = () => {
  const [quotes, setQuotes] = useState<Devis[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadQuotes();
  }, []);

  const loadQuotes = async () => {
    try {
      const data = await billingService.getDevis();
      setQuotes(data);
    } catch (error) {
      console.error('Erreur lors du chargement des devis:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les devis.",
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

  const convertToInvoice = async (quoteId: string) => {
    try {
      await billingService.updateDevisStatus(quoteId, 'accepte');
      console.log(`Conversion du devis ${quoteId} en facture`);
      toast({
        title: "Devis accepté",
        description: "Le devis a été marqué comme accepté. Vous pouvez maintenant créer une facture.",
      });
      loadQuotes();
    } catch (error) {
      console.error('Erreur lors de la conversion:', error);
      toast({
        title: "Erreur",
        description: "Impossible de convertir le devis.",
        variant: "destructive"
      });
    }
  };

  const handleDownloadPDF = (quote: Devis) => {
    generateQuotePDF(quote);
  };

  if (loading) {
    return <div className="flex justify-center p-8">Chargement des devis...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Liste des devis
          </CardTitle>
          <CardDescription>
            Gestion de tous vos devis émis
          </CardDescription>
        </CardHeader>
        <CardContent>
          {quotes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Aucun devis créé pour le moment.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>N° Devis</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Date création</TableHead>
                  <TableHead>Validité</TableHead>
                  <TableHead>Montant HT</TableHead>
                  <TableHead>Montant TTC</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quotes.map((quote) => (
                  <TableRow key={quote.id}>
                    <TableCell className="font-medium">{quote.numero}</TableCell>
                    <TableCell>{quote.client_nom}</TableCell>
                    <TableCell className="max-w-xs truncate">{quote.description}</TableCell>
                    <TableCell>{new Date(quote.date_creation).toLocaleDateString('fr-FR')}</TableCell>
                    <TableCell>{new Date(quote.date_validite).toLocaleDateString('fr-FR')}</TableCell>
                    <TableCell>{quote.montant_ht.toLocaleString('fr-FR')} €</TableCell>
                    <TableCell className="font-medium">{quote.montant_ttc.toLocaleString('fr-FR')} €</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(quote.statut)}>
                        {getStatusLabel(quote.statut)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDownloadPDF(quote)}
                          title="Télécharger PDF"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        {quote.statut === 'en_attente' && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => convertToInvoice(quote.id)}
                            title="Convertir en facture"
                          >
                            <ArrowRight className="h-4 w-4" />
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
