import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Search, 
  Filter, 
  Eye, 
  Pencil, 
  Trash2, 
  FileText, 
  Download,
  ExternalLink,
  History
} from 'lucide-react';
import { documentsSocieteService, DocumentSociete, DocumentSocieteCategorie } from '@/services/documentsSociete';
import { toast } from '@/hooks/use-toast';
import { format, differenceInDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { SocieteDocumentVersions } from './SocieteDocumentVersions';

interface SocieteDocumentsListProps {
  onEdit: (documentId: string) => void;
  onRefresh: () => void;
}

export const SocieteDocumentsList: React.FC<SocieteDocumentsListProps> = ({ onEdit, onRefresh }) => {
  const [documents, setDocuments] = useState<DocumentSociete[]>([]);
  const [categories, setCategories] = useState<DocumentSocieteCategorie[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categorieFilter, setCategorieFilter] = useState<string>('all');
  const [statutFilter, setStatutFilter] = useState<string>('all');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<DocumentSociete | null>(null);
  const [versionsDialogOpen, setVersionsDialogOpen] = useState(false);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [docsData, catsData] = await Promise.all([
        documentsSocieteService.getDocuments(),
        documentsSocieteService.getCategories()
      ]);
      setDocuments(docsData);
      setCategories(catsData);
    } catch (error) {
      console.error('Erreur chargement documents:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les documents',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!documentToDelete) return;

    try {
      await documentsSocieteService.deleteDocument(documentToDelete.id);
      toast({
        title: 'Document supprimé',
        description: 'Le document a été supprimé avec succès'
      });
      loadData();
      onRefresh();
    } catch (error) {
      console.error('Erreur suppression:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer le document',
        variant: 'destructive'
      });
    } finally {
      setDeleteDialogOpen(false);
      setDocumentToDelete(null);
    }
  };

  const getStatutBadge = (doc: DocumentSociete) => {
    if (!doc.date_expiration) {
      return <Badge variant="outline">Permanent</Badge>;
    }

    const jours = differenceInDays(new Date(doc.date_expiration), new Date());

    if (jours < 0) {
      return <Badge variant="destructive">Expiré</Badge>;
    } else if (jours <= 7) {
      return <Badge className="bg-red-500 text-white">Expire dans {jours}j</Badge>;
    } else if (jours <= 15) {
      return <Badge className="bg-orange-500 text-white">Expire dans {jours}j</Badge>;
    } else if (jours <= 30) {
      return <Badge className="bg-amber-500 text-white">Expire dans {jours}j</Badge>;
    } else {
      return <Badge className="bg-green-500 text-white">Valide</Badge>;
    }
  };

  const filteredDocuments = documents.filter(doc => {
    const matchSearch = doc.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        doc.type_document.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCategorie = categorieFilter === 'all' || doc.categorie_id === categorieFilter;
    const matchStatut = statutFilter === 'all' || doc.statut === statutFilter;
    return matchSearch && matchCategorie && matchStatut;
  });

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Documents de la Société
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filtres */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Rechercher un document..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={categorieFilter} onValueChange={setCategorieFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Catégorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes catégories</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat.id} value={cat.id}>{cat.nom}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statutFilter} onValueChange={setStatutFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous statuts</SelectItem>
                <SelectItem value="valide">Valide</SelectItem>
                <SelectItem value="expire">Expiré</SelectItem>
                <SelectItem value="en_renouvellement">En renouvellement</SelectItem>
                <SelectItem value="archive">Archivé</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Document</TableHead>
                  <TableHead className="hidden md:table-cell">Catégorie</TableHead>
                  <TableHead className="hidden lg:table-cell">Date création</TableHead>
                  <TableHead>Expiration</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="hidden md:table-cell">Fichiers</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDocuments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Aucun document trouvé
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredDocuments.map(doc => (
                    <TableRow key={doc.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{doc.nom}</p>
                          <p className="text-sm text-muted-foreground">{doc.type_document}</p>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge 
                          variant="outline" 
                          style={{ 
                            borderColor: doc.categorie?.couleur || '#6b7280',
                            color: doc.categorie?.couleur || '#6b7280'
                          }}
                        >
                          {doc.categorie?.nom || 'Non classé'}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {format(new Date(doc.date_creation), 'dd/MM/yyyy', { locale: fr })}
                      </TableCell>
                      <TableCell>
                        {doc.date_expiration 
                          ? format(new Date(doc.date_expiration), 'dd/MM/yyyy', { locale: fr })
                          : '-'
                        }
                      </TableCell>
                      <TableCell>{getStatutBadge(doc)}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        {doc.fichiers?.length || 0} fichier(s)
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {doc.fichiers && doc.fichiers.length > 0 && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => window.open(doc.fichiers![0].url, '_blank')}
                              title="Voir le fichier"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedDocumentId(doc.id);
                              setVersionsDialogOpen(true);
                            }}
                            title="Historique des versions"
                          >
                            <History className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onEdit(doc.id)}
                            title="Modifier"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setDocumentToDelete(doc);
                              setDeleteDialogOpen(true);
                            }}
                            title="Supprimer"
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer le document "{documentToDelete?.nom}" ?
              Cette action est irréversible et supprimera également tous les fichiers associés.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Versions Dialog */}
      {versionsDialogOpen && selectedDocumentId && (
        <SocieteDocumentVersions 
          documentId={selectedDocumentId}
          onClose={() => {
            setVersionsDialogOpen(false);
            setSelectedDocumentId(null);
          }}
        />
      )}
    </>
  );
};
