
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  AlertTriangle, 
  Clock, 
  User,
  FileText,
  Calendar,
  Settings
} from 'lucide-react';
import { alertesChauffeursService, AlerteChauffeur } from '@/services/alertesChauffeurs';
import { DocumentManagerChauffeur } from './DocumentManagerChauffeur';

export const AlertesDocuments = () => {
  const [alertes, setAlertes] = useState<AlerteChauffeur[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChauffeur, setSelectedChauffeur] = useState<{
    id: string;
    nom: string;
  } | null>(null);
  const [showDocumentManager, setShowDocumentManager] = useState(false);

  useEffect(() => {
    loadAlertes();
  }, []);

  const loadAlertes = async () => {
    try {
      setLoading(true);
      const data = await alertesChauffeursService.getAlertesChauffeurs();
      setAlertes(data);
    } catch (error) {
      console.error('Erreur lors du chargement des alertes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGererDocuments = (chauffeurId: string, chauffeurNom: string) => {
    setSelectedChauffeur({ id: chauffeurId, nom: chauffeurNom });
    setShowDocumentManager(true);
  };

  const handleDocumentManagerSuccess = () => {
    loadAlertes();
  };

  const getNiveauBadge = (niveau: string) => {
    const variants = {
      'expire': { variant: 'destructive', text: 'Expiré', color: 'text-red-600' },
      'a_renouveler': { variant: 'secondary', text: 'À renouveler', color: 'text-orange-600' },
      'info': { variant: 'default', text: 'Information', color: 'text-blue-600' }
    };

    const config = variants[niveau] || variants.info;
    
    return (
      <Badge variant={config.variant}>
        {config.text}
      </Badge>
    );
  };

  const getIconeNiveau = (niveau: string) => {
    if (niveau === 'expire') {
      return <AlertTriangle className="w-4 h-4 text-red-500" />;
    }
    if (niveau === 'a_renouveler') {
      return <Clock className="w-4 h-4 text-orange-500" />;
    }
    return <FileText className="w-4 h-4 text-blue-500" />;
  };

  const formatJoursRestants = (jours: number) => {
    if (jours === 0) return 'Expire aujourd\'hui';
    if (jours < 0) return `Expiré depuis ${Math.abs(jours)} jours`;
    return `${jours} jours`;
  };

  const alertesExpires = alertes.filter(a => a.niveau_alerte === 'expire').length;
  const alertesARenouveler = alertes.filter(a => a.niveau_alerte === 'a_renouveler').length;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Chargement des alertes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Résumé des alertes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Documents expirés</p>
                <p className="text-2xl font-bold text-red-600">{alertesExpires}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">À renouveler</p>
                <p className="text-2xl font-bold text-orange-600">{alertesARenouveler}</p>
              </div>
              <Clock className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total alertes</p>
                <p className="text-2xl font-bold text-blue-600">{alertes.length}</p>
              </div>
              <FileText className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Liste des alertes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2 text-orange-500" />
            Alertes documents chauffeurs
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {alertes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Aucune alerte document</p>
              <p className="text-sm">Tous les documents chauffeurs sont à jour</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Niveau</TableHead>
                    <TableHead>Chauffeur</TableHead>
                    <TableHead>Document</TableHead>
                    <TableHead>Date d'expiration</TableHead>
                    <TableHead>Jours restants</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {alertes
                    .sort((a, b) => {
                      const ordre = { 'expire': 1, 'a_renouveler': 2, 'info': 3 };
                      return ordre[a.niveau_alerte] - ordre[b.niveau_alerte];
                    })
                    .map((alerte) => (
                      <TableRow key={alerte.id} className={
                        alerte.niveau_alerte === 'expire' ? 'bg-red-50' :
                        alerte.niveau_alerte === 'a_renouveler' ? 'bg-orange-50' : ''
                      }>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {getIconeNiveau(alerte.niveau_alerte)}
                            {getNiveauBadge(alerte.niveau_alerte)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                              <User className="w-4 h-4" />
                            </div>
                            <span className="font-medium">{alerte.chauffeur_nom}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <FileText className="w-4 h-4 text-gray-500" />
                            {alerte.document_nom}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-4 h-4 text-gray-500" />
                            {new Date(alerte.date_expiration).toLocaleDateString('fr-FR')}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={
                            alerte.jours_restants <= 0 ? 'text-red-600 font-medium' :
                            alerte.jours_restants <= 30 ? 'text-orange-600 font-medium' :
                            'text-gray-600'
                          }>
                            {formatJoursRestants(alerte.jours_restants)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleGererDocuments(alerte.chauffeur_id, alerte.chauffeur_nom)}
                            >
                              <Settings className="w-4 h-4 mr-1" />
                              Gérer
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de gestion des documents */}
      {selectedChauffeur && (
        <DocumentManagerChauffeur
          chauffeurId={selectedChauffeur.id}
          chauffeurNom={selectedChauffeur.nom}
          open={showDocumentManager}
          onOpenChange={setShowDocumentManager}
          onSuccess={handleDocumentManagerSuccess}
        />
      )}
    </div>
  );
};
