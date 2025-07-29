
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Truck, CheckCircle, Wrench, AlertTriangle } from 'lucide-react';
import { VehicleListTab } from '@/components/fleet/VehicleListTab';
import { ValidationTab } from '@/components/fleet/ValidationTab';
import { MaintenanceTab } from '@/components/fleet/MaintenanceTab';
import { VehicleForm } from '@/components/fleet/VehicleForm';
import { DocumentManagerVehicule } from '@/components/fleet/DocumentManagerVehicule';
import { FleetStats } from '@/components/fleet/FleetStats';
import { FleetHeader } from '@/components/fleet/FleetHeader';
import { AlertesDocumentsVehicules } from '@/components/fleet/AlertesDocumentsVehicules';
import { toast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { vehiculesService } from '@/services/vehicules';
import { alertesService } from '@/services/alertesService';
import type { Vehicule } from '@/services/vehicules';

const Fleet = () => {
  const [activeTab, setActiveTab] = useState('vehicles');
  const [showVehicleForm, setShowVehicleForm] = useState(false);
  const [showDocumentManager, setShowDocumentManager] = useState(false);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
  const [selectedVehicleNumero, setSelectedVehicleNumero] = useState<string>('');
  const [selectedVehicleForEdit, setSelectedVehicleForEdit] = useState<Vehicule | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Fetch vehicles and calculate stats
  const { data: vehicles = [], isLoading } = useQuery({
    queryKey: ['vehicules', refreshKey],
    queryFn: vehiculesService.getAll,
  });

  // Fetch alerts
  const { data: alertes = [] } = useQuery({
    queryKey: ['alertes-documents-vehicules', refreshKey],
    queryFn: alertesService.getAlertesVehicules,
  });

  const stats = {
    total: vehicles.length,
    disponibles: vehicles.filter(v => v.statut === 'disponible').length,
    en_mission: vehicles.filter(v => v.statut === 'en_mission').length,
    maintenance: vehicles.filter(v => v.statut === 'maintenance').length,
    validation_requise: vehicles.filter(v => v.statut === 'validation_requise').length,
    alertes: alertes.length,
  };

  const handleVehicleCreated = () => {
    setRefreshKey(prev => prev + 1);
    toast({
      title: "Véhicule créé",
      description: "Le véhicule a été ajouté avec succès.",
    });
  };

  const handleManageDocuments = (vehicle: Vehicule) => {
    setSelectedVehicleId(vehicle.id);
    setSelectedVehicleNumero(vehicle.numero);
    setShowDocumentManager(true);
  };

  const handleModifyVehicle = async (vehicleId: string) => {
    console.log('Modifier véhicule:', vehicleId);
    try {
      const vehicle = await vehiculesService.getById(vehicleId);
      if (vehicle) {
        setSelectedVehicleForEdit(vehicle);
        setShowVehicleForm(true);
      } else {
        toast({
          title: "Erreur",
          description: "Impossible de charger les données du véhicule.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Erreur lors du chargement du véhicule:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les données du véhicule.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteVehicle = async (vehicleId: string) => {
    try {
      await vehiculesService.delete(vehicleId);
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      throw error;
    }
  };

  const handleFormClose = () => {
    setShowVehicleForm(false);
    setSelectedVehicleForEdit(null);
    setRefreshKey(prev => prev + 1);
  };

  const handleSelectVehicleForAlerts = (vehiculeId: string) => {
    const vehicle = vehicles.find(v => v.id === vehiculeId);
    if (vehicle) {
      handleManageDocuments(vehicle);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center p-8">Chargement des véhicules...</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <FleetHeader 
        onAddVehicle={() => {
          setSelectedVehicleForEdit(null);
          setShowVehicleForm(true);
        }}
        vehicleCount={vehicles.length}
      />

      <FleetStats stats={stats} />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="vehicles" className="gap-2">
            <Truck className="h-4 w-4" />
            Véhicules
          </TabsTrigger>
          <TabsTrigger value="validation" className="gap-2">
            <CheckCircle className="h-4 w-4" />
            Validation
          </TabsTrigger>
          <TabsTrigger value="maintenance" className="gap-2">
            <Wrench className="h-4 w-4" />
            Maintenance
          </TabsTrigger>
          <TabsTrigger value="alerts" className="gap-2">
            <AlertTriangle className="h-4 w-4" />
            Alertes
          </TabsTrigger>
        </TabsList>

        <TabsContent value="vehicles" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Liste des véhicules</CardTitle>
              <CardDescription>
                Gestion de votre flotte de véhicules avec filtres avancés
              </CardDescription>
            </CardHeader>
            <CardContent>
              <VehicleListTab 
                vehicles={vehicles}
                onEdit={handleModifyVehicle}
                onDelete={handleDeleteVehicle}
                onViewDocuments={handleManageDocuments}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="validation" className="space-y-6">
          <ValidationTab vehicles={vehicles} />
        </TabsContent>

        <TabsContent value="maintenance" className="space-y-6">
          <MaintenanceTab vehicles={vehicles} />
        </TabsContent>

        <TabsContent value="alerts" className="space-y-6">
          <AlertesDocumentsVehicules onSelectVehicule={handleSelectVehicleForAlerts} />
        </TabsContent>
      </Tabs>

      {/* Dialog pour le formulaire de véhicule */}
      <Dialog open={showVehicleForm} onOpenChange={setShowVehicleForm}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedVehicleForEdit ? 'Modifier le véhicule' : 'Ajouter un nouveau véhicule'}
            </DialogTitle>
          </DialogHeader>
          <VehicleForm 
            vehicule={selectedVehicleForEdit}
            onSuccess={handleFormClose}
          />
        </DialogContent>
      </Dialog>

      {/* Dialog pour la gestion des documents */}
      <Dialog open={showDocumentManager} onOpenChange={setShowDocumentManager}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Gestion des documents - {selectedVehicleNumero}</DialogTitle>
          </DialogHeader>
          <DocumentManagerVehicule
            vehiculeId={selectedVehicleId}
            vehiculeNumero={selectedVehicleNumero}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Fleet;
