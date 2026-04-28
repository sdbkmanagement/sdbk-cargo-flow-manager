import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Archive, ExternalLink, RotateCcw, Trash2 } from 'lucide-react';
import { documentsSocieteService, DocumentSociete } from '@/services/documentsSociete';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
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

interface Props {
  onRefresh?: () => void;
}

export const SocieteArchivesList: React.FC<Props> = ({ onRefresh }) => {
  const [documents, setDocuments] = useState<DocumentSociete[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [docToDelete, setDocToDelete] = useState<DocumentSociete | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await documentsSocieteService.getDocuments({ statut: 'archive' });
      setDocuments(data);
    } catch (error) {
      console.error('Erreur chargement archives:', error);
      toast({ title: 'Erreur', description: 'Impossible de charger les archives', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleRestore = async (doc: DocumentSociete) => {
    try {
      await documentsSocieteService.updateDocument(doc.id, { statut: 'valide' }, undefined, 'Restauration depuis archives');
      toast({ title: 'Document restauré', description: 'Le document est de nouveau actif' });
      loadData();
      onRefresh?.();
    } catch (error: any) {
      toast({ title: 'Erreur', description: error?.message || 'Restauration impossible', variant: 'destructive' });
    }
  };

  const handleDelete = async () => {
    if (!docToDelete) return;
    try {
      await documentsSocieteService.deleteDocument(docToDelete.id);
      toast({ title: 'Archive supprimée', description: 'Le document archivé a été supprimé définitivement' });
      loadData();
      onRefresh?.();
    } catch (error: any) {
      toast({ title: 'Erreur', description: error?.message || 'Suppression impossible', variant: 'destructive' });
    } finally {
      setDocToDelete(null);
    }
  };

  const filtered = documents.filter(d =>
    d.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.type_document.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Archive className="h-5 w-5" />
            Documents Archivés ({documents.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Rechercher dans les archives..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Document</TableHead>
                  <TableHead className="hidden md:table-cell">Catégorie</TableHead>
                  <TableHead>Date expiration</TableHead>
                  <TableHead className="hidden lg:table-cell">Archivé le</TableHead>
                  <TableHead className="hidden md:table-cell">Fichiers</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Aucun document archivé
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map(doc => (
                    <TableRow key={doc.id} className="bg-muted/30">
                      <TableCell>
                        <div>
                          <p className="font-medium">{doc.nom}</p>
                          <p className="text-sm text-muted-foreground">{doc.type_document}</p>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge variant="outline" style={{ borderColor: doc.categorie?.couleur, color: doc.categorie?.couleur }}>
                          {doc.categorie?.nom || 'Non classé'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {doc.date_expiration ? format(new Date(doc.date_expiration), 'dd/MM/yyyy', { locale: fr }) : '-'}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {format(new Date(doc.updated_at), 'dd/MM/yyyy', { locale: fr })}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">{doc.fichiers?.length || 0} fichier(s)</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {doc.fichiers && doc.fichiers.length > 0 && (
                            <Button variant="ghost" size="icon" onClick={() => window.open(doc.fichiers![0].url, '_blank')} title="Voir le fichier">
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" onClick={() => handleRestore(doc)} title="Restaurer">
                            <RotateCcw className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDocToDelete(doc)}
                            title="Supprimer définitivement"
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

      <AlertDialog open={!!docToDelete} onOpenChange={(o) => !o && setDocToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer définitivement ?</AlertDialogTitle>
            <AlertDialogDescription>
              Le document archivé "{docToDelete?.nom}" et ses fichiers seront supprimés définitivement.
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
    </>
  );
};
