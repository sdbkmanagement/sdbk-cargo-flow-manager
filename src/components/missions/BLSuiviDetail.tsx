
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { FileText, AlertTriangle, CheckCircle } from 'lucide-react';
import { BonLivraison } from '@/types/bl';

interface BLSuiviDetailProps {
  bl: BonLivraison;
  index: number;
  onUpdate: (field: keyof BonLivraison, value: any) => void;
  isReadOnly?: boolean;
}

export const BLSuiviDetail = ({ bl, index, onUpdate, isReadOnly = false }: BLSuiviDetailProps) => {
  const getStatutBadge = (statut: string) => {
    const variants = {
      'emis': 'bg-blue-100 text-blue-800',
      'charge': 'bg-yellow-100 text-yellow-800',
      'en_route': 'bg-purple-100 text-purple-800',
      'livre': 'bg-green-100 text-green-800',
      'termine': 'bg-gray-100 text-gray-800'
    };
    
    return (
      <Badge className={variants[statut as keyof typeof variants] || 'bg-gray-100 text-gray-800'}>
        {statut.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  const manquantTotal = (bl.manquant_cuve || 0) + (bl.manquant_compteur || 0);
  const hasProblems = manquantTotal > 0;

  return (
    <Card className={`border-2 ${hasProblems ? 'border-red-200 bg-red-50' : 'border-gray-200'}`}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <FileText className="w-5 h-5 mr-2 text-orange-500" />
            BL #{index + 1} - {bl.client_nom}
            {hasProblems ? (
              <AlertTriangle className="w-4 h-4 ml-2 text-red-500" />
            ) : (
              <CheckCircle className="w-4 h-4 ml-2 text-green-500" />
            )}
          </CardTitle>
          <div className="flex items-center space-x-2">
            {getStatutBadge(bl.statut)}
          </div>
        </div>
        <div className="text-sm text-gray-600">
          <span className="font-medium">{bl.destination}</span> • 
          <span className="ml-1">{bl.produit}</span> • 
          <span className="ml-1">{bl.quantite_prevue.toLocaleString()} L prévus</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Informations de suivi */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Numéro de tournée</Label>
            <Input
              value={bl.numero_tournee || ''}
              onChange={(e) => onUpdate('numero_tournee', e.target.value)}
              placeholder="Ex: T2024-001"
              disabled={isReadOnly}
            />
          </div>
          
          <div>
            <Label>Quantité livrée (L)</Label>
            <Input
              type="number"
              step="0.1"
              value={bl.quantite_livree || ''}
              onChange={(e) => onUpdate('quantite_livree', parseFloat(e.target.value) || 0)}
              placeholder="0.0"
              disabled={isReadOnly}
            />
          </div>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Date de chargement</Label>
            <Input
              type="datetime-local"
              value={bl.date_chargement_reelle ? new Date(bl.date_chargement_reelle).toISOString().slice(0, 16) : ''}
              onChange={(e) => onUpdate('date_chargement_reelle', e.target.value ? new Date(e.target.value).toISOString() : null)}
              disabled={isReadOnly}
            />
          </div>
          
          <div>
            <Label>Date de départ</Label>
            <Input
              type="datetime-local"
              value={bl.date_depart ? new Date(bl.date_depart).toISOString().slice(0, 16) : ''}
              onChange={(e) => onUpdate('date_depart', e.target.value ? new Date(e.target.value).toISOString() : null)}
              disabled={isReadOnly}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Date d'arrivée</Label>
            <Input
              type="datetime-local"
              value={bl.date_arrivee_reelle ? new Date(bl.date_arrivee_reelle).toISOString().slice(0, 16) : ''}
              onChange={(e) => onUpdate('date_arrivee_reelle', e.target.value ? new Date(e.target.value).toISOString() : null)}
              disabled={isReadOnly}
            />
          </div>
          
          <div>
            <Label>Date de déchargement</Label>
            <Input
              type="datetime-local"
              value={bl.date_dechargement ? new Date(bl.date_dechargement).toISOString().slice(0, 16) : ''}
              onChange={(e) => onUpdate('date_dechargement', e.target.value ? new Date(e.target.value).toISOString() : null)}
              disabled={isReadOnly}
            />
          </div>
        </div>

        {/* Manquants */}
        <div className="border-t pt-4">
          <h5 className="font-medium text-gray-700 mb-3">Quantités manquantes</h5>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Manquant Cuve (L)</Label>
              <Input
                type="number"
                step="0.1"
                value={bl.manquant_cuve || ''}
                onChange={(e) => onUpdate('manquant_cuve', parseFloat(e.target.value) || 0)}
                placeholder="0.0"
                disabled={isReadOnly}
                className={hasProblems ? 'border-red-300' : ''}
              />
            </div>
            
            <div>
              <Label>Manquant Compteur (L)</Label>
              <Input
                type="number"
                step="0.1"
                value={bl.manquant_compteur || ''}
                onChange={(e) => onUpdate('manquant_compteur', parseFloat(e.target.value) || 0)}
                placeholder="0.0"
                disabled={isReadOnly}
                className={hasProblems ? 'border-red-300' : ''}
              />
            </div>
            
            <div>
              <Label>Total Manquant (L)</Label>
              <div className={`p-2 rounded border bg-gray-50 ${hasProblems ? 'text-red-600 font-medium' : ''}`}>
                {manquantTotal.toFixed(1)} L
              </div>
            </div>
          </div>
        </div>

        {/* Observations */}
        <div>
          <Label>Observations</Label>
          <Input
            value={bl.observations || ''}
            onChange={(e) => onUpdate('observations', e.target.value)}
            placeholder="Observations particulières..."
            disabled={isReadOnly}
          />
        </div>
      </CardContent>
    </Card>
  );
};
