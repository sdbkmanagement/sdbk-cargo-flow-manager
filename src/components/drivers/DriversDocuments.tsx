
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
import { FileText, Search, Eye, Edit, Trash2, Upload, Plus, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { CHAUFFEUR_DOCUMENT_TYPES } from '@/types/chauffeur';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DocumentUpload } from '@/components/common/DocumentUpload';
import { documentsService } from '@/services/documentsService';

interface Document {
  id: string;
  entity_id: string;
  nom: string;
  type: string;
  url: string;
  date_expiration: string | null;
  date_delivrance: string | null;
  statut: string;
  chauffeur_nom?: string;
}

export const DriversDocuments = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [selectedChauffeur, setSelectedChauffeur] = useState('');
  const [selectedDocumentType, setSelectedDocumentType] = useState('');
  const [chauffeurs, setChauffeurs] = useState<any[]>([]);
  const { toast } = useToast();

  const loadDocuments = async () => {
    try {
      setLoading(true);
      
      // Charger les documents des chauffeurs
      const { data: documentsData, error: documentsError } = await supabase
        .from('documents')
        .select('*')
        .eq('entity_type', 'chauffeur')
        .order('created_at', { ascending: false });

      if (documentsError) {
        console.error('Erreur lors du chargement des documents:', documentsError);
        toast({
          title: 'Erreur',
          description: 'Impossible de charger les documents',
          variant: 'destructive'
        });
        return;
      }

      // Charger les noms des chauffeurs
      const chauffeurIds = [...new Set(documentsData?.map(doc => doc.entity_id))];
      const { data: chauffeursData } = await supabase
        .from('chauffeurs')
        .select('id, nom, prenom')
        .in('id', chauffeurIds);

      // Combiner les données
      const documentsWithNames = documentsData?.map(doc => ({
        ...doc,
        chauffeur_nom: chauffeursData?.find(c => c.id === doc.entity_id)
          ? `${chauffeursData.find(c => c.id === doc.entity_id)?.prenom} ${chauffeursData.find(c => c.id === doc.entity_id)?.nom}`
          : 'Chauffeur inconnu'
      })) || [];

      setDocuments(documentsWithNames);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadChauffeurs = async () => {
    try {
      const { data, error } = await supabase
        .from('chauffeurs')
        .select('id, nom, prenom, statut')
        .eq('statut', 'actif')
        .order('nom');

      if (error) throw error;
      setChauffeurs(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des chauffeurs:', error);
    }
  };

  useEffect(() => {
    loadDocuments();
    loadChauffeurs();
  }, []);

  const filteredDocuments = documents.filter(doc =>
    doc.chauffeur_nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (document: Document) => {
    if (!document.date_expiration) {
      return <Badge variant="secondary">Permanent</Badge>;
    }
    
    const now = new Date();
    const expDate = new Date(document.date_expiration);
    const daysUntilExpiry = Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry < 0) {
      return <Badge variant="destructive">Expiré</Badge>;
    } else if (daysUntilExpiry <= 30) {
      return <Badge className="bg-orange-100 text-orange-800">À renouveler</Badge>;
    } else {
      return <Badge className="bg-green-100 text-green-800">Valide</Badge>;
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

  const handleAssignDocument = async (file: File) => {
    if (!selectedChauffeur || !selectedDocumentType) {
      toast({
        title: 'Erreur',
        description: 'Veuillez sélectionner un chauffeur et un type de document',
        variant: 'destructive'
      });
      return;
    }

    try {
      const url = await documentsService.uploadFile(file, 'chauffeur', selectedChauffeur, selectedDocumentType);
      
      const documentData = {
        entity_type: 'chauffeur',
        entity_id: selectedChauffeur,
        nom: CHAUFFEUR_DOCUMENT_TYPES[selectedDocumentType as keyof typeof CHAUFFEUR_DOCUMENT_TYPES].label,
        type: selectedDocumentType,
        url: url,
        taille: file.size,
        statut: 'valide'
      };

      await documentsService.create(documentData);
      
      toast({
        title: "Document assigné",
        description: "Le document a été assigné avec succès",
      });
      
      setShowAssignDialog(false);
      setSelectedChauffeur('');
      setSelectedDocumentType('');
      loadDocuments();
    } catch (error) {
      console.error('Erreur lors de l\'assignation:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'assigner le document",
        variant: "destructive",
      });
    }
  };

  const getMissingDocumentsCount = () => {
    return documents.filter(d => !d.url || d.url === '').length;
  };

  const getExpiringDocumentsCount = () => {
    const now = new Date();
    return documents.filter(d => {
      if (!d.date_expiration) return false;
      const expDate = new Date(d.date_expiration);
      const daysUntilExpiry = Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return daysUntilExpiry <= 30 && daysUntilExpiry >= 0;
    }).length;
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
            {documents.length} document(s) • {getMissingDocumentsCount()} manquant(s) • {getExpiringDocumentsCount()} expirant(s)
          </p>
        </div>
        <Button 
          className="bg-orange-500 hover:bg-orange-600"
          onClick={() => setShowAssignDialog(true)}
        >
          <Plus className="w-4 h-4 mr-2" />
          Assigner document
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
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <FileText className="w-4 h-4 text-blue-500" />
                        <span>{document.nom}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{document.type}</Badge>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(document)}
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
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialog d'assignation de document */}
      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assigner un document</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Chauffeur</label>
              <Select value={selectedChauffeur} onValueChange={setSelectedChauffeur}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un chauffeur" />
                </SelectTrigger>
                <SelectContent>
                  {chauffeurs.map((chauffeur) => (
                    <SelectItem key={chauffeur.id} value={chauffeur.id}>
                      {chauffeur.prenom} {chauffeur.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Type de document</label>
              <Select value={selectedDocumentType} onValueChange={setSelectedDocumentType}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un type de document" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(CHAUFFEUR_DOCUMENT_TYPES).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      {config.label}
                      {config.obligatoire && <span className="text-red-500 ml-1">*</span>}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedChauffeur && selectedDocumentType && (
              <DocumentUpload
                onUpload={handleAssignDocument}
                onCancel={() => setShowAssignDialog(false)}
                acceptedTypes=".pdf,.jpg,.jpeg,.png"
                maxSize={10 * 1024 * 1024}
                showExpirationDate={false}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
