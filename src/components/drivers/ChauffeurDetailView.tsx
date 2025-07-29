
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  FileText, 
  Calendar, 
  Phone, 
  Mail, 
  MapPin, 
  Car,
  Upload,
  AlertTriangle
} from 'lucide-react';
import { CHAUFFEUR_DOCUMENT_TYPES } from '@/types/chauffeur';
import { DocumentManagerChauffeur } from './DocumentManagerChauffeur';

interface ChauffeurDetailViewProps {
  chauffeur: any;
  documents?: any[];
  onRefresh?: () => void;
}

export const ChauffeurDetailView = ({ chauffeur, documents = [], onRefresh }: ChauffeurDetailViewProps) => {
  const [showDocumentManager, setShowDocumentManager] = useState(false);

  const getDocumentStatus = (document: any) => {
    if (!document.date_expiration) {
      return { variant: 'secondary' as const, text: 'Permanent' };
    }
    
    const now = new Date();
    const expDate = new Date(document.date_expiration);
    const daysUntilExpiry = Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry < 0) {
      return { variant: 'destructive' as const, text: 'Expiré' };
    } else if (daysUntilExpiry <= 30) {
      return { variant: 'default' as const, text: 'À renouveler' };
    } else {
      return { variant: 'secondary' as const, text: 'Valide' };
    }
  };

  const getStatutBadge = (statut: string) => {
    switch (statut) {
      case 'actif':
        return <Badge className="bg-green-100 text-green-800">Actif</Badge>;
      case 'conge':
        return <Badge className="bg-blue-100 text-blue-800">En congé</Badge>;
      case 'maladie':
        return <Badge className="bg-yellow-100 text-yellow-800">Maladie</Badge>;
      case 'suspendu':
        return <Badge variant="destructive">Suspendu</Badge>;
      default:
        return <Badge variant="secondary">{statut}</Badge>;
    }
  };

  const getRequiredDocuments = () => {
    return Object.entries(CHAUFFEUR_DOCUMENT_TYPES).filter(([_, config]) => config.obligatoire);
  };

  const getMissingDocuments = () => {
    const requiredDocs = getRequiredDocuments();
    const existingTypes = documents.map(doc => doc.type);
    return requiredDocs.filter(([type]) => !existingTypes.includes(type));
  };

  const getExpiringDocuments = () => {
    const now = new Date();
    return documents.filter(doc => {
      if (!doc.date_expiration) return false;
      const expDate = new Date(doc.date_expiration);
      const daysUntilExpiry = Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return daysUntilExpiry <= 30 && daysUntilExpiry >= 0;
    });
  };

  const getExpiredDocuments = () => {
    const now = new Date();
    return documents.filter(doc => {
      if (!doc.date_expiration) return false;
      const expDate = new Date(doc.date_expiration);
      return expDate < now;
    });
  };

  return (
    <div className="space-y-6">
      {/* Informations personnelles */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Informations personnelles</span>
            {getStatutBadge(chauffeur.statut)}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="flex items-center space-x-2">
              <Phone className="w-4 h-4 text-gray-500" />
              <span className="text-sm">{chauffeur.telephone}</span>
            </div>
            
            {chauffeur.email && (
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4 text-gray-500" />
                <span className="text-sm">{chauffeur.email}</span>
              </div>
            )}
            
            {chauffeur.adresse && (
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-gray-500" />
                <span className="text-sm">{chauffeur.adresse}</span>
              </div>
            )}
            
            {chauffeur.date_naissance && (
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span className="text-sm">
                  Né le {new Date(chauffeur.date_naissance).toLocaleDateString('fr-FR')}
                </span>
              </div>
            )}

            {chauffeur.vehicule_assigne && (
              <div className="flex items-center space-x-2">
                <Car className="w-4 h-4 text-gray-500" />
                <span className="text-sm">Véhicule: {chauffeur.vehicule_assigne}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Informations permis */}
      <Card>
        <CardHeader>
          <CardTitle>Permis de conduire</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <span className="text-sm font-medium text-gray-500">Numéro de permis</span>
              <p className="text-sm">{chauffeur.numero_permis}</p>
            </div>
            
            <div>
              <span className="text-sm font-medium text-gray-500">Types autorisés</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {chauffeur.type_permis?.map((type: string) => (
                  <Badge key={type} variant="outline" className="text-xs">
                    {type}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Résumé de conformité */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2 text-orange-500" />
            État de conformité
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-red-50 p-4 rounded-lg">
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{getMissingDocuments().length}</div>
                <div className="text-sm text-red-600">Documents manquants</div>
              </div>
            </div>
            
            <div className="bg-orange-50 p-4 rounded-lg">
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{getExpiringDocuments().length}</div>
                <div className="text-sm text-orange-600">À renouveler</div>
              </div>
            </div>
            
            <div className="bg-red-50 p-4 rounded-lg">
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{getExpiredDocuments().length}</div>
                <div className="text-sm text-red-600">Expirés</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Documents manquants */}
      {getMissingDocuments().length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-red-600">
              <AlertTriangle className="w-5 h-5 mr-2" />
              Documents manquants
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              {getMissingDocuments().map(([type, config]) => (
                <div key={type} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <FileText className="w-4 h-4 text-red-500" />
                    <span className="text-sm font-medium">{config.label}</span>
                  </div>
                  <Badge variant="destructive" className="text-xs">
                    Requis
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Documents */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <FileText className="w-5 h-5 mr-2" />
              Documents ({documents.length})
            </div>
            <Button
              onClick={() => setShowDocumentManager(true)}
              size="sm"
            >
              <Upload className="w-4 h-4 mr-2" />
              Gérer les documents
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {documents.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Aucun document ajouté</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {documents.map((doc) => {
                const status = getDocumentStatus(doc);
                const docType = CHAUFFEUR_DOCUMENT_TYPES[doc.type as keyof typeof CHAUFFEUR_DOCUMENT_TYPES];
                
                return (
                  <div key={doc.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <FileText className="w-5 h-5 text-blue-500" />
                        <div>
                          <h4 className="font-medium">{doc.nom}</h4>
                          <div className="flex items-center space-x-2 text-sm text-gray-500">
                            <span>{docType?.label || doc.type}</span>
                            {doc.date_expiration && (
                              <>
                                <span>•</span>
                                <span>Expire le {new Date(doc.date_expiration).toLocaleDateString('fr-FR')}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={status.variant}>
                          {status.text}
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(doc.url, '_blank')}
                        >
                          Voir
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de gestion des documents */}
      {showDocumentManager && (
        <DocumentManagerChauffeur
          chauffeurId={chauffeur.id}
          chauffeurNom={`${chauffeur.prenom} ${chauffeur.nom}`}
          open={showDocumentManager}
          onOpenChange={setShowDocumentManager}
          onSuccess={() => {
            onRefresh?.();
            setShowDocumentManager(false);
          }}
        />
      )}
    </div>
  );
};
