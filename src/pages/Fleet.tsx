import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Plus, Truck, Wrench, FileText, AlertTriangle, Edit, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { vehiculesService } from '@/services/vehicules';
import { FleetStats } from '@/components/fleet/FleetStats';
import { VehicleForm } from '@/components/fleet/VehicleForm';
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

  const filteredVehicles = vehicules.filter(vehicle =>
    vehicle.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vehicle.marque.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vehicle.immatriculation.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openEditForm = (vehicule: Vehicule) => {
    console.log('Ouverture du formulaire d\'édition pour:', vehicule);
    setSelectedVehicule(vehicule);
    setIsFormOpen(true);
  };

  const openCreateForm = () => {
    console.log('Ouverture du formulaire de création');
    setSelectedVehicule(null);
    setIsFormOpen(true);
  };

  const handleFormClose = () => {
    console.log('Fermeture du formulaire');
    setIsFormOpen(false);
    setSelectedVehicule(null);
  };

  const handleFormSuccess = () => {
    console.log('Succès du formulaire - rechargement des données');
    loadData();
    setIsFormOpen(false);
    setSelectedVehicule(null);
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

  // Debug log pour le rendu du formulaire
  console.log('Rendu du VehicleForm - isFormOpen:', isFormOpen, 'selectedVehicule:', selectedVehicule);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gestion de la flotte</h1>
          <p className="text-muted-foreground">
            Gérez vos véhicules, maintenance et documentations
          </p>
        </div>
        <Button onClick={openCreateForm}>
          <Plus className="mr-2 h-4 w-4" />
          Nouveau véhicule
        </Button>
      </div>

      <FleetStats {...stats} />

      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un véhicule..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <Tabs defaultValue="list" className="space-y-4">
        <TabsList>
          <TabsTrigger value="list">Liste des véhicules</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Véhicules de la flotte</CardTitle>
              <CardDescription>
                {filteredVehicles.length} véhicule(s) trouvé(s)
              </CardDescription>
            </CardHeader>
            <CardContent>
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
                  {filteredVehicles.map((vehicle) => (
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
                            onClick={() => openEditForm(vehicle)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <FileText className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Wrench className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleDelete(vehicle.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="maintenance">
          <Card>
            <CardHeader>
              <CardTitle>Planification maintenance</CardTitle>
              <CardDescription>
                Gérez les maintenances préventives et correctives
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Module de maintenance en développement...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents">
          <Card>
            <CardHeader>
              <CardTitle>Documents véhicules</CardTitle>
              <CardDescription>
                Suivi des assurances, contrôles techniques, etc.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Module de gestion documentaire en développement...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <VehicleForm
        isOpen={isFormOpen}
        onClose={handleFormClose}
        onSuccess={handleFormSuccess}
        vehicule={selectedVehicule}
      />
    </div>
  );
};

export default Fleet;
