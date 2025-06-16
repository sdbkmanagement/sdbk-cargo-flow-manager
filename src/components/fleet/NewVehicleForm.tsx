
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { X } from 'lucide-react';

interface NewVehicleFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface Chauffeur {
  id: string;
  nom: string;
  prenom: string;
}

export const NewVehicleForm = ({ isOpen, onClose, onSuccess }: NewVehicleFormProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [chauffeurs, setChauffeurs] = useState<Chauffeur[]>([]);
  
  const [formData, setFormData] = useState({
    numero: '',
    marque: '',
    modele: '',
    immatriculation: '',
    type_transport: 'hydrocarbures',
    statut: 'disponible',
    chauffeur_assigne: '',
    capacite_max: '',
    unite_capacite: 'L',
    annee_fabrication: '',
    numero_chassis: '',
    consommation_moyenne: '',
    derniere_maintenance: '',
    prochaine_maintenance: ''
  });

  useEffect(() => {
    if (isOpen) {
      loadChauffeurs();
      // Reset form when opening
      setFormData({
        numero: '',
        marque: '',
        modele: '',
        immatriculation: '',
        type_transport: 'hydrocarbures',
        statut: 'disponible',
        chauffeur_assigne: '',
        capacite_max: '',
        unite_capacite: 'L',
        annee_fabrication: '',
        numero_chassis: '',
        consommation_moyenne: '',
        derniere_maintenance: '',
        prochaine_maintenance: ''
      });
    }
  }, [isOpen]);

  const loadChauffeurs = async () => {
    try {
      const { data, error } = await supabase
        .from('chauffeurs')
        .select('id, nom, prenom')
        .eq('statut', 'actif');
      
      if (error) {
        console.error('Erreur lors du chargement des chauffeurs:', error);
        return;
      }
      setChauffeurs(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des chauffeurs:', error);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Soumission du formulaire avec:', formData);
    
    if (!formData.numero || !formData.marque || !formData.modele || !formData.immatriculation) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const dataToInsert = {
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

      console.log('Données à insérer:', dataToInsert);

      const { data, error } = await supabase
        .from('vehicules')
        .insert([dataToInsert])
        .select()
        .single();

      if (error) {
        console.error('Erreur lors de l\'insertion:', error);
        throw error;
      }

      console.log('Véhicule créé avec succès:', data);

      toast({
        title: "Véhicule créé",
        description: "Le véhicule a été créé avec succès",
      });

      onSuccess();
    } catch (error: any) {
      console.error('Erreur lors de la création:', error);
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors de la création du véhicule",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            Nouveau véhicule
          </DialogTitle>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-4"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="numero">Numéro du véhicule *</Label>
              <Input
                id="numero"
                value={formData.numero}
                onChange={(e) => handleInputChange('numero', e.target.value)}
                placeholder="Ex: VH001"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="immatriculation">Immatriculation *</Label>
              <Input
                id="immatriculation"
                value={formData.immatriculation}
                onChange={(e) => handleInputChange('immatriculation', e.target.value)}
                placeholder="Ex: AB-123-CD"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="marque">Marque *</Label>
              <Input
                id="marque"
                value={formData.marque}
                onChange={(e) => handleInputChange('marque', e.target.value)}
                placeholder="Ex: Mercedes"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="modele">Modèle *</Label>
              <Input
                id="modele"
                value={formData.modele}
                onChange={(e) => handleInputChange('modele', e.target.value)}
                placeholder="Ex: Actros"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type_transport">Type de transport *</Label>
              <Select 
                value={formData.type_transport} 
                onValueChange={(value) => handleInputChange('type_transport', value)}
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
            
            <div className="space-y-2">
              <Label htmlFor="statut">Statut</Label>
              <Select 
                value={formData.statut} 
                onValueChange={(value) => handleInputChange('statut', value)}
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

          <div className="space-y-2">
            <Label htmlFor="chauffeur_assigne">Chauffeur assigné</Label>
            <Select 
              value={formData.chauffeur_assigne} 
              onValueChange={(value) => handleInputChange('chauffeur_assigne', value)}
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="capacite_max">Capacité max</Label>
              <Input
                id="capacite_max"
                type="number"
                step="0.01"
                value={formData.capacite_max}
                onChange={(e) => handleInputChange('capacite_max', e.target.value)}
                placeholder="25000"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="unite_capacite">Unité</Label>
              <Input
                id="unite_capacite"
                value={formData.unite_capacite}
                onChange={(e) => handleInputChange('unite_capacite', e.target.value)}
                placeholder="L, m³, tonnes..."
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="annee_fabrication">Année</Label>
              <Input
                id="annee_fabrication"
                type="number"
                value={formData.annee_fabrication}
                onChange={(e) => handleInputChange('annee_fabrication', e.target.value)}
                placeholder="2020"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="numero_chassis">Numéro de châssis</Label>
              <Input
                id="numero_chassis"
                value={formData.numero_chassis}
                onChange={(e) => handleInputChange('numero_chassis', e.target.value)}
                placeholder="VIN123456789"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="consommation_moyenne">Consommation (L/100km)</Label>
              <Input
                id="consommation_moyenne"
                type="number"
                step="0.1"
                value={formData.consommation_moyenne}
                onChange={(e) => handleInputChange('consommation_moyenne', e.target.value)}
                placeholder="35.5"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="derniere_maintenance">Dernière maintenance</Label>
              <Input
                id="derniere_maintenance"
                type="date"
                value={formData.derniere_maintenance}
                onChange={(e) => handleInputChange('derniere_maintenance', e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="prochaine_maintenance">Prochaine maintenance</Label>
              <Input
                id="prochaine_maintenance"
                type="date"
                value={formData.prochaine_maintenance}
                onChange={(e) => handleInputChange('prochaine_maintenance', e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Création en cours...' : 'Créer le véhicule'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
