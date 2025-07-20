
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
    console.log(`🔧 Modification BL ${index}, champ: ${champ}, valeur:`, valeur);
    
    const nouveauxBLs = [...bls];
    nouveauxBLs[index] = { ...nouveauxBLs[index], [champ]: valeur };
    
    // Log détaillé après modification
    console.log(`📋 BL ${index} après modification - État complet:`, {
      client_nom: nouveauxBLs[index].client_nom || 'VIDE',
      destination: nouveauxBLs[index].destination || 'VIDE',
      lieu_depart: nouveauxBLs[index].lieu_depart || 'VIDE',
      lieu_arrivee: nouveauxBLs[index].lieu_arrivee || 'VIDE',
      date_emission: nouveauxBLs[index].date_emission || 'VIDE',
      quantite_prevue: nouveauxBLs[index].quantite_prevue || 0,
      produit: nouveauxBLs[index].produit
    });
    
    onBLsChange(nouveauxBLs);
  };

  // Validation simplifiée et plus robuste
  const blsIncomplets = bls.filter((bl, blIndex) => {
    // Un BL est considéré comme valide si :
    // 1. Il a un client OU une destination (pas les deux vides)
    // 2. Il a une date d'émission
    // 3. Il a une quantité > 0
    // 4. Il a un lieu de départ
    
    const aClientOuDestination = (bl.client_nom && bl.client_nom.trim() !== '') || 
                                 (bl.destination && bl.destination.trim() !== '');
    const aDate = bl.date_emission && bl.date_emission.trim() !== '';
    const aQuantiteValide = bl.quantite_prevue && bl.quantite_prevue > 0;
    const aLieuDepart = bl.lieu_depart && bl.lieu_depart.trim() !== '';
    
    const estComplet = aClientOuDestination && aDate && aQuantiteValide && aLieuDepart;
    
    if (!estComplet) {
      console.log(`❌ BL ${blIndex} est incomplet:`, {
        aClientOuDestination: aClientOuDestination,
        aDate: aDate,
        aQuantiteValide: aQuantiteValide,
        aLieuDepart: aLieuDepart,
        valeurs_actuelles: {
          client_nom: bl.client_nom || 'VIDE',
          destination: bl.destination || 'VIDE',
          date_emission: bl.date_emission || 'VIDE',
          quantite_prevue: bl.quantite_prevue || 0,
          lieu_depart: bl.lieu_depart || 'VIDE'
        }
      });
    } else {
      console.log(`✅ BL ${blIndex} est complet`);
    }
    
    return !estComplet;
  });

  console.log(`📊 Validation globale finale: ${blsIncomplets.length}/${bls.length} BL incomplets`);

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
              Veuillez remplir tous les champs obligatoires avant de sauvegarder la mission.
              <div className="mt-2 text-xs">
                Champs requis: Client/Destination, Date d&apos;émission, Quantité &gt; 0, Lieu de départ
              </div>
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
                key={`bl-${index}-${bl.numero || 'new'}`}
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
