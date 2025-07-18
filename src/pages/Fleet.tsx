import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Search, Truck, Settings, Wrench, CheckCircle } from 'lucide-react';
import { VehicleListTab } from '@/components/fleet/VehicleListTab';
import { ValidationTab } from '@/components/fleet/ValidationTab';
import { MaintenanceTab } from '@/components/fleet/MaintenanceTab';
import { VehicleForm } from '@/components/fleet/VehicleForm';
import { DocumentManagerVehicule } from '@/components/fleet/DocumentManagerVehicule';
import { FleetStats } from '@/components/fleet/FleetStats';
import { FleetHeader } from '@/components/fleet/FleetHeader';
import { toast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { vehiculesService } from '@/services/vehicules';
import type { Vehicule } from '@/services/vehicules';

const Fleet = () => {
  const [activeTab, setActiveTab] = useState('vehicles');
  const [searchTerm, setSearchTerm] = useState('');
  const [showVehicleForm, setShowVehicleForm] = useState(false);
  const [showDocumentManager, setShowDocumentManager] = useState(false);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
  const [selectedVehicleNumero, setSelectedVehicleNumero] = useState<string>('');
  const [refreshKey, setRefreshKey] = useState(0);

  // Fetch vehicles and calculate stats
  const { data: vehicles = [], isLoading } = useQuery({
    queryKey: ['vehicules', refreshKey],
    queryFn: vehiculesService.getAll,
  });

  const stats = {
    total: vehicles.length,
    disponibles: vehicles.filter(v => v.statut === 'disponible').length,
    en_mission: vehicles.filter(v => v.statut === 'en_mission').length,
    maintenance: vehicles.filter(v => v.statut === 'maintenance').length,
    validation_requise: vehicles.filter(v => v.statut === 'validation_requise').length,
    hydrocarbures: vehicles.filter(v => v.type_transport === 'hydrocarbures').length,
    bauxite: vehicles.filter(v => v.type_transport === 'bauxite').length,
    maintenance_urgente: 0,
    bases: [],
    types_transport: []
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

  const handleModifyVehicle = (vehicleId: string) => {
    console.log('Modifier véhicule:', vehicleId);
    toast({
      title: "Fonctionnalité à venir",
      description: "La modification de véhicule sera disponible prochainement.",
    });
  };

  const handleMaintenanceVehicle = (vehicleId: string) => {
    console.log('Maintenance véhicule:', vehicleId);
    toast({
      title: "Fonctionnalité à venir",
      description: "La gestion de maintenance sera disponible prochainement.",
    });
  };

  const handleDeleteVehicle = async (vehicleId: string) => {
    try {
      await vehiculesService.delete(vehicleId);
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      throw error;
    }
  };

  if (isLoading) {
    return <div className="flex justify-center p-8">Chargement des véhicules...</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <FleetHeader 
        onAddVehicle={() => setShowVehicleForm(true)}
        vehicleCount={vehicles.length}
      />

      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="flex gap-2 items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un véhicule..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
        </div>
      </div>

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
          <TabsTrigger value="settings" className="gap-2">
            <Settings className="h-4 w-4" />
            Paramètres
          </TabsTrigger>
        </TabsList>

        <TabsContent value="vehicles" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Liste des véhicules</CardTitle>
              <CardDescription>
                Gestion de votre flotte de véhicules
              </CardDescription>
            </CardHeader>
            <CardContent>
              <VehicleListTab 
                vehicles={vehicles.filter(vehicle => 
                  vehicle.numero?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  vehicle.immatriculation?.toLowerCase().includes(searchTerm.toLowerCase())
                )}
                onEdit={handleModifyVehicle}
                onDelete={handleDeleteVehicle}
                onViewDocuments={handleManageDocuments}
                onViewMaintenance={handleMaintenanceVehicle}
                onViewPostMissionWorkflow={(vehicleId) => console.log('Post-mission workflow:', vehicleId)}
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

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Paramètres de la flotte</CardTitle>
              <CardDescription>
                Configuration et paramètres avancés
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Les paramètres de configuration seront disponibles prochainement.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog pour le formulaire de véhicule */}
      <Dialog open={showVehicleForm} onOpenChange={setShowVehicleForm}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Ajouter un nouveau véhicule</DialogTitle>
          </DialogHeader>
          <VehicleForm 
            onSuccess={() => {
              setShowVehicleForm(false);
              handleVehicleCreated();
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Dialog pour la gestion des documents */}
      <Dialog open={showDocumentManager} onOpenChange={setShowDocumentManager}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Gestion des documents</DialogTitle>
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
