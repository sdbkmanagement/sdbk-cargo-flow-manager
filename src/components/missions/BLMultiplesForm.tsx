
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, MapPin, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { BonLivraison } from '@/types/bl';
import { SingleBLForm } from './SingleBLForm';

interface BLMultiplesFormProps {
  bls: BonLivraison[];
  onBLsChange: (bls: BonLivraison[]) => void;
  vehiculeId: string;
  chauffeurId: string;
}

export const BLMultiplesForm = ({ bls, onBLsChange, vehiculeId, chauffeurId }: BLMultiplesFormProps) => {
  const ajouterBL = () => {
    const nouveauBL: BonLivraison = {
      numero: `BL-${Date.now()}`, // Temporary numero, will be replaced by database trigger
      client_nom: '',
      destination: '',
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
    if (bls.length <= 1) return; // Toujours garder au moins un BL
    const nouveauxBLs = bls.filter((_, i) => i !== index);
    onBLsChange(nouveauxBLs);
  };

  const modifierBL = (index: number, champ: keyof BonLivraison, valeur: any) => {
    const nouveauxBLs = [...bls];
    nouveauxBLs[index] = { ...nouveauxBLs[index], [champ]: valeur };
    onBLsChange(nouveauxBLs);
  };

  // Validation des BL - logique simplifiée
  const blsIncomplets = bls.filter(bl => {
    const isIncomplet = (
      !bl.client_nom || 
      bl.client_nom.trim() === '' ||
      !bl.date_emission || 
      bl.date_emission.trim() === '' ||
      !bl.quantite_prevue || 
      bl.quantite_prevue <= 0
    );
    
    console.log('Validation BL:', {
      client_nom: bl.client_nom,
      date_emission: bl.date_emission,
      quantite_prevue: bl.quantite_prevue,
      isIncomplet
    });
    
    return isIncomplet;
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <MapPin className="w-5 h-5 mr-2" />
            Bons de Livraison (BL)
            <span className="ml-2 text-sm font-normal text-gray-500">
              ({bls.length} BL{bls.length > 1 ? 's' : ''})
            </span>
          </CardTitle>
          <Button onClick={ajouterBL} className="bg-orange-500 hover:bg-orange-600">
            <Plus className="w-4 h-4 mr-2" />
            Ajouter un BL
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Alerte si des BL sont incomplets */}
        {blsIncomplets.length > 0 && (
          <Alert className="mb-6 border-amber-200 bg-amber-50">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800">
              <strong>Attention:</strong> {blsIncomplets.length} BL{blsIncomplets.length > 1 ? 's sont' : ' est'} incomplet{blsIncomplets.length > 1 ? 's' : ''}. 
              Veuillez vérifier que tous les champs obligatoires sont remplis (Client, Date, Quantité).
            </AlertDescription>
          </Alert>
        )}

        {bls.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <MapPin className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Aucun BL ajouté. Cliquez sur "Ajouter un BL" pour commencer.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {bls.map((bl, index) => (
              <SingleBLForm
                key={index}
                bl={bl}
                index={index}
                onUpdate={(field, value) => modifierBL(index, field, value)}
                onRemove={() => supprimerBL(index)}
                canRemove={bls.length > 1}
              />
            ))}
          </div>
        )}

        {/* Résumé des quantités */}
        {bls.length > 0 && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h5 className="font-medium text-gray-700 mb-2">Résumé des quantités</h5>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Total Essence:</span>
                <div className="font-medium text-blue-600">
                  {bls.filter(bl => bl.produit === 'essence').reduce((sum, bl) => sum + bl.quantite_prevue, 0).toLocaleString()} L
                </div>
              </div>
              <div>
                <span className="text-gray-600">Total Gasoil:</span>
                <div className="font-medium text-green-600">
                  {bls.filter(bl => bl.produit === 'gasoil').reduce((sum, bl) => sum + bl.quantite_prevue, 0).toLocaleString()} L
                </div>
              </div>
              <div>
                <span className="text-gray-600">Total général:</span>
                <div className="font-medium text-orange-600">
                  {bls.reduce((sum, bl) => sum + bl.quantite_prevue, 0).toLocaleString()} L
                </div>
              </div>
              <div>
                <span className="text-gray-600">Nombre de BL:</span>
                <div className="font-medium">{bls.length}</div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
