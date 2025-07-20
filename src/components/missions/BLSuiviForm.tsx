
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';
import { BonLivraison } from '@/types/bl';
import { BLSuiviDetail } from './BLSuiviDetail';

interface BLSuiviFormProps {
  bls: BonLivraison[];
  onBLsChange: (bls: BonLivraison[]) => void;
  isReadOnly?: boolean;
}

export const BLSuiviForm = ({ bls, onBLsChange, isReadOnly = false }: BLSuiviFormProps) => {
  const modifierBL = (index: number, champ: keyof BonLivraison, valeur: any) => {
    const nouveauxBLs = [...bls];
    nouveauxBLs[index] = { ...nouveauxBLs[index], [champ]: valeur };
    onBLsChange(nouveauxBLs);
  };

  // Calculs de résumé
  const totalPrevu = bls.reduce((sum, bl) => sum + bl.quantite_prevue, 0);
  const totalLivre = bls.reduce((sum, bl) => sum + (bl.quantite_livree || 0), 0);
  const totalManquant = bls.reduce((sum, bl) => sum + ((bl.manquant_cuve || 0) + (bl.manquant_compteur || 0)), 0);
  const blsAvecProblemes = bls.filter(bl => ((bl.manquant_cuve || 0) + (bl.manquant_compteur || 0)) > 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <TrendingUp className="w-5 h-5 mr-2" />
          Suivi des Bons de Livraison
          <span className="ml-2 text-sm font-normal text-gray-500">
            ({bls.length} BL{bls.length > 1 ? 's' : ''})
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Résumé global */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h5 className="font-medium text-gray-700 mb-3">Résumé de la mission</h5>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{totalPrevu.toLocaleString()}</div>
              <div className="text-sm text-gray-600">Litres prévus</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{totalLivre.toLocaleString()}</div>
              <div className="text-sm text-gray-600">Litres livrés</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${totalManquant > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                {totalManquant.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">Litres manquants</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{bls.length}</div>
              <div className="text-sm text-gray-600">BL{bls.length > 1 ? 's' : ''}</div>
            </div>
          </div>
        </div>

        {/* Alerte si des problèmes */}
        {blsAvecProblemes.length > 0 && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <strong>Attention:</strong> {blsAvecProblemes.length} BL{blsAvecProblemes.length > 1 ? 's présentent' : ' présente'} des manquants.
              Total des manquants: <strong>{totalManquant.toLocaleString()} litres</strong>
            </AlertDescription>
          </Alert>
        )}

        {/* Alerte si tout est OK */}
        {blsAvecProblemes.length === 0 && totalLivre > 0 && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              <strong>Parfait!</strong> Tous les BL ont été livrés sans manquant.
            </AlertDescription>
          </Alert>
        )}

        {/* Liste des BL pour suivi */}
        <div className="space-y-6">
          {bls.map((bl, index) => (
            <BLSuiviDetail
              key={bl.id || index}
              bl={bl}
              index={index}
              onUpdate={(field, value) => modifierBL(index, field, value)}
              isReadOnly={isReadOnly}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
