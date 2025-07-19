
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { vehiculesService } from '@/services/vehicules';
import type { Vehicule } from '@/services/vehicules';

interface VehicleFormSimpleProps {
  vehicule?: Vehicule | null;
  onSuccess: () => void;
}

export const VehicleFormSimple = ({ vehicule, onSuccess }: VehicleFormSimpleProps) => {
  const [formData, setFormData] = useState({
    numero: '',
    type_vehicule: 'porteur',
    type_transport: 'hydrocarbures',
    marque: '',
    modele: '',
    immatriculation: '',
    numero_chassis: '',
    annee_fabrication: '',
    date_fabrication: '',
    capacite_max: '',
    unite_capacite: 'litres',
    base: '',
    integration: '',
    tracteur_immatriculation: '',
    tracteur_marque: '',
    tracteur_modele: '',
    tracteur_configuration: '',
    tracteur_numero_chassis: '',
    tracteur_annee_fabrication: '',
    tracteur_date_fabrication: '',
    tracteur_date_mise_circulation: '',
    remorque_immatriculation: '',
    remorque_marque: '',
    remorque_modele: '',
    remorque_configuration: '',
    remorque_numero_chassis: '',
    remorque_annee_fabrication: '',
    remorque_date_fabrication: '',
    remorque_date_mise_circulation: '',
    remorque_volume_litres: '',
    consommation_moyenne: '',
    kilometrage: '',
    derniere_maintenance: '',
    prochaine_maintenance: '',
    statut: 'validation_requise'
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (vehicule) {
      setFormData({
        numero: vehicule.numero || '',
        type_vehicule: vehicule.type_vehicule || 'porteur',
        type_transport: vehicule.type_transport || 'hydrocarbures',
        marque: vehicule.marque || '',
        modele: vehicule.modele || '',
        immatriculation: vehicule.immatriculation || '',
        numero_chassis: vehicule.numero_chassis || '',
        annee_fabrication: vehicule.annee_fabrication?.toString() || '',
        date_fabrication: vehicule.date_fabrication || '',
        capacite_max: vehicule.capacite_max?.toString() || '',
        unite_capacite: vehicule.unite_capacite || 'litres',
        base: vehicule.base || '',
        integration: vehicule.integration || '',
        tracteur_immatriculation: vehicule.tracteur_immatriculation || '',
        tracteur_marque: vehicule.tracteur_marque || '',
        tracteur_modele: vehicule.tracteur_modele || '',
        tracteur_configuration: vehicule.tracteur_configuration || '',
        tracteur_numero_chassis: vehicule.tracteur_numero_chassis || '',
        tracteur_annee_fabrication: vehicule.tracteur_annee_fabrication?.toString() || '',
        tracteur_date_fabrication: vehicule.tracteur_date_fabrication || '',
        tracteur_date_mise_circulation: vehicule.tracteur_date_mise_circulation || '',
        remorque_immatriculation: vehicule.remorque_immatriculation || '',
        remorque_marque: vehicule.remorque_marque || '',
        remorque_modele: vehicule.remorque_modele || '',
        remorque_configuration: vehicule.remorque_configuration || '',
        remorque_numero_chassis: vehicule.remorque_numero_chassis || '',
        remorque_annee_fabrication: vehicule.remorque_annee_fabrication?.toString() || '',
        remorque_date_fabrication: vehicule.remorque_date_fabrication || '',
        remorque_date_mise_circulation: vehicule.remorque_date_mise_circulation || '',
        remorque_volume_litres: vehicule.remorque_volume_litres?.toString() || '',
        consommation_moyenne: vehicule.consommation_moyenne?.toString() || '',
        kilometrage: vehicule.kilometrage?.toString() || '',
        derniere_maintenance: vehicule.derniere_maintenance || '',
        prochaine_maintenance: vehicule.prochaine_maintenance || '',
        statut: vehicule.statut || 'validation_requise'
      });
    }
  }, [vehicule]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const vehiculeData = {
        ...formData,
        annee_fabrication: formData.annee_fabrication ? parseInt(formData.annee_fabrication) : null,
        capacite_max: formData.capacite_max ? parseFloat(formData.capacite_max) : null,
        tracteur_annee_fabrication: formData.tracteur_annee_fabrication ? parseInt(formData.tracteur_annee_fabrication) : null,
        remorque_annee_fabrication: formData.remorque_annee_fabrication ? parseInt(formData.remorque_annee_fabrication) : null,
        remorque_volume_litres: formData.remorque_volume_litres ? parseFloat(formData.remorque_volume_litres) : null,
        consommation_moyenne: formData.consommation_moyenne ? parseFloat(formData.consommation_moyenne) : null,
        kilometrage: formData.kilometrage ? parseInt(formData.kilometrage) : null,
        date_fabrication: formData.date_fabrication || null,
        tracteur_date_fabrication: formData.tracteur_date_fabrication || null,
        tracteur_date_mise_circulation: formData.tracteur_date_mise_circulation || null,
        remorque_date_fabrication: formData.remorque_date_fabrication || null,
        remorque_date_mise_circulation: formData.remorque_date_mise_circulation || null,
        derniere_maintenance: formData.derniere_maintenance || null,
        prochaine_maintenance: formData.prochaine_maintenance || null,
      };

      if (vehicule) {
        await vehiculesService.update(vehicule.id, vehiculeData);
        toast({
          title: "Véhicule modifié",
          description: "Le véhicule a été modifié avec succès.",
        });
      } else {
        await vehiculesService.create(vehiculeData);
        toast({
          title: "Véhicule créé",
          description: "Le véhicule a été créé avec succès.",
        });
      }

      onSuccess();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      toast({
        title: "Erreur",
        description: "Une erreur s'est produite lors de la sauvegarde.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Informations générales</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="numero">Numéro du véhicule</Label>
              <Input
                id="numero"
                value={formData.numero}
                onChange={(e) => handleInputChange('numero', e.target.value)}
                placeholder="Numéro automatique si vide"
              />
            </div>
            <div>
              <Label htmlFor="type_vehicule">Type de véhicule</Label>
              <Select value={formData.type_vehicule} onValueChange={(value) => handleInputChange('type_vehicule', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="porteur">Porteur</SelectItem>
                  <SelectItem value="tracteur_remorque">Tracteur + Remorque</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="type_transport">Type de transport</Label>
              <Select value={formData.type_transport} onValueChange={(value) => handleInputChange('type_transport', value)}>
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
              <Label htmlFor="base">Base</Label>
              <Input
                id="base"
                value={formData.base}
                onChange={(e) => handleInputChange('base', e.target.value)}
                placeholder="Base d'affectation"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {formData.type_vehicule === 'porteur' && (
        <Card>
          <CardHeader>
            <CardTitle>Informations du porteur</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="marque">Marque</Label>
                <Input
                  id="marque"
                  value={formData.marque}
                  onChange={(e) => handleInputChange('marque', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="modele">Modèle</Label>
                <Input
                  id="modele"
                  value={formData.modele}
                  onChange={(e) => handleInputChange('modele', e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="immatriculation">Immatriculation</Label>
                <Input
                  id="immatriculation"
                  value={formData.immatriculation}
                  onChange={(e) => handleInputChange('immatriculation', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="numero_chassis">Numéro de chassis</Label>
                <Input
                  id="numero_chassis"
                  value={formData.numero_chassis}
                  onChange={(e) => handleInputChange('numero_chassis', e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="capacite_max">Capacité maximale</Label>
                <Input
                  id="capacite_max"
                  type="number"
                  value={formData.capacite_max}
                  onChange={(e) => handleInputChange('capacite_max', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="unite_capacite">Unité de capacité</Label>
                <Select value={formData.unite_capacite} onValueChange={(value) => handleInputChange('unite_capacite', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="litres">Litres</SelectItem>
                    <SelectItem value="tonnes">Tonnes</SelectItem>
                    <SelectItem value="m3">M³</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {formData.type_vehicule === 'tracteur_remorque' && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Informations du tracteur</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="tracteur_marque">Marque</Label>
                  <Input
                    id="tracteur_marque"
                    value={formData.tracteur_marque}
                    onChange={(e) => handleInputChange('tracteur_marque', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="tracteur_modele">Modèle</Label>
                  <Input
                    id="tracteur_modele"
                    value={formData.tracteur_modele}
                    onChange={(e) => handleInputChange('tracteur_modele', e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="tracteur_immatriculation">Immatriculation</Label>
                  <Input
                    id="tracteur_immatriculation"
                    value={formData.tracteur_immatriculation}
                    onChange={(e) => handleInputChange('tracteur_immatriculation', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="tracteur_numero_chassis">Numéro de chassis</Label>
                  <Input
                    id="tracteur_numero_chassis"
                    value={formData.tracteur_numero_chassis}
                    onChange={(e) => handleInputChange('tracteur_numero_chassis', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Informations de la remorque</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="remorque_marque">Marque</Label>
                  <Input
                    id="remorque_marque"
                    value={formData.remorque_marque}
                    onChange={(e) => handleInputChange('remorque_marque', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="remorque_modele">Modèle</Label>
                  <Input
                    id="remorque_modele"
                    value={formData.remorque_modele}
                    onChange={(e) => handleInputChange('remorque_modele', e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="remorque_immatriculation">Immatriculation</Label>
                  <Input
                    id="remorque_immatriculation"
                    value={formData.remorque_immatriculation}
                    onChange={(e) => handleInputChange('remorque_immatriculation', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="remorque_volume_litres">Volume (litres)</Label>
                  <Input
                    id="remorque_volume_litres"
                    type="number"
                    value={formData.remorque_volume_litres}
                    onChange={(e) => handleInputChange('remorque_volume_litres', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      <div className="flex justify-end space-x-4">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Sauvegarde...' : (vehicule ? 'Modifier' : 'Créer')}
        </Button>
      </div>
    </form>
  );
};
