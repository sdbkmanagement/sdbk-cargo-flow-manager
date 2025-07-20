
import React, { useState, useMemo } from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapPin, Building } from 'lucide-react';
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

  // Obtenir les lieux de livraison pour la ville sélectionnée (sans inclure la ville elle-même)
  const lieuxLivraisonForVille = useMemo(() => {
    if (selectedVille) {
      const clientsForVille = getClientsByVille(selectedVille);
      // Filtrer pour ne garder que les stations/entreprises (pas la ville)
      return clientsForVille.filter(client => client.type !== 'ville');
    }
    return [];
  }, [selectedVille]);

  // Détecter la ville du client sélectionné
  const villeFromClient = useMemo(() => {
    if (selectedClient) {
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

  // Extraire le nom du lieu de livraison depuis le client sélectionné
  const selectedLieuNom = useMemo(() => {
    if (selectedClient && selectedVille) {
      // Le client est au format "VILLE LieuSpécifique"
      const lieuName = selectedClient.replace(`${selectedVille} `, '');
      console.log('Extraction:', { selectedClient, selectedVille, lieuName });
      
      // Trouver le lieu correspondant dans la liste pour s'assurer qu'il existe
      const lieuCorrespondant = lieuxLivraisonForVille.find(lieu => lieu.nom === lieuName);
      return lieuCorrespondant ? lieuName : '';
    }
    return '';
  }, [selectedClient, selectedVille, lieuxLivraisonForVille]);

  const handleVilleSelection = (ville: string) => {
    console.log('Ville sélectionnée:', ville);
    setSelectedVille(ville);
    // Réinitialiser la sélection du lieu de livraison quand on change de ville
    onClientChange('');
    onDestinationChange('');
  };

  const handleLieuLivraisonSelection = (lieuNom: string) => {
    console.log('Lieu de livraison sélectionné:', lieuNom);
    
    // Créer la destination complète : "VILLE LieuSpécifique"
    const destinationComplete = `${selectedVille} ${lieuNom}`;
    
    // Mettre à jour les deux champs avec les mêmes informations
    onClientChange(destinationComplete);
    onDestinationChange(destinationComplete);
    
    console.log('Destination complète créée:', destinationComplete);
  };

  return (
    <div className="space-y-4">
      {/* Sélection de la ville */}
      <div>
        <Label>Ville de destination *</Label>
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

      {/* Sélection du lieu de livraison spécifique */}
      <div>
        <Label>Lieu de livraison *</Label>
        <Select 
          value={selectedLieuNom} 
          onValueChange={handleLieuLivraisonSelection}
          disabled={!selectedVille}
        >
          <SelectTrigger>
            <SelectValue 
              placeholder={selectedVille ? "Sélectionner un lieu de livraison" : "Sélectionnez d'abord une ville"}
            />
          </SelectTrigger>
          <SelectContent className="max-h-60">
            {lieuxLivraisonForVille.length > 0 ? (
              lieuxLivraisonForVille.map((lieu, lieuIndex) => (
                <SelectItem 
                  key={`${lieu.nom}-${lieu.ville}-${lieuIndex}`} 
                  value={lieu.nom}
                >
                  <div className="flex items-center">
                    <Building className="w-4 h-4 mr-2" />
                    <div className="flex flex-col">
                      <span className="font-medium">{lieu.nom}</span>
                      <span className="text-xs text-gray-500">{lieu.type}</span>
                    </div>
                  </div>
                </SelectItem>
              ))
            ) : selectedVille ? (
              <SelectItem value="__no_lieu__" disabled>
                Aucun lieu de livraison trouvé pour {selectedVille}
              </SelectItem>
            ) : (
              <SelectItem value="__no_ville__" disabled>
                Veuillez d'abord sélectionner une ville
              </SelectItem>
            )}
          </SelectContent>
        </Select>
        
        {/* Affichage de la destination complète */}
        {selectedVille && selectedClient && (
          <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-md">
            <p className="text-sm font-medium text-green-800">
              Destination complète sélectionnée :
            </p>
            <p className="text-lg font-bold text-green-900">
              {selectedClient}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
