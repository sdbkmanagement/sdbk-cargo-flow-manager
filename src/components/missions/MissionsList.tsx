
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { 
  Truck, 
  User, 
  MapPin, 
  Calendar,
  Clock,
  Edit,
  Trash2,
  Eye,
  Package
} from 'lucide-react';
import { missionsService, type MissionWithDetails } from '@/services/missions';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface MissionsListProps {
  searchTerm?: string;
  statusFilter?: string;
  typeFilter?: string;
  onEditMission: (mission: MissionWithDetails) => void;
}

export const MissionsList = ({ 
  searchTerm = '', 
  statusFilter = '', 
  typeFilter = '',
  onEditMission 
}: MissionsListProps) => {
  const { toast } = useToast();
  const [missions, setMissions] = useState<MissionWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMission, setSelectedMission] = useState<MissionWithDetails | null>(null);

  useEffect(() => {
    loadMissions();
  }, []);

  const loadMissions = async () => {
    try {
      setLoading(true);
      const data = await missionsService.getAll();
      setMissions(data);
    } catch (error) {
      console.error('Erreur lors du chargement des missions:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les missions.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMission = async (mission: MissionWithDetails) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer la mission ${mission.numero} ?`)) {
      try {
        await missionsService.delete(mission.id);
        toast({
          title: "Mission supprimée",
          description: "La mission a été supprimée avec succès.",
        });
        loadMissions();
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        toast({
          title: "Erreur",
          description: "Impossible de supprimer la mission.",
          variant: "destructive"
        });
      }
    }
  };

  const getStatusBadge = (statut: string) => {
    const statusConfig = {
      'en_attente': { label: 'En attente', className: 'bg-yellow-100 text-yellow-800' },
      'en_cours': { label: 'En cours', className: 'bg-blue-100 text-blue-800' },
      'terminee': { label: 'Terminée', className: 'bg-green-100 text-green-800' },
      'annulee': { label: 'Annulée', className: 'bg-red-100 text-red-800' }
    };
    
    const config = statusConfig[statut as keyof typeof statusConfig] || statusConfig.en_attente;
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const getTransportTypeBadge = (type: string) => {
    const typeConfig = {
      'hydrocarbures': { label: 'Hydrocarbures', className: 'bg-purple-100 text-purple-800' },
      'bauxite': { label: 'Bauxite', className: 'bg-orange-100 text-orange-800' }
    };
    
    const config = typeConfig[type as keyof typeof typeConfig];
    return config ? <Badge variant="outline" className={config.className}>{config.label}</Badge> : null;
  };

  const filteredMissions = missions.filter(mission => {
    const matchesSearch = !searchTerm || 
      mission.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mission.site_depart.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mission.site_arrivee.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mission.vehicule?.immatriculation?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${mission.chauffeur?.prenom} ${mission.chauffeur?.nom}`.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = !statusFilter || mission.statut === statusFilter;
    const matchesType = !typeFilter || mission.type_transport === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Chargement des missions...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {filteredMissions.length === 0 ? (
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-gray-500">
              {searchTerm || statusFilter || typeFilter 
                ? 'Aucune mission ne correspond aux critères de recherche.' 
                : 'Aucune mission enregistrée.'
              }
            </div>
          </CardContent>
        </Card>
      ) : (
        filteredMissions.map((mission) => (
          <Card key={mission.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="font-semibold text-lg">{mission.numero}</h3>
                    {getTransportTypeBadge(mission.type_transport)}
                    {getStatusBadge(mission.statut)}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPin className="w-4 h-4 mr-2" />
                        <span>De: <strong>{mission.site_depart}</strong></span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPin className="w-4 h-4 mr-2" />
                        <span>Vers: <strong>{mission.site_arrivee}</strong></span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="w-4 h-4 mr-2" />
                        <span>Départ: <strong>{format(new Date(mission.date_heure_depart), 'dd/MM/yyyy HH:mm', { locale: fr })}</strong></span>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center text-sm text-gray-600">
                        <Truck className="w-4 h-4 mr-2" />
                        <span>Véhicule: <strong>{mission.vehicule?.numero} - {mission.vehicule?.immatriculation}</strong></span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <User className="w-4 h-4 mr-2" />
                        <span>Chauffeur: <strong>{mission.chauffeur?.prenom} {mission.chauffeur?.nom}</strong></span>
                      </div>
                      {mission.volume_poids && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Package className="w-4 h-4 mr-2" />
                          <span>Volume: <strong>{mission.volume_poids} {mission.unite_mesure}</strong></span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 ml-4">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" onClick={() => setSelectedMission(mission)}>
                        <Eye className="w-4 h-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Détails de la mission {mission.numero}</DialogTitle>
                      </DialogHeader>
                      {selectedMission && (
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <h4 className="font-medium">Informations générales</h4>
                              <div className="space-y-1 text-sm">
                                <p><strong>Type:</strong> {mission.type_transport}</p>
                                <p><strong>Statut:</strong> {mission.statut}</p>
                                <p><strong>Créée le:</strong> {format(new Date(mission.created_at), 'dd/MM/yyyy HH:mm', { locale: fr })}</p>
                              </div>
                            </div>
                            <div>
                              <h4 className="font-medium">Transport</h4>
                              <div className="space-y-1 text-sm">
                                <p><strong>Volume/Poids:</strong> {mission.volume_poids} {mission.unite_mesure}</p>
                                <p><strong>Arrivée prévue:</strong> {format(new Date(mission.date_heure_arrivee_prevue), 'dd/MM/yyyy HH:mm', { locale: fr })}</p>
                              </div>
                            </div>
                          </div>
                          {mission.observations && (
                            <div>
                              <h4 className="font-medium">Observations</h4>
                              <p className="text-sm bg-gray-50 p-2 rounded">{mission.observations}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>
                  
                  <Button variant="outline" size="sm" onClick={() => onEditMission(mission)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleDeleteMission(mission)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
};
