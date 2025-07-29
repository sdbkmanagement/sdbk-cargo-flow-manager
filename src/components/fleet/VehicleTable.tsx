
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
        variant: 'default' as const, 
        label: 'Disponible',
        className: 'bg-green-500 text-white border-green-600 hover:bg-green-600'
      },
      'en_mission': { 
        variant: 'secondary' as const, 
        label: 'En mission',
        className: 'bg-orange-500 text-white border-orange-600 hover:bg-orange-600'
      },
      'maintenance': { 
        variant: 'destructive' as const, 
        label: 'Maintenance',
        className: 'bg-red-500 text-white border-red-600 hover:bg-red-600'
      },
      'validation_requise': { 
        variant: 'outline' as const, 
        label: 'Validation requise',
        className: 'bg-yellow-500 text-white border-yellow-600 hover:bg-yellow-600'
      }
    };
    
    const config = statusConfig[statut as keyof typeof statusConfig] || { 
      variant: 'secondary' as const, 
      label: statut,
      className: 'bg-gray-500 text-white border-gray-600 hover:bg-gray-600'
    };
    
    return (
      <Badge variant={config.variant} className={config.className}>
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
            <TableHead>Numéro</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Immatriculation</TableHead>
            <TableHead>Marque/Modèle</TableHead>
            <TableHead>Transport</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead>Base</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {vehicles.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                Aucun véhicule trouvé
              </TableCell>
            </TableRow>
          ) : (
            vehicles.map((vehicle) => (
              <TableRow key={vehicle.id}>
                <TableCell className="font-medium">{vehicle.numero}</TableCell>
                <TableCell>{vehicle.type_vehicule}</TableCell>
                <TableCell className="font-medium">
                  {getMainImmatriculation(vehicle)}
                  {vehicle.type_vehicule === 'tracteur_remorque' && (
                    <div className="text-xs text-gray-500 mt-1">
                      Tracteur: {vehicle.tracteur_immatriculation || '-'}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  {vehicle.type_vehicule === 'porteur' 
                    ? `${vehicle.marque || ''} ${vehicle.modele || ''}`.trim() || '-'
                    : `${vehicle.tracteur_marque || ''} ${vehicle.tracteur_modele || ''}`.trim() || '-'
                  }
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="bg-blue-500 text-white border-blue-600 hover:bg-blue-600">
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
