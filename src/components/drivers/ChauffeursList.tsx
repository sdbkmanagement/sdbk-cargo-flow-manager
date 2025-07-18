
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Eye, Phone, Mail, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Chauffeur {
  id: string;
  nom: string;
  prenom: string;
  telephone: string;
  email?: string;
  statut: string;
  type_permis: string[];
  date_expiration_permis: string;
  vehicule_assigne?: string;
  photo_url?: string;
}

interface ChauffeursListProps {
  chauffeurs: Chauffeur[];
  onSelectChauffeur: (chauffeur: Chauffeur) => void;
  onEditChauffeur: (chauffeur: Chauffeur) => void;
  searchTerm: string;
  hasWritePermission?: boolean;
}

export const ChauffeursList = ({ 
  chauffeurs, 
  onSelectChauffeur, 
  onEditChauffeur,
  searchTerm,
  hasWritePermission = false 
}: ChauffeursListProps) => {
  const { toast } = useToast();

  const handleModify = (chauffeur: Chauffeur) => {
    console.log('Modification du chauffeur:', chauffeur);
    if (!hasWritePermission) {
      toast({
        title: 'Accès refusé',
        description: 'Vous n\'avez pas les permissions pour modifier les chauffeurs.',
        variant: 'destructive'
      });
      return;
    }
    onEditChauffeur(chauffeur);
  };

  const getStatutBadge = (statut: string) => {
    if (statut === 'actif') {
      return <Badge className="bg-green-100 text-green-800">Actif</Badge>;
    }
    return <Badge className="bg-gray-100 text-gray-800">Inactif</Badge>;
  };

  const getAlerteBadge = (dateExpiration: string) => {
    const today = new Date();
    const expiration = new Date(dateExpiration);
    const diffTime = expiration.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) {
      return <Badge className="bg-red-100 text-red-800">Expiré</Badge>;
    } else if (diffDays <= 30) {
      return <Badge className="bg-orange-100 text-orange-800">Expire bientôt</Badge>;
    }
    return null;
  };

  // Filter chauffeurs based on searchTerm
  const filteredChauffeurs = chauffeurs.filter(chauffeur => 
    chauffeur.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    chauffeur.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    chauffeur.telephone.includes(searchTerm)
  );

  if (filteredChauffeurs.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <p className="text-gray-500">Aucun chauffeur trouvé</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4">
      {filteredChauffeurs.map((chauffeur) => (
        <Card key={chauffeur.id} className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex justify-between items-start">
              <div className="flex items-start space-x-4">
                {chauffeur.photo_url && (
                  <img
                    src={chauffeur.photo_url}
                    alt={`${chauffeur.prenom} ${chauffeur.nom}`}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                )}
                <div>
                  <CardTitle className="text-lg">
                    {chauffeur.prenom} {chauffeur.nom}
                  </CardTitle>
                  <div className="flex items-center gap-2 mt-1">
                    {getStatutBadge(chauffeur.statut)}
                    {getAlerteBadge(chauffeur.date_expiration_permis)}
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <p className="text-sm font-medium text-gray-700">Contact</p>
                <div className="space-y-1">
                  <div className="flex items-center gap-1 text-sm">
                    <Phone className="w-3 h-3" />
                    {chauffeur.telephone}
                  </div>
                  {chauffeur.email && (
                    <div className="flex items-center gap-1 text-sm">
                      <Mail className="w-3 h-3" />
                      {chauffeur.email}
                    </div>
                  )}
                </div>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-700">Permis</p>
                <div className="flex flex-wrap gap-1">
                  {chauffeur.type_permis.map((permis) => (
                    <Badge key={permis} variant="outline" className="text-xs">
                      {permis}
                    </Badge>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Expire le {new Date(chauffeur.date_expiration_permis).toLocaleDateString()}
                </p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-700">Véhicule assigné</p>
                <p className="text-sm">{chauffeur.vehicule_assigne || 'Aucun'}</p>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleModify(chauffeur)}
                className="flex items-center gap-1"
              >
                <Edit className="w-4 h-4" />
                Modifier
              </Button>
              
              <Button
                size="sm"
                variant="outline"
                onClick={() => onSelectChauffeur(chauffeur)}
                className="flex items-center gap-1"
              >
                <Eye className="w-4 h-4" />
                Voir détails
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
