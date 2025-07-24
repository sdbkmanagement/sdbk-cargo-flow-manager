
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Shield, AlertTriangle, Activity, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useSecureAuthContext } from '@/contexts/SecureAuthContext';

export const SecurityDashboard = () => {
  const [eventFilter, setEventFilter] = useState<string>('all');
  const { validateSecureAction } = useSecureAuthContext();

  const { data: securityLogs, isLoading: logsLoading, refetch } = useQuery({
    queryKey: ['security-logs', eventFilter],
    queryFn: async () => {
      const hasPermission = await validateSecureAction('view_security_logs');
      if (!hasPermission) {
        throw new Error('Accès non autorisé');
      }

      let query = supabase
        .from('security_audit_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (eventFilter !== 'all') {
        query = query.eq('event_type', eventFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    staleTime: 30000,
  });

  const { data: securityStats } = useQuery({
    queryKey: ['security-stats'],
    queryFn: async () => {
      const hasPermission = await validateSecureAction('view_security_stats');
      if (!hasPermission) {
        throw new Error('Accès non autorisé');
      }

      const { data, error } = await supabase
        .from('security_audit_log')
        .select('event_type, created_at')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      if (error) throw error;

      const stats = {
        total: data.length,
        loginAttempts: data.filter(log => log.event_type === 'user_login').length,
        failedLogins: data.filter(log => log.event_type === 'login_failed').length,
        unauthorizedAccess: data.filter(log => log.event_type === 'unauthorized_access_attempt').length,
        adminActions: data.filter(log => log.event_type === 'admin_action').length,
      };

      return stats;
    },
    staleTime: 60000,
  });

  const getEventBadge = (eventType: string) => {
    switch (eventType) {
      case 'user_login':
        return <Badge className="bg-green-100 text-green-700">Connexion</Badge>;
      case 'user_logout':
        return <Badge className="bg-blue-100 text-blue-700">Déconnexion</Badge>;
      case 'admin_action':
        return <Badge className="bg-purple-100 text-purple-700">Action Admin</Badge>;
      case 'unauthorized_access_attempt':
        return <Badge className="bg-red-100 text-red-700">Accès Refusé</Badge>;
      case 'login_failed':
        return <Badge className="bg-orange-100 text-orange-700">Échec Connexion</Badge>;
      default:
        return <Badge variant="outline">{eventType}</Badge>;
    }
  };

  const formatDetails = (details: any) => {
    if (!details) return 'N/A';
    
    try {
      return JSON.stringify(details, null, 2);
    } catch {
      return String(details);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6 text-orange-500" />
            Tableau de Bord Sécurité
          </h2>
          <p className="text-gray-600">Monitoring et audit de sécurité</p>
        </div>
        <Button onClick={() => refetch()} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualiser
        </Button>
      </div>

      {/* Security Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Événements (24h)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {securityStats?.total || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Connexions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {securityStats?.loginAttempts || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Échecs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {securityStats?.failedLogins || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Accès Refusés</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {securityStats?.unauthorizedAccess || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Actions Admin</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {securityStats?.adminActions || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Security Events Log */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Journal des Événements de Sécurité
          </CardTitle>
          <CardDescription>
            Historique des événements de sécurité système
          </CardDescription>
          <div className="flex items-center gap-4">
            <Select value={eventFilter} onValueChange={setEventFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrer par type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les événements</SelectItem>
                <SelectItem value="user_login">Connexions</SelectItem>
                <SelectItem value="user_logout">Déconnexions</SelectItem>
                <SelectItem value="admin_action">Actions Admin</SelectItem>
                <SelectItem value="unauthorized_access_attempt">Accès Refusés</SelectItem>
                <SelectItem value="login_failed">Échecs de Connexion</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {logsLoading ? (
            <div className="text-center py-8">Chargement des logs de sécurité...</div>
          ) : (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Utilisateur</TableHead>
                    <TableHead>IP</TableHead>
                    <TableHead>Détails</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {securityLogs?.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        <div className="text-sm">
                          {new Date(log.created_at).toLocaleDateString('fr-FR')}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(log.created_at).toLocaleTimeString('fr-FR')}
                        </div>
                      </TableCell>
                      <TableCell>{getEventBadge(log.event_type)}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {log.user_id || 'Système'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-500">
                          {log.ip_address || 'N/A'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs truncate text-sm">
                          {formatDetails(log.event_details)}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {securityLogs?.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  Aucun événement de sécurité trouvé.
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
