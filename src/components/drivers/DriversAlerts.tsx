
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Clock, XCircle, Eye, RefreshCw, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { CHAUFFEUR_DOCUMENT_TYPES } from '@/types/chauffeur';

interface DocumentAlert {
  id: string;
  chauffeur_nom: string;
  document_nom: string;
  document_type: string;
  date_expiration: string | null;
  jours_restants: number | null;
  statut: string;
  niveau_alerte: string;
  chauffeur_id?: string;
}

export const DriversAlerts = () => {
  const [alerts, setAlerts] = useState<DocumentAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadAlerts = async () => {
    try {
      setLoading(true);
      
      // Récupérer les documents avec alertes depuis la vue
      const { data, error } = await supabase
        .from('alertes_documents_chauffeurs')
        .select('*')
        .order('jours_restants', { ascending: true, nullsLast: true });

      if (error) {
        console.error('Erreur lors du chargement des alertes:', error);
        toast({
          title: 'Erreur',
          description: 'Impossible de charger les alertes',
          variant: 'destructive'
        });
        return;
      }

      // Transformer les données
      const alertsData = data?.map(alert => ({
        id: alert.id || '',
        chauffeur_nom: alert.chauffeur_nom || 'Chauffeur inconnu',
        document_nom: alert.document_nom || '',
        document_type: alert.document_type || '',
        date_expiration: alert.date_expiration,
        jours_restants: alert.jours_restants,
        statut: alert.statut || 'inconnu',
        niveau_alerte: alert.niveau_alerte || 'INFO',
        chauffeur_id: alert.chauffeur_id
      })) || [];

      // Filtrer pour ne garder que les alertes pertinentes (moins de 30 jours ou expirés)
      const filteredAlerts = alertsData.filter(alert => 
        alert.jours_restants !== null && alert.jours_restants <= 30
      );

      setAlerts(filteredAlerts);
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

  const getDocumentLabel = (documentType: string) => {
    const config = CHAUFFEUR_DOCUMENT_TYPES[documentType as keyof typeof CHAUFFEUR_DOCUMENT_TYPES];
    return config ? config.label : documentType;
  };

  const getNiveauAlerte = (joursRestants: number | null) => {
    if (joursRestants === null) return 'INFO';
    if (joursRestants < 0) return 'URGENT - EXPIRÉ';
    if (joursRestants <= 7) return 'URGENT';
    if (joursRestants <= 30) return 'ATTENTION';
    return 'INFO';
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
          <h2 className="text-2xl font-bold text-gray-900">Alertes Documents Chauffeurs</h2>
          <p className="text-gray-600">
            {alerts.length} alerte(s) détectée(s)
          </p>
        </div>
        <Button onClick={loadAlerts} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Actualiser
        </Button>
      </div>

      {/* Résumé des alertes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Documents expirés</p>
                <p className="text-2xl font-bold text-red-600">
                  {alerts.filter(a => a.jours_restants !== null && a.jours_restants < 0).length}
                </p>
              </div>
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Expire sous 7 jours</p>
                <p className="text-2xl font-bold text-orange-600">
                  {alerts.filter(a => a.jours_restants !== null && a.jours_restants >= 0 && a.jours_restants <= 7).length}
                </p>
              </div>
              <AlertTriangle className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Expire sous 30 jours</p>
                <p className="text-2xl font-bold text-blue-600">
                  {alerts.filter(a => a.jours_restants !== null && a.jours_restants > 7 && a.jours_restants <= 30).length}
                </p>
              </div>
              <Clock className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
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
            const niveauCalcule = getNiveauAlerte(alert.jours_restants);
            
            return (
              <Alert key={alert.id} className={`border-l-4 ${
                alert.jours_restants !== null && alert.jours_restants < 0 
                  ? 'border-l-red-500' 
                  : alert.jours_restants !== null && alert.jours_restants <= 7
                  ? 'border-l-orange-500'
                  : 'border-l-blue-500'
              }`}>
                <AlertIcon className="h-4 w-4" />
                <AlertDescription>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4 mb-2">
                        <div className="flex items-center space-x-2">
                          <User className="w-4 h-4" />
                          <span className="font-semibold text-gray-900">
                            {alert.chauffeur_nom}
                          </span>
                        </div>
                        <span className="text-gray-600">
                          {getDocumentLabel(alert.document_type)}
                        </span>
                        {getStatusBadge(alert.statut)}
                      </div>
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">{niveauCalcule}</span>
                        {alert.date_expiration && (
                          <span className="ml-2">
                            • Expiration: {new Date(alert.date_expiration).toLocaleDateString('fr-FR')}
                          </span>
                        )}
                        {alert.jours_restants !== null && (
                          <span className="ml-2">
                            • {alert.jours_restants < 0 
                              ? `Expiré depuis ${Math.abs(alert.jours_restants)} jour(s)`
                              : `${alert.jours_restants} jour(s) restant(s)`
                            }
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
