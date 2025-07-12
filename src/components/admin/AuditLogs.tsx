
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { adminService } from '@/services/admin';
import { Activity, User, Calendar } from 'lucide-react';

export const AuditLogs = () => {
  const [logType, setLogType] = useState<string>('user_logs');

  const { data: userLogs = [], isLoading: userLogsLoading } = useQuery({
    queryKey: ['user-audit-logs'],
    queryFn: () => adminService.getUserAuditLogs(100),
  });

  const { data: userSessions = [], isLoading: sessionsLoading } = useQuery({
    queryKey: ['user-sessions'],
    queryFn: () => adminService.getUserSessions(50),
  });

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'CREATE_USER':
        return <Badge className="bg-green-100 text-green-700">Créer</Badge>;
      case 'UPDATE_USER':
        return <Badge className="bg-blue-100 text-blue-700">Modifier</Badge>;
      case 'DELETE_USER':
        return <Badge className="bg-red-100 text-red-700">Supprimer</Badge>;
      default:
        return <Badge variant="outline">{action}</Badge>;
    }
  };

  if (userLogsLoading || sessionsLoading) {
    return <div>Chargement des journaux d'audit...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Journaux d'audit système
              </CardTitle>
              <CardDescription>
                Historique des actions et connexions des utilisateurs
              </CardDescription>
            </div>
            <Select value={logType} onValueChange={setLogType}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user_logs">Actions utilisateurs</SelectItem>
                <SelectItem value="user_sessions">Sessions utilisateurs</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {logType === 'user_logs' && (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Action</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Utilisateur</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Détails</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {userLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>{getActionBadge(log.action)}</TableCell>
                      <TableCell>{log.target_type}</TableCell>
                      <TableCell>
                        {log.user_id ? (
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            <span className="text-sm">{log.user_id}</span>
                          </div>
                        ) : (
                          <span className="text-gray-500">Système</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span className="text-sm">
                            {new Date(log.created_at).toLocaleDateString('fr-FR', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-gray-600">
                          Target: {log.target_id || 'N/A'}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {logType === 'user_sessions' && (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Utilisateur</TableHead>
                    <TableHead>Adresse IP</TableHead>
                    <TableHead>Navigateur</TableHead>
                    <TableHead>Connexion</TableHead>
                    <TableHead>Expiration</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {userSessions.map((session) => (
                    <TableRow key={session.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          <span className="text-sm">{session.user_id}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{session.ip_address || 'Non disponible'}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-gray-600 max-w-[200px] truncate block">
                          {session.user_agent || 'Non disponible'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {new Date(session.created_at).toLocaleDateString('fr-FR', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {new Date(session.expires_at).toLocaleDateString('fr-FR', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {((logType === 'user_logs' && userLogs.length === 0) || 
            (logType === 'user_sessions' && userSessions.length === 0)) && (
            <div className="text-center py-8 text-gray-500">
              Aucun journal d'audit trouvé.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
