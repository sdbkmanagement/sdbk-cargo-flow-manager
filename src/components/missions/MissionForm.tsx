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
import { bonsLivraisonService } from '@/services/bonsLivraison';
import { ArrowLeft, Save, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { BLMultiplesForm } from './BLMultiplesForm';
import { BLSuiviForm } from './BLSuiviForm';
import { BonLivraison } from '@/types/bl';

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
    observations: mission?.observations || '',
    statut: mission?.statut || 'en_attente',
    date_heure_depart: mission?.date_heure_depart || '',
    date_heure_arrivee_prevue: mission?.date_heure_arrivee_prevue || ''
  });

  const [bls, setBls] = useState<BonLivraison[]>([]);
  const [chauffeursAssignes, setChauffeursAssignes] = useState([]);

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

  // Charger les BL existants si on modifie une mission
  useEffect(() => {
    if (mission?.id) {
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
        }
      };
      chargerBLs();
    } else {
      // Pour une nouvelle mission d'hydrocarbures, créer un BL par défaut
      if (formData.type_transport === 'hydrocarbures') {
        const defaultBL: BonLivraison = {
          numero: `BL-${Date.now()}`,
          client_nom: '',
          destination: '',
          vehicule_id: formData.vehicule_id,
          chauffeur_id: formData.chauffeur_id,
          date_emission: new Date().toISOString().split('T')[0],
          produit: 'essence',
          quantite_prevue: 0,
          unite_mesure: 'litres',
          statut: 'emis'
        };
        setBls([defaultBL]);
      }
    }
  }, [mission?.id, formData.type_transport, formData.vehicule_id, formData.chauffeur_id]);

  // Mutation pour créer/modifier une mission
  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      if (mission?.id) {
        // Mettre à jour la mission
        const missionUpdated = await missionsService.update(mission.id, data);
        
        // Mettre à jour les BL si c'est un transport d'hydrocarbures
        if (data.type_transport === 'hydrocarbures' && bls.length > 0) {
          for (const bl of bls) {
            const blData = {
              ...bl,
              mission_id: mission.id,
              vehicule_id: data.vehicule_id,
              chauffeur_id: data.chauffeur_id
            };
            
            if (bl.id) {
              await bonsLivraisonService.update(bl.id, blData);
            } else {
              await bonsLivraisonService.create(blData);
            }
          }
        }
        
        return missionUpdated;
      } else {
        // Créer la mission
        const missionCreated = await missionsService.create(data);
        
        // Créer les BL si c'est un transport d'hydrocarbures
        if (data.type_transport === 'hydrocarbures' && bls.length > 0) {
          for (const bl of bls) {
            const blData = {
              ...bl,
              mission_id: missionCreated.id,
              vehicule_id: data.vehicule_id,
              chauffeur_id: data.chauffeur_id
            };
            
            await bonsLivraisonService.create(blData);
          }
        }
        
        return missionCreated;
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

    // Validation spécifique aux hydrocarbures
    if (formData.type_transport === 'hydrocarbures' && bls.length === 0) {
      toast({
        title: 'Erreur',
        description: 'Vous devez ajouter au moins un BL pour un transport d\'hydrocarbures.',
        variant: 'destructive'
      });
      return;
    }

    // Validation des BL - simplifiée car client_nom et destination sont synchronisés
    if (formData.type_transport === 'hydrocarbures') {
      const blsIncomplets = bls.filter(bl => {
        // Vérifier que le client/destination est rempli (on vérifie juste client_nom maintenant)
        const clientManquant = !bl.client_nom || bl.client_nom.trim() === '';
        const dateManquante = !bl.date_emission || bl.date_emission.trim() === '';
        const quantiteInvalide = !bl.quantite_prevue || bl.quantite_prevue <= 0;
        
        return clientManquant || dateManquante || quantiteInvalide;
      });
      
      if (blsIncomplets.length > 0) {
        toast({
          title: 'Erreur',
          description: `${blsIncomplets.length} BL${blsIncomplets.length > 1 ? 's sont' : ' est'} incomplet${blsIncomplets.length > 1 ? 's' : ''}. Veuillez remplir tous les champs obligatoires.`,
          variant: 'destructive'
        });
        return;
      }
    }
    
    const submitData = {
      ...formData,
      volume_poids: formData.volume_poids ? parseFloat(formData.volume_poids) : null,
      date_heure_depart: formData.date_heure_depart ? new Date(formData.date_heure_depart).toISOString() : null,
      date_heure_arrivee_prevue: formData.date_heure_arrivee_prevue ? new Date(formData.date_heure_arrivee_prevue).toISOString() : null
    };

    console.log('Sauvegarde de la mission:', submitData);
    console.log('BLs associés:', bls);
    saveMutation.mutate(submitData);
  };

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      
      // Si le type de transport change, ajuster l'unité de mesure
      if (field === 'type_transport') {
        if (value === 'hydrocarbures' || value === 'lubrifiants') {
          newData.unite_mesure = 'litres';
        } else if (value === 'marchandises') {
          newData.unite_mesure = 'tonnes';
        }
        
        // Réinitialiser les BL si on change le type de transport
        if (value !== 'hydrocarbures') {
          setBls([]);
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
  const isTerminee = formData.statut === 'terminee';

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
                      <SelectItem value="lubrifiants">Lubrifiants</SelectItem>
                      <SelectItem value="marchandises">Marchandises</SelectItem>
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

              {/* Dates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="date_heure_depart">Date et heure de départ</Label>
                  <Input
                    id="date_heure_depart"
                    type="datetime-local"
                    value={formData.date_heure_depart}
                    onChange={(e) => updateFormData('date_heure_depart', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="date_heure_arrivee_prevue">Date et heure d'arrivée prévue</Label>
                  <Input
                    id="date_heure_arrivee_prevue"
                    type="datetime-local"
                    value={formData.date_heure_arrivee_prevue}
                    onChange={(e) => updateFormData('date_heure_arrivee_prevue', e.target.value)}
                  />
                </div>
              </div>

              {/* Champs pour tous les types de transport sauf hydrocarbures */}
              {!isHydrocarbures && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="site_depart">Site de départ</Label>
                      <Input
                        id="site_depart"
                        value={formData.site_depart}
                        onChange={(e) => updateFormData('site_depart', e.target.value)}
                        placeholder="Ex: Kamsar"
                      />
                    </div>
                    <div>
                      <Label htmlFor="site_arrivee">Site d'arrivée</Label>
                      <Input
                        id="site_arrivee"
                        value={formData.site_arrivee}
                        onChange={(e) => updateFormData('site_arrivee', e.target.value)}
                        placeholder="Ex: Conakry"
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
                </>
              )}

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
            </CardContent>
          </Card>
        </div>

        {/* Section BL pour les hydrocarbures */}
        {isHydrocarbures && (
          <>
            {!isTerminee ? (
              <BLMultiplesForm
                bls={bls}
                onBLsChange={setBls}
                vehiculeId={formData.vehicule_id}
                chauffeurId={formData.chauffeur_id}
              />
            ) : (
              <BLSuiviForm
                bls={bls}
                onBLsChange={setBls}
                isReadOnly={false}
              />
            )}
          </>
        )}

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
