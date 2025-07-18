
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Edit, 
  Trash2, 
  Eye,
  Phone,
  Mail,
  Calendar,
  User
} from 'lucide-react';
import { ChauffeurDetailDialog } from './ChauffeurDetailDialog';

interface ChauffeursListProps {
  chauffeurs: any[];
  onSelectChauffeur: (chauffeur: any) => void;
  onEditChauffeur: (chauffeur: any) => void;
  searchTerm: string;
  hasWritePermission: boolean;
}

export const ChauffeursList = ({ 
  chauffeurs, 
  onSelectChauffeur, 
  onEditChauffeur, 
  searchTerm, 
  hasWritePermission 
}: ChauffeursListProps) => {
  const [selectedChauffeur, setSelectedChauffeur] = useState<any>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);

  const filteredChauffeurs = chauffeurs.filter(chauffeur =>
    chauffeur.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    chauffeur.prenom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    chauffeur.telephone?.includes(searchTerm) ||
    chauffeur.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleViewDetails = (chauffeur: any) => {
    console.log('Affichage des détails du chauffeur:', chauffeur.id);
    setSelectedChauffeur(chauffeur);
    setShowDetailDialog(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'actif':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'inactif':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'suspendu':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredChauffeurs.map((chauffeur) => (
          <Card key={chauffeur.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {chauffeur.prenom} {chauffeur.nom}
                    </h3>
                    <Badge className={`text-xs ${getStatusColor(chauffeur.statut)}`}>
                      {chauffeur.statut}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="space-y-2 text-sm text-gray-600 mb-4">
                <div className="flex items-center">
                  <Phone className="w-4 h-4 mr-2" />
                  <span>{chauffeur.telephone}</span>
                </div>
                {chauffeur.email && (
                  <div className="flex items-center">
                    <Mail className="w-4 h-4 mr-2" />
                    <span className="truncate">{chauffeur.email}</span>
                  </div>
                )}
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-2" />
                  <span>
                    Permis expire: {chauffeur.date_expiration_permis ? 
                      new Date(chauffeur.date_expiration_permis).toLocaleDateString('fr-FR') : 
                      'Non renseigné'}
                  </span>
                </div>
              </div>

              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleViewDetails(chauffeur)}
                  className="flex-1"
                >
                  <Eye className="w-4 h-4 mr-1" />
                  Voir détails
                </Button>
                {hasWritePermission && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEditChauffeur(chauffeur)}
                    className="flex-1"
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Modifier
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredChauffeurs.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">Aucun chauffeur trouvé</p>
        </div>
      )}

      {/* Dialog de détails du chauffeur */}
      {selectedChauffeur && (
        <ChauffeurDetailDialog
          chauffeur={selectedChauffeur}
          open={showDetailDialog}
          onOpenChange={setShowDetailDialog}
        />
      )}
    </>
  );
};
