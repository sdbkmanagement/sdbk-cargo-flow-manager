
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Truck, Edit, FileText, Wrench, Trash2, AlertTriangle } from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';

type Vehicule = Database['public']['Tables']['vehicules']['Row'] & {
  chauffeur?: {
    nom: string;
    prenom: string;
  } | null;
};

interface VehicleTableProps {
  vehicles: Vehicule[];
  onEdit: (vehicule: Vehicule) => void;
  onDelete: (id: string) => void;
  onViewDocuments?: (vehicule: Vehicule) => void;
  onViewMaintenance?: (vehicule: Vehicule) => void;
}

export const VehicleTable = ({ 
  vehicles, 
  onEdit, 
  onDelete, 
  onViewDocuments, 
  onViewMaintenance 
}: VehicleTableProps) => {
  const getStatusBadge = (statut: string) => {
    const variants = {
      'disponible': 'bg-green-100 text-green-800',
      'en_mission': 'bg-blue-100 text-blue-800',
      'maintenance': 'bg-orange-100 text-orange-800',
      'validation_requise': 'bg-red-100 text-red-800'
    };
    
    const labels = {
      'disponible': 'Disponible',
      'en_mission': 'En mission',
      'maintenance': 'Maintenance',
      'validation_requise': 'Validation requise'
    };

    return (
      <Badge className={variants[statut as keyof typeof variants]}>
        {labels[statut as keyof typeof labels]}
      </Badge>
    );
  };

  const getTransportTypeBadge = (type: string) => {
    return (
      <Badge variant={type === 'hydrocarbures' ? 'destructive' : 'secondary'}>
        {type === 'hydrocarbures' ? 'Hydrocarbures' : 'Bauxite'}
      </Badge>
    );
  };

  const canDeleteVehicle = (vehicle: Vehicule) => {
    // Un véhicule peut être supprimé s'il n'est pas en mission ou assigné
    return vehicle.statut === 'disponible' && !vehicle.chauffeur_assigne;
  };

  const handleDeleteClick = (vehicle: Vehicule) => {
    if (!canDeleteVehicle(vehicle)) {
      let reason = '';
      if (vehicle.statut === 'en_mission') {
        reason = 'Ce véhicule est actuellement en mission et ne peut pas être supprimé.';
      } else if (vehicle.chauffeur_assigne) {
        reason = 'Ce véhicule est assigné à un chauffeur et ne peut pas être supprimé.';
      } else if (vehicle.statut === 'maintenance') {
        reason = 'Ce véhicule est en maintenance et ne peut pas être supprimé.';
      } else {
        reason = 'Ce véhicule ne peut pas être supprimé en raison de son statut actuel.';
      }
      
      alert(`Suppression impossible: ${reason}`);
      return;
    }
    
    onDelete(vehicle.id);
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Véhicule</TableHead>
          <TableHead>Immatriculation</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Chauffeur</TableHead>
          <TableHead>Statut</TableHead>
          <TableHead>Prochaine maintenance</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {vehicles.map((vehicle) => (
          <TableRow key={vehicle.id}>
            <TableCell>
              <div className="flex items-center space-x-3">
                <Truck className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">{vehicle.numero}</p>
                  <p className="text-sm text-muted-foreground">
                    {vehicle.marque} {vehicle.modele}
                  </p>
                </div>
              </div>
            </TableCell>
            <TableCell>{vehicle.immatriculation}</TableCell>
            <TableCell>
              {getTransportTypeBadge(vehicle.type_transport)}
            </TableCell>
            <TableCell>
              {vehicle.chauffeur 
                ? `${vehicle.chauffeur.prenom} ${vehicle.chauffeur.nom}`
                : 'Non assigné'
              }
            </TableCell>
            <TableCell>
              {getStatusBadge(vehicle.statut)}
            </TableCell>
            <TableCell>
              <div className="flex items-center space-x-2">
                <span className="text-sm">
                  {vehicle.prochaine_maintenance 
                    ? new Date(vehicle.prochaine_maintenance).toLocaleDateString()
                    : 'Non définie'
                  }
                </span>
                {vehicle.prochaine_maintenance && 
                 new Date(vehicle.prochaine_maintenance) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) && (
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                )}
              </div>
            </TableCell>
            <TableCell>
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => onEdit(vehicle)}
                  title="Modifier le véhicule"
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => onViewDocuments?.(vehicle)}
                  title="Voir les documents"
                >
                  <FileText className="h-4 w-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => onViewMaintenance?.(vehicle)}
                  title="Voir la maintenance"
                >
                  <Wrench className="h-4 w-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleDeleteClick(vehicle)}
                  title={canDeleteVehicle(vehicle) ? "Supprimer le véhicule" : "Suppression impossible"}
                  disabled={!canDeleteVehicle(vehicle)}
                  className={!canDeleteVehicle(vehicle) ? "opacity-50 cursor-not-allowed" : ""}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
