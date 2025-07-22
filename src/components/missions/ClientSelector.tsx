

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
    if (selectedClient && selectedClient.trim() !== '' && selectedClient !== 'VIDE' && !selectedVille) {
      console.log(`🔍 ClientSelector BL ${blIndex}: Tentative de reconstitution depuis selectedClient:`, selectedClient);
      
      const allClients = getAllClients();
      console.log(`🔍 ClientSelector BL ${blIndex}: Recherche parmi ${allClients.length} clients`);
      
      // Essayer de trouver le client avec différents formats possibles
      let client = allClients.find(c => `${c.ville} ${c.nom}` === selectedClient);
      if (!client) {
        // Essayer sans espace entre ville et nom
        client = allClients.find(c => `${c.ville}${c.nom}` === selectedClient);
      }
      if (!client) {
        // Essayer de trouver par nom seulement
        client = allClients.find(c => selectedClient.includes(c.nom));
      }
      if (!client) {
        // Essayer de séparer par l'espace et trouver par ville et nom séparément
        const parts = selectedClient.split(' ');
        if (parts.length >= 2) {
          const ville = parts[0];
          const nom = parts.slice(1).join(' ');
          client = allClients.find(c => c.ville === ville && c.nom === nom);
        }
      }
      
      if (client) {
        console.log(`✅ ClientSelector BL ${blIndex}: Client trouvé:`, client);
        setSelectedVille(client.ville);
        setSelectedLieuNom(client.nom);
        // Ne PAS déclencher onClientChange ici pour éviter d'effacer la valeur
      } else {
        console.log(`❌ ClientSelector BL ${blIndex}: Aucun client trouvé pour:`, selectedClient);
      }
    }
  }, [selectedClient, selectedVille, blIndex]);

  const handleVilleSelection = (ville: string) => {
    console.log(`🏙️ BL ${blIndex}: Ville sélectionnée:`, ville);
    setSelectedVille(ville);
    setSelectedLieuNom(''); // Réinitialiser le lieu
    // Réinitialiser les props parent
    onClientChange('');
    onDestinationChange('');
  };

  const handleLieuLivraisonSelection = (lieuNom: string) => {
    console.log(`🏢 BL ${blIndex}: Lieu de livraison sélectionné:`, lieuNom);
    
    setSelectedLieuNom(lieuNom);
    
    // Créer la destination complète pour lieu_arrivee
    const destinationComplete = `${selectedVille} ${lieuNom}`;
    
    console.log(`✅ BL ${blIndex}: Destination complète créée:`, destinationComplete);
    console.log(`🔄 BL ${blIndex}: Appel onClientChange pour mettre à jour lieu_arrivee:`, destinationComplete);
    
    // Appeler onClientChange avec la destination complète
    onClientChange(destinationComplete);
  };

  return (
    <div className="space-y-4">
      {/* Sélection de la ville */}
      <div>
        <Label>Ville de destination</Label>
        <Select value={selectedVille} onValueChange={handleVilleSelection}>
          <SelectTrigger>
            <SelectValue placeholder="Sélectionner une ville (optionnel)" />
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
        <Label>Lieu de livraison</Label>
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
              <SelectItem value="no_lieu_placeholder" disabled>
                Aucun lieu de livraison trouvé pour {selectedVille}
              </SelectItem>
            ) : (
              <SelectItem value="no_ville_placeholder" disabled>
                Veuillez d'abord sélectionner une ville
              </SelectItem>
            )}
          </SelectContent>
        </Select>
        
        {/* Affichage de la destination complète sélectionnée */}
        {selectedVille && selectedLieuNom && (
          <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-md">
            <p className="text-sm font-medium text-green-800">
              Destination sélectionnée :
            </p>
            <p className="text-lg font-bold text-green-900">
              {selectedVille} {selectedLieuNom}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

