
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface SecurityEvent {
  id: string;
  type: 'login_attempt' | 'failed_login' | 'user_created' | 'permission_change';
  severity: 'low' | 'medium' | 'high';
  message: string;
  timestamp: string;
  user_id?: string;
  ip_address?: string;
}

export const SecurityMonitor: React.FC = () => {
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalAttempts: 0,
    failedAttempts: 0,
    successRate: 0
  });

  useEffect(() => {
    loadSecurityEvents();
    loadSecurityStats();
  }, []);

  const loadSecurityEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_audit_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      const mappedEvents: SecurityEvent[] = (data || []).map(log => ({
        id: log.id,
        type: log.action.includes('login') ? 'login_attempt' : 'user_created',
        severity: log.action.includes('failed') ? 'high' : 'low',
        message: `${log.action} - ${log.target_type}`,
        timestamp: log.created_at,
        user_id: log.user_id,
        ip_address: log.ip_address
      }));

      setEvents(mappedEvents);
    } catch (error) {
      console.error('Failed to load security events:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSecurityStats = async () => {
    try {
      const { data, error } = await supabase
        .from('login_attempts')
        .select('success, created_at')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      if (error) throw error;

      const total = data?.length || 0;
      const failed = data?.filter(attempt => !attempt.success).length || 0;
      const success = total - failed;

      setStats({
        totalAttempts: total,
        failedAttempts: failed,
        successRate: total > 0 ? (success / total) * 100 : 0
      });
    } catch (error) {
      console.error('Failed to load security stats:', error);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-green-100 text-green-800 border-green-200';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'high': return <XCircle className="h-4 w-4" />;
      case 'medium': return <AlertTriangle className="h-4 w-4" />;
      default: return <CheckCircle className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading security monitor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Security Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Attempts (24h)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAttempts}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Failed Attempts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.failedAttempts}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.successRate.toFixed(1)}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Security Events */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Shield className="h-5 w-5 text-blue-600" />
            <CardTitle>Security Events</CardTitle>
          </div>
          <CardDescription>
            Recent security events and authentication attempts
          </CardDescription>
        </CardHeader>
        <CardContent>
          {events.length === 0 ? (
            <p className="text-center py-8 text-gray-500">No security events to display</p>
          ) : (
            <div className="space-y-3">
              {events.map(event => (
                <div key={event.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Badge className={getSeverityColor(event.severity)}>
                      {getSeverityIcon(event.severity)}
                      <span className="ml-1 capitalize">{event.severity}</span>
                    </Badge>
                    <div>
                      <p className="font-medium">{event.message}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(event.timestamp).toLocaleString()}
                        {event.ip_address && ` • IP: ${event.ip_address}`}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Security Alerts */}
      {stats.failedAttempts > 10 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            High number of failed login attempts detected in the last 24 hours. 
            Consider reviewing security logs and implementing additional protection measures.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};
