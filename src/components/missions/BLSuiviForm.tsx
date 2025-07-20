
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Truck } from 'lucide-react';
import { BonLivraison } from '@/types/bl';
import { getAllClients } from '@/data/destinations';

interface BLSuiviFormProps {
  bls: BonLivraison[];
  onBLsChange: (bls: BonLivraison[]) => void;
  isReadOnly?: boolean;
}

export const BLSuiviForm = ({ bls, onBLsChange, isReadOnly = false }: BLSuiviFormProps) => {
  const modifierBL = (index: number, champ: keyof BonLivraison, valeur: any) => {
    if (isReadOnly) return;
    
    const nouveauxBLs = [...bls];
    nouveauxBLs[index] = { ...nouveauxBLs[index], [champ]: valeur };
    
    // Calculer automatiquement le manquant total
    if (champ === 'manquant_cuve' || champ === 'manquant_compteur') {
      const manquantCuve = champ === 'manquant_cuve' ? valeur : (nouveauxBLs[index].manquant_cuve || 0);
      const manquantCompteur = champ === 'manquant_compteur' ? valeur : (nouveauxBLs[index].manquant_compteur || 0);
      nouveauxBLs[index].manquant_total = manquantCuve + manquantCompteur;
    }
    
    onBLsChange(nouveauxBLs);
  };

  const getStatutColor = (statut: string) => {
    switch (statut) {
      case 'emis': return 'bg-blue-100 text-blue-800';
      case 'charge': return 'bg-yellow-100 text-yellow-800';
      case 'en_route': return 'bg-orange-100 text-orange-800';
      case 'livre': return 'bg-green-100 text-green-800';
      case 'termine': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Truck className="w-5 h-5 mr-2" />
          Suivi des Bons de Livraison
        </CardTitle>
      </CardHeader>
      <CardContent>
        {bls.length === 0 ? (
          <p className="text-center py-8 text-gray-500">Aucun BL à suivre</p>
        ) : (
          <div className="space-y-6">
            {bls.map((bl, index) => (
              <Card key={index} className="border-2 border-blue-100">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-lg">
                        BL #{index + 1} - {bl.client_nom}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {bl.destination} • {bl.produit} • {bl.quantite_prevue} litres
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatutColor(bl.statut)}`}>
                      {bl.statut.toUpperCase()}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Modification du client si nécessaire */}
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <Label className="text-sm font-medium text-yellow-800">
                      Modification du lieu de livraison (si changement pendant la tournée)
                    </Label>
                    <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm">Nouveau client</Label>
                        <Select
                          value={bl.client_nom}
                          onValueChange={(value) => modifierBL(index, 'client_nom', value)}
                          disabled={isReadOnly}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {getAllClients().map(client => (
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
                      <div>
                        <Label className="text-sm">Nouvelle destination</Label>
                        <Input
                          value={bl.destination}
                          onChange={(e) => modifierBL(index, 'destination', e.target.value)}
                          disabled={isReadOnly}
                          placeholder="Nouvelle destination"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Informations de suivi */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Numéro de tournée</Label>
                      <Input
                        value={bl.numero_tournee || ''}
                        onChange={(e) => modifierBL(index, 'numero_tournee', e.target.value)}
                        disabled={isReadOnly}
                        placeholder="Ex: T001"
                      />
                    </div>
                    <div>
                      <Label>Quantité livrée (litres)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={bl.quantite_livree || ''}
                        onChange={(e) => modifierBL(index, 'quantite_livree', parseFloat(e.target.value) || 0)}
                        disabled={isReadOnly}
                        placeholder="0.0"
                      />
                    </div>
                  </div>

                  {/* Dates de suivi */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <Label>Date de chargement</Label>
                      <Input
                        type="datetime-local"
                        value={bl.date_chargement_reelle || ''}
                        onChange={(e) => modifierBL(index, 'date_chargement_reelle', e.target.value)}
                        disabled={isReadOnly}
                      />
                    </div>
                    <div>
                      <Label>Date de départ</Label>
                      <Input
                        type="datetime-local"
                        value={bl.date_depart || ''}
                        onChange={(e) => modifierBL(index, 'date_depart', e.target.value)}
                        disabled={isReadOnly}
                      />
                    </div>
                    <div>
                      <Label>Date d'arrivée</Label>
                      <Input
                        type="datetime-local"
                        value={bl.date_arrivee_reelle || ''}
                        onChange={(e) => modifierBL(index, 'date_arrivee_reelle', e.target.value)}
                        disabled={isReadOnly}
                      />
                    </div>
                    <div>
                      <Label>Date de déchargement</Label>
                      <Input
                        type="datetime-local"
                        value={bl.date_dechargement || ''}
                        onChange={(e) => modifierBL(index, 'date_dechargement', e.target.value)}
                        disabled={isReadOnly}
                      />
                    </div>
                  </div>

                  {/* Quantités manquantes */}
                  <div className="bg-red-50 p-4 rounded-lg">
                    <Label className="text-sm font-medium text-red-800 mb-3 block">
                      Quantités manquantes
                    </Label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label className="text-sm">Manquant Cuve (litres)</Label>
                        <Input
                          type="number"
                          step="0.1"
                          value={bl.manquant_cuve || ''}
                          onChange={(e) => modifierBL(index, 'manquant_cuve', parseFloat(e.target.value) || 0)}
                          disabled={isReadOnly}
                          placeholder="0.0"
                        />
                      </div>
                      <div>
                        <Label className="text-sm">Manquant Compteur (litres)</Label>
                        <Input
                          type="number"
                          step="0.1"
                          value={bl.manquant_compteur || ''}
                          onChange={(e) => modifierBL(index, 'manquant_compteur', parseFloat(e.target.value) || 0)}
                          disabled={isReadOnly}
                          placeholder="0.0"
                        />
                      </div>
                      <div>
                        <Label className="text-sm">Total Manquant (auto)</Label>
                        <Input
                          type="number"
                          value={bl.manquant_total || 0}
                          disabled
                          className="bg-gray-100"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Statut */}
                  <div>
                    <Label>Statut du BL</Label>
                    <Select
                      value={bl.statut}
                      onValueChange={(value) => modifierBL(index, 'statut', value)}
                      disabled={isReadOnly}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="emis">Émis</SelectItem>
                        <SelectItem value="charge">Chargé</SelectItem>
                        <SelectItem value="en_route">En route</SelectItem>
                        <SelectItem value="livre">Livré</SelectItem>
                        <SelectItem value="termine">Terminé</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Observations */}
                  <div>
                    <Label>Observations</Label>
                    <Textarea
                      value={bl.observations || ''}
                      onChange={(e) => modifierBL(index, 'observations', e.target.value)}
                      disabled={isReadOnly}
                      placeholder="Observations sur ce BL..."
                      rows={2}
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
