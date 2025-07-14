
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Activity, Shield } from 'lucide-react';
import { auditService } from '@/services/admin/auditService';
import type { AdminAuditLog, LoginAttempt } from '@/types/admin';
import { AuditFilters } from './audit/AuditFilters';
import { AuditLogTable } from './audit/AuditLogTable';
import { LoginAttemptsTable } from './audit/LoginAttemptsTable';

export const AuditLogs = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [emailFilter, setEmailFilter] = useState('');

  const { data: auditLogs = [], isLoading: auditLoading } = useQuery({
    queryKey: ['admin-audit-logs'],
    queryFn: () => auditService.getAuditLogs(200),
    refetchOnWindowFocus: false,
  });

  const { data: loginAttempts = [], isLoading: loginLoading } = useQuery({
    queryKey: ['login-attempts', emailFilter],
    queryFn: () => auditService.getLoginAttempts(emailFilter || undefined, 100),
    refetchOnWindowFocus: false,
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
              <AuditFilters
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                actionFilter={actionFilter}
                onActionFilterChange={setActionFilter}
              />
              <AuditLogTable logs={filteredAuditLogs} isLoading={auditLoading} />
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
              <AuditFilters
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                actionFilter=""
                onActionFilterChange={() => {}}
                emailFilter={emailFilter}
                onEmailFilterChange={setEmailFilter}
                showEmailFilter={true}
              />
              <LoginAttemptsTable attempts={filteredLoginAttempts} isLoading={loginLoading} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
