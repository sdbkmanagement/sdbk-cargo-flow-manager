
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Search, MapPin } from 'lucide-react';
import { BonLivraison } from '@/types/bl';
import { getAllClients, getClientsByVille, searchClients, DESTINATIONS } from '@/data/destinations';

interface BLMultiplesFormProps {
  bls: BonLivraison[];
  onBLsChange: (bls: BonLivraison[]) => void;
  vehiculeId: string;
  chauffeurId: string;
}

export const BLMultiplesForm = ({ bls, onBLsChange, vehiculeId, chauffeurId }: BLMultiplesFormProps) => {
  const [searchQueries, setSearchQueries] = useState<{ [key: number]: string }>({});
  const [selectedVilles, setSelectedVilles] = useState<{ [key: number]: string }>({});

  const ajouterBL = () => {
    const nouveauBL: BonLivraison = {
      client_nom: '',
      destination: '',
      ville: '',
      vehicule_id: vehiculeId,
      chauffeur_id: chauffeurId,
      date_emission: new Date().toISOString().split('T')[0],
      produit: 'essence',
      quantite_prevue: 0,
      unite_mesure: 'litres',
      statut: 'emis'
    };
    
    onBLsChange([...bls, nouveauBL]);
  };

  const supprimerBL = (index: number) => {
    const nouveauxBLs = bls.filter((_, i) => i !== index);
    onBLsChange(nouveauxBLs);
  };

  const modifierBL = (index: number, champ: keyof BonLivraison, valeur: any) => {
    const nouveauxBLs = [...bls];
    nouveauxBLs[index] = { ...nouveauxBLs[index], [champ]: valeur };
    
    // Si on change la ville, réinitialiser la destination
    if (champ === 'ville') {
      nouveauxBLs[index].destination = '';
      setSelectedVilles(prev => ({ ...prev, [index]: valeur }));
    }
    
    onBLsChange(nouveauxBLs);
  };

  const getClientsFiltered = (index: number) => {
    const query = searchQueries[index];
    const ville = selectedVilles[index];
    
    if (ville) {
      return getClientsByVille(ville);
    }
    
    if (query) {
      return searchClients(query);
    }
    
    return getAllClients();
  };

  const getDestinationsForVille = (ville: string) => {
    const destination = DESTINATIONS.find(d => d.ville === ville);
    return destination ? destination.stations : [];
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <MapPin className="w-5 h-5 mr-2" />
            Bons de Livraison (BL)
          </CardTitle>
          <Button onClick={ajouterBL} className="bg-orange-500 hover:bg-orange-600">
            <Plus className="w-4 h-4 mr-2" />
            Ajouter un BL
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {bls.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <MapPin className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Aucun BL ajouté. Cliquez sur "Ajouter un BL" pour commencer.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {bls.map((bl, index) => (
              <Card key={index} className="border-2 border-orange-100">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-lg">BL #{index + 1}</h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => supprimerBL(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Sélection de la ville */}
                    <div>
                      <Label>Ville de destination *</Label>
                      <Select
                        value={bl.ville}
                        onValueChange={(value) => modifierBL(index, 'ville', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner une ville" />
                        </SelectTrigger>
                        <SelectContent>
                          {DESTINATIONS.map(destination => (
                            <SelectItem key={destination.ville} value={destination.ville}>
                              {destination.ville}
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
                          value={searchQueries[index] || ''}
                          onChange={(e) => setSearchQueries(prev => ({ ...prev, [index]: e.target.value }))}
                          className="pl-10"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Client */}
                    <div>
                      <Label>Client *</Label>
                      <Select
                        value={bl.client_nom}
                        onValueChange={(value) => modifierBL(index, 'client_nom', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner un client" />
                        </SelectTrigger>
                        <SelectContent>
                          {getClientsFiltered(index).map(client => (
                            <SelectItem key={`${client.nom}-${client.ville}`} value={client.nom}>
                              <div className="flex flex-col">
                                <span>{client.nom}</span>
                                <span className="text-xs text-gray-500">{client.ville}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Destination spécifique */}
                    {bl.ville && (
                      <div>
                        <Label>Destination spécifique</Label>
                        <Select
                          value={bl.destination}
                          onValueChange={(value) => modifierBL(index, 'destination', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner une destination" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={bl.ville}>{bl.ville} (Ville)</SelectItem>
                            {getDestinationsForVille(bl.ville).map(station => (
                              <SelectItem key={station} value={station}>
                                {station}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Date d'émission */}
                    <div>
                      <Label>Date d'émission du BL *</Label>
                      <Input
                        type="date"
                        value={bl.date_emission}
                        onChange={(e) => modifierBL(index, 'date_emission', e.target.value)}
                      />
                    </div>

                    {/* Produit */}
                    <div>
                      <Label>Produit *</Label>
                      <Select
                        value={bl.produit}
                        onValueChange={(value) => modifierBL(index, 'produit', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="essence">Essence</SelectItem>
                          <SelectItem value="gasoil">Gasoil</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Quantité */}
                    <div>
                      <Label>Quantité (litres) *</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={bl.quantite_prevue}
                        onChange={(e) => modifierBL(index, 'quantite_prevue', parseFloat(e.target.value) || 0)}
                        placeholder="0.0"
                      />
                    </div>
                  </div>

                  {/* Code client TOTAL */}
                  <div>
                    <Label>Code client TOTAL (optionnel)</Label>
                    <Input
                      value={bl.client_code_total || ''}
                      onChange={(e) => modifierBL(index, 'client_code_total', e.target.value)}
                      placeholder="Code client fourni par TOTAL"
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
