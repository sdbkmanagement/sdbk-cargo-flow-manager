
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, 
  Truck, 
  Users, 
  MapPin, 
  CheckSquare, 
  Package, 
  FileText, 
  UserCheck, 
  Settings,
  ArrowRight,
  BookOpen
} from 'lucide-react';

const Guide = () => {
  const modules = [
    {
      id: 'dashboard',
      title: 'Tableau de bord',
      icon: BarChart3,
      description: 'Vue d\'ensemble des activités et statistiques',
      color: 'bg-blue-500'
    },
    {
      id: 'fleet',
      title: 'Gestion de la flotte',
      icon: Truck,
      description: 'Gestion des véhicules et maintenance',
      color: 'bg-green-500'
    },
    {
      id: 'drivers',
      title: 'Gestion des chauffeurs',
      icon: Users,
      description: 'Personnel de conduite et documentation',
      color: 'bg-purple-500'
    },
    {
      id: 'missions',
      title: 'Planification des missions',
      icon: MapPin,
      description: 'Organisation des transports',
      color: 'bg-orange-500'
    },
    {
      id: 'validations',
      title: 'Workflows de validation',
      icon: CheckSquare,
      description: 'Processus d\'approbation interservices',
      color: 'bg-yellow-500'
    },
    {
      id: 'cargo',
      title: 'Suivi des chargements',
      icon: Package,
      description: 'Gestion de la marchandise',
      color: 'bg-indigo-500'
    },
    {
      id: 'billing',
      title: 'Module de facturation',
      icon: FileText,
      description: 'Devis, factures et paiements',
      color: 'bg-red-500' 
    },
    {
      id: 'hr',
      title: 'Ressources humaines',
      icon: UserCheck,
      description: 'Gestion du personnel',
      color: 'bg-teal-500'
    },
    {
      id: 'admin',
      title: 'Administration',
      icon: Settings,
      description: 'Configuration système',
      color: 'bg-gray-500'
    }
  ];

  const [selectedModule, setSelectedModule] = useState('dashboard');

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <BookOpen className="w-8 h-8 text-orange-500" />
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Guide d'utilisation</h1>
          <p className="text-gray-600 mt-1">
            Documentation complète pour utiliser SDBK Transport
          </p>
        </div>
      </div>

      <Tabs value={selectedModule} onValueChange={setSelectedModule} className="w-full">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Navigation des modules */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Modules</CardTitle>
                <CardDescription>
                  Sélectionnez un module pour voir sa documentation
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {modules.map((module) => {
                  const Icon = module.icon;
                  return (
                    <button
                      key={module.id}
                      onClick={() => setSelectedModule(module.id)}
                      className={`w-full flex items-center space-x-3 p-3 rounded-lg text-left transition-colors ${
                        selectedModule === module.id
                          ? 'bg-orange-50 border border-orange-200'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className={`p-2 rounded-md ${module.color} text-white`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <p className={`font-medium ${
                          selectedModule === module.id ? 'text-orange-700' : 'text-gray-900'
                        }`}>
                          {module.title}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {module.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </CardContent>
            </Card>
          </div>

          {/* Contenu de la documentation */}
          <div className="lg:col-span-3">
            <TabsContent value="dashboard" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-md bg-blue-500 text-white">
                      <BarChart3 className="w-5 h-5" />
                    </div>
                    <div>
                      <CardTitle>Tableau de bord</CardTitle>
                      <CardDescription>Centre de surveillance et statistiques</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Vue d'ensemble</h3>
                    <p className="text-gray-600 mb-4">
                      Le tableau de bord vous donne une vue complète de l'activité de votre flotte en temps réel.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card className="border-l-4 border-l-blue-500">
                      <CardContent className="pt-4">
                        <h4 className="font-medium mb-2">Statistiques principales</h4>
                        <ul className="text-sm text-gray-600 space-y-1">
                          <li>• Nombre total de véhicules</li>
                          <li>• Véhicules en service / hors service</li>
                          <li>• Missions en cours</li>
                          <li>• Chauffeurs actifs</li>
                        </ul>
                      </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-green-500">
                      <CardContent className="pt-4">
                        <h4 className="font-medium mb-2">Alertes et notifications</h4>
                        <ul className="text-sm text-gray-600 space-y-1">
                          <li>• Maintenances à venir</li>
                          <li>• Documents expirés</li>
                          <li>• Validations en attente</li>
                          <li>• Missions urgentes</li>
                        </ul>
                      </CardContent>
                    </Card>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Comment utiliser :</h4>
                    <ol className="text-sm text-gray-600 space-y-2 list-decimal list-inside">
                      <li>Consultez les chiffres clés en haut de page</li>
                      <li>Vérifiez les alertes dans la section notifications</li>
                      <li>Utilisez les graphiques pour analyser les tendances</li>
                      <li>Cliquez sur les éléments pour accéder aux détails</li>
                    </ol>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="fleet" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-md bg-green-500 text-white">
                      <Truck className="w-5 h-5" />
                    </div>
                    <div>
                      <CardTitle>Gestion de la flotte</CardTitle>
                      <CardDescription>Administration des véhicules et maintenance</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Fonctionnalités principales</h3>
                    <p className="text-gray-600 mb-4">
                      Module complet pour gérer vos véhicules, leur maintenance et leur documentation.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <Card className="border-l-4 border-l-green-500">
                      <CardContent className="pt-4">
                        <h4 className="font-medium mb-2">📋 Liste des véhicules</h4>
                        <p className="text-sm text-gray-600 mb-2">Visualisez tous vos véhicules avec leurs informations essentielles :</p>
                        <ul className="text-sm text-gray-600 space-y-1 ml-4">
                          <li>• Numéro d'immatriculation</li>
                          <li>• Type et modèle</li>
                          <li>• Statut (en service, maintenance, hors service)</li>
                          <li>• Dernière maintenance</li>
                          <li>• Prochaine échéance</li>
                        </ul>
                      </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-blue-500">
                      <CardContent className="pt-4">
                        <h4 className="font-medium mb-2">🔧 Gestion maintenance</h4>
                        <p className="text-sm text-gray-600 mb-2">Planifiez et suivez la maintenance :</p>
                        <ul className="text-sm text-gray-600 space-y-1 ml-4">
                          <li>• Programmation des révisions</li>
                          <li>• Historique des interventions</li>
                          <li>• Coûts et pièces détachées</li>
                          <li>• Alertes automatiques</li>
                        </ul>
                      </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-purple-500">
                      <CardContent className="pt-4">
                        <h4 className="font-medium mb-2">✅ Workflows de validation</h4>
                        <p className="text-sm text-gray-600 mb-2">Processus d'approbation interservices :</p>
                        <ul className="text-sm text-gray-600 space-y-1 ml-4">
                          <li>• Validation technique</li>
                          <li>• Contrôle administratif</li>
                          <li>• Approbation HSECQ</li>
                          <li>• Suivi des étapes</li>
                        </ul>
                      </CardContent>
                    </Card>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Guide d'utilisation :</h4>
                    <ol className="text-sm text-gray-600 space-y-2 list-decimal list-inside">
                      <li><strong>Ajouter un véhicule :</strong> Cliquez sur "Nouveau véhicule" et remplissez le formulaire</li>
                      <li><strong>Planifier une maintenance :</strong> Allez dans l'onglet "Maintenance" et définissez les échéances</li>
                      <li><strong>Suivre les validations :</strong> Consultez l'onglet "Validations" pour le statut des approbations</li>
                      <li><strong>Générer des rapports :</strong> Utilisez les filtres pour exporter les données</li>
                    </ol>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="drivers" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-md bg-purple-500 text-white">
                      <Users className="w-5 h-5" />
                    </div>
                    <div>
                      <CardTitle>Gestion des chauffeurs</CardTitle>
                      <CardDescription>Personnel de conduite et documentation</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Gestion complète du personnel</h3>
                    <p className="text-gray-600 mb-4">
                      Administrez vos chauffeurs, leurs documents et leur planning de manière centralisée.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <Card className="border-l-4 border-l-purple-500">
                      <CardContent className="pt-4">
                        <h4 className="font-medium mb-2">👤 Profils chauffeurs</h4>
                        <ul className="text-sm text-gray-600 space-y-1 ml-4">
                          <li>• Informations personnelles complètes</li>
                          <li>• Coordonnées et contacts d'urgence</li>
                          <li>• Statut d'activité (actif/inactif)</li>
                          <li>• Historique d'emploi</li>
                        </ul>
                      </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-orange-500">
                      <CardContent className="pt-4">
                        <h4 className="font-medium mb-2">📄 Gestion documentaire</h4>
                        <ul className="text-sm text-gray-600 space-y-1 ml-4">
                          <li>• Permis de conduire et catégories</li>
                          <li>• Certificats médicaux</li>
                          <li>• Formations obligatoires (ADR, FIMO, FCO)</li>
                          <li>• Alertes d'expiration automatiques</li>
                        </ul>
                      </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-green-500">
                      <CardContent className="pt-4">
                        <h4 className="font-medium mb-2">📅 Planning et missions</h4>
                        <ul className="text-sm text-gray-600 space-y-1 ml-4">
                          <li>• Attribution des véhicules</li>
                          <li>• Planification des missions</li>
                          <li>• Suivi des temps de conduite</li>
                          <li>• Gestion des congés</li>
                        </ul>
                      </CardContent>
                    </Card>
                  </div>

                  <div>
                    <Badge variant="outline" className="mb-2">Alertes importantes</Badge>
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <h4 className="font-medium text-yellow-800 mb-2">Surveillance automatique</h4>
                      <p className="text-sm text-yellow-700">
                        Le système surveille automatiquement les dates d'expiration des documents et vous alerte 
                        30 jours avant l'échéance pour éviter toute interruption d'activité.
                      </p>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Procédure d'ajout d'un chauffeur :</h4>
                    <ol className="text-sm text-gray-600 space-y-2 list-decimal list-inside">
                      <li>Cliquez sur "Nouveau chauffeur"</li>
                      <li>Remplissez les informations personnelles</li>
                      <li>Téléchargez tous les documents requis</li>
                      <li>Ajoutez photo et signature numérique</li>
                      <li>Validez et activez le profil</li>
                    </ol>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="missions" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-md bg-orange-500 text-white">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div>
                      <CardTitle>Planification des missions</CardTitle>
                      <CardDescription>Organisation et suivi des transports</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Gestion complète des missions</h3>
                    <p className="text-gray-600 mb-4">
                      Planifiez, organisez et suivez toutes vos missions de transport en temps réel.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card className="border-l-4 border-l-orange-500">
                      <CardContent className="pt-4">
                        <h4 className="font-medium mb-2">🎯 Création de missions</h4>
                        <ul className="text-sm text-gray-600 space-y-1">
                          <li>• Définition des points de départ/arrivée</li>
                          <li>• Attribution véhicule et chauffeur</li>
                          <li>• Planification horaires</li>
                          <li>• Type de marchandise</li>
                        </ul>
                      </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-blue-500">
                      <CardContent className="pt-4">
                        <h4 className="font-medium mb-2">📊 Suivi en temps réel</h4>
                        <ul className="text-sm text-gray-600 space-y-1">
                          <li>• Statut des missions</li>
                          <li>• Localisation GPS</li>
                          <li>• Retards et incidents</li>
                          <li>• Communication chauffeur</li>
                        </ul>
                      </CardContent>
                    </Card>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">États des missions :</h4>
                    <div className="flex flex-wrap gap-2 mb-4">
                      <Badge variant="secondary">Planifiée</Badge>
                      <Badge className="bg-blue-500">En cours</Badge>
                      <Badge className="bg-yellow-500">En attente</Badge>
                      <Badge className="bg-green-500">Terminée</Badge>
                      <Badge variant="destructive">Annulée</Badge>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Comment créer une mission :</h4>
                    <ol className="text-sm text-gray-600 space-y-2 list-decimal list-inside">
                      <li>Cliquez sur "Nouvelle mission"</li>
                      <li>Saisissez les adresses de départ et destination</li>
                      <li>Sélectionnez le véhicule approprié</li>
                      <li>Assignez un chauffeur disponible</li>
                      <li>Définissez les créneaux horaires</li>
                      <li>Ajoutez les détails du chargement</li>
                      <li>Validez et programmez la mission</li>
                    </ol>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="validations" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-md bg-yellow-500 text-white">
                      <CheckSquare className="w-5 h-5" />
                    </div>
                    <div>
                      <CardTitle>Workflows de validation</CardTitle>
                      <CardDescription>Processus d'approbation interservices</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Système de validation multi-niveaux</h3>
                    <p className="text-gray-600 mb-4">
                      Processus structuré pour valider les véhicules selon les standards de l'entreprise.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <Card className="border-l-4 border-l-red-500">
                      <CardContent className="pt-4">
                        <h4 className="font-medium mb-2 text-red-700">🔧 Validation Technique</h4>
                        <ul className="text-sm text-gray-600 space-y-1 ml-4">
                          <li>• Contrôle mécanique complet</li>
                          <li>• Vérification des équipements</li>
                          <li>• Tests de sécurité</li>
                          <li>• Validation par l'équipe maintenance</li>
                        </ul>
                      </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-blue-500">
                      <CardContent className="pt-4">
                        <h4 className="font-medium mb-2 text-blue-700">📋 Validation Administrative</h4>
                        <ul className="text-sm text-gray-600 space-y-1 ml-4">
                          <li>• Vérification des documents</li>
                          <li>• Contrôle des assurances</li>
                          <li>• Validation des permis</li>
                          <li>• Conformité réglementaire</li>
                        </ul>
                      </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-green-500">
                      <CardContent className="pt-4">
                        <h4 className="font-medium mb-2 text-green-700">🛡️ Validation HSECQ</h4>
                        <ul className="text-sm text-gray-600 space-y-1 ml-4">
                          <li>• Hygiène et sécurité</li>
                          <li>• Contrôle environnemental</li>
                          <li>• Standards qualité</li>
                          <li>• Certification finale</li>
                        </ul>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-medium text-blue-800 mb-2">Processus de validation</h4>
                    <div className="flex items-center space-x-2 text-sm text-blue-700">
                      <span className="bg-blue-100 px-2 py-1 rounded">Technique</span>
                      <ArrowRight className="w-4 h-4" />
                      <span className="bg-blue-100 px-2 py-1 rounded">Administratif</span>
                      <ArrowRight className="w-4 h-4" />
                      <span className="bg-blue-100 px-2 py-1 rounded">HSECQ</span>
                      <ArrowRight className="w-4 h-4" />
                      <span className="bg-green-100 px-2 py-1 rounded text-green-700">Validé</span>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Comment utiliser les validations :</h4>
                    <ol className="text-sm text-gray-600 space-y-2 list-decimal list-inside">
                      <li>Accédez à la liste des véhicules à valider</li>
                      <li>Sélectionnez le véhicule concerné</li>
                      <li>Complétez les contrôles de votre service</li>
                      <li>Ajoutez vos commentaires si nécessaire</li>
                      <li>Validez ou rejetez selon les résultats</li>
                      <li>Le processus passe automatiquement à l'étape suivante</li>
                    </ol>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="cargo" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-md bg-indigo-500 text-white">
                      <Package className="w-5 h-5" />
                    </div>
                    <div>
                      <CardTitle>Suivi des chargements</CardTitle>
                      <CardDescription>Gestion de la marchandise et logistique</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Traçabilité complète des marchandises</h3>
                    <p className="text-gray-600 mb-4">
                      Suivez vos chargements de A à Z avec une traçabilité complète et des alertes en temps réel.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card className="border-l-4 border-l-indigo-500">
                      <CardContent className="pt-4">
                        <h4 className="font-medium mb-2">📦 Gestion des colis</h4>
                        <ul className="text-sm text-gray-600 space-y-1">
                          <li>• Enregistrement des chargements</li>
                          <li>• Codes-barres et QR codes</li>
                          <li>• Poids et dimensions</li>
                          <li>• Nature de la marchandise</li>
                        </ul>
                      </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-purple-500">
                      <CardContent className="pt-4">
                        <h4 className="font-medium mb-2">🚚 Suivi logistique</h4>
                        <ul className="text-sm text-gray-600 space-y-1">
                          <li>• Localisation en temps réel</li>
                          <li>• Étapes de livraison</li>
                          <li>• Preuve de livraison</li>
                          <li>• Gestion des retours</li>
                        </ul>
                      </CardContent>
                    </Card>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Statuts de chargement :</h4>
                    <div className="flex flex-wrap gap-2 mb-4">
                      <Badge variant="secondary">En préparation</Badge>
                      <Badge className="bg-yellow-500">Chargé</Badge>
                      <Badge className="bg-blue-500">En transit</Badge>
                      <Badge className="bg-green-500">Livré</Badge>
                      <Badge variant="destructive">Incident</Badge>
                    </div>
                  </div>

                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <h4 className="font-medium text-amber-800 mb-2">⚠️ Marchandises dangereuses</h4>
                    <p className="text-sm text-amber-700">
                      Le système gère automatiquement les contraintes ADR pour les matières dangereuses 
                      et vérifie les certifications des chauffeurs et véhicules.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Procédure de chargement :</h4>
                    <ol className="text-sm text-gray-600 space-y-2 list-decimal list-inside">
                      <li>Scannez ou saisissez les références du chargement</li>
                      <li>Associez le chargement à une mission</li>
                      <li>Vérifiez les contraintes (poids, volume, ADR)</li>
                      <li>Confirmez le chargement dans le véhicule</li>
                      <li>Suivez l'avancement via le GPS</li>
                      <li>Enregistrez la livraison et la signature client</li>
                    </ol>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="billing" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-md bg-red-500 text-white">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <CardTitle>Module de facturation</CardTitle>
                      <CardDescription>Devis, factures et suivi des paiements</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Gestion financière complète</h3>
                    <p className="text-gray-600 mb-4">
                      De la création de devis jusqu'au suivi des paiements, gérez tout votre cycle de facturation.
                    </p>
                  </div>

                  <Tabs defaultValue="devis" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="devis">Devis</TabsTrigger>
                      <TabsTrigger value="factures">Factures</TabsTrigger>
                      <TabsTrigger value="paiements">Paiements</TabsTrigger>
                    </TabsList>

                    <TabsContent value="devis" className="space-y-4">
                      <Card className="border-l-4 border-l-blue-500">
                        <CardContent className="pt-4">
                          <h4 className="font-medium mb-2">💼 Création de devis</h4>
                          <ul className="text-sm text-gray-600 space-y-1 ml-4">
                            <li>• Sélection du client et mission</li>
                            <li>• Calcul automatique des tarifs</li>
                            <li>• Ajout de services supplémentaires</li>
                            <li>• Génération PDF automatique</li>
                            <li>• Envoi par email intégré</li>
                          </ul>
                        </CardContent>
                      </Card>
                    </TabsContent>

                    <TabsContent value="factures" className="space-y-4">
                      <Card className="border-l-4 border-l-green-500">
                        <CardContent className="pt-4">
                          <h4 className="font-medium mb-2">🧾 Gestion des factures</h4>
                          <ul className="text-sm text-gray-600 space-y-1 ml-4">
                            <li>• Conversion devis → facture</li>
                            <li>• Numérotation automatique</li>
                            <li>• Calcul TVA et totaux</li>
                            <li>• Archivage numérique</li>
                            <li>• Relances automatisées</li>
                          </ul>
                        </CardContent>
                      </Card>
                    </TabsContent>

                    <TabsContent value="paiements" className="space-y-4">
                      <Card className="border-l-4 border-l-purple-500">
                        <CardContent className="pt-4">
                          <h4 className="font-medium mb-2">💳 Suivi des paiements</h4>
                          <ul className="text-sm text-gray-600 space-y-1 ml-4">
                            <li>• Tableau de bord des impayés</li>
                            <li>• Rapprochement bancaire</li>
                            <li>• Alertes de retard</li>
                            <li>• Historique des encaissements</li>
                            <li>• Reporting financier</li>
                          </ul>
                        </CardContent>
                      </Card>
                    </TabsContent>
                  </Tabs>

                  <div>
                    <h4 className="font-medium mb-2">Workflow de facturation :</h4>
                    <div className="flex items-center space-x-2 text-sm mb-4">
                      <span className="bg-blue-100 px-3 py-1 rounded text-blue-700">Devis</span>
                      <ArrowRight className="w-4 h-4 text-gray-400" />
                      <span className="bg-yellow-100 px-3 py-1 rounded text-yellow-700">Accepté</span>
                      <ArrowRight className="w-4 h-4 text-gray-400" />
                      <span className="bg-green-100 px-3 py-1 rounded text-green-700">Facture</span>
                      <ArrowRight className="w-4 h-4 text-gray-400" />
                      <span className="bg-purple-100 px-3 py-1 rounded text-purple-700">Payé</span>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Étapes pour facturer :</h4>
                    <ol className="text-sm text-gray-600 space-y-2 list-decimal list-inside">
                      <li>Créez un devis basé sur la mission</li>
                      <li>Envoyez le devis au client pour validation</li>
                      <li>Une fois accepté, convertissez en facture</li>
                      <li>Envoyez la facture au client</li>
                      <li>Suivez le paiement dans le module dédié</li>
                      <li>Relancez automatiquement en cas de retard</li>
                    </ol>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="hr" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-md bg-teal-500 text-white">
                      <UserCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <CardTitle>Ressources Humaines</CardTitle>
                      <CardDescription>Gestion du personnel et administration</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center py-8">
                    <UserCheck className="w-16 h-16 text-teal-500 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Module en développement</h3>
                    <p className="text-gray-600 mb-4">
                      Le module RH est actuellement en cours de développement et sera disponible prochainement.
                    </p>
                    <div className="bg-teal-50 border border-teal-200 rounded-lg p-4 text-left">
                      <h4 className="font-medium text-teal-800 mb-2">Fonctionnalités prévues :</h4>
                      <ul className="text-sm text-teal-700 space-y-1 ml-4">
                        <li>• Gestion des contrats et paies</li>
                        <li>• Suivi des congés et absences</li>
                        <li>• Évaluations et formations</li>
                        <li>• Dossiers personnel complets</li>
                        <li>• Reporting RH avancé</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="admin" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-md bg-gray-500 text-white">
                      <Settings className="w-5 h-5" />
                    </div>
                    <div>
                      <CardTitle>Administration</CardTitle>
                      <CardDescription>Configuration système et paramètres</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center py-8">
                    <Settings className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Accès administrateur uniquement</h3>
                    <p className="text-gray-600 mb-4">
                      Ce module est réservé aux administrateurs système pour la configuration avancée.
                    </p>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-left">
                      <h4 className="font-medium text-gray-800 mb-2">Fonctionnalités disponibles :</h4>
                      <ul className="text-sm text-gray-700 space-y-1 ml-4">
                        <li>• Gestion des utilisateurs et rôles</li>
                        <li>• Configuration des permissions</li>
                        <li>• Paramètres système</li>
                        <li>• Sauvegarde et maintenance</li>
                        <li>• Logs et monitoring</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </div>
      </Tabs>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BookOpen className="w-5 h-5 text-orange-500" />
            <span>Support et assistance</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <h4 className="font-medium mb-2">📞 Support technique</h4>
              <p className="text-sm text-gray-600">
                Contactez notre équipe pour toute assistance technique
              </p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <h4 className="font-medium mb-2">📚 Formation</h4>
              <p className="text-sm text-gray-600">
                Sessions de formation personnalisées disponibles sur demande
              </p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <h4 className="font-medium mb-2">🔄 Mises à jour</h4>
              <p className="text-sm text-gray-600">
                Le logiciel est régulièrement mis à jour avec de nouvelles fonctionnalités
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Guide;
