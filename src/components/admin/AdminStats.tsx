
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, UserCheck, UserX, Activity } from 'lucide-react';
import { adminService } from '@/services/admin';

export const AdminStats = () => {
  const { data: userStats } = useQuery({
    queryKey: ['user-stats'],
    queryFn: () => adminService.getUserStats(),
  });

  const { data: auditLogs } = useQuery({
    queryKey: ['recent-audit-logs'],
    queryFn: () => adminService.getUserAuditLogs(10),
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Utilisateurs</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{userStats?.total || 0}</div>
          <p className="text-xs text-muted-foreground">
            Comptes créés dans le système
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
          <CardTitle className="text-sm font-medium">Activité Récente</CardTitle>
          <Activity className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{auditLogs?.length || 0}</div>
          <p className="text-xs text-muted-foreground">
            Actions dans les 24h
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
