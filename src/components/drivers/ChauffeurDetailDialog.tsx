import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  User, 
  Phone, 
  Mail, 
  Calendar,
  FileText,
  Truck,
  AlertTriangle,
  Star,
  Edit,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface ChauffeurDetailDialogProps {
  chauffeur: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ChauffeurDetailDialog = ({ chauffeur, open, onOpenChange }: ChauffeurDetailDialogProps) => {
  const { hasPermission, hasRole } = useAuth();
  const [activeTab, setActiveTab] = useState('infos');
  const [documentViewDialog, setDocumentViewDialog] = useState({ open: false, url: '', title: '' });

  const tabs = [
    { id: 'infos', label: 'Informations', icon: User },
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'missions', label: 'Missions', icon: Truck },
    { id: 'performance', label: 'Performance', icon: Star, restricted: true },
    { id: 'incidents', label: 'Incidents', icon: AlertTriangle, restricted: true }
  ];

  const filteredTabs = tabs.filter(tab => 
    !tab.restricted || hasRole('rh') || hasRole('direction') || hasRole('admin')
  );

  const handleViewDocument = (documentTitle: string, documentUrl?: string) => {
    if (documentUrl) {
      // Si on a une vraie URL, on l'ouvre dans un nouvel onglet
      window.open(documentUrl, '_blank');
    } else {
      // Sinon, on simule l'ouverture d'un document (pour la démo)
      setDocumentViewDialog({
        open: true,
        url: '/placeholder.svg', // URL de démonstration
        title: documentTitle
      });
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <div className="text-xl font-bold">{chauffeur.prenom} {chauffeur.nom}</div>
                <div className="text-sm text-gray-500">{chauffeur.email}</div>
              </div>
            </DialogTitle>
            <DialogDescription>
              Fiche complète du chauffeur
            </DialogDescription>
          </DialogHeader>

          {/* Navigation par onglets */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {filteredTabs.map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`${
                      activeTab === tab.id
                        ? 'border-orange-500 text-orange-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center`}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Contenu selon l'onglet actif */}
          <div className="mt-6">
            {activeTab === 'infos' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Informations personnelles</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center space-x-3">
                        <Phone className="w-4 h-4 text-gray-500" />
                        <span>{chauffeur.telephone}</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Mail className="w-4 h-4 text-gray-500" />
                        <span>{chauffeur.email}</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <span>Permis expire le {chauffeur.dateExpirationPermis?.toLocaleDateString('fr-FR')}</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Statut et affectation</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span>Statut :</span>
                        <Badge variant={chauffeur.statut === 'actif' ? 'default' : 'secondary'}>
                          {chauffeur.statut.charAt(0).toUpperCase() + chauffeur.statut.slice(1)}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Véhicule assigné :</span>
                        {chauffeur.vehiculeAssigne ? (
                          <Badge variant="outline">{chauffeur.vehiculeAssigne}</Badge>
                        ) : (
                          <span className="text-gray-400">Non assigné</span>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Types de permis :</span>
                        <div className="flex flex-wrap gap-1">
                          {chauffeur.typePermis?.map(permis => (
                            <Badge key={permis} variant="outline" className="text-xs">
                              {permis}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {activeTab === 'documents' && (
              <Card>
                <CardHeader>
                  <CardTitle>Documents du chauffeur</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <FileText className="w-5 h-5 text-blue-500" />
                        <div>
                          <div className="font-medium">Permis de conduire</div>
                          <div className="text-sm text-gray-500">Expire le {chauffeur.dateExpirationPermis?.toLocaleDateString('fr-FR')}</div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">Valide</Badge>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleViewDocument('Permis de conduire')}
                        >
                          <ExternalLink className="w-4 h-4 mr-1" />
                          Voir
                        </Button>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <FileText className="w-5 h-5 text-orange-500" />
                        <div>
                          <div className="font-medium">Visite médicale</div>
                          <div className="text-sm text-gray-500">Expire le 25/07/2024</div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="default">À renouveler</Badge>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleViewDocument('Visite médicale')}
                        >
                          <ExternalLink className="w-4 h-4 mr-1" />
                          Voir
                        </Button>
                      </div>
                    </div>

                    {/* Autres documents si disponibles */}
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <FileText className="w-5 h-5 text-green-500" />
                        <div>
                          <div className="font-medium">Carte professionnelle</div>
                          <div className="text-sm text-gray-500">Valide jusqu'au 15/12/2025</div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="bg-green-50 text-green-700">Valide</Badge>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleViewDocument('Carte professionnelle')}
                        >
                          <ExternalLink className="w-4 h-4 mr-1" />
                          Voir
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeTab === 'missions' && (
              <Card>
                <CardHeader>
                  <CardTitle>Historique des missions</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">Aucune mission récente trouvée.</p>
                </CardContent>
              </Card>
            )}

            {activeTab === 'performance' && (hasRole('rh') || hasRole('direction') || hasRole('admin')) && (
              <Card>
                <CardHeader>
                  <CardTitle>Évaluation de performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span>Ponctualité :</span>
                      <div className="flex items-center">
                        {[1, 2, 3, 4, 5].map(star => (
                          <Star key={star} className="w-4 h-4 text-yellow-500 fill-current" />
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Comportement :</span>
                      <div className="flex items-center">
                        {[1, 2, 3, 4].map(star => (
                          <Star key={star} className="w-4 h-4 text-yellow-500 fill-current" />
                        ))}
                        <Star className="w-4 h-4 text-gray-300" />
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Sécurité :</span>
                      <div className="flex items-center">
                        {[1, 2, 3, 4, 5].map(star => (
                          <Star key={star} className="w-4 h-4 text-yellow-500 fill-current" />
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeTab === 'incidents' && (hasRole('rh') || hasRole('direction') || hasRole('admin')) && (
              <Card>
                <CardHeader>
                  <CardTitle>Incidents et remarques</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">Aucun incident signalé.</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-2 mt-6">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Fermer
            </Button>
            {hasPermission('drivers_write') && (
              <Button className="bg-orange-500 hover:bg-orange-600">
                <Edit className="w-4 h-4 mr-2" />
                Modifier
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de visualisation de document */}
      <Dialog open={documentViewDialog.open} onOpenChange={(open) => setDocumentViewDialog({ ...documentViewDialog, open })}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <FileText className="w-5 h-5" />
              <span>{documentViewDialog.title}</span>
            </DialogTitle>
            <DialogDescription>
              Visualisation du document
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 min-h-[500px] bg-gray-50 rounded-lg flex items-center justify-center">
            <div className="text-center space-y-4">
              <FileText className="w-16 h-16 text-gray-400 mx-auto" />
              <div>
                <p className="text-lg font-medium text-gray-600">Document : {documentViewDialog.title}</p>
                <p className="text-sm text-gray-500 mt-2">
                  Ici s'affichera le document sélectionné
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  (Intégration avec le système de gestion documentaire à venir)
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setDocumentViewDialog({ ...documentViewDialog, open: false })}>
              Fermer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
