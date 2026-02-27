
import React, { useState, useMemo, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Button } from '@/components/ui/button';
import { MapPin, Building, Check, ChevronsUpDown, Plus } from 'lucide-react';
import { getClientsByVille, DESTINATIONS, getAllClients } from '@/data/destinations';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { AddClientDialog } from './AddClientDialog';

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
  const [lieuOpen, setLieuOpen] = useState(false);
  const [addClientOpen, setAddClientOpen] = useState(false);
  const [dbClients, setDbClients] = useState<{ nom: string; ville: string }[]>([]);

  // Charger les clients ajoutés depuis la DB
  useEffect(() => {
    const loadDbClients = async () => {
      const { data } = await supabase
        .from('clients')
        .select('nom, ville')
        .order('nom');
      if (data) setDbClients(data.filter(c => c.ville));
    };
    loadDbClients();
  }, []);

  // Obtenir les lieux de livraison pour la ville sélectionnée (statique + DB)
  const lieuxLivraisonForVille = useMemo(() => {
    const staticClients = selectedVille
      ? getClientsByVille(selectedVille).filter(client => client.type !== 'ville')
      : [];
    
    const dbClientsForVille = selectedVille
      ? dbClients
          .filter(c => c.ville === selectedVille)
          .filter(c => !staticClients.some(sc => sc.nom === c.nom))
          .map(c => ({ nom: c.nom, ville: c.ville, type: 'entreprise' as const }))
      : [];
    
    return [...staticClients, ...dbClientsForVille].sort((a, b) => a.nom.localeCompare(b.nom));
  }, [selectedVille, dbClients]);

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
    setLieuOpen(false);
    
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

      {/* Sélection du lieu de livraison avec recherche */}
      <div>
        <div className="flex items-center justify-between">
          <Label>Lieu de livraison</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 text-xs gap-1"
            onClick={() => setAddClientOpen(true)}
          >
            <Plus className="h-3 w-3" />
            Nouveau client
          </Button>
        </div>
        <Popover open={lieuOpen} onOpenChange={setLieuOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={lieuOpen}
              className="w-full justify-between font-normal mt-1"
              disabled={!selectedVille}
            >
              {selectedLieuNom ? (
                <div className="flex items-center">
                  <Building className="w-4 h-4 mr-2" />
                  {selectedLieuNom}
                </div>
              ) : (
                <span className="text-muted-foreground">
                  {selectedVille ? "Rechercher un lieu de livraison..." : "Sélectionnez d'abord une ville"}
                </span>
              )}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[400px] p-0" align="start">
            <Command>
              <CommandInput placeholder="Rechercher un lieu..." />
              <CommandList>
                <CommandEmpty>Aucun lieu trouvé.</CommandEmpty>
                <CommandGroup>
                  {lieuxLivraisonForVille.map((lieu, lieuIndex) => (
                    <CommandItem
                      key={`${lieu.nom}-${lieu.ville}-${lieuIndex}`}
                      value={lieu.nom}
                      onSelect={() => handleLieuLivraisonSelection(lieu.nom)}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          selectedLieuNom === lieu.nom ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <Building className="w-4 h-4 mr-2" />
                      <div className="flex flex-col">
                        <span className="font-medium">{lieu.nom}</span>
                        <span className="text-xs text-muted-foreground">{lieu.type}</span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        
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

      <AddClientDialog
        open={addClientOpen}
        onOpenChange={setAddClientOpen}
        defaultVille={selectedVille}
        onClientAdded={(ville, nom) => {
          setDbClients(prev => [...prev, { nom, ville }]);
          setSelectedVille(ville);
          setSelectedLieuNom(nom);
          const destinationComplete = `${ville} ${nom}`;
          onClientChange(destinationComplete);
        }}
      />
    </div>
  );
};

