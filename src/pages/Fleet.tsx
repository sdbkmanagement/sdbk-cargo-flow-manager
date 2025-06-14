
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Plus, Truck, Wrench, FileText, AlertTriangle } from 'lucide-react';
import { Vehicle } from '@/types';

const Fleet = () => {
  const [searchTerm, setSearchTerm] = useState('');

  // Données demo
  const vehicles: Vehicle[] = [
    {
      id: '1',
      numero: 'V-001',
      marque: 'Volvo',
      modele: 'FH16',
      immatriculation: 'AB-123-CD',
      typeTransport: 'hydrocarbures',
      statut: 'disponible',
      derniereMaintenance: new Date('2024-01-15'),
      prochaineMaintenance: new Date('2024-03-15'),
      documents: [],
      chauffeurAssigne: 'Jean Dupont'
    },
    {
      id: '2',
      numero: 'V-002',
      marque: 'Mercedes',
      modele: 'Actros',
      immatriculation: 'EF-456-GH',
      typeTransport: 'bauxite',
      statut: 'en_mission',
      derniereMaintenance: new Date('2024-02-01'),
      prochaineMaintenance: new Date('2024-04-01'),
      documents: [],
      chauffeurAssigne: 'Pierre Martin'
    },
    {
      id: '3',
      numero: 'V-003',
      marque: 'Scania',
      modele: 'R450',
      immatriculation: 'IJ-789-KL',
      typeTransport: 'hydrocarbures',
      statut: 'maintenance',
      derniereMaintenance: new Date('2024-02-10'),
      prochaineMaintenance: new Date('2024-04-10'),
      documents: [],
      chauffeurAssigne: undefined
    }
  ];

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

  const filteredVehicles = vehicles.filter(vehicle =>
    vehicle.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vehicle.marque.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vehicle.immatriculation.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gestion de la flotte</h1>
          <p className="text-muted-foreground">
            Gérez vos véhicules, maintenance et documentations
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Nouveau véhicule
        </Button>
      </div>

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
                        {getTransportTypeBadge(vehicle.typeTransport)}
                      </TableCell>
                      <TableCell>
                        {vehicle.chauffeurAssigne || 'Non assigné'}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(vehicle.statut)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm">
                            {vehicle.prochaineMaintenance.toLocaleDateString()}
                          </span>
                          {vehicle.prochaineMaintenance < new Date() && (
                            <AlertTriangle className="h-4 w-4 text-red-500" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm">
                            <FileText className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Wrench className="h-4 w-4" />
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
    </div>
  );
};

export default Fleet;
