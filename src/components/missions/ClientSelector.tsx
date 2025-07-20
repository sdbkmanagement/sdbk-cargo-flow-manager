
import React, { useState, useMemo } from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapPin } from 'lucide-react';
import { getClientsByVille, DESTINATIONS, getAllClients } from '@/data/destinations';

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
  const [selectedVille, setSelectedVille] = useState('');

  // Obtenir les clients pour la ville sélectionnée
  const clientsForVille = useMemo(() => {
    if (selectedVille) {
      return getClientsByVille(selectedVille);
    }
    return [];
  }, [selectedVille]);

  // Détecter la ville du client sélectionné
  const villeFromClient = useMemo(() => {
    if (selectedClient) {
      // Trouver la ville du client sélectionné parmi tous les clients
      const allClients = getAllClients();
      const client = allClients.find(c => c.nom === selectedClient);
      if (client) {
        return client.ville;
      }
    }
    return '';
  }, [selectedClient]);

  // Synchroniser la ville sélectionnée avec la ville du client
  React.useEffect(() => {
    if (villeFromClient && villeFromClient !== selectedVille) {
      setSelectedVille(villeFromClient);
    }
  }, [villeFromClient, selectedVille]);

  const handleClientSelection = (clientNom: string) => {
    console.log('Client sélectionné:', clientNom);
    // Le client EST la destination - synchroniser les deux champs
    onClientChange(clientNom);
    onDestinationChange(clientNom);
  };

  const handleVilleSelection = (ville: string) => {
    setSelectedVille(ville);
    // Réinitialiser la sélection du client quand on change de ville
    onClientChange('');
    onDestinationChange('');
  };

  return (
    <div className="space-y-4">
      {/* Sélection de la ville */}
      <div>
        <Label>Ville *</Label>
        <Select value={selectedVille} onValueChange={handleVilleSelection}>
          <SelectTrigger>
            <SelectValue placeholder="Sélectionner une ville" />
          </SelectTrigger>
          <SelectContent>
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

      {/* Sélection du client/lieu de livraison */}
      <div>
        <Label>Client / Lieu de livraison *</Label>
        <Select 
          value={selectedClient || ''} 
          onValueChange={handleClientSelection}
          disabled={!selectedVille}
        >
          <SelectTrigger>
            <SelectValue placeholder={selectedVille ? "Sélectionner un client" : "Sélectionnez d'abord une ville"} />
          </SelectTrigger>
          <SelectContent className="max-h-60">
            {clientsForVille.length > 0 ? (
              clientsForVille.map((client, clientIndex) => (
                <SelectItem 
                  key={`${client.nom}-${client.ville}-${clientIndex}`} 
                  value={client.nom}
                >
                  <div className="flex flex-col">
                    <span className="font-medium">{client.nom}</span>
                    <span className="text-xs text-gray-500">{client.ville}</span>
                  </div>
                </SelectItem>
              ))
            ) : selectedVille ? (
              <SelectItem value="__no_client__" disabled>
                Aucun client trouvé pour {selectedVille}
              </SelectItem>
            ) : (
              <SelectItem value="__no_ville__" disabled>
                Veuillez d'abord sélectionner une ville
              </SelectItem>
            )}
          </SelectContent>
        </Select>
        {selectedVille && selectedClient && (
          <p className="text-xs text-green-600 mt-1">
            ✓ Client sélectionné: {selectedClient} ({selectedVille})
          </p>
        )}
      </div>
    </div>
  );
};
