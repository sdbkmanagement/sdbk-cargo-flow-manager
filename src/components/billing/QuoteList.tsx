
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calculator, Eye, Edit, ArrowRight, Download, Search, Filter, Trash2, MoreHorizontal } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { billingService, type Devis } from '@/services/billing';
import { generateQuotePDF } from '@/utils/pdfGenerator';
import { exportQuotesToCSV } from '@/utils/exportUtils';
import { QuoteDetail } from './QuoteDetail';
import { toast } from '@/hooks/use-toast';

export const QuoteList = () => {
  const [quotes, setQuotes] = useState<Devis[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedQuote, setSelectedQuote] = useState<string | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [quoteToDelete, setQuoteToDelete] = useState<string | null>(null);

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

  const handleExportAll = () => {
    exportQuotesToCSV(filteredQuotes);
    toast({
      title: "Export réussi",
      description: "Les devis ont été exportés en CSV.",
    });
  };

  const handleViewDetails = (quoteId: string) => {
    setSelectedQuote(quoteId);
    setShowDetail(true);
  };

  const handleEdit = () => {
    setShowDetail(false);
    toast({
      title: "Fonctionnalité à venir",
      description: "La modification de devis sera disponible prochainement.",
    });
  };

  const handleDeleteClick = (quoteId: string) => {
    setQuoteToDelete(quoteId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (quoteToDelete) {
      try {
        await billingService.deleteDevis(quoteToDelete);
        toast({
          title: "Devis supprimé",
          description: "Le devis a été supprimé avec succès.",
        });
        loadQuotes();
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        toast({
          title: "Erreur",
          description: "Impossible de supprimer le devis.",
          variant: "destructive"
        });
      }
    }
    setDeleteDialogOpen(false);
    setQuoteToDelete(null);
    setShowDetail(false);
  };

  const filteredQuotes = quotes.filter(quote =>
    quote.client_nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    quote.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
    quote.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="flex justify-center p-8">Chargement des devis...</div>;
  }

  return (
    <div className="space-y-6">
      {/* En-tête et actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un devis..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filtrer
          </Button>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExportAll}>
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
        </div>
      </div>

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
          {filteredQuotes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm ? 'Aucun devis trouvé pour cette recherche.' : 'Aucun devis créé pour le moment.'}
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
                {filteredQuotes.map((quote) => (
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
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-white border shadow-md z-50">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => handleViewDetails(quote.id)}>
                            <Eye className="mr-2 h-4 w-4" />
                            Voir détails
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={handleEdit}>
                            <Edit className="mr-2 h-4 w-4" />
                            Modifier
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleDownloadPDF(quote)}>
                            <Download className="mr-2 h-4 w-4" />
                            Télécharger PDF
                          </DropdownMenuItem>
                          {quote.statut === 'en_attente' && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => convertToInvoice(quote.id)}>
                                <ArrowRight className="mr-2 h-4 w-4" />
                                Convertir en facture
                              </DropdownMenuItem>
                            </>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => handleDeleteClick(quote.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialog de détails */}
      {selectedQuote && (
        <QuoteDetail
          quoteId={selectedQuote}
          open={showDetail}
          onClose={() => setShowDetail(false)}
          onEdit={handleEdit}
          onDelete={() => handleDeleteClick(selectedQuote)}
          onConvert={() => convertToInvoice(selectedQuote)}
        />
      )}

      {/* Dialog de confirmation de suppression */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer ce devis ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-red-600 hover:bg-red-700">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
