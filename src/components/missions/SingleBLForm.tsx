
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
    // Mettre à jour les deux champs simultanément pour éviter la désynchronisation
    onUpdate('client_nom', clientNom);
    onUpdate('destination', clientNom);
  };

  const handleDestinationChange = (destination: string) => {
    // Si on change la destination, on met aussi à jour le client pour maintenir la cohérence
    onUpdate('destination', destination);
    onUpdate('client_nom', destination);
  };

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
        {/* Sélection client uniquement */}
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
              onChange={(e) => onUpdate('date_emission', e.target.value)}
            />
          </div>

          <div>
            <Label>Produit *</Label>
            <Select
              value={bl.produit}
              onValueChange={(value) => onUpdate('produit', value)}
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
              onChange={(e) => onUpdate('quantite_prevue', parseFloat(e.target.value) || 0)}
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
