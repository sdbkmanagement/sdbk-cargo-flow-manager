
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Eye, FileText, Wrench, Trash2 } from 'lucide-react';
import type { Vehicule } from '@/services/vehicules';

interface VehicleTableProps {
  vehicles: Vehicule[];
  onEdit: (vehicule: Vehicule) => void;
  onDelete: (id: string) => void;
  onViewDocuments?: (vehicule: Vehicule) => void;
  onViewMaintenance?: (vehicule: Vehicule) => void;
  onViewPostMissionWorkflow?: (vehicule: Vehicule) => void;
}

export const VehicleTable = ({ 
  vehicles, 
  onEdit, 
  onDelete, 
  onViewDocuments, 
  onViewMaintenance,
  onViewPostMissionWorkflow 
}: VehicleTableProps) => {
  const getStatusBadge = (statut: string) => {
    const statusConfig = {
      'disponible': { 
        label: 'Disponible',
        className: 'bg-green-600 text-white hover:bg-green-700 border-green-600'
      },
      'en_mission': { 
        label: 'En mission',
        className: 'bg-blue-600 text-white hover:bg-blue-700 border-blue-600'
      },
      'maintenance': { 
        label: 'Maintenance',
        className: 'bg-orange-600 text-white hover:bg-orange-700 border-orange-600'
      },
      'validation_requise': { 
        label: 'Validation requise',
        className: 'bg-purple-600 text-white hover:bg-purple-700 border-purple-600'
      },
      'indisponible': { 
        label: 'Indisponible',
        className: 'bg-red-600 text-white hover:bg-red-700 border-red-600'
      },
      'hors_service': { 
        label: 'Hors service',
        className: 'bg-gray-600 text-white hover:bg-gray-700 border-gray-600'
      }
    };
    
    const config = statusConfig[statut as keyof typeof statusConfig] || { 
      label: statut,
      className: 'bg-gray-600 text-white hover:bg-gray-700 border-gray-600'
    };
    
    return (
      <Badge className={`font-semibold ${config.className}`}>
        {config.label}
      </Badge>
    );
  };

  const getMainImmatriculation = (vehicle: Vehicule) => {
    if (vehicle.type_vehicule === 'tracteur_remorque') {
      // Pour tracteur-remorque, privilégier l'immatriculation de la remorque (citerne)
      return vehicle.remorque_immatriculation || vehicle.tracteur_immatriculation || '-';
    }
    // Pour porteur, afficher l'immatriculation du porteur
    return vehicle.immatriculation || '-';
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Type</TableHead>
            <TableHead>Immatriculation</TableHead>
            <TableHead>Transport</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead>Base</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {vehicles.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                Aucun véhicule trouvé
              </TableCell>
            </TableRow>
          ) : (
            vehicles.map((vehicle) => (
              <TableRow key={vehicle.id}>
                <TableCell>{vehicle.type_vehicule}</TableCell>
                <TableCell className="font-medium">
                  {getMainImmatriculation(vehicle)}
                </TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {vehicle.type_transport === 'hydrocarbures' ? 'Hydrocarbures' : 'Bauxite'}
                  </Badge>
                </TableCell>
                <TableCell>{getStatusBadge(vehicle.statut)}</TableCell>
                <TableCell>{vehicle.base || '-'}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(vehicle)}
                      className="h-8 w-8 p-0"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    {onViewDocuments && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onViewDocuments(vehicle)}
                        className="h-8 w-8 p-0"
                      >
                        <FileText className="h-4 w-4" />
                      </Button>
                    )}
                    {onViewMaintenance && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onViewMaintenance(vehicle)}
                        className="h-8 w-8 p-0"
                      >
                        <Wrench className="h-4 w-4" />
                      </Button>
                    )}
                    {onViewPostMissionWorkflow && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onViewPostMissionWorkflow(vehicle)}
                        className="h-8 w-8 p-0"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(vehicle.id)}
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};

const getMainImmatriculation = (vehicle: Vehicule) => {
  if (vehicle.type_vehicule === 'tracteur_remorque') {
    // Pour tracteur-remorque, privilégier l'immatriculation de la remorque (citerne)
    return vehicle.remorque_immatriculation || vehicle.tracteur_immatriculation || '-';
  }
  // Pour porteur, afficher l'immatriculation du porteur
  return vehicle.immatriculation || '-';
};
