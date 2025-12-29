import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { History, User, Calendar } from 'lucide-react';
import { documentsSocieteService, DocumentSocieteVersion } from '@/services/documentsSociete';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface SocieteDocumentVersionsProps {
  documentId: string;
  onClose: () => void;
}

export const SocieteDocumentVersions: React.FC<SocieteDocumentVersionsProps> = ({
  documentId,
  onClose
}) => {
  const [versions, setVersions] = useState<DocumentSocieteVersion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadVersions();
  }, [documentId]);

  const loadVersions = async () => {
    try {
      setLoading(true);
      const data = await documentsSocieteService.getVersions(documentId);
      setVersions(data);
    } catch (error) {
      console.error('Erreur chargement versions:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Historique des versions
          </DialogTitle>
          <DialogDescription>
            Visualisez l'historique des modifications apportées à ce document
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : versions.length === 0 ? (
          <p className="text-center py-8 text-muted-foreground">
            Aucune version antérieure disponible
          </p>
        ) : (
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Version</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Modifié par</TableHead>
                  <TableHead>Motif</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {versions.map((version, index) => (
                  <TableRow key={version.id}>
                    <TableCell>
                      <Badge variant={index === 0 ? 'default' : 'secondary'}>
                        v{version.numero_version}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {format(new Date(version.date_modification), 'dd/MM/yyyy HH:mm', { locale: fr })}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        {version.modifie_par_nom || 'Inconnu'}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[200px]">
                      <span className="truncate block text-sm text-muted-foreground">
                        {version.motif_modification || '-'}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
