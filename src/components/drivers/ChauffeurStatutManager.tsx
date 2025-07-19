
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { chauffeursService } from '@/services/chauffeurs';

interface ChauffeurStatutManagerProps {
  chauffeur: any;
  onUpdate: () => void;
}

const STATUT_OPTIONS = {
  'disponible': { label: 'Disponible', color: 'bg-green-500' },
  'en_conge': { label: 'En congé', color: 'bg-blue-500' },
  'maladie': { label: 'Maladie', color: 'bg-red-500' },
  'indisponible': { label: 'Indisponible', color: 'bg-gray-500' }
};

export const ChauffeurStatutManager = ({ chauffeur, onUpdate }: ChauffeurStatutManagerProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [newStatut, setNewStatut] = useState(chauffeur.statut_disponibilite || 'disponible');
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');
  const [motif, setMotif] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const updateData = {
        statut_disponibilite: newStatut,
        date_debut_statut: dateDebut || null,
        date_fin_statut: dateFin || null
      };

      await chauffeursService.update(chauffeur.id, updateData);
      
      toast({
        title: "Statut mis à jour",
        description: `Le statut du chauffeur a été changé vers ${STATUT_OPTIONS[newStatut as keyof typeof STATUT_OPTIONS].label}`,
      });
      
      setIsEditing(false);
      onUpdate();
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le statut",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const currentStatut = chauffeur.statut_disponibilite || 'disponible';
  const statutConfig = STATUT_OPTIONS[currentStatut as keyof typeof STATUT_OPTIONS];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="w-5 h-5" />
          Statut du chauffeur
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!isEditing ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Badge className={`${statutConfig.color} text-white`}>
                {statutConfig.label}
              </Badge>
              {chauffeur.date_debut_statut && (
                <div className="flex items-center gap-1 text-sm text-gray-600">
                  <Calendar className="w-4 h-4" />
                  Depuis le {new Date(chauffeur.date_debut_statut).toLocaleDateString('fr-FR')}
                </div>
              )}
            </div>
            
            {chauffeur.date_fin_statut && (
              <div className="flex items-center gap-1 text-sm text-gray-600">
                <Clock className="w-4 h-4" />
                Jusqu'au {new Date(chauffeur.date_fin_statut).toLocaleDateString('fr-FR')}
              </div>
            )}
            
            <Button onClick={() => setIsEditing(true)} variant="outline">
              Modifier le statut
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Nouveau statut</Label>
              <Select value={newStatut} onValueChange={setNewStatut}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(STATUT_OPTIONS).map(([value, config]) => (
                    <SelectItem key={value} value={value}>
                      {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date de début</Label>
                <Input
                  type="date"
                  value={dateDebut}
                  onChange={(e) => setDateDebut(e.target.value)}
                  required
                />
              </div>
              
              {newStatut !== 'disponible' && (
                <div className="space-y-2">
                  <Label>Date de fin (optionnelle)</Label>
                  <Input
                    type="date"
                    value={dateFin}
                    onChange={(e) => setDateFin(e.target.value)}
                  />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Motif (optionnel)</Label>
              <Textarea
                value={motif}
                onChange={(e) => setMotif(e.target.value)}
                placeholder="Raison du changement de statut..."
                rows={3}
              />
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Enregistrement...' : 'Enregistrer'}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsEditing(false)}
              >
                Annuler
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
};
