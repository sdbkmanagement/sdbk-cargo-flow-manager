import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { processusSDBKService, type TarifDestination } from '@/services/processus-sdbk';
import { MapPin, Plus, Edit, Calculator } from 'lucide-react';

export const TarifsManagement = () => {
  const [tarifs, setTarifs] = useState<TarifDestination[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [editingTarif, setEditingTarif] = useState<TarifDestination | null>(null);
  const [formData, setFormData] = useState({
    destination: '',
    prix_unitaire_essence: '',
    prix_unitaire_gasoil: '',
    distance_km: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    loadTarifs();
  }, []);

  const loadTarifs = async () => {
    try {
      setLoading(true);
      const data = await processusSDBKService.getTarifs();
      setTarifs(data);
    } catch (error) {
      console.error('Erreur:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les tarifs',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      // TODO: Implement create/update tarif
      toast({
        title: 'Information',
        description: 'Modification des tarifs à implémenter',
      });
      
      setShowDialog(false);
      setEditingTarif(null);
      resetForm();
      loadTarifs();
    } catch (error) {
      console.error('Erreur:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de sauvegarder le tarif',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      destination: '',
      prix_unitaire_essence: '',
      prix_unitaire_gasoil: '',
      distance_km: ''
    });
  };

  const openEditDialog = (tarif: TarifDestination) => {
    setEditingTarif(tarif);
    setFormData({
      destination: tarif.destination,
      prix_unitaire_essence: tarif.prix_unitaire_essence.toString(),
      prix_unitaire_gasoil: tarif.prix_unitaire_gasoil.toString(),
      distance_km: tarif.distance_km?.toString() || ''
    });
    setShowDialog(true);
  };

  const openCreateDialog = () => {
    setEditingTarif(null);
    resetForm();
    setShowDialog(true);
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calculator className="w-6 h-6" />
          <h2 className="text-2xl font-bold">Péréquation TOTAL - Tarifs par Destination</h2>
        </div>
        <Button onClick={openCreateDialog} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Nouveau Tarif
        </Button>
      </div>

      {/* Tableau des tarifs */}
      <Card>
        <CardHeader>
          <CardTitle>Tarifs en vigueur</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-medium">Destination</th>
                  <th className="text-right p-3 font-medium">Distance (km)</th>
                  <th className="text-right p-3 font-medium">Prix Essence (GNF/L)</th>
                  <th className="text-right p-3 font-medium">Prix Gasoil (GNF/L)</th>
                  <th className="text-center p-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {tarifs.map((tarif) => (
                  <tr key={tarif.id} className="border-b hover:bg-gray-50">
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-500" />
                        <span className="font-medium">{tarif.destination}</span>
                      </div>
                    </td>
                    <td className="p-3 text-right">
                      {tarif.distance_km ? `${tarif.distance_km} km` : '-'}
                    </td>
                    <td className="p-3 text-right font-mono">
                      {tarif.prix_unitaire_essence.toLocaleString()} GNF
                    </td>
                    <td className="p-3 text-right font-mono">
                      {tarif.prix_unitaire_gasoil.toLocaleString()} GNF
                    </td>
                    <td className="p-3 text-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(tarif)}
                      >
                        <Edit className="w-3 h-3 mr-1" />
                        Modifier
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Dialog de création/modification */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingTarif ? 'Modifier le tarif' : 'Nouveau tarif'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="destination">Destination</Label>
              <Input
                id="destination"
                value={formData.destination}
                onChange={(e) => setFormData(prev => ({ ...prev, destination: e.target.value }))}
                placeholder="Ex: Mamou, Labé..."
                required
                disabled={!!editingTarif}
              />
            </div>

            <div>
              <Label htmlFor="distance_km">Distance (km)</Label>
              <Input
                id="distance_km"
                type="number"
                value={formData.distance_km}
                onChange={(e) => setFormData(prev => ({ ...prev, distance_km: e.target.value }))}
                placeholder="280"
              />
            </div>

            <div>
              <Label htmlFor="prix_unitaire_essence">Prix unitaire Essence (GNF/L)</Label>
              <Input
                id="prix_unitaire_essence"
                type="number"
                step="0.001"
                value={formData.prix_unitaire_essence}
                onChange={(e) => setFormData(prev => ({ ...prev, prix_unitaire_essence: e.target.value }))}
                placeholder="0.750"
                required
              />
            </div>

            <div>
              <Label htmlFor="prix_unitaire_gasoil">Prix unitaire Gasoil (GNF/L)</Label>
              <Input
                id="prix_unitaire_gasoil"
                type="number"
                step="0.001"
                value={formData.prix_unitaire_gasoil}
                onChange={(e) => setFormData(prev => ({ ...prev, prix_unitaire_gasoil: e.target.value }))}
                placeholder="0.720"
                required
              />
            </div>

            <div className="bg-blue-50 p-3 rounded border border-blue-200">
              <p className="text-xs text-blue-700">
                <strong>Note:</strong> Les prix sont définis par la péréquation TOTAL et correspondent au tarif de transport par litre livré.
              </p>
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Enregistrement...' : 'Enregistrer'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};