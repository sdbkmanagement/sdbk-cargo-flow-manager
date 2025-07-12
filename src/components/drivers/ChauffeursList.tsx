import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ChauffeurDetailDialog } from './ChauffeurDetailDialog';
import { User, Phone, Calendar, AlertTriangle, Eye, Edit } from 'lucide-react';
import { chauffeursService } from '@/services/chauffeurs';
import type { Chauffeur } from '@/types/chauffeur';

interface ChauffeursListProps {
  searchTerm: string;
  onSelectChauffeur: (chauffeur: Chauffeur) => void;
}

export const ChauffeursList = ({ searchTerm, onSelectChauffeur }: ChauffeursListProps) => {
  const { hasRole } = useAuth();
  const [selectedChauffeur, setSelectedChauffeur] = useState<Chauffeur | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  // Vérifier les permissions d'écriture
  const hasWritePermission = hasRole('transport') || hasRole('admin') || hasRole('direction');

  const { data: chauffeurs = [], isLoading, error } = useQuery({
    queryKey: ['chauffeurs'],
    queryFn: chauffeursService.getAll,
  });

  // Filtrer les chauffeurs selon le terme de recherche
  const filteredChauffeurs = Array.isArray(chauffeurs) ? chauffeurs.filter(chauffeur =>
    chauffeur.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    chauffeur.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    chauffeur.telephone.includes(searchTerm) ||
    (chauffeur.email && chauffeur.email.toLowerCase().includes(searchTerm.toLowerCase()))
  ) : [];

  const getStatutBadge = (statut: string) => {
    switch (statut) {
      case 'actif':
        return <Badge className="bg-green-100 text-green-700 border-green-200">Actif</Badge>;
      case 'inactif':
        return <Badge className="bg-red-100 text-red-700 border-red-200">Inactif</Badge>;
      case 'suspendu':
        return <Badge className="bg-orange-100 text-orange-700 border-orange-200">Suspendu</Badge>;
      default:
        return <Badge variant="secondary">{statut}</Badge>;
    }
  };

  const handleViewDetails = (chauffeur: Chauffeur) => {
    setSelectedChauffeur(chauffeur);
    setDetailDialogOpen(true);
  };

  const handleEdit = (chauffeur: Chauffeur) => {
    setDetailDialogOpen(false);
    onSelectChauffeur(chauffeur);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <p>Chargement des chauffeurs...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600">Erreur lors du chargement des chauffeurs</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Liste des chauffeurs</CardTitle>
          <CardDescription>
            {filteredChauffeurs.length} chauffeur(s) trouvé(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Chauffeur</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Permis</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Véhicule assigné</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredChauffeurs.map((chauffeur) => (
                  <TableRow key={chauffeur.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium">{chauffeur.nom} {chauffeur.prenom}</p>
                          <p className="text-sm text-gray-500">
                            Créé le {new Date(chauffeur.created_at || '').toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-gray-400" />
                          <span className="text-sm">{chauffeur.telephone}</span>
                        </div>
                        {chauffeur.email && (
                          <p className="text-sm text-gray-500">{chauffeur.email}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="text-sm font-medium">{chauffeur.numero_permis}</p>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-gray-400" />
                          <span className="text-xs text-gray-500">
                            Exp: {new Date(chauffeur.date_expiration_permis).toLocaleDateString('fr-FR')}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatutBadge(chauffeur.statut || 'actif')}
                    </TableCell>
                    <TableCell>
                      {chauffeur.vehicule_assigne ? (
                        <span className="text-sm">{chauffeur.vehicule_assigne}</span>
                      ) : (
                        <span className="text-sm text-gray-500">Non assigné</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewDetails(chauffeur)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        {hasWritePermission && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onSelectChauffeur(chauffeur)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredChauffeurs.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              {searchTerm ? 
                'Aucun chauffeur trouvé avec les critères de recherche.' :
                'Aucun chauffeur enregistré.'
              }
            </div>
          )}
        </CardContent>
      </Card>

      <ChauffeurDetailDialog
        chauffeur={selectedChauffeur}
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        onEdit={handleEdit}
      />
    </>
  );
};
