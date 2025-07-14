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
      'disponible': { variant: 'available' as const, label: 'Disponible' },
      'en_mission': { variant: 'mission' as const, label: 'En mission' },
      'maintenance': { variant: 'maintenance' as const, label: 'Maintenance' },
      'validation_requise': { variant: 'pending' as const, label: 'Validation requise' }
    };
    
    const config = statusConfig[statut as keyof typeof statusConfig] || { variant: 'secondary' as const, label: statut };
    return <Badge variant={config.variant}>{config.label}</Badge>;
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
                <TableCell>
                  {vehicle.type_vehicule === 'porteur' 
                    ? vehicle.immatriculation 
                    : vehicle.tracteur_immatriculation
                  }
                </TableCell>
                <TableCell>
                  {vehicle.type_vehicule === 'porteur' 
                    ? `${vehicle.marque || ''} ${vehicle.modele || ''}`.trim() || '-'
                    : `${vehicle.tracteur_marque || ''} ${vehicle.tracteur_modele || ''}`.trim() || '-'
                  }
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
