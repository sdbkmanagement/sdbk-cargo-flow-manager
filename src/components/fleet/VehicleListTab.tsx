import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { Edit, Trash2, FileText, Truck, User, Eye } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { toast } from '@/hooks/use-toast';
import { VehicleDetailDialog } from './VehicleDetailDialog';
import type { Vehicule } from '@/services/vehicules';

interface VehicleListTabProps {
  vehicles: Vehicule[];
  onEdit: (vehicleId: string) => void;
  onDelete: (vehicleId: string) => Promise<void>;
  onViewDocuments: (vehicle: Vehicule) => void;
}

export const VehicleListTab = ({ vehicles, onEdit, onDelete, onViewDocuments }: VehicleListTabProps) => {
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicule | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);

  const getStatusBadge = (statut: string) => {
    const statusConfig = {
      'disponible': {
        label: 'Disponible',
        className: 'bg-green-500 text-white border-green-600 hover:bg-green-600'
      },
      'en_mission': {
        label: 'En Mission',
        className: 'bg-orange-500 text-white border-orange-600 hover:bg-orange-600'
      },
      'maintenance': {
        label: 'Maintenance',
        className: 'bg-red-500 text-white border-red-600 hover:bg-red-600'
      },
      'validation_requise': {
        label: 'Validation Requise',
        className: 'bg-yellow-500 text-white border-yellow-600 hover:bg-yellow-600'
      }
    };

    const config = statusConfig[statut as keyof typeof statusConfig] || {
      label: statut,
      className: 'bg-gray-500 text-white border-gray-600 hover:bg-gray-600'
    };

    return (
      <Badge className={config.className}>
        {config.label}
      </Badge>
    );
  };

  const getTransportBadge = (type: string) => {
    if (type === 'hydrocarbures') {
      return (
        <Badge className="bg-blue-500 text-white border-blue-600 hover:bg-blue-700">
          Hydrocarbures
        </Badge>
      );
    } else {
      return (
        <Badge className="bg-purple-500 text-white border-purple-600 hover:bg-purple-600">
          Bauxite
        </Badge>
      );
    }
  };

  if (vehicles.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Truck className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-lg font-medium text-muted-foreground mb-2">Aucun véhicule trouvé</p>
          <p className="text-sm text-muted-foreground text-center">
            Commencez par ajouter votre premier véhicule à la flotte.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Numéro/Immatriculation</TableHead>
                <TableHead>Type/Marque</TableHead>
                <TableHead>Transport</TableHead>
                <TableHead>Propriétaire</TableHead>
                <TableHead>Base</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vehicles.map((vehicle) => (
                <TableRow key={vehicle.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{vehicle.numero}</span>
                      <span className="text-sm text-muted-foreground">
                        {vehicle.type_vehicule === 'tracteur_remorque' 
                          ? `${vehicle.tracteur_immatriculation} / ${vehicle.remorque_immatriculation}`
                          : vehicle.immatriculation
                        }
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {vehicle.type_vehicule === 'porteur' ? 'Porteur' : 'Tracteur+Remorque'}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {vehicle.type_vehicule === 'porteur' 
                          ? `${vehicle.marque} ${vehicle.modele}` 
                          : `${vehicle.tracteur_marque} ${vehicle.tracteur_modele}`
                        }
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Volume: {getVolumeDisplay(vehicle)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {getTransportBadge(vehicle.type_transport)}
                  </TableCell>
                  <TableCell>
                    {vehicle.proprietaire_nom || vehicle.proprietaire_prenom ? (
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          {vehicle.proprietaire_nom} {vehicle.proprietaire_prenom}
                        </span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">Non renseigné</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="capitalize">{vehicle.base || 'Non définie'}</span>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(vehicle.statut)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewDetails(vehicle)}
                        className="flex items-center gap-1"
                      >
                        <Eye className="h-4 w-4" />
                        Détails
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onViewDocuments(vehicle)}
                        className="flex items-center gap-1"
                      >
                        <FileText className="h-4 w-4" />
                        Documents
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEdit(vehicle.id)}
                        className="flex items-center gap-1"
                      >
                        <Edit className="h-4 w-4" />
                        Modifier
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
                            <AlertDialogDescription>
                              Êtes-vous sûr de vouloir supprimer le véhicule {vehicle.numero} ? 
                              Cette action est irréversible.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Annuler</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(vehicle.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Supprimer
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <VehicleDetailDialog
        vehicule={selectedVehicle}
        open={showDetailDialog}
        onOpenChange={setShowDetailDialog}
      />
    </div>
  );

  function getVolumeDisplay(vehicle: Vehicule) {
    if (vehicle.type_vehicule === 'tracteur_remorque' && vehicle.remorque_volume_litres) {
      const unit = vehicle.type_transport === 'hydrocarbures' ? 'L' : 't';
      return `${vehicle.remorque_volume_litres}${unit}`;
    } else if (vehicle.type_vehicule === 'porteur' && vehicle.volume_tonnes) {
      const unit = vehicle.type_transport === 'hydrocarbures' ? 'L' : 't';
      return `${vehicle.volume_tonnes}${unit}`;
    }
    return 'Non défini';
  }

  async function handleDelete(vehicleId: string) {
    try {
      await onDelete(vehicleId);
      toast({
        title: "Véhicule supprimé",
        description: "Le véhicule a été supprimé avec succès.",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le véhicule.",
        variant: "destructive"
      });
    }
  }

  function handleViewDetails(vehicle: Vehicule) {
    setSelectedVehicle(vehicle);
    setShowDetailDialog(true);
  }
};
