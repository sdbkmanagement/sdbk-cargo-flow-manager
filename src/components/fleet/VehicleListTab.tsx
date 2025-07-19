
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { Edit, Trash2, FileText, Truck, User } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { toast } from '@/hooks/use-toast';
import type { Vehicule } from '@/services/vehicules';

interface VehicleListTabProps {
  vehicles: Vehicule[];
  onEdit: (vehicleId: string) => void;
  onDelete: (vehicleId: string) => Promise<void>;
  onViewDocuments: (vehicle: Vehicule) => void;
}

export const VehicleListTab = ({ vehicles, onEdit, onDelete, onViewDocuments }: VehicleListTabProps) => {
  const getStatusBadge = (statut: string) => {
    const variants: { [key: string]: 'default' | 'secondary' | 'destructive' | 'outline' } = {
      'disponible': 'default',
      'en_mission': 'secondary',
      'maintenance': 'destructive',
      'validation_requise': 'outline'
    };

    const labels: { [key: string]: string } = {
      'disponible': 'Disponible',
      'en_mission': 'En Mission',
      'maintenance': 'Maintenance',
      'validation_requise': 'Validation Requise'
    };

    return (
      <Badge variant={variants[statut] || 'outline'}>
        {labels[statut] || statut}
      </Badge>
    );
  };

  const getTransportBadge = (type: string) => {
    const variants: { [key: string]: 'default' | 'secondary' } = {
      'hydrocarbures': 'default',
      'marchandise': 'secondary'
    };

    return (
      <Badge variant={variants[type] || 'default'}>
        {type === 'hydrocarbures' ? 'Hydrocarbures' : 'Marchandise'}
      </Badge>
    );
  };

  const handleDelete = async (vehicleId: string) => {
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
                      {vehicle.type_vehicule === 'porteur' && vehicle.volume_tonnes && (
                        <span className="text-xs text-muted-foreground">
                          Volume: {vehicle.volume_tonnes}t
                        </span>
                      )}
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
    </div>
  );
};
