
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, FileText } from 'lucide-react';
import type { Vehicule } from '@/services/vehicules';
import { useToast } from '@/hooks/use-toast';

interface VehicleListTabProps {
  vehicles: Vehicule[];
  onEdit: (vehicleId: string) => void;
  onDelete: (vehicleId: string) => Promise<void>;
  onViewDocuments: (vehicle: Vehicule) => void;
}

export const VehicleListTab = ({ 
  vehicles, 
  onEdit, 
  onDelete, 
  onViewDocuments
}: VehicleListTabProps) => {
  const { toast } = useToast();

  const handleEdit = (vehicleId: string) => {
    console.log('Modification du véhicule:', vehicleId);
    onEdit(vehicleId);
  };

  const handleDelete = async (vehicleId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce véhicule ?')) {
      try {
        await onDelete(vehicleId);
        toast({
          title: 'Véhicule supprimé',
          description: 'Le véhicule a été supprimé avec succès.'
        });
      } catch (error) {
        toast({
          title: 'Erreur',
          description: 'Impossible de supprimer le véhicule.',
          variant: 'destructive'
        });
      }
    }
  };

  const handleViewDocuments = (vehicle: Vehicule) => {
    console.log('Affichage des documents pour:', vehicle.id);
    onViewDocuments(vehicle);
  };

  const getStatusBadge = (statut: string) => {
    const statusConfig = {
      'disponible': { label: 'Disponible', className: 'bg-green-100 text-green-800' },
      'en_mission': { label: 'En Mission', className: 'bg-blue-100 text-blue-800' },
      'maintenance': { label: 'Maintenance', className: 'bg-orange-100 text-orange-800' },
      'validation_requise': { label: 'Validation Requise', className: 'bg-yellow-100 text-yellow-800' }
    };
    
    const config = statusConfig[statut as keyof typeof statusConfig] || 
                  { label: statut, className: 'bg-gray-100 text-gray-800' };
    
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const getVehicleTypeLabel = (type: string) => {
    return type === 'porteur' ? 'Porteur' : 'Tracteur + Remorque';
  };

  if (vehicles.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <p className="text-gray-500">Aucun véhicule trouvé</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {vehicles.map((vehicle) => (
        <Card key={vehicle.id}>
          <CardHeader className="pb-3">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-lg">
                  {vehicle.numero} - {getVehicleTypeLabel(vehicle.type_vehicule)}
                </CardTitle>
                <p className="text-sm text-gray-600">
                  {vehicle.type_vehicule === 'porteur' 
                    ? `${vehicle.marque} ${vehicle.modele} (${vehicle.immatriculation})`
                    : `Tracteur: ${vehicle.tracteur_immatriculation} / Remorque: ${vehicle.remorque_immatriculation}`
                  }
                </p>
              </div>
              {getStatusBadge(vehicle.statut)}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div>
                <p className="text-sm font-medium text-gray-700">Type de transport</p>
                <p className="text-sm capitalize">{vehicle.type_transport}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Base</p>
                <p className="text-sm">{vehicle.base || 'Non assignée'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Capacité</p>
                <p className="text-sm">
                  {vehicle.capacite_max ? `${vehicle.capacite_max} ${vehicle.unite_capacite}` : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Kilométrage</p>
                <p className="text-sm">{vehicle.kilometrage?.toLocaleString()} km</p>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleEdit(vehicle.id)}
                className="flex items-center gap-1"
              >
                <Edit className="w-4 h-4" />
                Modifier
              </Button>
              
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleViewDocuments(vehicle)}
                className="flex items-center gap-1"
              >
                <FileText className="w-4 h-4" />
                Documents
              </Button>
              
              <Button
                size="sm"
                variant="destructive"
                onClick={() => handleDelete(vehicle.id)}
                className="flex items-center gap-1"
              >
                <Trash2 className="w-4 h-4" />
                Supprimer
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
