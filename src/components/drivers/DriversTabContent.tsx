
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Edit, 
  Phone, 
  User,
  Calendar,
  MapPin,
  Car
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { chauffeursService } from '@/services/chauffeurs';
import { ChauffeurAvatar } from './ChauffeurAvatar';

interface DriversTabContentProps {
  searchTerm: string;
  onSelectChauffeur: (chauffeur: any) => void;
}

export const DriversTabContent: React.FC<DriversTabContentProps> = ({
  searchTerm,
  onSelectChauffeur
}) => {
  const { data: chauffeurs = [], isLoading } = useQuery({
    queryKey: ['chauffeurs'],
    queryFn: chauffeursService.getAll
  });

  const filteredChauffeurs = chauffeurs.filter(chauffeur =>
    chauffeur.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    chauffeur.prenom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    chauffeur.telephone?.includes(searchTerm) ||
    chauffeur.numero_permis?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatutBadge = (statut: string) => {
    switch (statut) {
      case 'actif':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Actif</Badge>;
      case 'inactif':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Inactif</Badge>;
      case 'suspendu':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Suspendu</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200">Inconnu</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
        <p className="mt-2 text-sm text-gray-600">Chargement des chauffeurs...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {filteredChauffeurs.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <User className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Aucun chauffeur trouvé</p>
          {searchTerm && <p className="text-sm">Essayez avec d'autres termes de recherche</p>}
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredChauffeurs.map((chauffeur) => (
            <Card key={chauffeur.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  {/* Info principale */}
                  <div className="flex items-center space-x-4">
                    <ChauffeurAvatar chauffeur={chauffeur} size="md" />
                    <div>
                      <h3 className="font-semibold text-lg">
                        {chauffeur.prenom} {chauffeur.nom}
                      </h3>
                      <p className="text-sm text-gray-600">Mat: {chauffeur.matricule}</p>
                    </div>
                  </div>

                  {/* Téléphone */}
                  <div className="flex items-center space-x-2">
                    <Phone className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">{chauffeur.telephone}</span>
                  </div>

                  {/* Permis */}
                  <div className="text-center">
                    <div className="text-sm font-medium">{chauffeur.numero_permis}</div>
                    <div className="text-xs text-gray-500">
                      {chauffeur.type_permis?.[0] || 'B'}
                    </div>
                  </div>

                  {/* Statut */}
                  <div>
                    {getStatutBadge(chauffeur.statut)}
                  </div>

                  {/* Véhicule assigné */}
                  <div className="text-center">
                    <div className="text-sm font-medium flex items-center gap-1">
                      <Car className="w-4 h-4 text-gray-500" />
                      {chauffeur.vehicule_assigne || 'Non assigné'}
                    </div>
                    <div className="text-xs text-gray-500">
                      Véhicule
                    </div>
                  </div>

                  {/* Actions */}
                  <div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onSelectChauffeur(chauffeur)}
                      className="flex items-center space-x-1"
                    >
                      <Edit className="w-4 h-4" />
                      <span>Modifier</span>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
