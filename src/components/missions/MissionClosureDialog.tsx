
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle, X, AlertTriangle, Save } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { bonsLivraisonService } from '@/services/bonsLivraison';
import { missionsService } from '@/services/missions';
import { BonLivraison } from '@/types/bl';

interface MissionClosureDialogProps {
  mission: any;
  onClose: () => void;
  onSuccess: () => void;
}

export const MissionClosureDialog = ({ mission, onClose, onSuccess }: MissionClosureDialogProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [bls, setBls] = useState<BonLivraison[]>([]);
  const [loading, setLoading] = useState(true);

  // Charger les BLs associés à la mission
  useEffect(() => {
    const chargerBLs = async () => {
      try {
        const data = await bonsLivraisonService.getByMissionId(mission.id);
        // Cast des données pour s'assurer du bon typage
        const blsTyped = data.map(bl => ({
          ...bl,
          produit: bl.produit as 'essence' | 'gasoil',
          unite_mesure: bl.unite_mesure as 'litres',
          statut: bl.statut as 'emis' | 'charge' | 'en_route' | 'livre' | 'termine'
        }));
        setBls(blsTyped);
      } catch (error) {
        console.error('Erreur lors du chargement des BL:', error);
        toast({
          title: 'Erreur',
          description: 'Impossible de charger les bons de livraison',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };
    chargerBLs();
  }, [mission.id, toast]);

  const updateBL = (index: number, field: keyof BonLivraison, value: any) => {
    const nouveauxBLs = [...bls];
    nouveauxBLs[index] = { ...nouveauxBLs[index], [field]: value };
    setBls(nouveauxBLs);
  };

  const closureMutation = useMutation({
    mutationFn: async () => {
      // Mettre à jour tous les BLs
      for (const bl of bls) {
        if (bl.id) {
          await bonsLivraisonService.update(bl.id, {
            ...bl,
            statut: 'livre'
          });
        }
      }

      // Mettre à jour la mission
      await missionsService.update(mission.id, {
        statut: 'terminee'
      });
    },
    onSuccess: () => {
      toast({
        title: 'Mission clôturée',
        description: 'La mission a été clôturée avec succès'
      });
      queryClient.invalidateQueries({ queryKey: ['missions'] });
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: 'Erreur',
        description: error.message || 'Erreur lors de la clôture de la mission',
        variant: 'destructive'
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation des champs obligatoires
    const blsIncomplets = bls.filter(bl => {
      return !bl.numero_tournee || !bl.date_chargement_reelle || !bl.date_depart || 
             !bl.date_arrivee_reelle || !bl.date_dechargement ||
             bl.manquant_cuve === undefined || bl.manquant_compteur === undefined;
    });

    if (blsIncomplets.length > 0) {
      toast({
        title: 'Champs obligatoires manquants',
        description: 'Veuillez remplir tous les champs obligatoires pour tous les BL, y compris le numéro de tournée',
        variant: 'destructive'
      });
      return;
    }

    closureMutation.mutate();
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <Card className="w-full max-w-4xl mx-4">
          <CardContent className="p-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
              <p>Chargement des informations...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="border-b bg-orange-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-6 h-6 text-orange-500" />
              <div>
                <CardTitle className="text-xl">Clôture de mission</CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  Mission {mission.numero} - Finalisation des informations
                </p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="p-6 space-y-6">
            {bls.length === 0 ? (
              <Alert className="border-amber-200 bg-amber-50">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-800">
                  Aucun bon de livraison trouvé pour cette mission.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-6">
                <div className="text-sm text-gray-600 mb-4">
                  Complétez les informations pour chaque bon de livraison ({bls.length} BL{bls.length > 1 ? 's' : ''})
                </div>

                {bls.map((bl, index) => (
                  <Card key={bl.id || index} className="border-2 border-orange-100">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-lg flex items-center justify-between">
                        <span>BL #{index + 1} - {bl.lieu_arrivee || bl.destination}</span>
                        <div className="text-sm font-normal text-gray-500">
                          {bl.produit} - {bl.quantite_prevue?.toLocaleString()} L
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Numéro de tournée - mis en évidence */}
                      <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                        <Label htmlFor={`tournee-${index}`} className="text-orange-800 font-medium">
                          Numéro de tournée *
                        </Label>
                        <Input
                          id={`tournee-${index}`}
                          value={bl.numero_tournee || ''}
                          onChange={(e) => updateBL(index, 'numero_tournee', e.target.value)}
                          placeholder="Ex: T2024-001"
                          className="mt-1 border-orange-300 focus:border-orange-500 focus:ring-orange-500"
                        />
                        <p className="text-xs text-orange-600 mt-1">
                          Ce numéro apparaîtra sur les factures et exports
                        </p>
                      </div>

                      {/* Modification du client/destination */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-blue-50 rounded-lg">
                        <div>
                          <Label>Lieu d'arrivée / Destination *</Label>
                          <Input
                            value={bl.lieu_arrivee || bl.destination}
                            onChange={(e) => {
                              updateBL(index, 'lieu_arrivee', e.target.value);
                              updateBL(index, 'destination', e.target.value);
                            }}
                            placeholder="Lieu d'arrivée"
                          />
                          <p className="text-xs text-blue-600 mt-1">
                            Modifiable pendant la tournée
                          </p>
                        </div>
                        <div>
                          <Label>Code client TOTAL</Label>
                          <Input
                            value={bl.client_code_total || ''}
                            onChange={(e) => updateBL(index, 'client_code_total', e.target.value)}
                            placeholder="Code TOTAL (optionnel)"
                          />
                        </div>
                      </div>

                      {/* Dates de la tournée */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label>Date de chargement *</Label>
                          <Input
                            type="datetime-local"
                            value={bl.date_chargement_reelle || ''}
                            onChange={(e) => updateBL(index, 'date_chargement_reelle', e.target.value)}
                          />
                        </div>
                        <div>
                          <Label>Date de départ *</Label>
                          <Input
                            type="datetime-local"
                            value={bl.date_depart || ''}
                            onChange={(e) => updateBL(index, 'date_depart', e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label>Date d'arrivée *</Label>
                          <Input
                            type="datetime-local"
                            value={bl.date_arrivee_reelle || ''}
                            onChange={(e) => updateBL(index, 'date_arrivee_reelle', e.target.value)}
                          />
                        </div>
                        <div>
                          <Label>Date de déchargement *</Label>
                          <Input
                            type="datetime-local"
                            value={bl.date_dechargement || ''}
                            onChange={(e) => updateBL(index, 'date_dechargement', e.target.value)}
                          />
                        </div>
                      </div>

                      {/* Quantités manquantes */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                        <div>
                          <Label>Manquant cuve (L) *</Label>
                          <Input
                            type="number"
                            step="0.1"
                            value={bl.manquant_cuve || 0}
                            onChange={(e) => updateBL(index, 'manquant_cuve', parseFloat(e.target.value) || 0)}
                            placeholder="0.0"
                          />
                        </div>
                        <div>
                          <Label>Manquant compteur (L) *</Label>
                          <Input
                            type="number"
                            step="0.1"
                            value={bl.manquant_compteur || 0}
                            onChange={(e) => updateBL(index, 'manquant_compteur', parseFloat(e.target.value) || 0)}
                            placeholder="0.0"
                          />
                        </div>
                        <div>
                          <Label>Total manquant (L)</Label>
                          <Input
                            type="number"
                            value={(bl.manquant_cuve || 0) + (bl.manquant_compteur || 0)}
                            readOnly
                            className="bg-gray-100"
                          />
                        </div>
                      </div>

                      {/* Observations */}
                      <div>
                        <Label>Observations</Label>
                        <Textarea
                          value={bl.observations || ''}
                          onChange={(e) => updateBL(index, 'observations', e.target.value)}
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

          <div className="flex justify-end space-x-4 p-6 border-t bg-gray-50">
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button 
              type="submit" 
              className="bg-green-600 hover:bg-green-700"
              disabled={closureMutation.isPending || bls.length === 0}
            >
              <Save className="w-4 h-4 mr-2" />
              {closureMutation.isPending ? 'Clôture...' : 'Clôturer la mission'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
