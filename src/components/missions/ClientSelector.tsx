
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
  // États locaux pour gérer ville et lieu séparément
  const [selectedVille, setSelectedVille] = useState('');
  const [selectedLieuNom, setSelectedLieuNom] = useState('');

  // Obtenir les lieux de livraison pour la ville sélectionnée
  const lieuxLivraisonForVille = useMemo(() => {
    if (selectedVille) {
      const clientsForVille = getClientsByVille(selectedVille);
      return clientsForVille.filter(client => client.type !== 'ville');
    }
    return [];
  }, [selectedVille]);

  // Initialiser les valeurs depuis selectedClient au premier rendu
  React.useEffect(() => {
    if (selectedClient && !selectedVille) {
      const allClients = getAllClients();
      const client = allClients.find(c => `${c.ville} ${c.nom}` === selectedClient);
      if (client) {
        setSelectedVille(client.ville);
        setSelectedLieuNom(client.nom);
      }
    }
  }, [selectedClient, selectedVille]);

  const handleVilleSelection = (ville: string) => {
    console.log('Ville sélectionnée:', ville);
    setSelectedVille(ville);
    setSelectedLieuNom(''); // Réinitialiser le lieu
    // Réinitialiser les props parent
    onClientChange('');
    onDestinationChange('');
  };

  const handleLieuLivraisonSelection = (lieuNom: string) => {
    console.log('Lieu de livraison sélectionné:', lieuNom);
    
    setSelectedLieuNom(lieuNom);
    
    // Créer la destination complète : "VILLE LieuSpécifique"
    const destinationComplete = `${selectedVille} ${lieuNom}`;
    
    // Mettre à jour les props parent
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
        
        {/* Debug info */}
        {selectedClient && (
          <div className="mt-2 text-xs text-gray-500">
            Debug: selectedLieuNom = "{selectedLieuNom}" | selectedVille = "{selectedVille}" | selectedClient = "{selectedClient}"
          </div>
        )}
        
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
