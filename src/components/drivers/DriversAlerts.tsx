
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Clock, XCircle, Eye, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface DocumentAlert {
  id: string;
  chauffeur_nom: string;
  document_nom: string;
  document_type: string;
  date_expiration: string | null;
  jours_restants: number | null;
  statut: string;
  niveau_alerte: string;
}

export const DriversAlerts = () => {
  const [alerts, setAlerts] = useState<DocumentAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadAlerts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('alertes_documents_chauffeurs_v2')
        .select('*')
        .order('jours_restants', { ascending: true, nullsLast: false });

      if (error) {
        console.error('Erreur lors du chargement des alertes:', error);
        toast({
          title: 'Erreur',
          description: 'Impossible de charger les alertes',
          variant: 'destructive'
        });
        return;
      }

      setAlerts(data || []);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAlerts();
  }, []);

  const getAlertIcon = (niveau: string) => {
    if (niveau.includes('URGENT')) return XCircle;
    if (niveau.includes('ATTENTION')) return AlertTriangle;
    return Clock;
  };

  const getAlertColor = (niveau: string) => {
    if (niveau.includes('URGENT')) return 'destructive';
    if (niveau.includes('ATTENTION')) return 'secondary';
    return 'default';
  };

  const getStatusBadge = (statut: string) => {
    switch (statut) {
      case 'expire':
        return <Badge variant="destructive">Expiré</Badge>;
      case 'a_renouveler':
        return <Badge variant="secondary">À renouveler</Badge>;
      case 'manquant':
        return <Badge variant="outline" className="border-red-500 text-red-700">Manquant</Badge>;
      default:
        return <Badge variant="default">Valide</Badge>;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="w-6 h-6 animate-spin mr-2" />
            <span>Chargement des alertes...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Alertes Documents</h2>
          <p className="text-gray-600">
            {alerts.length} alerte(s) détectée(s)
          </p>
        </div>
        <Button onClick={loadAlerts} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Actualiser
        </Button>
      </div>

      {alerts.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <AlertTriangle className="w-12 h-12 mx-auto text-green-500 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Aucune alerte
            </h3>
            <p className="text-gray-600">
              Tous les documents des chauffeurs sont conformes
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {alerts.map((alert) => {
            const AlertIcon = getAlertIcon(alert.niveau_alerte);
            return (
              <Alert key={alert.id} className="border-l-4 border-l-orange-500">
                <AlertIcon className="h-4 w-4" />
                <AlertDescription>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4 mb-2">
                        <span className="font-semibold text-gray-900">
                          {alert.chauffeur_nom}
                        </span>
                        <span className="text-gray-600">
                          {alert.document_nom}
                        </span>
                        {getStatusBadge(alert.statut)}
                      </div>
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">{alert.niveau_alerte}</span>
                        {alert.date_expiration && (
                          <span className="ml-2">
                            • Expiration: {new Date(alert.date_expiration).toLocaleDateString('fr-FR')}
                          </span>
                        )}
                        {alert.jours_restants !== null && alert.jours_restants < 999 && (
                          <span className="ml-2">
                            • {alert.jours_restants} jour(s) restant(s)
                          </span>
                        )}
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      <Eye className="w-4 h-4 mr-1" />
                      Voir chauffeur
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            );
          })}
        </div>
      )}
    </div>
  );
};
