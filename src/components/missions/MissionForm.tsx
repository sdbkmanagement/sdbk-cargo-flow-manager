
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation } from '@tanstack/react-query';
import { missionsService } from '@/services/missions';
import { ArrowLeft, Save, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface MissionFormProps {
  mission?: any;
  onSuccess: () => void;
  onCancel: () => void;
}

export const MissionForm = ({ mission, onSuccess, onCancel }: MissionFormProps) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    type_transport: mission?.type_transport || '',
    site_depart: mission?.site_depart || '',
    site_arrivee: mission?.site_arrivee || '',
    volume_poids: mission?.volume_poids || '',
    unite_mesure: mission?.unite_mesure || 'tonnes',
    vehicule_id: mission?.vehicule_id || '',
    chauffeur_id: mission?.chauffeur_id || '',
    date_heure_depart: mission?.date_heure_depart ? 
      new Date(mission.date_heure_depart).toISOString().slice(0, 16) : '',
    date_heure_arrivee_prevue: mission?.date_heure_arrivee_prevue ? 
      new Date(mission.date_heure_arrivee_prevue).toISOString().slice(0, 16) : '',
    observations: mission?.observations || '',
    statut: mission?.statut || 'en_attente'
  });

  const [availabilityCheck, setAvailabilityCheck] = useState(null);

  // Récupérer les véhicules disponibles selon le type de transport
  const { data: vehicules = [] } = useQuery({
    queryKey: ['available-vehicles', formData.type_transport],
    queryFn: () => formData.type_transport ? 
      missionsService.getAvailableVehicles(formData.type_transport) : Promise.resolve([]),
    enabled: !!formData.type_transport
  });

  // Récupérer les chauffeurs actifs
  const { data: chauffeurs = [] } = useQuery({
    queryKey: ['active-chauffeurs'],
    queryFn: missionsService.getActiveChauffeurs
  });

  // Mutation pour créer/modifier une mission
  const saveMutation = useMutation({
    mutationFn: (data: any) => {
      if (mission?.id) {
        return missionsService.update(mission.id, data);
      } else {
        return missionsService.create(data);
      }
    },
    onSuccess: () => {
      toast({
        title: mission?.id ? 'Mission mise à jour' : 'Mission créée',
        description: 'La mission a été sauvegardée avec succès.'
      });
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: 'Erreur',
        description: error.message || 'Une erreur est survenue lors de la sauvegarde.',
        variant: 'destructive'
      });
    }
  });

  // Vérifier la disponibilité des ressources
  const checkAvailability = async () => {
    if (formData.vehicule_id && formData.chauffeur_id && 
        formData.date_heure_depart && formData.date_heure_arrivee_prevue) {
      try {
        const result = await missionsService.checkResourceAvailability(
          formData.vehicule_id,
          formData.chauffeur_id,
          formData.date_heure_depart,
          formData.date_heure_arrivee_prevue,
          mission?.id
        );
        setAvailabilityCheck(result);
      } catch (error) {
        console.error('Erreur lors de la vérification:', error);
      }
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(checkAvailability, 500);
    return () => clearTimeout(timeoutId);
  }, [formData.vehicule_id, formData.chauffeur_id, formData.date_heure_depart, formData.date_heure_arrivee_prevue]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!availabilityCheck?.vehicule_disponible || !availabilityCheck?.chauffeur_disponible) {
      toast({
        title: 'Ressources non disponibles',
        description: availabilityCheck?.message || 'Vérifiez la disponibilité des ressources.',
        variant: 'destructive'
      });
      return;
    }

    const submitData = {
      ...formData,
      volume_poids: formData.volume_poids ? parseFloat(formData.volume_poids) : null,
      date_heure_depart: new Date(formData.date_heure_depart).toISOString(),
      date_heure_arrivee_prevue: new Date(formData.date_heure_arrivee_prevue).toISOString()
    };

    saveMutation.mutate(submitData);
  };

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={onCancel}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              {mission?.id ? 'Modifier la mission' : 'Nouvelle mission'}
            </h1>
            {mission?.numero && (
              <p className="text-gray-600">{mission.numero}</p>
            )}
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Informations de base */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Informations de la mission</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="type_transport">Type de transport *</Label>
                  <Select value={formData.type_transport} onValueChange={(value) => updateFormData('type_transport', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner le type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hydrocarbures">Hydrocarbures</SelectItem>
                      <SelectItem value="bauxite">Bauxite</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
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
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="site_depart">Site de départ *</Label>
                  <Input
                    id="site_depart"
                    value={formData.site_depart}
                    onChange={(e) => updateFormData('site_depart', e.target.value)}
                    placeholder="Ex: Kamsar"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="site_arrivee">Site d'arrivée *</Label>
                  <Input
                    id="site_arrivee"
                    value={formData.site_arrivee}
                    onChange={(e) => updateFormData('site_arrivee', e.target.value)}
                    placeholder="Ex: Conakry"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="volume_poids">Volume/Poids</Label>
                  <Input
                    id="volume_poids"
                    type="number"
                    step="0.1"
                    value={formData.volume_poids}
                    onChange={(e) => updateFormData('volume_poids', e.target.value)}
                    placeholder="0.0"
                  />
                </div>
                <div>
                  <Label htmlFor="unite_mesure">Unité</Label>
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="date_heure_depart">Date et heure de départ *</Label>
                  <Input
                    id="date_heure_depart"
                    type="datetime-local"
                    value={formData.date_heure_depart}
                    onChange={(e) => updateFormData('date_heure_depart', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="date_heure_arrivee_prevue">Date et heure d'arrivée prévue *</Label>
                  <Input
                    id="date_heure_arrivee_prevue"
                    type="datetime-local"
                    value={formData.date_heure_arrivee_prevue}
                    onChange={(e) => updateFormData('date_heure_arrivee_prevue', e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="observations">Observations</Label>
                <Textarea
                  id="observations"
                  value={formData.observations}
                  onChange={(e) => updateFormData('observations', e.target.value)}
                  placeholder="Observations ou instructions particulières..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Assignation des ressources */}
          <Card>
            <CardHeader>
              <CardTitle>Assignation des ressources</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="vehicule_id">Véhicule *</Label>
                <Select value={formData.vehicule_id} onValueChange={(value) => updateFormData('vehicule_id', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un véhicule" />
                  </SelectTrigger>
                  <SelectContent>
                    {vehicules.map(vehicule => (
                      <SelectItem key={vehicule.id} value={vehicule.id}>
                        {vehicule.numero} - {vehicule.marque} {vehicule.modele}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="chauffeur_id">Chauffeur *</Label>
                <Select value={formData.chauffeur_id} onValueChange={(value) => updateFormData('chauffeur_id', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un chauffeur" />
                  </SelectTrigger>
                  <SelectContent>
                    {chauffeurs.map(chauffeur => (
                      <SelectItem key={chauffeur.id} value={chauffeur.id}>
                        {chauffeur.prenom} {chauffeur.nom}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Vérification de disponibilité */}
              {availabilityCheck && (
                <Alert className={
                  (availabilityCheck.vehicule_disponible && availabilityCheck.chauffeur_disponible) 
                    ? 'border-green-200 bg-green-50' 
                    : 'border-red-200 bg-red-50'
                }>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    {availabilityCheck.message}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end space-x-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Annuler
          </Button>
          <Button 
            type="submit" 
            className="bg-orange-500 hover:bg-orange-600"
            disabled={saveMutation.isPending}
          >
            <Save className="w-4 h-4 mr-2" />
            {saveMutation.isPending ? 'Sauvegarde...' : 'Sauvegarder'}
          </Button>
        </div>
      </form>
    </div>
  );
};
