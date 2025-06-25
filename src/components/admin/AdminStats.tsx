
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, UserCheck, UserX, Shield, Activity } from 'lucide-react';
import { adminService } from '@/services/admin';
import { ROLE_LABELS } from '@/types/admin';

export const AdminStats = () => {
  const { data: userStats, isLoading } = useQuery({
    queryKey: ['admin-user-stats'],
    queryFn: () => adminService.getUserStats(),
  });

  const { data: recentLogs } = useQuery({
    queryKey: ['admin-recent-logs'],
    queryFn: () => adminService.getAuditLogs(10),
  });

  if (isLoading) {
    return <div>Chargement des statistiques...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Utilisateurs</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userStats?.total || 0}</div>
            <p className="text-xs text-muted-foreground">
              Tous les utilisateurs du système
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Utilisateurs Actifs</CardTitle>
            <UserCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{userStats?.actifs || 0}</div>
            <p className="text-xs text-muted-foreground">
              Comptes actifs et opérationnels
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Utilisateurs Inactifs</CardTitle>
            <UserX className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{userStats?.inactifs || 0}</div>
            <p className="text-xs text-muted-foreground">
              Comptes désactivés
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Comptes Suspendus</CardTitle>
            <Shield className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{userStats?.suspendus || 0}</div>
            <p className="text-xs text-muted-foreground">
              Comptes temporairement suspendus
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Répartition par Rôle</CardTitle>
            <CardDescription>
              Distribution des utilisateurs par rôle système
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {userStats?.byRole && Object.entries(userStats.byRole).map(([role, count]) => (
                <div key={role} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">
                      {ROLE_LABELS[role as keyof typeof ROLE_LABELS] || role}
                    </Badge>
                  </div>
                  <span className="font-medium">{count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Activité Récente</CardTitle>
            <CardDescription>
              Dernières actions d'administration
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentLogs?.slice(0, 5).map((log) => (
                <div key={log.id} className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2">
                    <Activity className="h-3 w-3 text-muted-foreground" />
                    <span>{log.action}</span>
                    <Badge variant="secondary" className="text-xs">
                      {log.target_type}
                    </Badge>
                  </div>
                  <span className="text-muted-foreground">
                    {new Date(log.created_at).toLocaleDateString('fr-FR')}
                  </span>
                </div>
              ))}
              {(!recentLogs || recentLogs.length === 0) && (
                <p className="text-sm text-muted-foreground">Aucune activité récente</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
