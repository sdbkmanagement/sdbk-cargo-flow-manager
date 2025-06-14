
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { vehiculesService } from '@/services/vehicules';
import { chauffeursService } from '@/services/chauffeurs';
import type { Database } from '@/integrations/supabase/types';

type Vehicule = Database['public']['Tables']['vehicules']['Row'];
type Chauffeur = Database['public']['Tables']['chauffeurs']['Row'];

interface VehicleFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  vehicule?: Vehicule | null;
}

export const VehicleForm = ({ isOpen, onClose, onSuccess, vehicule }: VehicleFormProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [chauffeurs, setChauffeurs] = useState<Chauffeur[]>([]);
  
  const [formData, setFormData] = useState({
    numero: '',
    marque: '',
    modele: '',
    immatriculation: '',
    type_transport: 'hydrocarbures' as 'hydrocarbures' | 'bauxite',
    statut: 'disponible' as 'disponible' | 'en_mission' | 'maintenance' | 'validation_requise',
    chauffeur_assigne: '',
    capacite_max: '',
    unite_capacite: '',
    annee_fabrication: '',
    numero_chassis: '',
    consommation_moyenne: '',
    derniere_maintenance: '',
    prochaine_maintenance: ''
  });

  useEffect(() => {
    if (isOpen) {
      loadChauffeurs();
      if (vehicule) {
        setFormData({
          numero: vehicule.numero || '',
          marque: vehicule.marque || '',
          modele: vehicule.modele || '',
          immatriculation: vehicule.immatriculation || '',
          type_transport: vehicule.type_transport as 'hydrocarbures' | 'bauxite' || 'hydrocarbures',
          statut: vehicule.statut as 'disponible' | 'en_mission' | 'maintenance' | 'validation_requise' || 'disponible',
          chauffeur_assigne: vehicule.chauffeur_assigne || '',
          capacite_max: vehicule.capacite_max?.toString() || '',
          unite_capacite: vehicule.unite_capacite || '',
          annee_fabrication: vehicule.annee_fabrication?.toString() || '',
          numero_chassis: vehicule.numero_chassis || '',
          consommation_moyenne: vehicule.consommation_moyenne?.toString() || '',
          derniere_maintenance: vehicule.derniere_maintenance || '',
          prochaine_maintenance: vehicule.prochaine_maintenance || ''
        });
      } else {
        resetForm();
      }
    }
  }, [isOpen, vehicule]);

  const loadChauffeurs = async () => {
    try {
      const data = await chauffeursService.getAll();
      setChauffeurs(data.filter(c => c.statut === 'actif'));
    } catch (error) {
      console.error('Erreur lors du chargement des chauffeurs:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      numero: '',
      marque: '',
      modele: '',
      immatriculation: '',
      type_transport: 'hydrocarbures',
      statut: 'disponible',
      chauffeur_assigne: '',
      capacite_max: '',
      unite_capacite: '',
      annee_fabrication: '',
      numero_chassis: '',
      consommation_moyenne: '',
      derniere_maintenance: '',
      prochaine_maintenance: ''
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const dataToSubmit = {
        numero: formData.numero,
        marque: formData.marque,
        modele: formData.modele,
        immatriculation: formData.immatriculation,
        type_transport: formData.type_transport,
        statut: formData.statut,
        chauffeur_assigne: formData.chauffeur_assigne || null,
        capacite_max: formData.capacite_max ? parseFloat(formData.capacite_max) : null,
        unite_capacite: formData.unite_capacite || null,
        annee_fabrication: formData.annee_fabrication ? parseInt(formData.annee_fabrication) : null,
        numero_chassis: formData.numero_chassis || null,
        consommation_moyenne: formData.consommation_moyenne ? parseFloat(formData.consommation_moyenne) : null,
        derniere_maintenance: formData.derniere_maintenance || null,
        prochaine_maintenance: formData.prochaine_maintenance || null
      };

      if (vehicule) {
        await vehiculesService.update(vehicule.id, dataToSubmit);
        toast({
          title: "Véhicule modifié",
          description: "Le véhicule a été modifié avec succès",
        });
      } else {
        await vehiculesService.create(dataToSubmit);
        toast({
          title: "Véhicule créé",
          description: "Le véhicule a été créé avec succès",
        });
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Erreur:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de l'enregistrement",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{vehicule ? 'Modifier le véhicule' : 'Nouveau véhicule'}</DialogTitle>
          <DialogDescription>
            {vehicule ? 'Modifiez les informations du véhicule' : 'Ajoutez un nouveau véhicule à la flotte'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="numero">Numéro du véhicule *</Label>
              <Input
                id="numero"
                value={formData.numero}
                onChange={(e) => setFormData(prev => ({ ...prev, numero: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label htmlFor="immatriculation">Immatriculation *</Label>
              <Input
                id="immatriculation"
                value={formData.immatriculation}
                onChange={(e) => setFormData(prev => ({ ...prev, immatriculation: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="marque">Marque *</Label>
              <Input
                id="marque"
                value={formData.marque}
                onChange={(e) => setFormData(prev => ({ ...prev, marque: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label htmlFor="modele">Modèle *</Label>
              <Input
                id="modele"
                value={formData.modele}
                onChange={(e) => setFormData(prev => ({ ...prev, modele: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="type_transport">Type de transport *</Label>
              <Select 
                value={formData.type_transport} 
                onValueChange={(value: 'hydrocarbures' | 'bauxite') => 
                  setFormData(prev => ({ ...prev, type_transport: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hydrocarbures">Hydrocarbures</SelectItem>
                  <SelectItem value="bauxite">Bauxite</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="statut">Statut</Label>
              <Select 
                value={formData.statut} 
                onValueChange={(value: 'disponible' | 'en_mission' | 'maintenance' | 'validation_requise') => 
                  setFormData(prev => ({ ...prev, statut: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="disponible">Disponible</SelectItem>
                  <SelectItem value="en_mission">En mission</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="validation_requise">Validation requise</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="chauffeur_assigne">Chauffeur assigné</Label>
            <Select 
              value={formData.chauffeur_assigne} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, chauffeur_assigne: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un chauffeur" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Aucun chauffeur assigné</SelectItem>
                {chauffeurs.map((chauffeur) => (
                  <SelectItem key={chauffeur.id} value={chauffeur.id}>
                    {chauffeur.prenom} {chauffeur.nom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="capacite_max">Capacité max</Label>
              <Input
                id="capacite_max"
                type="number"
                step="0.01"
                value={formData.capacite_max}
                onChange={(e) => setFormData(prev => ({ ...prev, capacite_max: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="unite_capacite">Unité</Label>
              <Input
                id="unite_capacite"
                value={formData.unite_capacite}
                onChange={(e) => setFormData(prev => ({ ...prev, unite_capacite: e.target.value }))}
                placeholder="L, m³, tonnes..."
              />
            </div>
            <div>
              <Label htmlFor="annee_fabrication">Année</Label>
              <Input
                id="annee_fabrication"
                type="number"
                value={formData.annee_fabrication}
                onChange={(e) => setFormData(prev => ({ ...prev, annee_fabrication: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="numero_chassis">Numéro de châssis</Label>
              <Input
                id="numero_chassis"
                value={formData.numero_chassis}
                onChange={(e) => setFormData(prev => ({ ...prev, numero_chassis: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="consommation_moyenne">Consommation (L/100km)</Label>
              <Input
                id="consommation_moyenne"
                type="number"
                step="0.1"
                value={formData.consommation_moyenne}
                onChange={(e) => setFormData(prev => ({ ...prev, consommation_moyenne: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="derniere_maintenance">Dernière maintenance</Label>
              <Input
                id="derniere_maintenance"
                type="date"
                value={formData.derniere_maintenance}
                onChange={(e) => setFormData(prev => ({ ...prev, derniere_maintenance: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="prochaine_maintenance">Prochaine maintenance</Label>
              <Input
                id="prochaine_maintenance"
                type="date"
                value={formData.prochaine_maintenance}
                onChange={(e) => setFormData(prev => ({ ...prev, prochaine_maintenance: e.target.value }))}
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Enregistrement...' : vehicule ? 'Modifier' : 'Créer'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
