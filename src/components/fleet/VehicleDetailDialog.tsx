
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Wrench, Users, Truck, UserCheck } from 'lucide-react';
import { ChauffeurAssignmentManager } from './ChauffeurAssignmentManager';
import { DocumentManagerVehicule } from './DocumentManagerVehicule';
import { VehicleMaintenanceHistory } from './VehicleMaintenanceHistory';
import type { Vehicule } from '@/services/vehicules';

interface VehicleDetailDialogProps {
  vehicule: Vehicule | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const VehicleDetailDialog = ({ vehicule, open, onOpenChange }: VehicleDetailDialogProps) => {
  if (!vehicule) return null;

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
    if (type === 'hydrocarbures') {
      return (
        <Badge className="bg-blue-600 text-white border-blue-600 hover:bg-blue-700">
          Hydrocarbures
        </Badge>
      );
    } else {
      return (
        <Badge variant="secondary" className="bg-gray-100 text-gray-900 border-gray-300">
          Marchandise
        </Badge>
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Détails du véhicule {vehicule.numero}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Informations générales */}
          <Card>
            <CardHeader>
              <CardTitle>Informations générales</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Numéro</label>
                  <p className="font-medium">{vehicule.numero}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Type</label>
                  <p className="font-medium capitalize">{vehicule.type_vehicule}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Immatriculation</label>
                  <p className="font-medium">
                    {vehicule.type_vehicule === 'porteur' 
                      ? vehicule.immatriculation 
                      : `${vehicule.tracteur_immatriculation} / ${vehicule.remorque_immatriculation}`
                    }
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Marque/Modèle</label>
                  <p className="font-medium">
                    {vehicule.type_vehicule === 'porteur' 
                      ? `${vehicule.marque} ${vehicule.modele}` 
                      : `${vehicule.tracteur_marque} ${vehicule.tracteur_modele}`
                    }
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Transport</label>
                  <div>{getTransportBadge(vehicule.type_transport)}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Statut</label>
                  <div>{getStatusBadge(vehicule.statut)}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Base</label>
                  <p className="font-medium capitalize">{vehicule.base || 'Non définie'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Kilométrage</label>
                  <p className="font-medium">{vehicule.kilometrage?.toLocaleString() || 0} km</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section d'assignation de chauffeur mise en avant */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2 mb-3">
              <UserCheck className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-blue-900">Assignation de chauffeur</h3>
            </div>
            <p className="text-sm text-blue-700 mb-4">
              Gérez l'assignation des chauffeurs à ce véhicule dans l'onglet "Chauffeurs" ci-dessous.
            </p>
          </div>

          {/* Onglets pour les différentes sections */}
          <Tabs defaultValue="chauffeurs" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="chauffeurs" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Chauffeurs
              </TabsTrigger>
              <TabsTrigger value="documents" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Documents
              </TabsTrigger>
              <TabsTrigger value="maintenance" className="flex items-center gap-2">
                <Wrench className="h-4 w-4" />
                Maintenance
              </TabsTrigger>
            </TabsList>

            <TabsContent value="chauffeurs" className="mt-4">
              <ChauffeurAssignmentManager vehicule={vehicule} />
            </TabsContent>

            <TabsContent value="documents" className="mt-4">
              <DocumentManagerVehicule
                vehiculeId={vehicule.id}
                vehiculeNumero={vehicule.numero}
              />
            </TabsContent>

            <TabsContent value="maintenance" className="mt-4">
              <VehicleMaintenanceHistory vehicle={vehicule} />
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};
