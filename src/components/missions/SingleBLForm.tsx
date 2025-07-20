
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
    console.log('Mise à jour client_nom pour BL:', clientNom);
    onUpdate('client_nom', clientNom);
  };

  const handleDestinationChange = (destination: string) => {
    console.log('Mise à jour destination pour BL:', destination);
    onUpdate('destination', destination);
  };

  return (
    <Card className="border-l-4 border-l-orange-400">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center text-lg">
            <FileText className="w-5 h-5 mr-2" />
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
        {/* Sélection Client/Destination */}
        <ClientSelector
          selectedClient={bl.client_nom || ''}
          selectedDestination={bl.destination || ''}
          onClientChange={handleClientChange}
          onDestinationChange={handleDestinationChange}
          blIndex={index}
          hideDestinationField={true}
        />

        {/* Informations du BL */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor={`date_emission_${index}`}>Date d'émission *</Label>
            <Input
              id={`date_emission_${index}`}
              type="date"
              value={bl.date_emission}
              onChange={(e) => onUpdate('date_emission', e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor={`produit_${index}`}>Produit *</Label>
            <Select value={bl.produit} onValueChange={(value) => onUpdate('produit', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="essence">Essence</SelectItem>
                <SelectItem value="gasoil">Gasoil</SelectItem>
                <SelectItem value="lubrifiant">Lubrifiant</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor={`quantite_prevue_${index}`}>Quantité prévue (L) *</Label>
            <Input
              id={`quantite_prevue_${index}`}
              type="number"
              min="0"
              step="0.1"
              value={bl.quantite_prevue}
              onChange={(e) => onUpdate('quantite_prevue', parseFloat(e.target.value) || 0)}
              placeholder="0"
              required
            />
          </div>
        </div>

        {/* Statut et Observations */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor={`statut_${index}`}>Statut</Label>
            <Select value={bl.statut} onValueChange={(value) => onUpdate('statut', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="emis">Émis</SelectItem>
                <SelectItem value="en_cours">En cours</SelectItem>
                <SelectItem value="livre">Livré</SelectItem>
                <SelectItem value="annule">Annulé</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor={`unite_mesure_${index}`}>Unité de mesure</Label>
            <Select value={bl.unite_mesure} onValueChange={(value) => onUpdate('unite_mesure', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="litres">Litres</SelectItem>
                <SelectItem value="tonnes">Tonnes</SelectItem>
                <SelectItem value="m3">m³</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
