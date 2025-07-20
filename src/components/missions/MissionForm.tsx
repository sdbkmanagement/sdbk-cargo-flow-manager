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
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Save, Info, AlertTriangle } from 'lucide-react';
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
    statut: mission?.statut || 'en_attente',
    // Nouveaux champs pour hydrocarbures
    date_emission_bl: mission?.date_emission_bl ? 
      new Date(mission.date_emission_bl).toISOString().slice(0, 10) : '',
    lieu_chargement: mission?.lieu_chargement || '',
    destination: mission?.destination || '',
    type_produit: mission?.type_produit || '',
    quantite_litres: mission?.quantite_litres || ''
  });

  const [availabilityInfo, setAvailabilityInfo] = useState(null);
  const [chauffeursAssignes, setChauffeursAssignes] = useState([]);

  // Récupérer les lieux de départ depuis la facturation
  const { data: lieuxDepart = [] } = useQuery({
    queryKey: ['lieux-depart'],
    queryFn: async () => {
      console.log('Chargement des lieux de départ...');
      const { data, error } = await supabase
        .from('bons_livraison')
        .select('destination')
        .not('destination', 'is', null);
      
      if (error) {
        console.error('Erreur lors du chargement des lieux de départ:', error);
        return [];
      }
      
      // Extraire les destinations uniques et les utiliser comme lieux de départ
      const lieux = data && data.length > 0 ? [...new Set(data.map(item => item.destination).filter(Boolean))] : [];
      console.log('Lieux de départ chargés:', lieux);
      return lieux;
    }
  });

  // Récupérer les destinations depuis la facturation
  const { data: destinations = [] } = useQuery({
    queryKey: ['destinations-facturation'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients_total')
        .select('destination')
        .not('destination', 'is', null);
      
      if (error) {
        console.error('Erreur lors du chargement des destinations:', error);
        return [];
      }
      
      const destinationsUniques = data && data.length > 0 ? [...new Set(data.map(item => item.destination).filter(Boolean))] : [];
      return destinationsUniques;
    }
  });

  // Récupérer les véhicules disponibles
  const { data: vehicules = [] } = useQuery({
    queryKey: ['available-vehicules'],
    queryFn: missionsService.getAvailableVehicules
  });

  // Récupérer les chauffeurs assignés au véhicule sélectionné
  const { data: chauffeursAssignesVehicule = [] } = useQuery({
    queryKey: ['chauffeurs-assignes-vehicule', formData.vehicule_id],
    queryFn: () => missionsService.getChauffeursAssignesVehicule(formData.vehicule_id),
    enabled: !!formData.vehicule_id
  });

  // Logique d'auto-assignation du/des chauffeur(s)
  useEffect(() => {
    if (chauffeursAssignesVehicule.length > 0 && formData.vehicule_id) {
      console.log('Chauffeurs assignés au véhicule:', chauffeursAssignesVehicule);
      
      if (!mission?.id) {
        if (chauffeursAssignesVehicule.length === 1) {
          const chauffeurAssigne = chauffeursAssignesVehicule[0];
          setFormData(prev => ({ 
            ...prev, 
            chauffeur_id: chauffeurAssigne.id 
          }));
          
          toast({
            title: 'Chauffeur assigné automatiquement',
            description: `${chauffeurAssigne.prenom} ${chauffeurAssigne.nom} est assigné à ce véhicule.`
          });
        } else {
          const chauffeurAssigne = chauffeursAssignesVehicule[0];
          setFormData(prev => ({ 
            ...prev, 
            chauffeur_id: chauffeurAssigne.id 
          }));
          
          toast({
            title: 'Premier chauffeur assigné',
            description: `${chauffeurAssigne.prenom} ${chauffeurAssigne.nom} est le premier chauffeur assigné à ce véhicule.`
          });
        }
      }
      
      setChauffeursAssignes(chauffeursAssignesVehicule);
    } else {
      setChauffeursAssignes([]);
      
      if (!mission?.id && formData.vehicule_id) {
        setFormData(prev => ({ ...prev, chauffeur_id: '' }));
      }
    }
  }, [chauffeursAssignesVehicule, formData.vehicule_id, mission?.id, toast]);

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

  // Vérifier la disponibilité des ressources (informatif seulement)
  const checkAvailabilityInfo = async () => {
    if (formData.vehicule_id && formData.chauffeur_id && 
        formData.date_heure_depart && formData.date_heure_arrivee_prevue) {
      try {
        const result = await missionsService.checkResourceAvailability(
          formData.vehicule_id,
          formData.chauffeur_id,
          formData.date_heure_depart,
          formData.date_heure_arrivee_prevue
        );
        setAvailabilityInfo(result);
      } catch (error) {
        console.error('Erreur lors de la vérification:', error);
        setAvailabilityInfo(null);
      }
    } else {
      setAvailabilityInfo(null);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(checkAvailabilityInfo, 500);
    return () => clearTimeout(timeoutId);
  }, [formData.vehicule_id, formData.chauffeur_id, formData.date_heure_depart, formData.date_heure_arrivee_prevue]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.chauffeur_id) {
      toast({
        title: 'Erreur',
        description: 'Aucun chauffeur n\'est assigné au véhicule sélectionné.',
        variant: 'destructive'
      });
      return;
    }
    
    const submitData = {
      ...formData,
      volume_poids: formData.volume_poids ? parseFloat(formData.volume_poids) : null,
      quantite_litres: formData.quantite_litres ? parseFloat(formData.quantite_litres) : null,
      date_heure_depart: new Date(formData.date_heure_depart).toISOString(),
      date_heure_arrivee_prevue: new Date(formData.date_heure_arrivee_prevue).toISOString(),
      date_emission_bl: formData.date_emission_bl ? new Date(formData.date_emission_bl).toISOString() : null
    };

    console.log('Sauvegarde de la mission:', submitData);
    saveMutation.mutate(submitData);
  };

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      
      // Si le type de transport change, ajuster l'unité de mesure
      if (field === 'type_transport') {
        if (value === 'hydrocarbures') {
          newData.unite_mesure = 'litres';
        } else if (value === 'bauxite') {
          newData.unite_mesure = 'tonnes';
        }
      }
      
      // Si le véhicule change, réinitialiser le chauffeur sauf si on modifie une mission existante
      if (field === 'vehicule_id' && !mission?.id) {
        newData.chauffeur_id = '';
      }
      
      return newData;
    });
  };

  // Obtenir le nom du chauffeur assigné pour l'affichage
  const getChauffeurAssigneNom = () => {
    const chauffeur = chauffeursAssignes.find(c => c.id === formData.chauffeur_id);
    return chauffeur ? `${chauffeur.prenom} ${chauffeur.nom}` : '';
  };

  const isHydrocarbures = formData.type_transport === 'hydrocarbures';

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

              {/* Champs spécifiques aux hydrocarbures */}
              {isHydrocarbures && (
                <>
                  <div>
                    <Label htmlFor="date_emission_bl">Date d'émission du BL *</Label>
                    <Input
                      id="date_emission_bl"
                      type="date"
                      value={formData.date_emission_bl}
                      onChange={(e) => updateFormData('date_emission_bl', e.target.value)}
                      required={isHydrocarbures}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="lieu_chargement">Lieu de chargement *</Label>
                      <Select value={formData.lieu_chargement} onValueChange={(value) => updateFormData('lieu_chargement', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner le lieu" />
                        </SelectTrigger>
                        <SelectContent>
                          {lieuxDepart.map(lieu => (
                            <SelectItem key={lieu} value={lieu}>
                              {lieu}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="destination">Destination *</Label>
                      <Select value={formData.destination} onValueChange={(value) => updateFormData('destination', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner la destination" />
                        </SelectTrigger>
                        <SelectContent>
                          {destinations.map(dest => (
                            <SelectItem key={dest} value={dest}>
                              {dest}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="type_produit">Type de produit *</Label>
                      <Select value={formData.type_produit} onValueChange={(value) => updateFormData('type_produit', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner le produit" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="essence">Essence</SelectItem>
                          <SelectItem value="gasoil">Gasoil</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="quantite_litres">Quantité (litres) *</Label>
                      <Input
                        id="quantite_litres"
                        type="number"
                        step="0.1"
                        value={formData.quantite_litres}
                        onChange={(e) => updateFormData('quantite_litres', e.target.value)}
                        placeholder="0.0"
                        required={isHydrocarbures}
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Champs généraux (modifiés conditionnellement) */}
              {!isHydrocarbures && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="site_depart">Site de départ *</Label>
                    <Input
                      id="site_depart"
                      value={formData.site_depart}
                      onChange={(e) => updateFormData('site_depart', e.target.value)}
                      placeholder="Ex: Kamsar"
                      required={!isHydrocarbures}
                    />
                  </div>
                  <div>
                    <Label htmlFor="site_arrivee">Site d'arrivée *</Label>
                    <Input
                      id="site_arrivee"
                      value={formData.site_arrivee}
                      onChange={(e) => updateFormData('site_arrivee', e.target.value)}
                      placeholder="Ex: Conakry"
                      required={!isHydrocarbures}
                    />
                  </div>
                </div>
              )}

              {!isHydrocarbures && (
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
              )}

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
                <Label htmlFor="chauffeur_display">Chauffeur assigné</Label>
                <div className="mt-2">
                  {formData.vehicule_id ? (
                    chauffeursAssignes.length > 0 ? (
                      <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                        <div className="flex items-center space-x-2">
                          <span className="text-green-600 font-semibold">
                            ✓ {getChauffeurAssigneNom()}
                          </span>
                        </div>
                        <p className="text-sm text-green-600 mt-1">
                          Chauffeur automatiquement assigné selon le véhicule
                        </p>
                        {chauffeursAssignes.length > 1 && (
                          <p className="text-xs text-green-500 mt-1">
                            ({chauffeursAssignes.length} chauffeurs assignés à ce véhicule)
                          </p>
                        )}
                      </div>
                    ) : (
                      <Alert className="border-red-200 bg-red-50">
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                        <AlertDescription className="text-red-700">
                          <strong>Erreur :</strong> Aucun chauffeur n'est assigné à ce véhicule. 
                          Veuillez d'abord assigner un chauffeur dans le module Flotte.
                        </AlertDescription>
                      </Alert>
                    )
                  ) : (
                    <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
                      <p className="text-sm text-gray-500">
                        Sélectionnez d'abord un véhicule pour voir le chauffeur assigné
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Information de disponibilité (non-bloquante) */}
              {availabilityInfo && (
                <Alert className="border-blue-200 bg-blue-50">
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Information planning:</strong> {availabilityInfo.message}
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
            disabled={saveMutation.isPending || !formData.chauffeur_id}
          >
            <Save className="w-4 h-4 mr-2" />
            {saveMutation.isPending ? 'Sauvegarde...' : 'Sauvegarder'}
          </Button>
        </div>
      </form>
    </div>
  );
};
