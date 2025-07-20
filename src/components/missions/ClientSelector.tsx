
import React, { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, MapPin } from 'lucide-react';
import { getAllClients, getClientsByVille, searchClients, DESTINATIONS } from '@/data/destinations';

interface ClientSelectorProps {
  selectedClient: string;
  selectedDestination: string;
  onClientChange: (client: string) => void;
  onDestinationChange: (destination: string) => void;
  blIndex: number;
  hideDestinationField?: boolean;
}

export const ClientSelector = ({
  selectedClient,
  selectedDestination,
  onClientChange,
  onDestinationChange,
  blIndex,
  hideDestinationField = false
}: ClientSelectorProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVille, setSelectedVille] = useState('all');

  // Filtrer les clients selon la recherche et la ville sélectionnée
  const filteredClients = useMemo(() => {
    if (selectedVille && selectedVille !== 'all') {
      return getClientsByVille(selectedVille);
    }
    
    if (searchQuery) {
      return searchClients(searchQuery);
    }
    
    return getAllClients();
  }, [searchQuery, selectedVille]);

  const handleClientSelect = (clientNom: string) => {
    console.log('ClientSelector - Selecting client:', clientNom);
    console.log('ClientSelector - Current selectedClient:', selectedClient);
    
    // Appeler directement onClientChange avec le nom du client
    onClientChange(clientNom);
    
    // Trouver la ville du client sélectionné pour la destination
    const selectedClientData = filteredClients.find(c => c.nom === clientNom);
    if (selectedClientData) {
      console.log('ClientSelector - Setting destination to:', selectedClientData.ville);
      onDestinationChange(selectedClientData.ville);
    }
  };

  console.log('ClientSelector - Render with selectedClient:', selectedClient);
  console.log('ClientSelector - Available clients:', filteredClients.length);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Filtre par ville */}
        <div>
          <Label>Filtrer par ville</Label>
          <Select value={selectedVille} onValueChange={(value) => {
            console.log('ClientSelector - Ville filter changed to:', value);
            setSelectedVille(value);
            if (value !== 'all') {
              onDestinationChange(value);
            }
          }}>
            <SelectTrigger>
              <SelectValue placeholder="Toutes les villes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les villes</SelectItem>
              {DESTINATIONS.map(destination => (
                <SelectItem key={destination.ville} value={destination.ville}>
                  <div className="flex items-center">
                    <MapPin className="w-4 h-4 mr-2" />
                    {destination.ville}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Recherche client */}
        <div>
          <Label>Rechercher un client</Label>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Rechercher un client..."
              value={searchQuery}
              onChange={(e) => {
                console.log('ClientSelector - Search query:', e.target.value);
                setSearchQuery(e.target.value);
              }}
              className="pl-10"
            />
          </div>
        </div>
      </div>

      <div className="w-full">
        {/* Sélection du client */}
        <div>
          <Label>Client / Destination *</Label>
          <Select 
            value={selectedClient || ''} 
            onValueChange={handleClientSelect}
          >
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner un client">
                {selectedClient || 'Sélectionner un client'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="max-h-60">
              {filteredClients.length === 0 ? (
                <SelectItem value="no-results" disabled>
                  Aucun client trouvé
                </SelectItem>
              ) : (
                filteredClients.map((client, index) => (
                  <SelectItem 
                    key={`${client.nom}-${client.ville}-${index}`} 
                    value={client.nom}
                  >
                    <div className="flex flex-col">
                      <span className="font-medium">{client.nom}</span>
                      <span className="text-xs text-gray-500">{client.ville}</span>
                    </div>
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};
