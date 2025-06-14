
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapPin, Clock, User, X } from 'lucide-react';

interface Mission {
  id?: string;
  title: string;
  startTime: string;
  endTime: string;
  location: string;
  description?: string;
  status: 'planifie' | 'en_cours' | 'termine' | 'annule';
  chauffeurId: string;
  date: string;
}

interface MissionFormProps {
  mission?: Mission;
  chauffeurs: any[];
  onSave: (mission: Mission) => void;
  onCancel: () => void;
  defaultDate?: Date;
  defaultChauffeurId?: string;
}

export const MissionForm = ({ 
  mission, 
  chauffeurs, 
  onSave, 
  onCancel,
  defaultDate,
  defaultChauffeurId 
}: MissionFormProps) => {
  const [formData, setFormData] = useState<Mission>({
    id: mission?.id,
    title: mission?.title || '',
    startTime: mission?.startTime || '08:00',
    endTime: mission?.endTime || '17:00',
    location: mission?.location || '',
    description: mission?.description || '',
    status: mission?.status || 'planifie',
    chauffeurId: mission?.chauffeurId || defaultChauffeurId || '',
    date: mission?.date || defaultDate?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0]
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const updateFormData = (field: keyof Mission, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <MapPin className="w-5 h-5 mr-2" />
            {mission ? 'Modifier la mission' : 'Nouvelle mission'}
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="title">Titre de la mission</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => updateFormData('title', e.target.value)}
                placeholder="Ex: Livraison client ABC"
                required
              />
            </div>
            <div>
              <Label htmlFor="chauffeur">Chauffeur assigné</Label>
              <Select value={formData.chauffeurId} onValueChange={(value) => updateFormData('chauffeurId', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un chauffeur" />
                </SelectTrigger>
                <SelectContent>
                  {chauffeurs.map(chauffeur => (
                    <SelectItem key={chauffeur.id} value={chauffeur.id}>
                      <div className="flex items-center">
                        <User className="w-4 h-4 mr-2" />
                        {chauffeur.prenom} {chauffeur.nom}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => updateFormData('date', e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="startTime">Heure de début</Label>
              <Input
                id="startTime"
                type="time"
                value={formData.startTime}
                onChange={(e) => updateFormData('startTime', e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="endTime">Heure de fin</Label>
              <Input
                id="endTime"
                type="time"
                value={formData.endTime}
                onChange={(e) => updateFormData('endTime', e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="location">Lieu</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => updateFormData('location', e.target.value)}
              placeholder="Adresse de la mission"
              required
            />
          </div>

          <div>
            <Label htmlFor="status">Statut</Label>
            <Select value={formData.status} onValueChange={(value) => updateFormData('status', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="planifie">Planifiée</SelectItem>
                <SelectItem value="en_cours">En cours</SelectItem>
                <SelectItem value="termine">Terminée</SelectItem>
                <SelectItem value="annule">Annulée</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="description">Description (optionnel)</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => updateFormData('description', e.target.value)}
              placeholder="Détails supplémentaires sur la mission..."
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Annuler
            </Button>
            <Button type="submit" className="bg-orange-500 hover:bg-orange-600">
              {mission ? 'Mettre à jour' : 'Créer la mission'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
