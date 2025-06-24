
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Truck, User, MapPin, Calendar, AlertTriangle, X } from 'lucide-react';
import { missionsService, type MissionWithDetails } from '@/services/missions';

interface MissionFormProps {
  mission?: MissionWithDetails;
  onSave: (mission: any) => void;
  onCancel: () => void;
}

interface FormData {
  numero: string;
  type_transport: 'hydrocarbures' | 'bauxite';
  vehicule_id: string;
  chauffeur_id: string;
  site_depart: string;
  site_arrivee: string;
  date_heure_depart: string;
  date_heure_arrivee_prevue: string;
  volume_poids: string;
  unite_mesure: string;
  observations: string;
  statut: 'en_attente' | 'en_cours' | 'terminee' | 'annulee';
}

export const MissionForm = ({ mission, onSave, onCancel }: MissionFormProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [vehicules, setVehicules] = useState<any[]>([]);
  const [chauffeurs, setChauffeurs] = useState<any[]>([]);
  const [availabilityMessage, setAvailabilityMessage] = useState<string>('');
  const [availabilityType, setAvailabilityType] = useState<'success' | 'warning' | 'error'>('success');

  const [formData, setFormData] = useState<FormData>({
    numero: mission?.numero || '',
    type_transport: (mission?.type_transport as 'hydrocarbures' | 'bauxite') || 'hydrocarbures',
    vehicule_id: mission?.vehicule_id || '',
    chauffeur_id: mission?.chauffeur_id || '',
    site_depart: mission?.site_depart || '',
    site_arrivee: mission?.site_arrivee || '',
    date_heure_depart: mission?.date_heure_depart ? new Date(mission.date_heure_depart).toISOString().slice(0, 16) : '',
    date_heure_arrivee_prevue: mission?.date_heure_arrivee_prevue ? new Date(mission.date_heure_arrivee_prevue).toISOString().slice(0, 16) : '',
    volume_poids: mission?.volume_poids?.toString() || '',
    unite_mesure: mission?.unite_mesure || 'tonnes',
    observations: mission?.observations || '',
    statut: (mission?.statut as any) || 'en_attente'
  });

  useEffect(() => {
    loadResources();
  }, []);

  useEffect(() => {
    if (formData.vehicule_id && formData.chauffeur_id && formData.date_heure_depart && formData.date_heure_arrivee_prevue) {
      checkAvailability();
    }
  }, [formData.vehicule_id, formData.chauffeur_id, formData.date_heure_depart, formData.date_heure_arrivee_prevue]);

  const loadResources = async () => {
    try {
      const [vehiculesData, chauffeursData] = await Promise.all([
        missionsService.getAvailableVehicules(),
        missionsService.getAvailableChauffeurs()
      ]);
      setVehicules(vehiculesData);
      setChauffeurs(chauffeursData);
    } catch (error) {
      console.error('Erreur lors du chargement des ressources:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les véhicules et chauffeurs disponibles.",
        variant: "destructive"
      });
    }
  };

  const checkAvailability = async () => {
    try {
      const result = await missionsService.checkAvailability(
        formData.vehicule_id,
        formData.chauffeur_id,
        formData.date_heure_depart,
        formData.date_heure_arrivee_prevue,
        mission?.id
      );
      
      setAvailabilityMessage(result.message);
      
      if (result.vehicule_disponible && result.chauffeur_disponible) {
        setAvailabilityType('success');
      } else if (result.message.includes('Conflit')) {
        setAvailabilityType('warning');
      } else {
        setAvailabilityType('error');
      }
    } catch (error) {
      console.error('Erreur lors de la vérification:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const missionData = {
        ...formData,
        volume_poids: formData.volume_poids ? parseFloat(formData.volume_poids) : null,
        date_heure_depart: new Date(formData.date_heure_depart).toISOString(),
        date_heure_arrivee_prevue: new Date(formData.date_heure_arrivee_prevue).toISOString(),
      };

      if (mission) {
        await missionsService.update(mission.id, missionData);
        toast({
          title: "Mission mise à jour",
          description: "La mission a été mise à jour avec succès.",
        });
      } else {
        await missionsService.create(missionData);
        toast({
          title: "Mission créée",
          description: "La nouvelle mission a été créée avec succès.",
        });
      }

      onSave(missionData);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la sauvegarde.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateFormData = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <Truck className="w-5 h-5 mr-2" />
            {mission ? 'Modifier la mission' : 'Nouvelle mission'}
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="numero">Numéro de mission</Label>
              <Input
                id="numero"
                value={formData.numero}
                onChange={(e) => updateFormData('numero', e.target.value)}
                placeholder="Auto-généré si vide"
              />
            </div>
            <div>
              <Label htmlFor="type_transport">Type de transport</Label>
              <Select value={formData.type_transport} onValueChange={(value) => updateFormData('type_transport', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hydrocarbures">Hydrocarbures</SelectItem>
                  <SelectItem value="bauxite">Bauxite</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="vehicule">Véhicule</Label>
              <Select value={formData.vehicule_id} onValueChange={(value) => updateFormData('vehicule_id', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un véhicule" />
                </SelectTrigger>
                <SelectContent>
                  {vehicules.map(vehicule => (
                    <SelectItem key={vehicule.id} value={vehicule.id}>
                      <div className="flex items-center">
                        <Truck className="w-4 h-4 mr-2" />
                        {vehicule.numero} - {vehicule.immatriculation} ({vehicule.marque} {vehicule.modele})
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="chauffeur">Chauffeur</Label>
              <Select value={formData.chauffeur_id} onValueChange={(value) => updateFormData('chauffeur_id', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un chauffeur" />
                </SelectTrigger>
                <SelectContent>
                  {chauffeurs.map(chauffeur => (
                    <SelectItem key={chauffeur.id} value={chauffeur.id}>
                      <div className="flex items-center">
                        <User className="w-4 h-4 mr-2" />
                        {chauffeur.prenom} {chauffeur.nom} - {chauffeur.telephone}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {availabilityMessage && (
            <Alert className={availabilityType === 'error' ? 'border-red-500' : availabilityType === 'warning' ? 'border-yellow-500' : 'border-green-500'}>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{availabilityMessage}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="site_depart">Site de départ</Label>
              <Input
                id="site_depart"
                value={formData.site_depart}
                onChange={(e) => updateFormData('site_depart', e.target.value)}
                placeholder="Lieu de départ"
                required
              />
            </div>
            <div>
              <Label htmlFor="site_arrivee">Site d'arrivée</Label>
              <Input
                id="site_arrivee"
                value={formData.site_arrivee}
                onChange={(e) => updateFormData('site_arrivee', e.target.value)}
                placeholder="Lieu d'arrivée"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="date_depart">Date et heure de départ</Label>
              <Input
                id="date_depart"
                type="datetime-local"
                value={formData.date_heure_depart}
                onChange={(e) => updateFormData('date_heure_depart', e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="date_arrivee">Date et heure d'arrivée prévue</Label>
              <Input
                id="date_arrivee"
                type="datetime-local"
                value={formData.date_heure_arrivee_prevue}
                onChange={(e) => updateFormData('date_heure_arrivee_prevue', e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="volume_poids">Volume/Poids à transporter</Label>
              <Input
                id="volume_poids"
                type="number"
                step="0.01"
                value={formData.volume_poids}
                onChange={(e) => updateFormData('volume_poids', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="unite_mesure">Unité de mesure</Label>
              <Select value={formData.unite_mesure} onValueChange={(value) => updateFormData('unite_mesure', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tonnes">Tonnes</SelectItem>
                  <SelectItem value="litres">Litres</SelectItem>
                  <SelectItem value="m3">m³</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {mission && (
            <div>
              <Label htmlFor="statut">Statut</Label>
              <Select value={formData.statut} onValueChange={(value) => updateFormData('statut', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en_attente">En attente</SelectItem>
                  <SelectItem value="en_cours">En cours</SelectItem>
                  <SelectItem value="terminee">Terminée</SelectItem>
                  <SelectItem value="annulee">Annulée</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <Label htmlFor="observations">Observations</Label>
            <Textarea
              id="observations"
              value={formData.observations}
              onChange={(e) => updateFormData('observations', e.target.value)}
              placeholder="Notes ou observations sur la mission..."
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Annuler
            </Button>
            <Button 
              type="submit" 
              disabled={loading || availabilityType === 'error'}
              className="bg-orange-500 hover:bg-orange-600"
            >
              {loading ? 'Sauvegarde...' : (mission ? 'Mettre à jour' : 'Créer la mission')}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
