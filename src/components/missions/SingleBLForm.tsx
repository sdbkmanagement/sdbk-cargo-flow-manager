
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, FileText } from 'lucide-react';
import { BonLivraison } from '@/types/bl';
import { ClientSelector } from './ClientSelector';

interface SingleBLFormProps {
  bl: BonLivraison;
  index: number;
  onUpdate: (field: keyof BonLivraison, value: any) => void;
  onRemove: () => void;
  canRemove: boolean;
}

export const SingleBLForm = ({ bl, index, onUpdate, onRemove, canRemove }: SingleBLFormProps) => {
  const handleClientChange = (clientNom: string) => {
    console.log(`🎯 BL ${index}: handleClientChange appelé avec:`, clientNom);
    console.log(`📝 BL ${index}: Valeurs AVANT modification:`, {
      client_nom: bl.client_nom,
      destination: bl.destination,
      lieu_arrivee: bl.lieu_arrivee
    });
    
    // Mise à jour synchrone de tous les champs liés
    onUpdate('client_nom', clientNom);
    onUpdate('destination', clientNom);
    onUpdate('lieu_arrivee', clientNom);
    
    console.log(`✅ BL ${index}: Client mis à jour:`, clientNom);
  };

  const handleDestinationChange = (destination: string) => {
    console.log(`🎯 BL ${index}: handleDestinationChange appelé avec:`, destination);
    // Cette fonction reste vide car tout passe par handleClientChange
  };

  // Log des valeurs actuelles du BL avec plus de détails
  console.log(`📊 BL ${index} - État actuel complet:`, {
    client_nom: bl.client_nom || 'VIDE',
    destination: bl.destination || 'VIDE',
    lieu_depart: bl.lieu_depart || 'VIDE',
    lieu_arrivee: bl.lieu_arrivee || 'VIDE',
    date_emission: bl.date_emission || 'VIDE',
    quantite_prevue: bl.quantite_prevue || 0,
    produit: bl.produit
  });

  return (
    <Card className="border-2 border-orange-100">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <FileText className="w-5 h-5 mr-2 text-orange-500" />
            BL #{index + 1}
          </CardTitle>
          {canRemove && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onRemove}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Lieux de départ et d'arrivée */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-blue-50 rounded-lg">
          <div>
            <Label>Lieu de départ *</Label>
            <Select
              value={bl.lieu_depart || ''}
              onValueChange={(value) => {
                console.log(`🚚 BL ${index}: Lieu de départ sélectionné:`, value);
                onUpdate('lieu_depart', value);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner le lieu de départ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Conakry">Conakry</SelectItem>
                <SelectItem value="Kankan">Kankan</SelectItem>
                <SelectItem value="N'Zerekore">N'Zerekore</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Lieu d'arrivée (Client)</Label>
            <Input
              value={bl.lieu_arrivee || bl.client_nom || ''}
              readOnly
              className="bg-gray-100"
              placeholder="Défini par le client sélectionné"
            />
            <p className="text-xs text-blue-600 mt-1">
              Automatiquement défini par le client
            </p>
          </div>
        </div>

        {/* Sélection client/destination */}
        <div>
          <Label>Client / Destination *</Label>
          <ClientSelector
            selectedClient={bl.client_nom || bl.destination || ''}
            selectedDestination={bl.destination || bl.client_nom || ''}
            onClientChange={handleClientChange}
            onDestinationChange={handleDestinationChange}
            blIndex={index}
            hideDestinationField={true}
          />
        </div>

        {/* Informations du BL */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label>Date d'émission du BL *</Label>
            <Input
              type="date"
              value={bl.date_emission}
              onChange={(e) => {
                console.log(`📅 BL ${index}: Date d'émission changée:`, e.target.value);
                onUpdate('date_emission', e.target.value);
              }}
            />
          </div>

          <div>
            <Label>Produit *</Label>
            <Select
              value={bl.produit}
              onValueChange={(value) => {
                console.log(`⛽ BL ${index}: Produit sélectionné:`, value);
                onUpdate('produit', value);
              }}
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

          <div>
            <Label>Quantité (litres) *</Label>
            <Input
              type="number"
              step="0.1"
              value={bl.quantite_prevue}
              onChange={(e) => {
                const newValue = parseFloat(e.target.value) || 0;
                console.log(`📊 BL ${index}: Quantité changée:`, newValue);
                onUpdate('quantite_prevue', newValue);
              }}
              placeholder="0.0"
            />
          </div>
        </div>

        {/* Code client TOTAL */}
        <div>
          <Label>Code client TOTAL (optionnel)</Label>
          <Input
            value={bl.client_code_total || ''}
            onChange={(e) => onUpdate('client_code_total', e.target.value)}
            placeholder="Code client fourni par TOTAL"
          />
        </div>

        {/* Informations de suivi (affichées seulement si déjà renseignées) */}
        {(bl.numero_tournee || bl.date_chargement_reelle || bl.manquant_total) && (
          <div className="border-t pt-4 mt-4">
            <h5 className="font-medium text-gray-700 mb-3">Informations de suivi</h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              {bl.numero_tournee && (
                <div>
                  <span className="font-medium">Numéro de tournée:</span> {bl.numero_tournee}
                </div>
              )}
              {bl.date_chargement_reelle && (
                <div>
                  <span className="font-medium">Date de chargement:</span> {new Date(bl.date_chargement_reelle).toLocaleDateString()}
                </div>
              )}
              {bl.manquant_total && bl.manquant_total > 0 && (
                <div className="text-red-600">
                  <span className="font-medium">Manquant total:</span> {bl.manquant_total} L
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
