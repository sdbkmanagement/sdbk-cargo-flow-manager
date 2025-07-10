import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { processusSDBKService } from '@/services/processus-sdbk';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Truck, FileText } from 'lucide-react';

interface BLDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehiculeId: string;
  onSuccess: () => void;
}

interface Chauffeur {
  id: string;
  nom: string;
  prenom: string;
}

export const BLDialog = ({ open, onOpenChange, vehiculeId, onSuccess }: BLDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [chauffeurs, setChauffeurs] = useState<Chauffeur[]>([]);
  const [formData, setFormData] = useState({
    chauffeur_id: '',
    client_nom: '',
    client_code: '',
    destination: '',
    produit: '',
    quantite_prevue: '',
    unite_mesure: 'litres',
    date_emission: new Date().toISOString().split('T')[0],
    date_chargement_prevue: '',
    date_arrivee_prevue: '',
    transitaire_nom: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      loadChauffeurs();
    }
  }, [open]);

  const loadChauffeurs = async () => {
    try {
      const { data, error } = await supabase
        .from('chauffeurs')
        .select('id, nom, prenom')
        .eq('statut', 'actif')
        .order('nom');

      if (error) throw error;
      setChauffeurs(data || []);
    } catch (error) {
      console.error('Erreur:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les chauffeurs',
        variant: 'destructive'
      });
    }
  };

  const destinations = [
    'Mamou', 'Kamsar', 'Labé', 'Siguiri', 'Kindia', 'Boké', 'Faranah', 'Kankan'
  ];

  const produits = [
    'Essence Super', 'Essence Ordinaire', 'Gasoil', 'Pétrole Lampant', 'Fuel Oil'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const blData = {
        numero: '', // Auto-généré par le trigger
        vehicule_id: vehiculeId,
        chauffeur_id: formData.chauffeur_id,
        client_nom: formData.client_nom,
        client_code: formData.client_code || undefined,
        destination: formData.destination,
        produit: formData.produit,
        quantite_prevue: parseFloat(formData.quantite_prevue),
        unite_mesure: formData.unite_mesure,
        date_emission: formData.date_emission,
        date_chargement_prevue: formData.date_chargement_prevue ? new Date(formData.date_chargement_prevue).toISOString() : undefined,
        date_arrivee_prevue: formData.date_arrivee_prevue ? new Date(formData.date_arrivee_prevue).toISOString() : undefined,
        transitaire_nom: formData.transitaire_nom,
        saisi_par: 'Transitaire' // TODO: Récupérer le vrai utilisateur
      };

      await processusSDBKService.creerBonLivraison(blData);
      
      onSuccess();
      
      // Reset form
      setFormData({
        chauffeur_id: '',
        client_nom: '',
        client_code: '',
        destination: '',
        produit: '',
        quantite_prevue: '',
        unite_mesure: 'litres',
        date_emission: new Date().toISOString().split('T')[0],
        date_chargement_prevue: '',
        date_arrivee_prevue: '',
        transitaire_nom: ''
      });
    } catch (error) {
      console.error('Erreur:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de créer le bon de livraison',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Planification et Émission du Bon de Livraison (BL)
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informations générales */}
          <Card>
            <CardHeader>
              <CardTitle>Informations générales</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="date_emission">Date d'émission</Label>
                  <Input
                    id="date_emission"
                    type="date"
                    value={formData.date_emission}
                    onChange={(e) => setFormData(prev => ({ ...prev, date_emission: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="transitaire_nom">Nom du transitaire</Label>
                  <Input
                    id="transitaire_nom"
                    value={formData.transitaire_nom}
                    onChange={(e) => setFormData(prev => ({ ...prev, transitaire_nom: e.target.value }))}
                    placeholder="Nom du transitaire"
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Affectation */}
          <Card>
            <CardHeader>
              <CardTitle>Affectation du véhicule</CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <Label htmlFor="chauffeur_id">Chauffeur assigné</Label>
                <Select value={formData.chauffeur_id} onValueChange={(value) => setFormData(prev => ({ ...prev, chauffeur_id: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un chauffeur" />
                  </SelectTrigger>
                  <SelectContent>
                    {chauffeurs.map((chauffeur) => (
                      <SelectItem key={chauffeur.id} value={chauffeur.id}>
                        {chauffeur.prenom} {chauffeur.nom}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Informations client */}
          <Card>
            <CardHeader>
              <CardTitle>Informations client</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="client_nom">Nom du client</Label>
                  <Input
                    id="client_nom"
                    value={formData.client_nom}
                    onChange={(e) => setFormData(prev => ({ ...prev, client_nom: e.target.value }))}
                    placeholder="Nom du client"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="client_code">Code personnel Total (optionnel)</Label>
                  <Input
                    id="client_code"
                    value={formData.client_code}
                    onChange={(e) => setFormData(prev => ({ ...prev, client_code: e.target.value }))}
                    placeholder="Code fourni par Total"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Transport */}
          <Card>
            <CardHeader>
              <CardTitle>Détails du transport</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="destination">Destination</Label>
                  <Select value={formData.destination} onValueChange={(value) => setFormData(prev => ({ ...prev, destination: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une destination" />
                    </SelectTrigger>
                    <SelectContent>
                      {destinations.map((dest) => (
                        <SelectItem key={dest} value={dest}>
                          {dest}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="produit">Produit à transporter</Label>
                  <Select value={formData.produit} onValueChange={(value) => setFormData(prev => ({ ...prev, produit: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un produit" />
                    </SelectTrigger>
                    <SelectContent>
                      {produits.map((prod) => (
                        <SelectItem key={prod} value={prod}>
                          {prod}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="quantite_prevue">Quantité à transporter</Label>
                  <Input
                    id="quantite_prevue"
                    type="number"
                    step="0.01"
                    value={formData.quantite_prevue}
                    onChange={(e) => setFormData(prev => ({ ...prev, quantite_prevue: e.target.value }))}
                    placeholder="Ex: 15000"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="unite_mesure">Unité de mesure</Label>
                  <Select value={formData.unite_mesure} onValueChange={(value) => setFormData(prev => ({ ...prev, unite_mesure: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="litres">Litres</SelectItem>
                      <SelectItem value="tonnes">Tonnes</SelectItem>
                      <SelectItem value="m3">Mètres cubes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Planning */}
          <Card>
            <CardHeader>
              <CardTitle>Planning prévisionnel</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="date_chargement_prevue">Date/heure de chargement prévue</Label>
                  <Input
                    id="date_chargement_prevue"
                    type="datetime-local"
                    value={formData.date_chargement_prevue}
                    onChange={(e) => setFormData(prev => ({ ...prev, date_chargement_prevue: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="date_arrivee_prevue">Date/heure d'arrivée prévue</Label>
                  <Input
                    id="date_arrivee_prevue"
                    type="datetime-local"
                    value={formData.date_arrivee_prevue}
                    onChange={(e) => setFormData(prev => ({ ...prev, date_arrivee_prevue: e.target.value }))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button 
              type="submit" 
              disabled={loading}
              className="bg-green-600 hover:bg-green-700"
            >
              <Truck className="w-4 h-4 mr-2" />
              {loading ? 'Création...' : 'Créer le Bon de Livraison'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};