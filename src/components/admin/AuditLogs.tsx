
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Activity, Shield, AlertTriangle } from 'lucide-react';
import { adminService } from '@/services/admin';
import type { AdminAuditLog, LoginAttempt } from '@/types/admin';

export const AuditLogs = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [emailFilter, setEmailFilter] = useState('');

  const { data: auditLogs = [], isLoading: auditLoading } = useQuery({
    queryKey: ['admin-audit-logs'],
    queryFn: () => adminService.getAuditLogs(200),
  });

  const { data: loginAttempts = [], isLoading: loginLoading } = useQuery({
    queryKey: ['login-attempts', emailFilter],
    queryFn: () => adminService.getLoginAttempts(emailFilter || undefined, 100),
  });

  const filteredAuditLogs = auditLogs.filter(log => {
    const matchesSearch = log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.target_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (log.user_id && log.user_id.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesAction = actionFilter === 'all' || log.action === actionFilter;
    
    return matchesSearch && matchesAction;
  });

  const filteredLoginAttempts = loginAttempts.filter(attempt => {
    if (!searchTerm) return true;
    return attempt.email.toLowerCase().includes(searchTerm.toLowerCase());
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
        return <Badge variant="secondary">{action}</Badge>;
    }
  };

  const getSuccessBadge = (success: boolean) => {
    return success ? (
      <Badge className="bg-green-100 text-green-700 border-green-200">Succès</Badge>
    ) : (
      <Badge className="bg-red-100 text-red-700 border-red-200">Échec</Badge>
    );
  };

  const formatDetails = (details: any): string => {
    if (!details) return 'Aucun détail';
    
    try {
      if (typeof details === 'string') {
        return details;
      }
      return JSON.stringify(details, null, 2);
    } catch {
      return 'Détails non formatables';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Audit & Journalisation</h2>
          <p className="text-gray-600 mt-1">
            Historique des actions et tentatives de connexion
          </p>
        </div>
      </div>

      <Tabs defaultValue="audit" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="audit" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Journal d'audit
          </TabsTrigger>
          <TabsTrigger value="login" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Connexions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="audit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Journal d'audit des actions</CardTitle>
              <CardDescription>
                Historique des actions effectuées par les administrateurs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Rechercher par action, type ou utilisateur..."
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
                    <SelectItem value="INSERT">Création</SelectItem>
                    <SelectItem value="UPDATE">Modification</SelectItem>
                    <SelectItem value="DELETE">Suppression</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {auditLoading ? (
                <div className="text-center py-8">Chargement des logs d'audit...</div>
              ) : (
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
                      {filteredAuditLogs.map((log) => (
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

                  {filteredAuditLogs.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      Aucun log d'audit trouvé avec les critères de recherche actuels.
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="login" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tentatives de connexion</CardTitle>
              <CardDescription>
                Historique des tentatives de connexion au système
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Rechercher par email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
                <Input
                  placeholder="Filtrer par email spécifique..."
                  value={emailFilter}
                  onChange={(e) => setEmailFilter(e.target.value)}
                  className="w-full sm:w-[250px]"
                />
              </div>

              {loginLoading ? (
                <div className="text-center py-8">Chargement des tentatives de connexion...</div>
              ) : (
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
                      {filteredLoginAttempts.map((attempt) => (
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

                  {filteredLoginAttempts.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      Aucune tentative de connexion trouvée avec les critères de recherche actuels.
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
