
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { getActionBadge, formatDetails } from './auditUtils';
import type { AdminAuditLog } from '@/types/admin';

interface AuditLogTableProps {
  logs: AdminAuditLog[];
  isLoading: boolean;
}

export const AuditLogTable = ({ logs, isLoading }: AuditLogTableProps) => {
  if (isLoading) {
    return <div className="text-center py-8">Chargement des logs d'audit...</div>;
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Action</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Utilisateur</TableHead>
            <TableHead>IP</TableHead>
            <TableHead>Détails</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.map((log) => (
            <TableRow key={log.id}>
              <TableCell>
                <div className="text-sm">
                  {new Date(log.created_at).toLocaleDateString('fr-FR')}
                </div>
                <div className="text-xs text-muted-foreground">
                  {new Date(log.created_at).toLocaleTimeString('fr-FR')}
                </div>
              </TableCell>
              <TableCell>{getActionBadge(log.action)}</TableCell>
              <TableCell>
                <Badge variant="outline">{log.target_type}</Badge>
              </TableCell>
              <TableCell>
                <div className="text-sm">
                  {log.user_id || 'Système'}
                </div>
              </TableCell>
              <TableCell>
                <div className="text-sm text-muted-foreground">
                  {log.ip_address || 'N/A'}
                </div>
              </TableCell>
              <TableCell>
                <div className="max-w-xs truncate text-sm">
                  {formatDetails(log.details)}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {logs.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          Aucun log d'audit trouvé avec les critères de recherche actuels.
        </div>
      )}
    </div>
  );
};
