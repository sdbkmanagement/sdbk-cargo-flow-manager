import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Clock, FileText, User, Truck } from 'lucide-react';
import { documentService } from '@/services/documentService';

interface AlerteDocument {
  id: string;
  niveau_alerte: 'expire' | 'a_renouveler' | 'valide';
  document_nom: string;
  document_type: string;
  date_expiration: string;
  jours_restants: number;
  // Pour véhicules
  vehicule_numero?: string;
  vehicule_id?: string;
  immatriculation?: string;
  // Pour chauffeurs  
  chauffeur_nom?: string;
  chauffeur_id?: string;
}

export const AlertesDocuments = () => {
  const [alertesVehicules, setAlertesVehicules] = useState<AlerteDocument[]>([]);
  const [alertesChauffeurs, setAlertesChauffeurs] = useState<AlerteDocument[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAlertes();
  }, []);

  const loadAlertes = async () => {
    try {
      setLoading(true);
      const [vehicules, chauffeurs] = await Promise.all([
        documentService.getAlertesVehicules(),
        documentService.getAlertesChauffeurs()
      ]);
      setAlertesVehicules(vehicules);
      setAlertesChauffeurs(chauffeurs);
    } catch (error) {
      console.error('Erreur lors du chargement des alertes:', error);
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

  const totalAlertes = alertesVehicules.length + alertesChauffeurs.length;
  const alertesExpires = [...alertesVehicules, ...alertesChauffeurs].filter(a => a.niveau_alerte === 'expire').length;

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Chargement des alertes...</div>
        </CardContent>
      </Card>
    );
  }

  if (totalAlertes === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="w-5 h-5 mr-2" />
            Conformité Documentaire
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <FileText className="h-4 w-4" />
            <AlertDescription>
              Aucun document en anomalie. Tous les documents sont à jour.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <FileText className="w-5 h-5 mr-2" />
            Conformité Documentaire
          </div>
          <div className="flex space-x-2">
            <Badge variant="outline">{totalAlertes} document(s) en anomalie</Badge>
            {alertesExpires > 0 && (
              <Badge variant="destructive">{alertesExpires} expiré(s)</Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Alertes Véhicules */}
        {alertesVehicules.length > 0 && (
          <div>
            <h4 className="font-medium mb-3 flex items-center">
              <Truck className="w-4 h-4 mr-2" />
              Documents Véhicules ({alertesVehicules.length})
            </h4>
            <div className="space-y-2">
              {alertesVehicules.map((alerte) => (
                <div key={alerte.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    {getIcon(alerte.niveau_alerte)}
                    <div>
                      <div className="font-medium text-sm">
                        {alerte.vehicule_numero} {alerte.immatriculation && `(${alerte.immatriculation})`}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {alerte.document_type} - {alerte.document_nom}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-muted-foreground">
                      {formatJoursRestants(alerte.jours_restants)}
                    </span>
                    <Badge variant={getBadgeVariant(alerte.niveau_alerte)}>
                      {getBadgeText(alerte.niveau_alerte)}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Alertes Chauffeurs */}
        {alertesChauffeurs.length > 0 && (
          <div>
            <h4 className="font-medium mb-3 flex items-center">
              <User className="w-4 h-4 mr-2" />
              Documents Chauffeurs ({alertesChauffeurs.length})
            </h4>
            <div className="space-y-2">
              {alertesChauffeurs.map((alerte) => (
                <div key={alerte.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    {getIcon(alerte.niveau_alerte)}
                    <div>
                      <div className="font-medium text-sm">
                        {alerte.chauffeur_nom}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {alerte.document_type} - {alerte.document_nom}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-muted-foreground">
                      {formatJoursRestants(alerte.jours_restants)}
                    </span>
                    <Badge variant={getBadgeVariant(alerte.niveau_alerte)}>
                      {getBadgeText(alerte.niveau_alerte)}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};