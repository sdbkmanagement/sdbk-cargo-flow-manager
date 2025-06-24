
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ValidationWorkflowCard } from './validation/ValidationWorkflowCard';
import { ValidationStats } from './validation/ValidationStats';
import { Search, Filter } from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';

type Vehicule = Database['public']['Tables']['vehicules']['Row'] & {
  chauffeur?: {
    nom: string;
    prenom: string;
  } | null;
};

interface ValidationTabProps {
  vehicles: Vehicule[];
}

export const ValidationTab = ({ vehicles }: ValidationTabProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Filtrer les véhicules
  const filteredVehicles = vehicles.filter(vehicle => {
    const matchesSearch = 
      vehicle.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.immatriculation.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.marque.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.modele.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || vehicle.statut === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <ValidationStats />
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{vehicles.length}</div>
            <p className="text-xs text-muted-foreground">Véhicules total</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">
              {vehicles.filter(v => v.statut === 'disponible').length}
            </div>
            <p className="text-xs text-muted-foreground">Prêts pour mission</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-600">
              {vehicles.filter(v => v.statut === 'validation_requise').length}
            </div>
            <p className="text-xs text-muted-foreground">En validation</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtres */}
      <Card>
        <CardHeader>
          <CardTitle>Workflows de Validation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <Label htmlFor="search">Rechercher un véhicule</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Numéro, immatriculation, marque..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="w-full md:w-48">
              <Label htmlFor="status-filter">Filtrer par statut</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="disponible">Disponible</SelectItem>
                  <SelectItem value="validation_requise">En validation</SelectItem>
                  <SelectItem value="en_mission">En mission</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Liste des workflows */}
          <div className="space-y-4">
            {filteredVehicles.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Aucun véhicule trouvé avec ces critères
              </div>
            ) : (
              filteredVehicles.map((vehicle) => (
                <ValidationWorkflowCard 
                  key={vehicle.id}
                  vehiculeId={vehicle.id}
                  vehiculeNumero={`${vehicle.numero} (${vehicle.immatriculation})`}
                  userRole="admin" // TODO: Récupérer le vrai rôle utilisateur
                />
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
