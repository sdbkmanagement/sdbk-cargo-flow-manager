import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Search, 
  Filter,
  Edit,
  Trash2,
  MapPin,
  Calendar,
  Truck,
  User,
  MoreHorizontal,
  Eye,
  RefreshCw,
  CheckCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { missionsService } from '@/services/missions';
import { cn } from '@/lib/utils';
import { MissionClosureDialog } from './MissionClosureDialog';
import { MissionTrackingButton } from './MissionTrackingButton';

interface MissionsTableProps {
  missions: any[];
  onEdit: (mission: any) => void;
  hasWritePermission: boolean;
  onRefresh: () => void;
  showHistoryFilters?: boolean;
}

export const MissionsTable = ({ missions, onEdit, hasWritePermission, onRefresh, showHistoryFilters = false }: MissionsTableProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedMissionForClosure, setSelectedMissionForClosure] = useState(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { hasRole, hasPermission } = useAuth();

  // Vérifier si l'utilisateur peut clôturer une mission
  const canCloseMission = hasRole('admin') || hasRole('transport') || hasPermission('missions_write');

  const deleteMissionMutation = useMutation({
    mutationFn: missionsService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['missions'] });
      toast({
        title: "Mission supprimée",
        description: "La mission a été supprimée avec succès",
      });
      onRefresh();
    },
    onError: (error) => {
      console.error('Erreur lors de la suppression:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la mission",
        variant: "destructive",
      });
    }
  });

  const handleDeleteMission = (mission: any) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer la mission ${mission.numero} ?`)) {
      console.log('Suppression de la mission:', mission.id);
      deleteMissionMutation.mutate(mission.id);
    }
  };

  const handleCloseMission = (mission: any) => {
    setSelectedMissionForClosure(mission);
  };

  const handleClosureSuccess = () => {
    setSelectedMissionForClosure(null);
    onRefresh();
  };

  const getStatusColor = (status: string) => {
    const colors = {
      'en_attente': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'en_cours': 'bg-sdbk-green/10 text-sdbk-green border-green-200',
      'terminee': 'bg-blue-100 text-sdbk-blue border-blue-200',
      'annulee': 'bg-red-100 text-sdbk-red border-red-200'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      'en_attente': 'En attente',
      'en_cours': 'En cours',
      'terminee': 'Terminée',
      'annulee': 'Annulée'
    };
    return labels[status as keyof typeof labels] || status;
  };

  const filteredMissions = missions.filter(mission => {
    const matchesSearch = 
      mission.numero?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mission.chauffeur?.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mission.chauffeur?.prenom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mission.vehicule?.numero?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mission.site_depart?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mission.site_arrivee?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || mission.statut === statusFilter;
    const matchesType = typeFilter === 'all' || mission.type_transport === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  return (
    <>
      <Card className="sdbk-card">
        <CardHeader className="border-b border-gray-100 bg-gray-50/50">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-sdbk-blue/10 rounded-lg">
                <Calendar className="w-5 h-5 text-sdbk-blue" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold text-gray-900">
                  Missions ({filteredMissions.length})
                </CardTitle>
                <p className="text-sm text-gray-500 mt-1">
                  Gestion des missions de transport
                </p>
              </div>
            </div>
            <Button 
              onClick={onRefresh} 
              variant="outline" 
              size="sm"
              className="hover:bg-sdbk-blue hover:text-white transition-colors duration-200"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Actualiser
            </Button>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 mt-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Rechercher par numéro, chauffeur, véhicule..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 sdbk-input"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[200px] sdbk-input">
                <SelectValue placeholder="Filtrer par statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="en_attente">En attente</SelectItem>
                <SelectItem value="en_cours">En cours</SelectItem>
                <SelectItem value="terminee">Terminée</SelectItem>
                <SelectItem value="annulee">Annulée</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[200px] sdbk-input">
                <SelectValue placeholder="Filtrer par type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                <SelectItem value="hydrocarbures">Hydrocarbures</SelectItem>
                <SelectItem value="bauxite">Bauxite</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="sdbk-table-header">
                  <th className="text-left py-4 px-6 font-semibold text-gray-900">Citerne</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-900">Prénoms et Nom du Chauffeur</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-900">N°BL</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-900">N° Tournée</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-900">Nombre de BL</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-900">Capacité</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-900">Quantité / Litre</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-900">Produits</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-900">Provenance</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-900">Destinations</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredMissions.map((mission) => {
                  const firstBL = mission.bons_livraison?.[0];
                  const nombreBL = mission.bons_livraison?.length || 0;
                  const citerne = mission.vehicule?.remorque_immatriculation || 
                                 mission.vehicule?.immatriculation || 
                                 mission.vehicule?.numero || 
                                 '-';
                  
                  return (
                    <tr key={mission.id} className="sdbk-table-row">
                      {/* Citerne */}
                      <td className="py-4 px-6">
                        <span className="font-semibold text-gray-900">
                          {citerne}
                        </span>
                      </td>
                      
                      {/* Prénoms et Nom du Chauffeur */}
                      <td className="py-4 px-6">
                        <span className="font-medium text-gray-900">
                          {mission.chauffeur ? 
                            `${mission.chauffeur.prenom} ${mission.chauffeur.nom}` : 
                            '-'
                          }
                        </span>
                      </td>
                      
                      {/* N°BL */}
                      <td className="py-4 px-6">
                        <span className="text-sm text-gray-900">
                          {firstBL?.numero || '-'}
                        </span>
                      </td>
                      
                      {/* N° Tournée */}
                      <td className="py-4 px-6">
                        <span className="text-sm text-gray-900">
                          {firstBL?.numero_tournee || '-'}
                        </span>
                      </td>
                      
                      {/* Nombre de BL */}
                      <td className="py-4 px-6">
                        <Badge variant="outline" className="font-medium">
                          {nombreBL}
                        </Badge>
                      </td>
                      
                      {/* Capacité */}
                      <td className="py-4 px-6">
                        <span className="text-sm text-gray-900">
                          {mission.vehicule?.capacite_citerne || '-'}
                        </span>
                      </td>
                      
                      {/* Quantité / Litre */}
                      <td className="py-4 px-6">
                        <span className="text-sm text-gray-900">
                          {firstBL?.quantite_prevue ? `${firstBL.quantite_prevue}` : '-'}
                        </span>
                      </td>
                      
                      {/* Produits */}
                      <td className="py-4 px-6">
                        <Badge 
                          variant="outline"
                          className={cn(
                            "font-medium uppercase text-xs",
                            firstBL?.produit === 'essence' 
                              ? 'bg-green-50 text-green-700 border-green-200' 
                              : 'bg-orange-50 text-orange-700 border-orange-200'
                          )}
                        >
                          {firstBL?.produit || '-'}
                        </Badge>
                      </td>
                      
                      {/* Provenance */}
                      <td className="py-4 px-6">
                        <span className="text-sm text-gray-900">
                          {firstBL?.lieu_depart || mission.site_depart || '-'}
                        </span>
                      </td>
                      
                      {/* Destinations */}
                      <td className="py-4 px-6">
                        <span className="text-sm text-gray-900">
                          {firstBL?.destination || mission.site_arrivee || '-'}
                        </span>
                      </td>
                      
                      {/* Actions */}
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onEdit(mission)}
                            className="hover:bg-sdbk-blue/10 hover:text-sdbk-blue transition-colors duration-200"
                            title="Modifier la mission"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          
                          {canCloseMission && mission.statut === 'en_cours' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCloseMission(mission)}
                              className="hover:bg-green-50 hover:text-green-600 transition-colors duration-200"
                              title="Clôturer la mission"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </Button>
                          )}
                          
                          {hasWritePermission && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteMission(mission)}
                              className="hover:bg-red-50 hover:text-sdbk-red transition-colors duration-200"
                              title="Supprimer la mission"
                              disabled={deleteMissionMutation.isPending}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            
            {filteredMissions.length === 0 && (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Calendar className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-500 font-medium">Aucune mission trouvée</p>
                <p className="text-sm text-gray-400 mt-1">
                  Essayez de modifier vos critères de recherche
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dialog de clôture de mission */}
      {selectedMissionForClosure && (
        <MissionClosureDialog
          mission={selectedMissionForClosure}
          onClose={() => setSelectedMissionForClosure(null)}
          onSuccess={handleClosureSuccess}
        />
      )}
    </>
  );
};
