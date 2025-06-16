
import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { vehiculesService } from '@/services/vehicules';
import { FleetStats } from '@/components/fleet/FleetStats';
import { FleetHeader } from '@/components/fleet/FleetHeader';
import { SearchInput } from '@/components/fleet/SearchInput';
import { VehicleListTab } from '@/components/fleet/VehicleListTab';
import { MaintenanceTabContent } from '@/components/fleet/MaintenanceTabContent';
import { DocumentsTabContent } from '@/components/fleet/DocumentsTabContent';
import { VehicleForm } from '@/components/fleet/VehicleForm';
import { NewVehicleForm } from '@/components/fleet/NewVehicleForm';
import { Plus, TestTube } from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';

type Vehicule = Database['public']['Tables']['vehicules']['Row'] & {
  chauffeur?: {
    nom: string;
    prenom: string;
  } | null;
};

const Fleet = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [vehicules, setVehicules] = useState<Vehicule[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isNewFormOpen, setIsNewFormOpen] = useState(false);
  const [selectedVehicule, setSelectedVehicule] = useState<Vehicule | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    disponibles: 0,
    en_mission: 0,
    maintenance: 0,
    hydrocarbures: 0,
    bauxite: 0,
    maintenance_urgente: 0
  });
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [vehiculesData, statsData] = await Promise.all([
        vehiculesService.getAll(),
        vehiculesService.getFleetStats()
      ]);
      
      setVehicules(vehiculesData);
      setStats(statsData);
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les données de la flotte",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce véhicule ?')) return;
    
    try {
      await vehiculesService.delete(id);
      toast({
        title: "Véhicule supprimé",
        description: "Le véhicule a été supprimé avec succès",
      });
      loadData();
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le véhicule",
        variant: "destructive",
      });
    }
  };

  const filteredVehicles = vehicules.filter(vehicle =>
    vehicle.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vehicle.marque.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vehicle.immatriculation.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (vehicule: Vehicule) => {
    console.log('Ouverture du formulaire d\'édition pour:', vehicule);
    setSelectedVehicule(vehicule);
    setIsFormOpen(true);
  };

  const handleNewVehicle = () => {
    console.log('Ouverture du formulaire de création');
    setSelectedVehicule(null);
    setIsFormOpen(true);
  };

  const handleNewVehicleTest = () => {
    console.log('Ouverture du nouveau formulaire de test');
    setIsNewFormOpen(true);
  };

  const handleFormClose = () => {
    console.log('Fermeture du formulaire');
    setIsFormOpen(false);
    setSelectedVehicule(null);
  };

  const handleNewFormClose = () => {
    console.log('Fermeture du nouveau formulaire');
    setIsNewFormOpen(false);
  };

  const handleFormSuccess = () => {
    console.log('Succès du formulaire - rechargement des données');
    setIsFormOpen(false);
    setSelectedVehicule(null);
    loadData();
  };

  const handleNewFormSuccess = () => {
    console.log('Succès du nouveau formulaire - rechargement des données');
    setIsNewFormOpen(false);
    loadData();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gestion de la flotte</h1>
          <p className="text-muted-foreground">
            Gérez vos véhicules, maintenance et documentations
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleNewVehicle}>
            <Plus className="mr-2 h-4 w-4" />
            Nouveau véhicule
          </Button>
          <Button onClick={handleNewVehicleTest} variant="secondary">
            <TestTube className="mr-2 h-4 w-4" />
            Test Nouveau véhicule
          </Button>
        </div>
      </div>

      <FleetStats {...stats} />

      <SearchInput
        value={searchTerm}
        onChange={setSearchTerm}
      />

      <Tabs defaultValue="list" className="space-y-4">
        <TabsList>
          <TabsTrigger value="list">Liste des véhicules</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          <VehicleListTab
            vehicles={filteredVehicles}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </TabsContent>

        <TabsContent value="maintenance">
          <MaintenanceTabContent />
        </TabsContent>

        <TabsContent value="documents">
          <DocumentsTabContent />
        </TabsContent>
      </Tabs>

      {isFormOpen && (
        <VehicleForm
          isOpen={isFormOpen}
          onClose={handleFormClose}
          onSuccess={handleFormSuccess}
          vehicule={selectedVehicule}
        />
      )}

      {isNewFormOpen && (
        <NewVehicleForm
          isOpen={isNewFormOpen}
          onClose={handleNewFormClose}
          onSuccess={handleNewFormSuccess}
        />
      )}
    </div>
  );
};

export default Fleet;
