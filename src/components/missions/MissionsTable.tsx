
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Search, 
  Filter,
  Edit,
  Trash2,
  MapPin,
  Calendar,
  Truck,
  User
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { missionsService } from '@/services/missions';

interface MissionsTableProps {
  missions: any[];
  onEdit: (mission: any) => void;
  hasWritePermission: boolean;
  onRefresh: () => void;
}

export const MissionsTable = ({ missions, onEdit, hasWritePermission, onRefresh }: MissionsTableProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const { toast } = useToast();
  const queryClient = useQueryClient();

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

  const getStatusColor = (status: string) => {
    const colors = {
      'en_attente': 'bg-yellow-100 text-yellow-800',
      'en_cours': 'bg-green-100 text-green-800',
      'terminee': 'bg-blue-100 text-blue-800',
      'annulee': 'bg-red-100 text-red-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
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
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <CardTitle className="flex items-center">
            <Calendar className="w-5 h-5 mr-2" />
            Liste des missions ({filteredMissions.length})
          </CardTitle>
          <Button onClick={onRefresh} variant="outline" size="sm">
            Actualiser
          </Button>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Rechercher par numéro, chauffeur, véhicule..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
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
            <SelectTrigger className="w-[180px]">
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
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4 font-medium">Numéro</th>
                <th className="text-left py-3 px-4 font-medium">Type</th>
                <th className="text-left py-3 px-4 font-medium">Trajet</th>
                <th className="text-left py-3 px-4 font-medium">Véhicule</th>
                <th className="text-left py-3 px-4 font-medium">Chauffeur</th>
                <th className="text-left py-3 px-4 font-medium">Date départ</th>
                <th className="text-left py-3 px-4 font-medium">Statut</th>
                <th className="text-left py-3 px-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredMissions.map((mission) => (
                <tr key={mission.id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium text-blue-600">
                    {mission.numero}
                  </td>
                  <td className="py-3 px-4">
                    <Badge variant="outline" className={
                      mission.type_transport === 'hydrocarbures' 
                        ? 'border-red-200 text-red-700' 
                        : 'border-orange-200 text-orange-700'
                    }>
                      {mission.type_transport === 'hydrocarbures' ? 'Hydrocarbures' : 'Bauxite'}
                    </Badge>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center text-sm">
                      <MapPin className="w-4 h-4 mr-1 text-gray-400" />
                      <span className="truncate max-w-[120px]">
                        {mission.site_depart} → {mission.site_arrivee}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center text-sm">
                      <Truck className="w-4 h-4 mr-1 text-gray-400" />
                      {mission.vehicule?.numero}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center text-sm">
                      <User className="w-4 h-4 mr-1 text-gray-400" />
                      {mission.chauffeur?.prenom} {mission.chauffeur?.nom}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm">
                    {mission.date_heure_depart && format(
                      new Date(mission.date_heure_depart), 
                      'dd/MM/yyyy HH:mm', 
                      { locale: fr }
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <Badge className={getStatusColor(mission.statut)}>
                      {getStatusLabel(mission.statut)}
                    </Badge>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(mission)}
                        title="Modifier la mission"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      {hasWritePermission && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteMission(mission)}
                          className="text-red-600 hover:text-red-800 hover:bg-red-50"
                          title="Supprimer la mission"
                          disabled={deleteMissionMutation.isPending}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredMissions.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Aucune mission trouvée
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
