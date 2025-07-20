
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  AlertTriangle, 
  Calendar,
  FileText,
  User,
  Phone
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { documentsSimpleService } from '@/services/documentsSimple';
import { chauffeursService } from '@/services/chauffeurs';

export const DriversAlerts = () => {
  const { data: chauffeurs = [] } = useQuery({
    queryKey: ['chauffeurs'],
    queryFn: chauffeursService.getAll
  });

  const { data: documentsExpiring = [] } = useQuery({
    queryKey: ['documents-expiring'],
    queryFn: async () => {
      try {
        const allDocuments = [];
        for (const chauffeur of chauffeurs) {
          const docs = await documentsSimpleService.getByEntity('chauffeur', chauffeur.id);
          const expiringDocs = docs.filter(doc => {
            if (!doc.date_expiration) return false;
            const expDate = new Date(doc.date_expiration);
            const now = new Date();
            const daysUntilExpiry = Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            return daysUntilExpiry <= 30;
          }).map(doc => ({
            ...doc,
            chauffeur_nom: `${chauffeur.prenom} ${chauffeur.nom}`,
            chauffeur_telephone: chauffeur.telephone
          }));
          allDocuments.push(...expiringDocs);
        }
        return allDocuments;
      } catch (error) {
        console.error('Erreur lors de la récupération des documents:', error);
        return [];
      }
    },
    enabled: chauffeurs.length > 0
  });

  const urgentAlerts = documentsExpiring.filter(doc => {
    const expDate = new Date(doc.date_expiration);
    const now = new Date();
    const daysUntilExpiry = Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 7;
  });

  if (documentsExpiring.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-600">
            <div className="p-2 bg-green-50 rounded-lg">
              <FileText className="h-5 w-5" />
            </div>
            Alertes Chauffeurs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="text-green-600 mr-3">✓</div>
            <p className="text-sm text-green-800">Tous les documents des chauffeurs sont à jour</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="p-2 bg-orange-50 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
          </div>
          Alertes Chauffeurs
          {urgentAlerts.length > 0 && (
            <Badge className="bg-red-500 text-white ml-2">
              {urgentAlerts.length} urgent{urgentAlerts.length > 1 ? 's' : ''}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {urgentAlerts.length > 0 && (
          <div className="p-4 border-l-4 border-red-500 bg-red-50 rounded-r-lg">
            <div className="flex items-center mb-2">
              <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
              <p className="text-sm font-medium text-red-800">
                {urgentAlerts.length} document{urgentAlerts.length > 1 ? 's' : ''} expire{urgentAlerts.length > 1 ? 'nt' : ''} dans moins de 7 jours
              </p>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {documentsExpiring.slice(0, 5).map((doc, index) => {
            const expDate = new Date(doc.date_expiration);
            const now = new Date();
            const daysUntilExpiry = Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            const isUrgent = daysUntilExpiry <= 7;
            const isExpired = daysUntilExpiry < 0;

            return (
              <div 
                key={`${doc.id}-${index}`}
                className={`p-3 rounded-lg border ${
                  isExpired ? 'bg-red-50 border-red-200' :
                  isUrgent ? 'bg-orange-50 border-orange-200' : 
                  'bg-yellow-50 border-yellow-200'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <User className="h-4 w-4 text-gray-500" />
                      <span className="font-medium text-sm">{doc.chauffeur_nom}</span>
                      <Phone className="h-3 w-3 text-gray-400 ml-2" />
                      <span className="text-xs text-gray-500">{doc.chauffeur_telephone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-700">{doc.nom}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Calendar className="h-3 w-3 text-gray-400" />
                      <span className="text-xs text-gray-500">
                        Expire le {expDate.toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                  </div>
                  <Badge 
                    className={`text-xs ${
                      isExpired ? 'bg-red-500 text-white' :
                      isUrgent ? 'bg-orange-500 text-white' : 
                      'bg-yellow-500 text-white'
                    }`}
                  >
                    {isExpired ? 'Expiré' : 
                     isUrgent ? `${daysUntilExpiry}j` : 
                     `${daysUntilExpiry} jours`}
                  </Badge>
                </div>
              </div>
            );
          })}
        </div>

        {documentsExpiring.length > 5 && (
          <div className="text-center pt-2">
            <Button variant="outline" size="sm">
              Voir tous ({documentsExpiring.length})
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
