
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getSuccessBadge } from './auditUtils';
import type { LoginAttempt } from '@/types/admin';

interface LoginAttemptsTableProps {
  attempts: LoginAttempt[];
  isLoading: boolean;
}

export const LoginAttemptsTable = ({ attempts, isLoading }: LoginAttemptsTableProps) => {
  if (isLoading) {
    return <div className="text-center py-8">Chargement des tentatives de connexion...</div>;
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead>IP</TableHead>
            <TableHead>Erreur</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {attempts.map((attempt) => (
            <TableRow key={attempt.id}>
              <TableCell>
                <div className="text-sm">
                  {new Date(attempt.created_at).toLocaleDateString('fr-FR')}
                </div>
                <div className="text-xs text-muted-foreground">
                  {new Date(attempt.created_at).toLocaleTimeString('fr-FR')}
                </div>
              </TableCell>
              <TableCell>{attempt.email}</TableCell>
              <TableCell>{getSuccessBadge(attempt.success)}</TableCell>
              <TableCell>
                <div className="text-sm text-muted-foreground">
                  {attempt.ip_address || 'N/A'}
                </div>
              </TableCell>
              <TableCell>
                <div className="max-w-xs truncate text-sm text-red-600">
                  {attempt.error_message || 'Aucune erreur'}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {attempts.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          Aucune tentative de connexion trouvée avec les critères de recherche actuels.
        </div>
      )}
    </div>
  );
};
