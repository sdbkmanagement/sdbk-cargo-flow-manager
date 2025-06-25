
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Activity, Eye, Search, Download } from 'lucide-react';
import { adminService } from '@/services/admin';

export const AuditLogs = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [targetFilter, setTargetFilter] = useState<string>('all');
  const [selectedLog, setSelectedLog] = useState<any>(null);

  const { data: auditLogs = [], isLoading } = useQuery({
    queryKey: ['admin-audit-logs'],
    queryFn: () => adminService.getAuditLogs(200),
  });

  const { data: loginAttempts = [] } = useQuery({
    queryKey: ['admin-login-attempts'],
    queryFn: () => adminService.getLoginAttempts(),
  });

  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch = log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (log.user_id && log.user_id.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesAction = actionFilter === 'all' || log.action === actionFilter;
    const matchesTarget = targetFilter === 'all' || log.target_type === targetFilter;
    
    return matchesSearch && matchesAction && matchesTarget;
  });

  const getActionBadge = (action: string) => {
    switch (action.toLowerCase()) {
      case 'insert':
        return <Badge className="bg-green-100 text-green-700 border-green-200">Création</Badge>;
      case 'update':
        return <Badge className="bg-blue-100 text-blue-700 border-blue-200">Modification</Badge>;
      case 'delete':
        return <Badge className="bg-red-100 text-red-700 border-red-200">Suppression</Badge>;
      default:
        return <Badge variant="outline">{action}</Badge>;
    }
  };

  const getTargetBadge = (targetType: string) => {
    const colors = {
      user: 'bg-purple-100 text-purple-700 border-purple-200',
      role_permissions: 'bg-orange-100 text-orange-700 border-orange-200',
      admin_audit_log: 'bg-gray-100 text-gray-700 border-gray-200'
    };
    const color = colors[targetType as keyof typeof colors] || 'bg-gray-100 text-gray-700 border-gray-200';
    
    return <Badge className={color}>{targetType}</Badge>;
  };

  const exportLogs = () => {
    const csvData = filteredLogs.map(log => ({
      Date: new Date(log.created_at).toLocaleString('fr-FR'),
      Action: log.action,
      Type: log.target_type,
      Utilisateur: log.user_id || 'Système',
      Details: JSON.stringify(log.details)
    }));

    const csvContent = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).map(value => `"${value}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return <div>Chargement des logs d'audit...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Statistiques de sécurité */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Actions Totales</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{auditLogs.length}</div>
            <p className="text-xs text-muted-foreground">
              Dernières 200 actions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tentatives de Connexion</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loginAttempts.length}</div>
            <p className="text-xs text-muted-foreground">
              Dernières 50 tentatives
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Connexions Échouées</CardTitle>
            <Activity className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {loginAttempts.filter(attempt => !attempt.success).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Échecs de connexion
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Journal d'audit */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Journal d'Audit</CardTitle>
              <CardDescription>
                Historique des actions administratives et modifications système
              </CardDescription>
            </div>
            <Button onClick={exportLogs} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Exporter CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filtres */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher dans les logs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Filtrer par action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les actions</SelectItem>
                <SelectItem value="INSERT">Créations</SelectItem>
                <SelectItem value="UPDATE">Modifications</SelectItem>
                <SelectItem value="DELETE">Suppressions</SelectItem>
              </SelectContent>
            </Select>
            <Select value={targetFilter} onValueChange={setTargetFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Filtrer par type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                <SelectItem value="user">Utilisateurs</SelectItem>
                <SelectItem value="role_permissions">Permissions</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tableau des logs */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date & Heure</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Type de Cible</TableHead>
                  <TableHead>Utilisateur</TableHead>
                  <TableHead>Adresse IP</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      {new Date(log.created_at).toLocaleString('fr-FR')}
                    </TableCell>
                    <TableCell>{getActionBadge(log.action)}</TableCell>
                    <TableCell>{getTargetBadge(log.target_type)}</TableCell>
                    <TableCell>
                      {log.user_id ? (
                        <code className="text-xs bg-gray-100 px-1 rounded">
                          {log.user_id.substring(0, 8)}...
                        </code>
                      ) : (
                        'Système'
                      )}
                    </TableCell>
                    <TableCell>
                      {log.ip_address || 'N/A'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => setSelectedLog(log)}
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Détails de l'Action</DialogTitle>
                            <DialogDescription>
                              Informations complètes sur l'action d'audit
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <strong>ID:</strong> {log.id}
                              </div>
                              <div>
                                <strong>Date:</strong> {new Date(log.created_at).toLocaleString('fr-FR')}
                              </div>
                              <div>
                                <strong>Action:</strong> {log.action}
                              </div>
                              <div>
                                <strong>Type:</strong> {log.target_type}
                              </div>
                              <div>
                                <strong>Utilisateur:</strong> {log.user_id || 'Système'}
                              </div>
                              <div>
                                <strong>IP:</strong> {log.ip_address || 'N/A'}
                              </div>
                            </div>
                            {log.details && (
                              <div>
                                <strong>Détails:</strong>
                                <pre className="mt-2 p-3 bg-gray-100 rounded text-xs overflow-auto max-h-60">
                                  {JSON.stringify(log.details, null, 2)}
                                </pre>
                              </div>
                            )}
                          </div>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredLogs.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Aucun log d'audit trouvé avec les critères de recherche actuels.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tentatives de connexion */}
      <Card>
        <CardHeader>
          <CardTitle>Tentatives de Connexion Récentes</CardTitle>
          <CardDescription>
            Historique des connexions réussies et échouées
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date & Heure</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Adresse IP</TableHead>
                  <TableHead>Message d'Erreur</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loginAttempts.slice(0, 10).map((attempt) => (
                  <TableRow key={attempt.id}>
                    <TableCell>
                      {new Date(attempt.created_at).toLocaleString('fr-FR')}
                    </TableCell>
                    <TableCell>{attempt.email}</TableCell>
                    <TableCell>
                      {attempt.success ? (
                        <Badge className="bg-green-100 text-green-700 border-green-200">Réussi</Badge>
                      ) : (
                        <Badge className="bg-red-100 text-red-700 border-red-200">Échec</Badge>
                      )}
                    </TableCell>
                    <TableCell>{attempt.ip_address || 'N/A'}</TableCell>
                    <TableCell>
                      {attempt.error_message && (
                        <span className="text-red-600 text-sm">{attempt.error_message}</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
