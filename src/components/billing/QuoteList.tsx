
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calculator, Eye, Edit, FileText, ArrowRight } from 'lucide-react';

export const QuoteList = () => {
  // Données simulées pour les devis
  const quotes = [
    {
      id: 'D2024-001',
      client: 'Total Guinée',
      dateCreation: '2024-01-20',
      dateValidite: '2024-02-20',
      montantHT: 4800.00,
      montantTTC: 5664.00,
      statut: 'en_attente',
      description: 'Transport hydrocarbures Conakry-Labé'
    },
    {
      id: 'D2024-002',
      client: 'CBG Bauxite',
      dateCreation: '2024-01-18',
      dateValidite: '2024-02-18',
      montantHT: 6200.00,
      montantTTC: 7316.00,
      statut: 'accepte',
      description: 'Transport bauxite mines-port'
    }
  ];

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

  const convertToInvoice = (quoteId: string) => {
    console.log(`Conversion du devis ${quoteId} en facture`);
    // Logique de conversion à implémenter
  };

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
                  <TableCell className="font-medium">{quote.id}</TableCell>
                  <TableCell>{quote.client}</TableCell>
                  <TableCell className="max-w-xs truncate">{quote.description}</TableCell>
                  <TableCell>{new Date(quote.dateCreation).toLocaleDateString('fr-FR')}</TableCell>
                  <TableCell>{new Date(quote.dateValidite).toLocaleDateString('fr-FR')}</TableCell>
                  <TableCell>{quote.montantHT.toLocaleString('fr-FR')} €</TableCell>
                  <TableCell className="font-medium">{quote.montantTTC.toLocaleString('fr-FR')} €</TableCell>
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
                      {quote.statut === 'accepte' && (
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
        </CardContent>
      </Card>
    </div>
  );
};
