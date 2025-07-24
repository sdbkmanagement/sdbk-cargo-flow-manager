
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, AlertTriangle, Users, Activity, Eye, Search, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface SecurityEvent {
  id: string;
  user_id: string;
  event_type: string;
  event_details: any;
  ip_address: string | null;
  user_agent: string;
  created_at: string;
}

interface SecurityStats {
  total_events: number;
  failed_logins: number;
  successful_logins: number;
  active_sessions: number;
  suspicious_activities: number;
}

export const SecurityDashboard: React.FC = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [stats, setStats] = useState<SecurityStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [eventTypeFilter, setEventTypeFilter] = useState('all');
  const [dateRange, setDateRange] = useState('24h');

  useEffect(() => {
    if (user?.roles?.includes('admin')) {
      fetchSecurityData();
    }
  }, [user]);

  const fetchSecurityData = async () => {
    try {
      setLoading(true);
      
      // Fetch security events
      const { data: eventsData, error: eventsError } = await supabase
        .from('security_audit_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (eventsError) {
        console.error('Error fetching security events:', eventsError);
        toast.error('Erreur lors du chargement des événements de sécurité');
        return;
      }

      // Transform the data to match our interface
      const transformedEvents: SecurityEvent[] = (eventsData || []).map(event => ({
        id: event.id,
        user_id: event.user_id || '',
        event_type: event.event_type,
        event_details: event.event_details,
        ip_address: event.ip_address ? String(event.ip_address) : null,
        user_agent: event.user_agent || '',
        created_at: event.created_at
      }));

      setEvents(transformedEvents);

      // Calculate stats
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      
      const recentEvents = transformedEvents.filter(event => 
        new Date(event.created_at) > yesterday
      );

      const securityStats: SecurityStats = {
        total_events: recentEvents.length,
        failed_logins: recentEvents.filter(e => e.event_type === 'login_failed').length,
        successful_logins: recentEvents.filter(e => e.event_type === 'login_success').length,
        active_sessions: recentEvents.filter(e => e.event_type === 'session_start').length,
        suspicious_activities: recentEvents.filter(e => 
          e.event_type.includes('failed') || e.event_type.includes('unauthorized')
        ).length
      };

      setStats(securityStats);
    } catch (error) {
      console.error('Error fetching security data:', error);
      toast.error('Erreur lors du chargement des données de sécurité');
    } finally {
      setLoading(false);
    }
  };

  const getEventTypeColor = (eventType: string) => {
    if (eventType.includes('failed') || eventType.includes('unauthorized')) {
      return 'destructive';
    }
    if (eventType.includes('success') || eventType.includes('login')) {
      return 'default';
    }
    return 'secondary';
  };

  const getEventTypeIcon = (eventType: string) => {
    if (eventType.includes('failed')) {
      return <AlertTriangle className="h-4 w-4" />;
    }
    if (eventType.includes('login')) {
      return <Users className="h-4 w-4" />;
    }
    return <Activity className="h-4 w-4" />;
  };

  const filteredEvents = events.filter(event => {
    const matchesSearch = searchTerm === '' || 
      event.event_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.user_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      JSON.stringify(event.event_details).toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = eventTypeFilter === 'all' || event.event_type === eventTypeFilter;
    
    return matchesSearch && matchesType;
  });

  const formatEventDetails = (details: any): string => {
    if (!details) return 'Aucun détail';
    
    if (typeof details === 'string') return details;
    
    try {
      // Handle different event detail structures
      if (details.email) return `Email: ${details.email}`;
      if (details.user_email) return `Utilisateur: ${details.user_email}`;
      if (details.error) return `Erreur: ${details.error}`;
      
      return JSON.stringify(details, null, 2);
    } catch (error) {
      return 'Erreur lors du formatage des détails';
    }
  };

  if (!user?.roles?.includes('admin')) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Accès refusé. Seuls les administrateurs peuvent voir le tableau de bord de sécurité.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="h-6 w-6 text-blue-600" />
          <h1 className="text-2xl font-bold">Tableau de Bord Sécurité</h1>
        </div>
        <Button onClick={fetchSecurityData} disabled={loading}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualiser
        </Button>
      </div>

      {/* Security Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Événements (24h)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_events}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Connexions réussies</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.successful_logins}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Connexions échouées</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.failed_logins}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Activités suspectes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats.suspicious_activities}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Security Events */}
      <Card>
        <CardHeader>
          <CardTitle>Événements de Sécurité</CardTitle>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              <Input
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:w-64"
              />
            </div>
            <Select value={eventTypeFilter} onValueChange={setEventTypeFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Type d'événement" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                <SelectItem value="login_success">Connexions réussies</SelectItem>
                <SelectItem value="login_failed">Connexions échouées</SelectItem>
                <SelectItem value="logout">Déconnexions</SelectItem>
                <SelectItem value="session_start">Démarrage de session</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-8">Chargement...</div>
            ) : filteredEvents.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Aucun événement trouvé
              </div>
            ) : (
              filteredEvents.map((event) => (
                <div key={event.id} className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getEventTypeIcon(event.event_type)}
                      <Badge variant={getEventTypeColor(event.event_type)}>
                        {event.event_type}
                      </Badge>
                    </div>
                    <span className="text-sm text-gray-500">
                      {new Date(event.created_at).toLocaleString()}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <strong>Utilisateur:</strong> {event.user_id || 'Anonyme'}
                    </div>
                    <div>
                      <strong>IP:</strong> {event.ip_address || 'Non disponible'}
                    </div>
                  </div>
                  
                  <div className="text-sm">
                    <strong>Détails:</strong>
                    <pre className="mt-1 p-2 bg-gray-100 rounded text-xs overflow-x-auto">
                      {formatEventDetails(event.event_details)}
                    </pre>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
