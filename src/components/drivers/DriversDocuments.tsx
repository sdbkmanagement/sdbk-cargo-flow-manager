
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { FileText, Search, Eye, Download, Upload, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Document {
  id: string;
  entity_id: string;
  nom: string;
  type: string;
  url: string;
  date_expiration: string | null;
  date_delivrance: string | null;
  statut: string;
  document_requis: boolean;
  assigne_automatiquement: boolean;
  chauffeur_nom?: string;
}

export const DriversDocuments = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('documents')
        .select(`
          *,
          chauffeurs!entity_id (
            nom,
            prenom
          )
        `)
        .eq('entity_type', 'chauffeur')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erreur lors du chargement des documents:', error);
        toast({
          title: 'Erreur',
          description: 'Impossible de charger les documents',
          variant: 'destructive'
        });
        return;
      }

      const documentsWithNames = data?.map(doc => ({
        ...doc,
        chauffeur_nom: doc.chauffeurs ? 
          `${doc.chauffeurs.prenom} ${doc.chauffeurs.nom}` : 
          'Chauffeur inconnu'
      })) || [];

      setDocuments(documentsWithNames);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, []);

  const filteredDocuments = documents.filter(doc =>
    doc.chauffeur_nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (statut: string, hasFile: boolean, isRequired: boolean) => {
    if (!hasFile && isRequired) {
      return <Badge variant="outline" className="border-red-500 text-red-700">Manquant</Badge>;
    }
    
    switch (statut) {
      case 'expire':
        return <Badge variant="destructive">Expiré</Badge>;
      case 'a_renouveler':
        return <Badge variant="secondary">À renouveler</Badge>;
      case 'manquant':
        return <Badge variant="outline" className="border-red-500 text-red-700">Manquant</Badge>;
      default:
        return <Badge variant="default">Valide</Badge>;
    }
  };

  const handleViewDocument = (document: Document) => {
    if (document.url && document.url !== '') {
      window.open(document.url, '_blank');
    } else {
      toast({
        title: 'Document non disponible',
        description: 'Ce document n\'a pas encore été téléchargé',
        variant: 'destructive'
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Chargement des documents...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestion des Documents</h2>
          <p className="text-gray-600">
            {documents.length} document(s) • {documents.filter(d => !d.url || d.url === '').length} manquant(s)
          </p>
        </div>
        <Button className="bg-orange-500 hover:bg-orange-600">
          <Plus className="w-4 h-4 mr-2" />
          Assigner documents
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <FileText className="w-5 h-5 mr-2" />
              Documents des chauffeurs
            </CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredDocuments.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">Aucun document trouvé</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Chauffeur</TableHead>
                  <TableHead>Document</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Expiration</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDocuments.map((document) => (
                  <TableRow key={document.id}>
                    <TableCell>
                      <div className="font-medium">{document.chauffeur_nom}</div>
                      {document.assigne_automatiquement && (
                        <div className="text-xs text-gray-500">Assigné automatiquement</div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <FileText className="w-4 h-4 text-blue-500" />
                        <span>{document.nom}</span>
                        {document.document_requis && (
                          <Badge variant="outline" className="text-xs">Requis</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{document.type}</Badge>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(
                        document.statut, 
                        Boolean(document.url && document.url !== ''), 
                        document.document_requis
                      )}
                    </TableCell>
                    <TableCell>
                      {document.date_expiration ? (
                        <div className="text-sm">
                          {new Date(document.date_expiration).toLocaleDateString('fr-FR')}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">Aucune</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDocument(document)}
                          disabled={!document.url || document.url === ''}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        {(!document.url || document.url === '') && (
                          <Button variant="outline" size="sm">
                            <Upload className="w-4 h-4" />
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
