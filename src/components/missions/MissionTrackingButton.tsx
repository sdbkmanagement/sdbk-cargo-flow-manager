
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Truck, X, Save } from 'lucide-react';
import { bonsLivraisonService } from '@/services/bonsLivraison';
import { missionsService } from '@/services/missions';
import { BonLivraison } from '@/types/bl';

interface MissionTrackingButtonProps {
  mission: any;
  onSuccess: () => void;
}

export const MissionTrackingButton = ({ mission, onSuccess }: MissionTrackingButtonProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showDialog, setShowDialog] = useState(false);
  const [bls, setBls] = useState<BonLivraison[]>([]);
  const [loading, setLoading] = useState(false);

  const handleOpenDialog = async () => {
    setLoading(true);
    try {
      const data = await bonsLivraisonService.getByMissionId(mission.id);
      const blsTyped = data.map(bl => ({
        ...bl,
        produit: bl.produit as 'essence' | 'gasoil',
        unite_mesure: bl.unite_mesure as 'litres',
        statut: bl.statut as 'emis' | 'charge' | 'en_route' | 'livre' | 'termine'
      }));
      setBls(blsTyped);
      setShowDialog(true);
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

  const updateBL = (index: number, field: keyof BonLivraison, value: any) => {
    const nouveauxBLs = [...bls];
    nouveauxBLs[index] = { ...nouveauxBLs[index], [field]: value };
    
    // Calculer automatiquement le manquant total
    if (field === 'manquant_cuve' || field === 'manquant_compteur') {
      const manquantCuve = field === 'manquant_cuve' ? value : (nouveauxBLs[index].manquant_cuve || 0);
      const manquantCompteur = field === 'manquant_compteur' ? value : (nouveauxBLs[index].manquant_compteur || 0);
      nouveauxBLs[index].manquant_total = manquantCuve + manquantCompteur;
    }
    
    setBls(nouveauxBLs);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      // Mettre à jour tous les BLs
      for (const bl of bls) {
        if (bl.id) {
          await bonsLivraisonService.update(bl.id, {
            ...bl,
            statut: 'termine'
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
        title: 'Mission mise à jour',
        description: 'Les informations de suivi ont été enregistrées'
      });
      queryClient.invalidateQueries({ queryKey: ['missions'] });
      setShowDialog(false);
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: 'Erreur',
        description: error.message || 'Erreur lors de la sauvegarde',
        variant: 'destructive'
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation des champs obligatoires
    const blsIncomplets = bls.filter(bl => {
      return !bl.date_chargement_reelle || !bl.date_depart || 
             !bl.date_arrivee_reelle || !bl.date_dechargement ||
             bl.manquant_cuve === undefined || bl.manquant_compteur === undefined;
    });

    if (blsIncomplets.length > 0) {
      toast({
        title: 'Champs obligatoires manquants',
        description: 'Veuillez remplir tous les champs obligatoires pour tous les BL',
        variant: 'destructive'
      });
      return;
    }

    saveMutation.mutate();
  };

  if (!showDialog) {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={handleOpenDialog}
        disabled={loading}
        className="hover:bg-blue-50 hover:text-blue-600 transition-colors duration-200"
        title="Saisir les informations de suivi"
      >
        <Truck className="w-4 h-4" />
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="border-b bg-blue-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Truck className="w-6 h-6 text-blue-500" />
              <div>
                <CardTitle className="text-xl">Suivi de mission</CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  Mission {mission.numero} - Saisie des informations de transport
                </p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setShowDialog(false)}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="p-6 space-y-6">
            {bls.map((bl, index) => (
              <Card key={bl.id || index} className="border-2 border-blue-100">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg flex items-center justify-between">
                    <span>BL #{index + 1} - {bl.lieu_arrivee || bl.destination}</span>
                    <div className="text-sm font-normal text-gray-500">
                      {bl.lieu_depart} → {bl.lieu_arrivee || bl.destination}
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Code client TOTAL */}
                  <div>
                    <Label>Code client TOTAL</Label>
                    <Input
                      value={bl.client_code_total || ''}
                      onChange={(e) => updateBL(index, 'client_code_total', e.target.value)}
                      placeholder="Code TOTAL (si applicable)"
                    />
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
          </CardContent>

          <div className="flex justify-end space-x-4 p-6 border-t bg-gray-50">
            <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
              Annuler
            </Button>
            <Button 
              type="submit" 
              className="bg-green-600 hover:bg-green-700"
              disabled={saveMutation.isPending}
            >
              <Save className="w-4 h-4 mr-2" />
              {saveMutation.isPending ? 'Sauvegarde...' : 'Terminer la mission'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
