
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
  const [dateDebutError, setDateDebutError] = useState('');
  const [dateFinError, setDateFinError] = useState('');
  const { toast } = useToast();

  const validateDates = () => {
    let isValid = true;
    setDateDebutError('');
    setDateFinError('');

    if (!dateDebut || dateDebut.trim() === '') {
      setDateDebutError('La date de début est obligatoire');
      isValid = false;
    }

    if (!dateFin || dateFin.trim() === '') {
      setDateFinError('La date de fin est obligatoire');
      isValid = false;
    }

    if (dateDebut && dateFin) {
      const debut = new Date(dateDebut);
      const fin = new Date(dateFin);
      
      if (isNaN(debut.getTime()) || isNaN(fin.getTime())) {
        if (isNaN(debut.getTime())) setDateDebutError('Date de début invalide');
        if (isNaN(fin.getTime())) setDateFinError('Date de fin invalide');
        isValid = false;
      } else if (fin <= debut) {
        setDateFinError('La date de fin doit être postérieure à la date de début');
        isValid = false;
      }
    }

    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('Tentative de soumission avec:', { dateDebut, dateFin });
    
    if (!validateDates()) {
      toast({
        title: "Erreur de validation",
        description: "Veuillez corriger les erreurs dans le formulaire",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const updateData = {
        ...chauffeur,
        statut_disponibilite: newStatut,
        date_debut_statut: dateDebut,
        date_fin_statut: dateFin
      };

      console.log('Mise à jour du statut avec:', updateData);

      await chauffeursService.update(chauffeur.id, updateData);
      
      toast({
        title: "Statut mis à jour",
        description: `Le statut du chauffeur a été changé vers ${STATUT_OPTIONS[newStatut as keyof typeof STATUT_OPTIONS].label}`,
      });
      
      setIsEditing(false);
      setDateDebut('');
      setDateFin('');
      setMotif('');
      setDateDebutError('');
      setDateFinError('');
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

  const handleCancel = () => {
    setIsEditing(false);
    setNewStatut(chauffeur.statut_disponibilite || 'disponible');
    setDateDebut('');
    setDateFin('');
    setMotif('');
    setDateDebutError('');
    setDateFinError('');
  };

  const handleDateDebutChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setDateDebut(value);
    if (dateDebutError && value.trim() !== '') {
      setDateDebutError('');
    }
  };

  const handleDateFinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setDateFin(value);
    if (dateFinError && value.trim() !== '') {
      setDateFinError('');
    }
  };

  // Le formulaire est valide seulement si les deux dates sont renseignées ET valides
  const canSubmit = dateDebut && dateFin && dateDebut.trim() !== '' && dateFin.trim() !== '' && !dateDebutError && !dateFinError;

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
                <Label>Date de début <span className="text-red-500">*</span></Label>
                <Input
                  type="date"
                  value={dateDebut}
                  onChange={handleDateDebutChange}
                  required
                  className={`${dateDebutError ? 'border-red-500 focus:border-red-500' : 'border-gray-200'}`}
                />
                {dateDebutError && (
                  <p className="text-xs text-red-500">{dateDebutError}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label>Date de fin <span className="text-red-500">*</span></Label>
                <Input
                  type="date"
                  value={dateFin}
                  onChange={handleDateFinChange}
                  required
                  className={`${dateFinError ? 'border-red-500 focus:border-red-500' : 'border-gray-200'}`}
                />
                {dateFinError && (
                  <p className="text-xs text-red-500">{dateFinError}</p>
                )}
              </div>
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

            {(!dateDebut || !dateFin || dateDebutError || dateFinError) && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">
                  ⚠️ Les dates de début et de fin sont obligatoires pour changer le statut
                </p>
              </div>
            )}

            <div className="flex gap-2">
              <Button 
                type="submit" 
                disabled={isLoading || !canSubmit}
                className={!canSubmit ? 'opacity-50 cursor-not-allowed' : ''}
              >
                {isLoading ? 'Enregistrement...' : 'Enregistrer'}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleCancel}
                disabled={isLoading}
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
