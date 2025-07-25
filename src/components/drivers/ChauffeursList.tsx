
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { chauffeursService } from '@/services/chauffeurs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Search, 
  User, 
  Phone, 
  Eye,
  Edit,
  Trash2,
  UserPlus,
  Filter
} from 'lucide-react';
import { ChauffeurDetailDialog } from './ChauffeurDetailDialog';
import { useToast } from '@/hooks/use-toast';
import { ChauffeurAvatar } from './ChauffeurAvatar';

interface ChauffeursListProps {
  chauffeurs: any[];
  onSelectChauffeur: (chauffeur: any) => void;
  onEditChauffeur: (chauffeur: any) => void;
  searchTerm: string;
  hasWritePermission: boolean;
}

export const ChauffeursList = ({ 
  chauffeurs: propChauffeurs, 
  onSelectChauffeur, 
  onEditChauffeur, 
  searchTerm, 
  hasWritePermission 
}: ChauffeursListProps) => {
  const [statusFilter, setStatusFilter] = useState('tous');
  const [selectedChauffeur, setSelectedChauffeur] = useState<any>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const { toast } = useToast();

  // Utiliser les chauffeurs passés en props ou charger depuis l'API si pas fournis
  const { data: fetchedChauffeurs = [], isLoading, refetch } = useQuery({
    queryKey: ['chauffeurs'],
    queryFn: chauffeursService.getAll,
    enabled: !propChauffeurs || propChauffeurs.length === 0
  });

  const chauffeurs = propChauffeurs && propChauffeurs.length > 0 ? propChauffeurs : fetchedChauffeurs;

  const filteredChauffeurs = chauffeurs.filter(chauffeur => {
    const matchesSearch = 
      chauffeur.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      chauffeur.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      chauffeur.telephone.includes(searchTerm) ||
      chauffeur.numero_permis.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'tous' || chauffeur.statut === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleDelete = async (chauffeur: any) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer ${chauffeur.prenom} ${chauffeur.nom} ?`)) {
      return;
    }

    try {
      await chauffeursService.delete(chauffeur.id);
      toast({
        title: "Chauffeur supprimé",
        description: `${chauffeur.prenom} ${chauffeur.nom} a été supprimé avec succès.`,
      });
      refetch();
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le chauffeur.",
        variant: "destructive",
      });
    }
  };

  const handleViewDetails = (chauffeur: any) => {
    setSelectedChauffeur(chauffeur);
    setShowDetailDialog(true);
  };

  const getStatutBadge = (statut: string) => {
    const statusConfig = {
      'actif': { label: 'Actif', color: 'bg-green-500' },
      'inactif': { label: 'Inactif', color: 'bg-red-500' },
      'conge': { label: 'En congé', color: 'bg-blue-500' },
      'maladie': { label: 'Maladie', color: 'bg-orange-500' },
      'suspendu': { label: 'Suspendu', color: 'bg-gray-500' }
    };
    
    const config = statusConfig[statut as keyof typeof statusConfig] || { label: statut, color: 'bg-gray-400' };
    return <Badge className={`${config.color} text-white`}>{config.label}</Badge>;
  };

  if (isLoading && !propChauffeurs) {
    return (
      <Card>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-500 mt-2">Chargement des chauffeurs...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filtres */}
      <div className="flex gap-4 mb-6">
        <div className="w-48">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
          >
            <option value="tous">Tous les statuts</option>
            <option value="actif">Actif</option>
            <option value="inactif">Inactif</option>
            <option value="conge">En congé</option>
            <option value="maladie">Maladie</option>
            <option value="suspendu">Suspendu</option>
          </select>
        </div>
      </div>

      {/* Tableau */}
      {filteredChauffeurs.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <User className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>Aucun chauffeur trouvé</p>
          {searchTerm && (
            <p className="text-sm">Essayez de modifier vos critères de recherche</p>
          )}
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom complet</TableHead>
              <TableHead>Téléphone</TableHead>
              <TableHead>Permis</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Véhicule assigné</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredChauffeurs.map((chauffeur) => (
              <TableRow key={chauffeur.id}>
                <TableCell>
                  <div className="flex items-center space-x-3">
                    <ChauffeurAvatar chauffeur={chauffeur} size="sm" />
                    <div>
                      <div className="font-medium">
                        {chauffeur.prenom} {chauffeur.nom}
                      </div>
                      {chauffeur.matricule && (
                        <div className="text-sm text-gray-500">
                          Mat: {chauffeur.matricule}
                        </div>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center">
                    <Phone className="w-4 h-4 mr-2 text-gray-400" />
                    {chauffeur.telephone}
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-mono text-sm">{chauffeur.numero_permis}</div>
                    <div className="flex gap-1 mt-1">
                      {chauffeur.type_permis?.map((type: string, index: number) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {type}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  {getStatutBadge(chauffeur.statut)}
                </TableCell>
                <TableCell>
                  {chauffeur.vehicule_assigne ? (
                    <span className="text-sm">{chauffeur.vehicule_assigne}</span>
                  ) : (
                    <span className="text-sm text-gray-400">Non assigné</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewDetails(chauffeur)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    {hasWritePermission && onEditChauffeur && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEditChauffeur(chauffeur)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    )}
                    {hasWritePermission && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(chauffeur)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Dialog de détails */}
      <ChauffeurDetailDialog
        chauffeur={selectedChauffeur}
        open={showDetailDialog}
        onOpenChange={setShowDetailDialog}
      />
    </div>
  );
};
