
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  User, 
  Phone, 
  Calendar,
  AlertTriangle,
  Edit,
  FileText
} from 'lucide-react';
import { ChauffeurDetailDialog } from './ChauffeurDetailDialog';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { chauffeursService } from '@/services/chauffeurs';
import type { Database } from '@/integrations/supabase/types';

type Chauffeur = Database['public']['Tables']['chauffeurs']['Row'];

interface ChauffeursListProps {
  searchTerm: string;
  onSelectChauffeur: (chauffeur: any) => void;
}

export const ChauffeursList = ({ searchTerm, onSelectChauffeur }: ChauffeursListProps) => {
  const { hasPermission } = useAuth();
  const [selectedChauffeur, setSelectedChauffeur] = useState(null);
  const [showDetail, setShowDetail] = useState(false);

  const { data: chauffeurs = [], isLoading, error } = useQuery({
    queryKey: ['chauffeurs'],
    queryFn: chauffeursService.getAll,
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Chargement des chauffeurs...</div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            Erreur lors du chargement des chauffeurs
          </div>
        </CardContent>
      </Card>
    );
  }

  const filteredChauffeurs = chauffeurs.filter((chauffeur: Chauffeur) =>
    chauffeur.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    chauffeur.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (chauffeur.email && chauffeur.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getStatutBadge = (statut: string | null) => {
    const statusValue = statut || 'actif';
    const variants = {
      'actif': 'default',
      'conge': 'secondary',
      'maladie': 'destructive',
      'suspendu': 'destructive'
    } as const;
    
    return (
      <Badge variant={variants[statusValue as keyof typeof variants] || 'secondary'}>
        {statusValue.charAt(0).toUpperCase() + statusValue.slice(1)}
      </Badge>
    );
  };

  const handleViewDetail = (chauffeur: any) => {
    setSelectedChauffeur(chauffeur);
    setShowDetail(true);
  };

  const getAlertes = (chauffeur: Chauffeur) => {
    let alertes = 0;
    const today = new Date();
    const expirationDate = new Date(chauffeur.date_expiration_permis);
    const diffTime = expirationDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // Alerte si le permis expire dans moins de 30 jours
    if (diffDays < 30) {
      alertes++;
    }
    
    return alertes;
  };

  const getInitials = (nom: string, prenom: string) => {
    return `${prenom.charAt(0)}${nom.charAt(0)}`.toUpperCase();
  };

  return (
    <>
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Chauffeur</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Permis</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Véhicule assigné</TableHead>
                  <TableHead>Alertes</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredChauffeurs.map((chauffeur: Chauffeur) => {
                  const alertes = getAlertes(chauffeur);
                  return (
                    <TableRow key={chauffeur.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <Avatar className="w-10 h-10">
                            <AvatarImage 
                              src={chauffeur.photo_url || undefined} 
                              alt={`${chauffeur.prenom} ${chauffeur.nom}`} 
                            />
                            <AvatarFallback className="bg-orange-100 text-orange-700">
                              {getInitials(chauffeur.nom, chauffeur.prenom)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{chauffeur.prenom} {chauffeur.nom}</div>
                            <div className="text-sm text-gray-500">{chauffeur.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center text-sm">
                          <Phone className="w-4 h-4 mr-1" />
                          {chauffeur.telephone}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {chauffeur.type_permis.map(permis => (
                            <Badge key={permis} variant="outline" className="text-xs">
                              {permis}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatutBadge(chauffeur.statut)}
                      </TableCell>
                      <TableCell>
                        {chauffeur.vehicule_assigne ? (
                          <Badge variant="secondary">{chauffeur.vehicule_assigne}</Badge>
                        ) : (
                          <span className="text-gray-400">Non assigné</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {alertes > 0 ? (
                          <div className="flex items-center text-orange-600">
                            <AlertTriangle className="w-4 h-4 mr-1" />
                            {alertes}
                          </div>
                        ) : (
                          <span className="text-green-600">Aucune</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewDetail(chauffeur)}
                          >
                            <FileText className="w-4 h-4" />
                          </Button>
                          {hasPermission('drivers_write') && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onSelectChauffeur(chauffeur)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {showDetail && selectedChauffeur && (
        <ChauffeurDetailDialog
          chauffeur={selectedChauffeur}
          open={showDetail}
          onOpenChange={setShowDetail}
        />
      )}
    </>
  );
};
