
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, AlertTriangle, Activity, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import type { SecurityEvent } from '@/types/admin';

export const SecurityMonitor = () => {
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [stats, setStats] = useState({
    totalEvents: 0,
    highSeverityEvents: 0,
    activeUsers: 0,
    failedLogins: 0
  });

  useEffect(() => {
    fetchSecurityEvents();
    fetchSecurityStats();
    
    const interval = setInterval(() => {
      fetchSecurityEvents();
      fetchSecurityStats();
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const fetchSecurityEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_audit_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      const formattedEvents: SecurityEvent[] = data.map(log => ({
        id: log.id,
        type: log.action as SecurityEvent['type'],
        severity: log.details?.severity || 'low',
        message: log.details?.message || `Action: ${log.action}`,
        timestamp: new Date(log.created_at).toLocaleString(),
        user_id: log.user_id || 'system',
        ip_address: log.ip_address || 'unknown'
      }));

      setEvents(formattedEvents);
    } catch (error) {
      console.error('Error fetching security events:', error);
    }
  };

  const fetchSecurityStats = async () => {
    try {
      const { data: auditData } = await supabase
        .from('admin_audit_log')
        .select('*')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      const { data: usersData } = await supabase
        .from('users')
        .select('*')
        .eq('status', 'active');

      const { data: loginData } = await supabase
        .from('login_attempts')
        .select('*')
        .eq('success', false)
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      setStats({
        totalEvents: auditData?.length || 0,
        highSeverityEvents: auditData?.filter(e => e.details?.severity === 'high').length || 0,
        activeUsers: usersData?.length || 0,
        failedLogins: loginData?.length || 0
      });
    } catch (error) {
      console.error('Error fetching security stats:', error);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Événements (24h)</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalEvents}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alertes critiques</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.highSeverityEvents}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Utilisateurs actifs</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeUsers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tentatives échouées</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.failedLogins}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Événements de sécurité récents</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {events.map((event) => (
              <Alert key={event.id}>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="flex items-center justify-between">
                  <span>{event.message}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant={getSeverityColor(event.severity)}>
                      {event.severity}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {event.timestamp}
                    </span>
                  </div>
                </AlertDescription>
              </Alert>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
