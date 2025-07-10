import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { DiagnosticMaintenanceForm } from './diagnostics/DiagnosticMaintenanceForm';
import { DocumentsAdministratifsManager } from './documents/DocumentsAdministratifsManager';
import { diagnosticMaintenanceService } from '@/services/diagnosticMaintenance';
import { documentsAdministratifsService } from '@/services/documentsAdministratifs';
import { historiqueVehiculesService } from '@/services/historiqueVehicules';
import { 
  Wrench, 
  FileText, 
  CheckCircle, 
  AlertTriangle, 
  Clock,
  ArrowRight,
  History,
  Settings
} from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';

type Vehicule = Database['public']['Tables']['vehicules']['Row'] & {
  chauffeur?: {
    nom: string;
    prenom: string;
  } | null;
};

interface PostMissionWorkflowProps {
  vehicule: Vehicule;
  userRole: string;
  userName: string;
  userId: string;
  onClose: () => void;
}

export const PostMissionWorkflow = ({
  vehicule,
  userRole,
  userName,
  userId,
  onClose
}: PostMissionWorkflowProps) => {
  const [showDiagnosticForm, setShowDiagnosticForm] = useState(false);
  const [showDocumentsManager, setShowDocumentsManager] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // Récupérer les diagnostics de maintenance
  const { data: diagnostics = [] } = useQuery({
    queryKey: ['diagnostics-maintenance', vehicule.id],
    queryFn: () => diagnosticMaintenanceService.getByVehicle(vehicule.id),
  });

  // Récupérer la conformité documentaire
  const { data: conformite } = useQuery({
    queryKey: ['conformite-documentaire', vehicule.id],
    queryFn: () => documentsAdministratifsService.verifierConformiteDocumentaire(vehicule.id),
  });

  // Récupérer l'historique du véhicule
  const { data: historique = [] } = useQuery({
    queryKey: ['historique-vehicule', vehicule.id],
    queryFn: () => historiqueVehiculesService.getByVehicule(vehicule.id),
  });

  // Récupérer les alertes de documents
  const { data: alertesDocuments = [] } = useQuery({
    queryKey: ['alertes-documents', vehicule.id],
    queryFn: () => documentsAdministratifsService.getAlertesVehicule(vehicule.id),
  });

  const getStatutColor = (statut: string) => {
    switch (statut) {
      case 'disponible': return 'bg-green-100 text-green-800';
      case 'indisponible_reparation': return 'bg-red-100 text-red-800';
      case 'disponible_maintenance': return 'bg-blue-100 text-blue-800';
      case 'disponible_administratif': return 'bg-green-100 text-green-800';
      case 'bloque_document_manquant': return 'bg-red-100 text-red-800';
      case 'bloque_document_expire': return 'bg-orange-100 text-orange-800';
      case 'en_mission': return 'bg-purple-100 text-purple-800';
      case 'maintenance': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatutLabel = (statut: string) => {
    switch (statut) {
      case 'disponible': return 'Disponible';
      case 'indisponible_reparation': return 'En réparation';
      case 'disponible_maintenance': return 'Maintenance OK';
      case 'disponible_administratif': return 'Administratif OK';
      case 'bloque_document_manquant': return 'Documents manquants';
      case 'bloque_document_expire': return 'Documents expirés';
      case 'en_mission': return 'En mission';
      case 'maintenance': return 'Maintenance';
      default: return statut;
    }
  };

  const calculateProgress = () => {
    let progress = 0;
    
    // Étape 1: Maintenance (50% du processus)
    const diagnosticEnCours = diagnostics.find(d => d.statut === 'en_cours');
    const diagnosticTermine = diagnostics.find(d => d.statut === 'termine');
    
    if (diagnosticTermine || vehicule.statut === 'disponible_maintenance') {
      progress += 50;
    } else if (diagnosticEnCours || vehicule.statut === 'indisponible_reparation') {
      progress += 25;
    }

    // Étape 2: Administratif (50% du processus)
    if (conformite?.conforme || vehicule.statut === 'disponible_administratif') {
      progress += 50;
    } else if (conformite && !conformite.conforme) {
      progress += 25; // Démarré mais pas terminé
    }

    return Math.min(progress, 100);
  };

  const canAccessMaintenance = userRole === 'maintenance' || userRole === 'admin';
  const canAccessAdministratif = userRole === 'administratif' || userRole === 'admin';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-6xl mx-4 max-h-[90vh] overflow-y-auto">
        <Card className="border-0 shadow-none">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Processus post-mission
              </CardTitle>
              <CardDescription>
                Véhicule: {vehicule.numero} - {vehicule.immatriculation || 'Sans immatriculation'}
              </CardDescription>
            </div>
            <div className="flex items-center gap-4">
              <Badge className={getStatutColor(vehicule.statut)}>
                {getStatutLabel(vehicule.statut)}
              </Badge>
              <Button variant="outline" onClick={onClose}>
                Fermer
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
                <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
                <TabsTrigger value="administratif">Administratif</TabsTrigger>
                <TabsTrigger value="historique">Historique</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                {/* Progression du workflow */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Progression du processus</CardTitle>
                    <CardDescription>
                      Suivi de l'avancement du processus post-mission
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Avancement global</span>
                        <span>{calculateProgress()}%</span>
                      </div>
                      <Progress value={calculateProgress()} className="w-full" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Étape 1: Maintenance */}
                      <Card className="relative">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Wrench className="h-4 w-4" />
                              <span>1. Contrôle Maintenance</span>
                            </div>
                            {diagnostics.some(d => d.statut === 'termine') || vehicule.statut === 'disponible_maintenance' ? (
                              <CheckCircle className="h-5 w-5 text-green-600" />
                            ) : diagnostics.some(d => d.statut === 'en_cours') ? (
                              <Clock className="h-5 w-5 text-blue-600" />
                            ) : (
                              <AlertTriangle className="h-5 w-5 text-yellow-600" />
                            )}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <p className="text-sm text-muted-foreground">
                              Diagnostics: {diagnostics.length}
                            </p>
                            {diagnostics.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {diagnostics.slice(0, 3).map((diagnostic) => (
                                  <Badge key={diagnostic.id} variant="outline" className="text-xs">
                                    {diagnostic.statut}
                                  </Badge>
                                ))}
                                {diagnostics.length > 3 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{diagnostics.length - 3}
                                  </Badge>
                                )}
                              </div>
                            )}
                            <div className="pt-2">
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => setActiveTab('maintenance')}
                                disabled={!canAccessMaintenance}
                              >
                                Gérer la maintenance
                                <ArrowRight className="h-4 w-4 ml-2" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Étape 2: Administratif */}
                      <Card className="relative">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4" />
                              <span>2. Vérification Administrative</span>
                            </div>
                            {conformite?.conforme || vehicule.statut === 'disponible_administratif' ? (
                              <CheckCircle className="h-5 w-5 text-green-600" />
                            ) : conformite && !conformite.conforme ? (
                              <AlertTriangle className="h-5 w-5 text-red-600" />
                            ) : (
                              <Clock className="h-5 w-5 text-yellow-600" />
                            )}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {conformite ? (
                              <>
                                <p className="text-sm text-muted-foreground">
                                  Documents manquants: {conformite.documentsManquants.length}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  Documents expirés: {conformite.documentsExpires.length}
                                </p>
                                {alertesDocuments.length > 0 && (
                                  <Badge variant="destructive" className="text-xs">
                                    {alertesDocuments.length} alerte(s)
                                  </Badge>
                                )}
                              </>
                            ) : (
                              <p className="text-sm text-muted-foreground">Chargement...</p>
                            )}
                            <div className="pt-2">
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => setActiveTab('administratif')}
                                disabled={!canAccessAdministratif}
                              >
                                Gérer les documents
                                <ArrowRight className="h-4 w-4 ml-2" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </CardContent>
                </Card>

                {/* Alertes et actions rapides */}
                {(alertesDocuments.length > 0 || diagnostics.some(d => d.statut === 'en_attente')) && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-yellow-600" />
                        Actions requises
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {diagnostics.some(d => d.statut === 'en_attente') && canAccessMaintenance && (
                        <Alert>
                          <AlertDescription>
                            Des diagnostics de maintenance sont en attente de traitement.
                            <Button 
                              size="sm" 
                              className="ml-2"
                              onClick={() => setActiveTab('maintenance')}
                            >
                              Voir les diagnostics
                            </Button>
                          </AlertDescription>
                        </Alert>
                      )}
                      
                      {alertesDocuments.length > 0 && canAccessAdministratif && (
                        <Alert>
                          <AlertDescription>
                            {alertesDocuments.length} document(s) nécessitent votre attention.
                            <Button 
                              size="sm" 
                              className="ml-2"
                              onClick={() => setActiveTab('administratif')}
                            >
                              Voir les documents
                            </Button>
                          </AlertDescription>
                        </Alert>
                      )}
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="maintenance" className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Gestion de la maintenance</h3>
                  {canAccessMaintenance && (
                    <Button onClick={() => setShowDiagnosticForm(true)}>
                      <Wrench className="h-4 w-4 mr-2" />
                      Nouveau diagnostic
                    </Button>
                  )}
                </div>

                {!canAccessMaintenance ? (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Vous n'avez pas les permissions nécessaires pour accéder à la gestion de maintenance.
                      Seuls les utilisateurs avec le rôle "Maintenance" peuvent intervenir.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="space-y-4">
                    {diagnostics.length === 0 ? (
                      <Card>
                        <CardContent className="pt-6 text-center">
                          <p className="text-muted-foreground">Aucun diagnostic de maintenance pour ce véhicule.</p>
                        </CardContent>
                      </Card>
                    ) : (
                      <div className="grid gap-4">
                        {diagnostics.map((diagnostic) => (
                          <Card key={diagnostic.id}>
                            <CardContent className="pt-4">
                              <div className="flex justify-between items-start">
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium">{diagnostic.type_panne}</span>
                                    <Badge className={getStatutColor(diagnostic.statut)}>
                                      {diagnostic.statut}
                                    </Badge>
                                  </div>
                                  <p className="text-sm text-muted-foreground">
                                    {diagnostic.description}
                                  </p>
                                  <div className="text-xs text-muted-foreground">
                                    Créé le {new Date(diagnostic.created_at).toLocaleDateString('fr-FR')} 
                                    par {diagnostic.responsable_maintenance}
                                  </div>
                                </div>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => setShowDiagnosticForm(true)}
                                >
                                  Modifier
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="administratif" className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Vérification administrative</h3>
                  {canAccessAdministratif && (
                    <Button onClick={() => setShowDocumentsManager(true)}>
                      <FileText className="h-4 w-4 mr-2" />
                      Gérer les documents
                    </Button>
                  )}
                </div>

                {!canAccessAdministratif ? (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Vous n'avez pas les permissions nécessaires pour accéder à la gestion administrative.
                      Seuls les utilisateurs avec le rôle "Administratif" peuvent modifier et valider les documents.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="space-y-4">
                    {conformite && (
                      <Card>
                        <CardHeader>
                          <CardTitle className={`text-base ${conformite.conforme ? 'text-green-700' : 'text-red-700'}`}>
                            {conformite.conforme ? 'Conformité documentaire validée' : 'Non-conformité documentaire'}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          {!conformite.conforme && (
                            <div className="space-y-2">
                              {conformite.documentsManquants.length > 0 && (
                                <div>
                                  <p className="text-sm font-medium text-red-600">Documents manquants:</p>
                                  <ul className="text-sm text-muted-foreground list-disc list-inside">
                                    {conformite.documentsManquants.map((doc, index) => (
                                      <li key={index}>{doc}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                              {conformite.documentsExpires.length > 0 && (
                                <div>
                                  <p className="text-sm font-medium text-red-600">Documents expirés:</p>
                                  <ul className="text-sm text-muted-foreground list-disc list-inside">
                                    {conformite.documentsExpires.map((doc, index) => (
                                      <li key={index}>{doc}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          )}
                          {conformite.documentsProchesExpiration.length > 0 && (
                            <div>
                              <p className="text-sm font-medium text-yellow-600">Documents expirant bientôt:</p>
                              <ul className="text-sm text-muted-foreground list-disc list-inside">
                                {conformite.documentsProchesExpiration.map((doc, index) => (
                                  <li key={index}>{doc}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="historique" className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium flex items-center gap-2">
                    <History className="h-5 w-5" />
                    Historique des actions
                  </h3>
                </div>

                <div className="space-y-3">
                  {historique.length === 0 ? (
                    <Card>
                      <CardContent className="pt-6 text-center">
                        <p className="text-muted-foreground">Aucun historique pour ce véhicule.</p>
                      </CardContent>
                    </Card>
                  ) : (
                    historique.slice(0, 20).map((entry) => (
                      <Card key={entry.id}>
                        <CardContent className="pt-4">
                          <div className="flex justify-between items-start">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">
                                  {entry.type_action}
                                </Badge>
                                <span className="font-medium text-sm">{entry.action}</span>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {historiqueVehiculesService.formatDetailsAction(entry)}
                              </p>
                              <div className="text-xs text-muted-foreground">
                                {new Date(entry.created_at).toLocaleString('fr-FR')} 
                                par {entry.utilisateur_nom} ({entry.utilisateur_role})
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Modals */}
        {showDiagnosticForm && (
          <DiagnosticMaintenanceForm
            vehicule={vehicule}
            onClose={() => setShowDiagnosticForm(false)}
            onSuccess={() => setShowDiagnosticForm(false)}
            userRole={userRole}
            userName={userName}
            userId={userId}
          />
        )}

        {showDocumentsManager && (
          <DocumentsAdministratifsManager
            vehicule={vehicule}
            userRole={userRole}
            userName={userName}
            userId={userId}
            onClose={() => setShowDocumentsManager(false)}
          />
        )}
      </div>
    </div>
  );
};