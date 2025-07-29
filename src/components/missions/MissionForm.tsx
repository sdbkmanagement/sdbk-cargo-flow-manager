
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import vehiculesService from '@/services/vehicules';
import { chauffeursService } from '@/services/chauffeurs';
import missionsService from '@/services/missions';

interface MissionFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export const MissionForm = ({ onSuccess, onCancel }: MissionFormProps) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    vehicule_id: '',
    chauffeur_id: '',
    type_transport: '',
    site_depart: '',
    site_arrivee: '',
    volume_poids: '',
    unite_mesure: 'tonnes',
    observations: ''
  });

  const { data: vehicules, isLoading: vehiculesLoading } = useQuery({
    queryKey: ['vehicules'],
    queryFn: vehiculesService.getAll
  });

  const { data: chauffeurs } = useQuery({
    queryKey: ['chauffeurs'],
    queryFn: chauffeursService.getAll
  });

  const generateMissionNumber = () => {
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2);
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const time = now.getTime().toString().slice(-6);
    return `M${year}${month}${day}-${time}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await missionsService.create({
        numero: generateMissionNumber(),
        vehicule_id: formData.vehicule_id,
        chauffeur_id: formData.chauffeur_id,
        type_transport: formData.type_transport,
        site_depart: formData.site_depart,
        site_arrivee: formData.site_arrivee,
        volume_poids: formData.volume_poids ? parseFloat(formData.volume_poids) : null,
        unite_mesure: formData.unite_mesure,
        observations: formData.observations,
        statut: 'en_attente',
        created_by: 'current_user'
      });

      toast({
        title: 'Mission créée',
        description: 'La mission a été créée avec succès'
      });

      onSuccess();
    } catch (error) {
      console.error('Erreur lors de la création:', error);
      toast({
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Erreur lors de la création de la mission',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="vehicule">Véhicule *</Label>
          <Select value={formData.vehicule_id} onValueChange={(value) => setFormData({...formData, vehicule_id: value})}>
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner un véhicule" />
            </SelectTrigger>
            <SelectContent>
              {vehiculesLoading ? (
                <SelectItem value="loading" disabled>Chargement...</SelectItem>
              ) : (
                vehicules?.map((vehicule) => (
                  <SelectItem key={vehicule.id} value={vehicule.id}>
                    {vehicule.immatriculation || vehicule.tracteur_immatriculation || vehicule.numero}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="chauffeur">Chauffeur *</Label>
          <Select value={formData.chauffeur_id} onValueChange={(value) => setFormData({...formData, chauffeur_id: value})}>
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner un chauffeur" />
            </SelectTrigger>
            <SelectContent>
              {chauffeurs?.map((chauffeur) => (
                <SelectItem key={chauffeur.id} value={chauffeur.id}>
                  {chauffeur.prenom} {chauffeur.nom}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="type_transport">Type de transport *</Label>
          <Select value={formData.type_transport} onValueChange={(value) => setFormData({...formData, type_transport: value})}>
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner le type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Bauxite">Bauxite</SelectItem>
              <SelectItem value="Alumine">Alumine</SelectItem>
              <SelectItem value="Carburant">Carburant</SelectItem>
              <SelectItem value="Personnel">Personnel</SelectItem>
              <SelectItem value="Equipement">Equipement</SelectItem>
              <SelectItem value="Vivres">Vivres</SelectItem>
              <SelectItem value="Autre">Autre</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label htmlFor="volume_poids">Volume/Poids</Label>
            <Input
              id="volume_poids"
              type="number"
              step="0.01"
              value={formData.volume_poids}
              onChange={(e) => setFormData({...formData, volume_poids: e.target.value})}
              placeholder="0.00"
            />
          </div>
          <div>
            <Label htmlFor="unite_mesure">Unité</Label>
            <Select value={formData.unite_mesure} onValueChange={(value) => setFormData({...formData, unite_mesure: value})}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tonnes">Tonnes</SelectItem>
                <SelectItem value="kg">Kilogrammes</SelectItem>
                <SelectItem value="litres">Litres</SelectItem>
                <SelectItem value="m3">Mètres cubes</SelectItem>
                <SelectItem value="unites">Unités</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="site_depart">Site de départ *</Label>
          <Input
            id="site_depart"
            value={formData.site_depart}
            onChange={(e) => setFormData({...formData, site_depart: e.target.value})}
            placeholder="Site de départ"
            required
          />
        </div>

        <div>
          <Label htmlFor="site_arrivee">Site d'arrivée *</Label>
          <Input
            id="site_arrivee"
            value={formData.site_arrivee}
            onChange={(e) => setFormData({...formData, site_arrivee: e.target.value})}
            placeholder="Site d'arrivée"
            required
          />
        </div>
      </div>

      <div>
        <Label htmlFor="observations">Observations</Label>
        <Textarea
          id="observations"
          value={formData.observations}
          onChange={(e) => setFormData({...formData, observations: e.target.value})}
          placeholder="Observations ou instructions particulières..."
          rows={3}
        />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Annuler
        </Button>
        <Button 
          type="submit" 
          disabled={isLoading}
        >
          {isLoading ? 'Création...' : 'Créer la mission'}
        </Button>
      </div>
    </form>
  );
};
