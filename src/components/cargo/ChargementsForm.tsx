
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';

const chargementSchema = z.object({
  mission_id: z.string().min(1, "Sélectionnez une mission"),
  type_chargement: z.enum(['hydrocarbures', 'bauxite'], {
    required_error: "Sélectionnez le type de chargement"
  }),
  volume_poids: z.number().min(0.1, "Volume/poids requis"),
  unite_mesure: z.enum(['litres', 'tonnes']),
  date_heure_chargement: z.string().min(1, "Date et heure requises"),
  lieu_chargement: z.string().min(1, "Lieu de chargement requis"),
  lieu_livraison: z.string().min(1, "Lieu de livraison requis"),
  client_nom: z.string().min(1, "Nom du client requis"),
  observations: z.string().optional(),
});

type ChargementFormData = z.infer<typeof chargementSchema>;

export const ChargementsForm = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();

  const { register, handleSubmit, formState: { errors }, setValue, watch, reset } = useForm<ChargementFormData>({
    resolver: zodResolver(chargementSchema),
    defaultValues: {
      unite_mesure: 'tonnes'
    }
  });

  const selectedMissionId = watch('mission_id');

  // Récupérer les missions disponibles
  const { data: missions } = useQuery({
    queryKey: ['missions-disponibles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('missions')
        .select(`
          id,
          numero,
          site_depart,
          site_arrivee,
          statut,
          chauffeurs(nom, prenom),
          vehicules(immatriculation, marque, modele)
        `)
        .in('statut', ['en_cours', 'en_attente']);
      
      if (error) throw error;
      return data;
    }
  });

  // Récupérer les détails de la mission sélectionnée
  const { data: selectedMission } = useQuery({
    queryKey: ['mission-details', selectedMissionId],
    queryFn: async () => {
      if (!selectedMissionId) return null;
      
      const { data, error } = await supabase
        .from('missions')
        .select(`
          *,
          chauffeurs(id, nom, prenom),
          vehicules(id, immatriculation, marque, modele)
        `)
        .eq('id', selectedMissionId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!selectedMissionId
  });

  const createChargementMutation = useMutation({
    mutationFn: async (data: ChargementFormData) => {
      if (!selectedMission) {
        throw new Error('Mission non sélectionnée');
      }

      const chargementData = {
        mission_id: data.mission_id,
        vehicule_id: selectedMission.vehicule_id,
        chauffeur_id: selectedMission.chauffeur_id,
        type_chargement: data.type_chargement,
        volume_poids: data.volume_poids,
        unite_mesure: data.unite_mesure,
        date_heure_chargement: data.date_heure_chargement,
        lieu_chargement: data.lieu_chargement,
        lieu_livraison: data.lieu_livraison,
        client_nom: data.client_nom,
        observations: data.observations || null,
        numero: `CH-${Date.now()}`,
        statut: 'charge' as const
      };

      const { data: result, error } = await supabase
        .from('chargements')
        .insert([chargementData])
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      toast({
        title: "Chargement créé",
        description: "Le chargement a été enregistré avec succès",
      });
      reset();
      queryClient.invalidateQueries({ queryKey: ['chargements'] });
      queryClient.invalidateQueries({ queryKey: ['chargements-stats'] });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Impossible de créer le chargement",
        variant: "destructive",
      });
      console.error('Erreur création chargement:', error);
    }
  });

  const onSubmit = async (data: ChargementFormData) => {
    setIsSubmitting(true);
    try {
      await createChargementMutation.mutateAsync(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="mission_id">Mission *</Label>
            <Select onValueChange={(value) => setValue('mission_id', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner une mission" />
              </SelectTrigger>
              <SelectContent>
                {missions?.map((mission) => (
                  <SelectItem key={mission.id} value={mission.id}>
                    {mission.numero} - {mission.site_depart} → {mission.site_arrivee}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.mission_id && (
              <p className="text-sm text-red-500 mt-1">{errors.mission_id.message}</p>
            )}
          </div>

          {selectedMission && (
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-4">
                <h4 className="font-medium text-blue-900 mb-2">Détails de la mission</h4>
                <div className="text-sm space-y-1 text-blue-800">
                  <p><strong>Véhicule:</strong> {selectedMission.vehicules?.immatriculation} ({selectedMission.vehicules?.marque} {selectedMission.vehicules?.modele})</p>
                  <p><strong>Chauffeur:</strong> {selectedMission.chauffeurs?.prenom} {selectedMission.chauffeurs?.nom}</p>
                  <p><strong>Trajet:</strong> {selectedMission.site_depart} → {selectedMission.site_arrivee}</p>
                </div>
              </CardContent>
            </Card>
          )}

          <div>
            <Label htmlFor="type_chargement">Type de chargement *</Label>
            <Select onValueChange={(value) => setValue('type_chargement', value as 'hydrocarbures' | 'bauxite')}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner le type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hydrocarbures">Hydrocarbures</SelectItem>
                <SelectItem value="bauxite">Bauxite</SelectItem>
              </SelectContent>
            </Select>
            {errors.type_chargement && (
              <p className="text-sm text-red-500 mt-1">{errors.type_chargement.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="volume_poids">Volume/Poids *</Label>
              <Input
                id="volume_poids"
                type="number"
                step="0.1"
                {...register('volume_poids', { valueAsNumber: true })}
              />
              {errors.volume_poids && (
                <p className="text-sm text-red-500 mt-1">{errors.volume_poids.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="unite_mesure">Unité</Label>
              <Select onValueChange={(value) => setValue('unite_mesure', value as 'litres' | 'tonnes')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="litres">Litres</SelectItem>
                  <SelectItem value="tonnes">Tonnes</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="date_heure_chargement">Date et heure de chargement *</Label>
            <Input
              id="date_heure_chargement"
              type="datetime-local"
              {...register('date_heure_chargement')}
            />
            {errors.date_heure_chargement && (
              <p className="text-sm text-red-500 mt-1">{errors.date_heure_chargement.message}</p>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="lieu_chargement">Lieu de chargement *</Label>
            <Input
              id="lieu_chargement"
              {...register('lieu_chargement')}
              placeholder="Adresse complète du point de chargement"
            />
            {errors.lieu_chargement && (
              <p className="text-sm text-red-500 mt-1">{errors.lieu_chargement.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="lieu_livraison">Lieu de livraison *</Label>
            <Input
              id="lieu_livraison"
              {...register('lieu_livraison')}
              placeholder="Adresse complète du point de livraison"
            />
            {errors.lieu_livraison && (
              <p className="text-sm text-red-500 mt-1">{errors.lieu_livraison.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="client_nom">Nom du client *</Label>
            <Input
              id="client_nom"
              {...register('client_nom')}
              placeholder="Nom de l'entreprise ou du client"
            />
            {errors.client_nom && (
              <p className="text-sm text-red-500 mt-1">{errors.client_nom.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="observations">Observations</Label>
            <Textarea
              id="observations"
              {...register('observations')}
              placeholder="Remarques particulières, instructions spéciales..."
              rows={4}
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => reset()}
        >
          Annuler
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="bg-orange-500 hover:bg-orange-600"
        >
          <Plus className="w-4 h-4 mr-2" />
          {isSubmitting ? 'Création...' : 'Créer le chargement'}
        </Button>
      </div>
    </form>
  );
};
