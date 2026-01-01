import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation } from '@tanstack/react-query';
import { missionsService } from '@/services/missions';
import { bonsLivraisonService } from '@/services/bonsLivraison';
import { ArrowLeft, Save, AlertTriangle, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { BLMultiplesForm } from './BLMultiplesForm';
import { BLSuiviForm } from './BLSuiviForm';
import { BonLivraison } from '@/types/bl';
import { Search, Fuel } from 'lucide-react';

interface MissionFormProps {
  mission?: any;
  onSuccess: () => void;
  onCancel: () => void;
}

export const MissionForm = ({ mission, onSuccess, onCancel }: MissionFormProps) => {
  const { toast } = useToast();
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  // Wrapper pour capturer les erreurs
  const handleError = (error: any, context: string) => {
    console.error(`❌ Erreur dans MissionForm (${context}):`, error);
    setHasError(true);
    setErrorMessage(`Erreur lors du chargement du formulaire: ${error?.message || 'Erreur inconnue'}`);
  };

  const [formData, setFormData] = useState({
    type_transport: mission?.type_transport || '',
    site_depart: mission?.site_depart || '',
    site_arrivee: mission?.site_arrivee || '',
    volume_poids: mission?.volume_poids || '',
    unite_mesure: mission?.unite_mesure || 'tonnes',
    vehicule_id: mission?.vehicule_id || '',
    chauffeur_id: mission?.chauffeur_id || '',
    statut: mission?.statut || 'en_cours'
  });

  const [bls, setBls] = useState<BonLivraison[]>([]);
  const [vehiculeSearch, setVehiculeSearch] = useState('');
  const [vehiculeAvailability, setVehiculeAvailability] = useState<{
    available: boolean;
    message: string;
  } | null>(null);

  // Fonction pour formater l'affichage du véhicule - Afficher uniquement le numéro de citerne
  const getVehiculeDisplayText = (vehicule: any) => {
    if (vehicule.type_vehicule === 'tracteur_remorque') {
      // Pour tracteur-remorque, afficher uniquement l'immatriculation de la remorque (citerne)
      return vehicule.remorque_immatriculation || vehicule.tracteur_immatriculation || vehicule.numero;
    }
    // Pour porteur, afficher uniquement l'immatriculation
    return vehicule.immatriculation || vehicule.numero;
  };

  // Récupérer les véhicules disponibles
  const { data: vehicules = [], isLoading: vehiculesLoading, error: vehiculesError } = useQuery({
    queryKey: ['available-vehicules'],
    queryFn: missionsService.getAvailableVehicules,
    refetchInterval: 30000, // Actualiser toutes les 30 secondes
    retry: 2
  });
  
  // Obtenir la capacité du véhicule sélectionné
  const getCapaciteVehicule = (): number => {
    if (!formData.vehicule_id || !vehicules || vehicules.length === 0) return 0;
    const vehicule = vehicules.find((v: any) => v.id === formData.vehicule_id);
    if (!vehicule) return 0;
    
    // Pour les tracteur-remorque, utiliser remorque_volume_litres
    if (vehicule.type_vehicule === 'tracteur_remorque' && vehicule.remorque_volume_litres) {
      return vehicule.remorque_volume_litres;
    }
    // Pour les porteurs ou autres, utiliser capacite_max
    return vehicule.capacite_max || 0;
  };

  const capaciteVehicule = getCapaciteVehicule();
  const totalQuantiteBLs = bls.reduce((sum, bl) => sum + (bl.quantite_prevue || 0), 0);
  const ecartCapacite = capaciteVehicule - totalQuantiteBLs;

  // Filtrer les véhicules selon la recherche (priorité au numéro de citerne)
  const filteredVehicules = vehicules.filter((v: any) => {
    if (!vehiculeSearch) return true;
    const search = vehiculeSearch.toLowerCase();
    
    // Priorité 1: Numéro de citerne (remorque_immatriculation pour tracteur-remorque)
    if (v.type_vehicule === 'tracteur_remorque' && v.remorque_immatriculation) {
      if (v.remorque_immatriculation.toLowerCase().includes(search)) return true;
    }
    
    // Priorité 2: Immatriculation du porteur
    if (v.immatriculation && v.immatriculation.toLowerCase().includes(search)) return true;
    
    // Priorité 3: Numéro du véhicule
    if (v.numero.toLowerCase().includes(search)) return true;
    
    // Priorité 4: Marque/modèle
    if (v.marque && v.marque.toLowerCase().includes(search)) return true;
    if (v.modele && v.modele.toLowerCase().includes(search)) return true;
    
    return false;
  });

  // Récupérer les chauffeurs assignés au véhicule sélectionné
  const { data: chauffeursAssignesVehicule = [], error: chauffeursError } = useQuery({
    queryKey: ['chauffeurs-assignes-vehicule', formData.vehicule_id],
    queryFn: () => missionsService.getChauffeursAssignesVehicule(formData.vehicule_id),
    enabled: !!formData.vehicule_id,
    retry: 2
  });

  // Vérifier les erreurs de chargement
  useEffect(() => {
    if (vehiculesError) {
      handleError(vehiculesError, 'Chargement des véhicules');
    }
    if (chauffeursError) {
      handleError(chauffeursError, 'Chargement des chauffeurs');
    }
  }, [vehiculesError, chauffeursError]);

  // Vérifier la disponibilité du véhicule sélectionné
  useEffect(() => {
    if (formData.vehicule_id && !mission?.id) {
      const checkAvailability = async () => {
        try {
          const availability = await missionsService.checkVehiculeAvailability(formData.vehicule_id);
          setVehiculeAvailability(availability);
        } catch (error) {
          console.error('Erreur lors de la vérification de disponibilité:', error);
          setVehiculeAvailability({
            available: false,
            message: 'Erreur lors de la vérification'
          });
        }
      };

      checkAvailability();
    } else if (mission?.id) {
      // Si on modifie une mission existante, le véhicule est considéré comme disponible
      setVehiculeAvailability({
        available: true,
        message: 'Véhicule assigné à cette mission'
      });
    } else {
      setVehiculeAvailability(null);
    }
  }, [formData.vehicule_id, mission?.id]);

  // Logique d'auto-assignation du/des chauffeur(s)
  useEffect(() => {
    console.log('🔄 Vérification des chauffeurs assignés...', {
      vehiculeId: formData.vehicule_id,
      nombreChauffeurs: chauffeursAssignesVehicule.length,
      chauffeurs: chauffeursAssignesVehicule
    });
    
    if (chauffeursAssignesVehicule.length > 0 && formData.vehicule_id) {
      console.log('✅ Chauffeurs trouvés pour le véhicule:', chauffeursAssignesVehicule);
      
      if (!mission?.id) {
        const chauffeurAssigne = chauffeursAssignesVehicule[0];
        console.log('📝 Auto-assignation du chauffeur:', chauffeurAssigne);
        
        setFormData(prev => ({ 
          ...prev, 
          chauffeur_id: chauffeurAssigne.id 
        }));
        
        const message = chauffeursAssignesVehicule.length === 1
          ? `${chauffeurAssigne.prenom} ${chauffeurAssigne.nom} est assigné à ce véhicule.`
          : `${chauffeurAssigne.prenom} ${chauffeurAssigne.nom} est le premier chauffeur assigné à ce véhicule.`;
        
        toast({
          title: 'Chauffeur assigné automatiquement',
          description: message
        });
      }
    } else {
      console.warn('⚠️ Aucun chauffeur assigné trouvé pour ce véhicule');
      
      if (!mission?.id && formData.vehicule_id) {
        console.log('🔄 Réinitialisation du chauffeur_id');
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
      // Pour une nouvelle mission d'hydrocarbures, ne pas créer de BL par défaut
      // L'utilisateur doit saisir un numéro pour créer un BL
      setBls([]);
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
    
    console.log('📝 Tentative de soumission du formulaire:', {
      type_transport: formData.type_transport,
      vehicule_id: formData.vehicule_id,
      chauffeur_id: formData.chauffeur_id,
      chauffeursDisponibles: chauffeursAssignesVehicule.length
    });
    
    if (!formData.chauffeur_id) {
      console.error('❌ Aucun chauffeur assigné. Chauffeurs disponibles:', chauffeursAssignesVehicule);
      
      toast({
        title: 'Erreur',
        description: chauffeursAssignesVehicule.length > 0 
          ? `Veuillez sélectionner un chauffeur parmi les ${chauffeursAssignesVehicule.length} disponible(s).`
          : 'Aucun chauffeur n\'est assigné à ce véhicule. Veuillez d\'abord assigner un chauffeur dans le module Flotte.',
        variant: 'destructive'
      });
      return;
    }

    // Vérifier la disponibilité du véhicule pour les nouvelles missions
    if (!mission?.id && vehiculeAvailability && !vehiculeAvailability.available) {
      toast({
        title: 'Véhicule non disponible',
        description: vehiculeAvailability.message,
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

    // Validation de la capacité du véhicule pour les hydrocarbures
    if (formData.type_transport === 'hydrocarbures' && capaciteVehicule > 0) {
      if (totalQuantiteBLs !== capaciteVehicule) {
        toast({
          title: 'Erreur de capacité',
          description: `Le total des quantités (${totalQuantiteBLs.toLocaleString()} L) doit être égal à la capacité du camion (${capaciteVehicule.toLocaleString()} L). Écart: ${Math.abs(ecartCapacite).toLocaleString()} L`,
          variant: 'destructive'
        });
        return;
      }
    }

    // Validation des BL simplifiée - seulement les champs actuellement présents
    if (formData.type_transport === 'hydrocarbures') {
      console.log('🔍 Validation des BL:', bls);
      
      const blsIncomplets = bls.filter(bl => {
        // Validation simplifiée basée sur les champs actuellement visibles
        const dateValide = bl.date_emission && bl.date_emission.trim() !== '';
        const quantiteValide = bl.quantite_prevue && bl.quantite_prevue > 0;
        const lieuDepartValide = bl.lieu_depart && bl.lieu_depart.trim() !== '';
        const destinationChoisie = bl.lieu_arrivee && bl.lieu_arrivee.trim() !== '';
        
        const estComplet = dateValide && quantiteValide && lieuDepartValide && destinationChoisie;
        
        console.log('🔍 BL validation:', {
          id: bl.id || 'nouveau',
          dateValide,
          quantiteValide,
          lieuDepartValide,
          destinationChoisie,
          estComplet
        });
        
        return !estComplet;
      });
      
      if (blsIncomplets.length > 0) {
        toast({
          title: 'Erreur de validation',
          description: `${blsIncomplets.length} BL${blsIncomplets.length > 1 ? 's sont' : ' est'} incomplet${blsIncomplets.length > 1 ? 's' : ''}. Veuillez remplir tous les champs obligatoires.`,
          variant: 'destructive'
        });
        return;
      }
    }
    
    const submitData = {
      ...formData,
      volume_poids: formData.volume_poids ? parseFloat(formData.volume_poids) : null
    };

    console.log('💾 Sauvegarde de la mission:', submitData);
    console.log('📋 BLs associés:', bls);
    saveMutation.mutate(submitData);
  };

  // Effet pour mettre à jour automatiquement site_depart et site_arrivee basé sur les BL
  useEffect(() => {
    if (bls.length > 0) {
      // Pour site_depart, prendre le premier BL avec lieu_depart défini
      const premierBLAvecDepart = bls.find(bl => bl.lieu_depart && bl.lieu_depart.trim() !== '');
      if (premierBLAvecDepart && premierBLAvecDepart.lieu_depart !== formData.site_depart) {
        setFormData(prev => ({ ...prev, site_depart: premierBLAvecDepart.lieu_depart }));
      }
      
      // Pour site_arrivee, prendre le premier BL avec lieu_arrivee défini
      const premierBLAvecArrivee = bls.find(bl => bl.lieu_arrivee && bl.lieu_arrivee.trim() !== '');
      if (premierBLAvecArrivee && premierBLAvecArrivee.lieu_arrivee !== formData.site_arrivee) {
        setFormData(prev => ({ ...prev, site_arrivee: premierBLAvecArrivee.lieu_arrivee }));
      }
    }
  }, [bls, formData.site_depart, formData.site_arrivee]);

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
    const chauffeur = chauffeursAssignesVehicule.find(c => c.id === formData.chauffeur_id);
    return chauffeur ? `${chauffeur.prenom} ${chauffeur.nom}` : '';
  };

  const isHydrocarbures = formData.type_transport === 'hydrocarbures';
  const isTerminee = formData.statut === 'terminee';

  // Fonction pour vérifier si le bouton doit être activé
  const isSaveButtonEnabled = () => {
    // Vérifications de base
    if (!formData.type_transport || !formData.vehicule_id || !formData.chauffeur_id) {
      return false;
    }
    
    // Si c'est une nouvelle mission, vérifier la disponibilité du véhicule
    if (!mission?.id && vehiculeAvailability && !vehiculeAvailability.available) {
      return false;
    }
    
    // Si c'est un transport d'hydrocarbures, vérifier les BL
    if (isHydrocarbures) {
      if (bls.length === 0) return false;
      
      // Vérifier que tous les BL ont les champs obligatoires remplis
      const tousBlsValides = bls.every(bl => {
        return bl.date_emission && 
               bl.date_emission.trim() !== '' &&
               bl.quantite_prevue > 0 &&
               bl.lieu_depart && 
               bl.lieu_depart.trim() !== '' &&
               bl.lieu_arrivee && 
               bl.lieu_arrivee.trim() !== '';
      });
      
      if (!tousBlsValides) return false;
      
      // Vérifier que le total des quantités = capacité du véhicule
      if (capaciteVehicule > 0 && totalQuantiteBLs !== capaciteVehicule) {
        return false;
      }
    }
    
    return !saveMutation.isPending;
  };

  // Afficher l'erreur si le formulaire ne peut pas se charger
  if (hasError) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={onCancel}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
        </div>
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-5 w-5 text-red-600" />
          <AlertDescription className="text-red-800">
            <div className="font-semibold mb-2">Erreur de chargement du formulaire</div>
            <p className="text-sm">{errorMessage}</p>
            <p className="text-sm mt-2">Veuillez réessayer ou contacter l'administrateur si le problème persiste.</p>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

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
                  {!mission?.id ? (
                    <div className="flex items-center h-10 px-3 py-2 bg-gray-100 border border-gray-300 rounded-md">
                      <span className="text-gray-700">En cours</span>
                    </div>
                  ) : (
                    <Select value={formData.statut} onValueChange={(value) => updateFormData('statut', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en_cours">En cours</SelectItem>
                        <SelectItem value="terminee">Terminée</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
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

             </CardContent>
           </Card>

          {/* Assignation des ressources */}
          <Card>
            <CardHeader>
              <CardTitle>Assignation des ressources</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="vehicule_id">Véhicule * (Recherche par n° citerne prioritaire)</Label>
                <div className="space-y-2">
                  <Input
                    placeholder="Rechercher par n° citerne, immatriculation, numéro..."
                    value={vehiculeSearch}
                    onChange={(e) => setVehiculeSearch(e.target.value)}
                    className="mb-2"
                  />
                  <Select value={formData.vehicule_id} onValueChange={(value) => updateFormData('vehicule_id', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un véhicule" />
                    </SelectTrigger>
                    <SelectContent>
                      {vehiculesLoading ? (
                        <SelectItem value="loading" disabled>Chargement...</SelectItem>
                      ) : filteredVehicules.length === 0 ? (
                        <SelectItem value="none" disabled>
                          {vehiculeSearch ? 'Aucun résultat' : 'Aucun véhicule disponible'}
                        </SelectItem>
                      ) : (
                        filteredVehicules.map((vehicule: any) => (
                          <SelectItem key={vehicule.id} value={vehicule.id}>
                            {getVehiculeDisplayText(vehicule)}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Affichage de l'état de disponibilité du véhicule */}
                {vehiculeAvailability && (
                  <div className="mt-2">
                    <Alert className={vehiculeAvailability.available ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
                      {vehiculeAvailability.available ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                      )}
                      <AlertDescription className={vehiculeAvailability.available ? 'text-green-700' : 'text-red-700'}>
                        {vehiculeAvailability.message}
                      </AlertDescription>
                    </Alert>
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="chauffeur_display">Chauffeur assigné</Label>
                <div className="mt-2">
                  {formData.vehicule_id ? (
                    chauffeursAssignesVehicule.length > 0 ? (
                      <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                        <div className="flex items-center space-x-2">
                          <span className="text-green-600 font-semibold">
                            ✓ {getChauffeurAssigneNom()}
                          </span>
                        </div>
                        <p className="text-sm text-green-600 mt-1">
                          Chauffeur automatiquement assigné selon le véhicule
                        </p>
                        {chauffeursAssignesVehicule.length > 1 && (
                          <p className="text-xs text-green-500 mt-1">
                            ({chauffeursAssignesVehicule.length} chauffeurs assignés à ce véhicule)
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

        {/* Section BL pour les hydrocarbures - Visible uniquement si véhicule et chauffeur assignés */}
        {isHydrocarbures && formData.vehicule_id && formData.chauffeur_id && (
          <>
            {/* Affichage de la capacité du véhicule et validation */}
            {capaciteVehicule > 0 && (
              <Card className={`border-2 ${totalQuantiteBLs === capaciteVehicule ? 'border-green-500 bg-green-50' : totalQuantiteBLs > capaciteVehicule ? 'border-red-500 bg-red-50' : 'border-amber-500 bg-amber-50'}`}>
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Fuel className={`w-6 h-6 ${totalQuantiteBLs === capaciteVehicule ? 'text-green-600' : totalQuantiteBLs > capaciteVehicule ? 'text-red-600' : 'text-amber-600'}`} />
                      <div>
                        <p className="font-semibold text-foreground">Capacité du camion: {capaciteVehicule.toLocaleString()} L</p>
                        <p className={`text-sm ${totalQuantiteBLs === capaciteVehicule ? 'text-green-700' : totalQuantiteBLs > capaciteVehicule ? 'text-red-700' : 'text-amber-700'}`}>
                          Total BLs saisis: {totalQuantiteBLs.toLocaleString()} L
                          {totalQuantiteBLs !== capaciteVehicule && (
                            <span className="ml-2 font-medium">
                              ({totalQuantiteBLs > capaciteVehicule ? 'Dépassement' : 'Manque'}: {Math.abs(ecartCapacite).toLocaleString()} L)
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${totalQuantiteBLs === capaciteVehicule ? 'bg-green-200 text-green-800' : totalQuantiteBLs > capaciteVehicule ? 'bg-red-200 text-red-800' : 'bg-amber-200 text-amber-800'}`}>
                      {totalQuantiteBLs === capaciteVehicule ? '✓ Conforme' : totalQuantiteBLs > capaciteVehicule ? '✗ Dépassement' : '⚠ Incomplet'}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            
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
            disabled={!isSaveButtonEnabled()}
          >
            <Save className="w-4 h-4 mr-2" />
            {saveMutation.isPending ? 'Sauvegarde...' : 'Sauvegarder'}
          </Button>
        </div>
      </form>
    </div>
  );
};
