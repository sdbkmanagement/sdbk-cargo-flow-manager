import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  History, 
  User, 
  FileText,
  Plus,
  Pencil,
  Trash2,
  Eye
} from 'lucide-react';
import { documentsSocieteService, DocumentSocieteAudit } from '@/services/documentsSociete';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export const SocieteAuditLog: React.FC = () => {
  const [logs, setLogs] = useState<DocumentSocieteAudit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const data = await documentsSocieteService.getAuditLogs();
      setLogs(data);
    } catch (error) {
      console.error('Erreur chargement logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActionBadge = (action: string) => {
    const actionConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ReactNode }> = {
      creation: { label: 'Création', variant: 'default', icon: <Plus className="h-3 w-3" /> },
      modification: { label: 'Modification', variant: 'secondary', icon: <Pencil className="h-3 w-3" /> },
      suppression: { label: 'Suppression', variant: 'destructive', icon: <Trash2 className="h-3 w-3" /> },
      consultation: { label: 'Consultation', variant: 'outline', icon: <Eye className="h-3 w-3" /> }
    };

    const config = actionConfig[action] || { label: action, variant: 'outline' as const, icon: null };

    return (
      <Badge variant={config.variant} className="flex items-center gap-1 w-fit">
        {config.icon}
        {config.label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardContent className="p-6">
          <div className="h-64 bg-muted rounded"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Journal d'audit
        </CardTitle>
        <CardDescription>
          Historique de toutes les actions effectuées sur les documents
        </CardDescription>
      </CardHeader>
      <CardContent>
        {logs.length === 0 ? (
          <p className="text-center py-8 text-muted-foreground">
            Aucune action enregistrée
          </p>
        ) : (
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date & Heure</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead className="hidden md:table-cell">Document</TableHead>
                  <TableHead className="hidden lg:table-cell">Utilisateur</TableHead>
                  <TableHead className="hidden xl:table-cell">Détails</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map(log => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {format(new Date(log.created_at), 'dd/MM/yyyy', { locale: fr })}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(log.created_at), 'HH:mm:ss', { locale: fr })}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getActionBadge(log.action)}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="truncate max-w-[200px]">
                          {log.details?.nom || '-'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span>{log.utilisateur_nom || 'Système'}</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden xl:table-cell">
                      <span className="text-sm text-muted-foreground truncate max-w-[200px] block">
                        {log.details?.motif || '-'}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
