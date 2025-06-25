
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Save } from 'lucide-react';
import { chargementsService } from '@/services/chargements';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

interface ChargementFormProps {
  chargement?: any;
  onSuccess: () => void;
  onCancel: () => void;
}

export const ChargementForm = ({ chargement, onSuccess, onCancel }: ChargementFormProps) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    mission_id: '',
    type_chargement: '',
    volume_poids: '',
    unite_mesure: 'tonnes',
    vehicule_id: '',
    chauffeur_id: '',
    date_heure_chargement: '',
    lieu_chargement: '',
    lieu_livraison: '',
    client_nom: '',
    statut: 'charge',
    observations: ''
  });

  const [selectedMission, setSelectedMission] = useState<any>(null);

  const { data: missions = [] } = useQuery({
    queryKey: ['active-missions'],
    queryFn: chargementsService.getActiveMissions,
  });

  useEffect(() => {
    if (chargement) {
      setFormData({
        mission_id: chargement.mission_id || '',
        type_chargement: chargement.type_chargement || '',
        volume_poids: chargement.volume_poids?.toString() || '',
        unite_mesure: chargement.unite_mesure || 'tonnes',
        vehicule_id: chargement.vehicule_id || '',
        chauffeur_id: chargement.chauffeur_id || '',
        date_heure_chargement: chargement.date_heure_chargement 
          ? new Date(chargement.date_heure_chargement).toISOString().slice(0, 16)
          : '',
        lieu_chargement: chargement.lieu_chargement || '',
        lieu_livraison: chargement.lieu_livraison || '',
        client_nom: chargement.client_nom || '',
        statut: chargement.statut || 'charge',
        observations: chargement.observations || ''
      });
    }
  }, [chargement]);

  const handleMissionChange = (missionId: string) => {
    const mission = missions.find(m => m.id === missionId);
    if (mission) {
      setSelectedMission(mission);
      setFormData(prev => ({
        ...prev,
        mission_id: missionId,
        vehicule_id: mission.vehicule_id,
        chauffeur_id: mission.chauffeur_id,
        lieu_chargement: mission.site_depart,
        lieu_livraison: mission.site_arrivee,
        type_chargement: mission.type_transport
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const chargementData = {
        ...formData,
        volume_poids: parseFloat(formData.volume_poids),
        date_heure_chargement: new Date(formData.date_heure_chargement).toISOString(),
        created_by: user?.email
      };

      if (chargement) {
        await chargementsService.update(chargement.id, chargementData);
        toast.success('Chargement mis à jour avec succès');
      } else {
        await chargementsService.create(chargementData);
        toast.success('Chargement créé avec succès');
      }
      
      onSuccess();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      toast.error('Erreur lors de la sauvegarde du chargement');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" onClick={onCancel}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour
        </Button>
        <h1 className="text-2xl font-bold">
          {chargement ? 'Modifier le chargement' : 'Nouveau chargement'}
        </h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informations du chargement</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="mission_id">Mission *</Label>
                <Select 
                  value={formData.mission_id} 
                  onValueChange={handleMissionChange}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une mission" />
                  </SelectTrigger>
                  <SelectContent>
                    {missions.map((mission) => (
                      <SelectItem key={mission.id} value={mission.id}>
                        {mission.numero} - {mission.site_depart} → {mission.site_arrivee}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="type_chargement">Type de chargement *</Label>
                <Select 
                  value={formData.type_chargement} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, type_chargement: value }))}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Type de chargement" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hydrocarbures">Hydrocarbures</SelectItem>
                    <SelectItem value="bauxite">Bauxite</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="volume_poids">Volume/Poids *</Label>
                <div className="flex space-x-2">
                  <Input
                    id="volume_poids"
                    type="number"
                    step="0.01"
                    value={formData.volume_poids}
                    onChange={(e) => setFormData(prev => ({ ...prev, volume_poids: e.target.value }))}
                    required
                    className="flex-1"
                  />
                  <Select 
                    value={formData.unite_mesure} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, unite_mesure: value }))}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tonnes">Tonnes</SelectItem>
                      <SelectItem value="litres">Litres</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="date_heure_chargement">Date et heure de chargement *</Label>
                <Input
                  id="date_heure_chargement"
                  type="datetime-local"
                  value={formData.date_heure_chargement}
                  onChange={(e) => setFormData(prev => ({ ...prev, date_heure_chargement: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lieu_chargement">Lieu de chargement *</Label>
                <Input
                  id="lieu_chargement"
                  value={formData.lieu_chargement}
                  onChange={(e) => setFormData(prev => ({ ...prev, lieu_chargement: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lieu_livraison">Lieu de livraison *</Label>
                <Input
                  id="lieu_livraison"
                  value={formData.lieu_livraison}
                  onChange={(e) => setFormData(prev => ({ ...prev, lieu_livraison: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="client_nom">Nom du client *</Label>
                <Input
                  id="client_nom"
                  value={formData.client_nom}
                  onChange={(e) => setFormData(prev => ({ ...prev, client_nom: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="statut">Statut</Label>
                <Select 
                  value={formData.statut} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, statut: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="charge">Chargé</SelectItem>
                    <SelectItem value="livre">Livré</SelectItem>
                    <SelectItem value="annule">Annulé</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {selectedMission && (
              <Card className="bg-gray-50">
                <CardHeader>
                  <CardTitle className="text-lg">Informations de la mission</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <strong>Véhicule:</strong> {selectedMission.vehicule?.numero} - {selectedMission.vehicule?.marque} {selectedMission.vehicule?.modele}
                    </div>
                    <div>
                      <strong>Chauffeur:</strong> {selectedMission.chauffeur?.prenom} {selectedMission.chauffeur?.nom}
                    </div>
                    <div>
                      <strong>Type transport:</strong> {selectedMission.type_transport}
                    </div>
                    <div>
                      <strong>Statut mission:</strong> {selectedMission.statut}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="space-y-2">
              <Label htmlFor="observations">Observations</Label>
              <Textarea
                id="observations"
                value={formData.observations}
                onChange={(e) => setFormData(prev => ({ ...prev, observations: e.target.value }))}
                rows={3}
              />
            </div>

            <div className="flex justify-end space-x-4">
              <Button type="button" variant="outline" onClick={onCancel}>
                Annuler
              </Button>
              <Button type="submit" className="bg-orange-500 hover:bg-orange-600">
                <Save className="w-4 h-4 mr-2" />
                {chargement ? 'Mettre à jour' : 'Créer'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
