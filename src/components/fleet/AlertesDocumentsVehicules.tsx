
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Clock, FileText, Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { AlerteDocument } from '@/services/alertesService';

interface AlertesDocumentsVehiculesProps {
  onSelectVehicule?: (vehiculeId: string) => void;
}

export const AlertesDocumentsVehicules = ({ onSelectVehicule }: AlertesDocumentsVehiculesProps) => {
  const [alertes, setAlertes] = useState<AlerteDocument[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAlertes();
  }, []);

  const loadAlertes = async () => {
    try {
      setLoading(true);
      // Requête directe à la table documents_vehicules avec jointure
      const { data, error } = await supabase
        .from('documents_vehicules')
        .select(`
          id,
          vehicule_id,
          nom,
          type,
          date_expiration,
          statut,
          vehicules!inner(numero, immatriculation)
        `)
        .not('date_expiration', 'is', null)
        .lte('date_expiration', new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
        .order('date_expiration', { ascending: true });

      if (error) {
        console.error('Erreur lors du chargement des alertes:', error);
        setAlertes([]);
        return;
      }

      // Transformer les données pour correspondre au format attendu
      const alertesFormatted: AlerteDocument[] = (data || []).map(doc => {
        const joursRestants = Math.ceil((new Date(doc.date_expiration).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        let niveauAlerte = 'INFO';
        
        if (joursRestants < 0) {
          niveauAlerte = 'expire';
        } else if (joursRestants <= 7) {
          niveauAlerte = 'a_renouveler';
        }

        return {
          id: doc.id,
          vehicule_id: doc.vehicule_id,
          vehicule_numero: doc.vehicules?.numero || 'N/A',
          immatriculation: doc.vehicules?.immatriculation || '',
          document_nom: doc.nom,
          document_type: doc.type,
          date_expiration: doc.date_expiration,
          jours_restants: joursRestants,
          statut: doc.statut || 'valide',
          niveau_alerte: niveauAlerte
        };
      });

      setAlertes(alertesFormatted);
    } catch (error) {
      console.error('Erreur lors du chargement des alertes:', error);
      setAlertes([]);
    } finally {
      setLoading(false);
    }
  };

  const getBadgeVariant = (niveau: string) => {
    switch (niveau) {
      case 'expire':
        return 'destructive';
      case 'a_renouveler':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const getBadgeText = (niveau: string) => {
    switch (niveau) {
      case 'expire':
        return 'Expiré';
      case 'a_renouveler':
        return 'À renouveler';
      default:
        return 'Valide';
    }
  };

  const getIcon = (niveau: string) => {
    switch (niveau) {
      case 'expire':
        return <AlertTriangle className="w-4 h-4 text-destructive" />;
      case 'a_renouveler':
        return <Clock className="w-4 h-4 text-warning" />;
      default:
        return <FileText className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const formatJoursRestants = (jours: number) => {
    if (jours < 0) return `Expiré depuis ${Math.abs(jours)} jour(s)`;
    if (jours === 0) return 'Expire aujourd\'hui';
    return `Expire dans ${jours} jour(s)`;
  };

  const alertesExpires = alertes.filter(a => a.niveau_alerte === 'expire').length;

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Chargement des alertes...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2" />
            Alertes Documents Véhicules
          </div>
          <div className="flex space-x-2">
            <Badge variant="outline">{alertes.length} document(s) en anomalie</Badge>
            {alertesExpires > 0 && (
              <Badge variant="destructive">{alertesExpires} expiré(s)</Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {alertes.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Aucun document en anomalie</p>
            <p className="text-sm">Tous les documents véhicules sont à jour</p>
          </div>
        ) : (
          <div className="space-y-3">
            {alertes.map((alerte) => (
              <div key={alerte.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  {getIcon(alerte.niveau_alerte)}
                  <div>
                    <div className="font-medium">
                      {alerte.vehicule_numero} {alerte.immatriculation && `(${alerte.immatriculation})`}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {alerte.document_type} - {alerte.document_nom}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Expiration: {new Date(alerte.date_expiration).toLocaleDateString('fr-FR')}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="text-right">
                    <div className="text-sm font-medium">
                      {formatJoursRestants(alerte.jours_restants)}
                    </div>
                    <Badge variant={getBadgeVariant(alerte.niveau_alerte)}>
                      {getBadgeText(alerte.niveau_alerte)}
                    </Badge>
                  </div>
                  {onSelectVehicule && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onSelectVehicule(alerte.vehicule_id)}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Gérer
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
