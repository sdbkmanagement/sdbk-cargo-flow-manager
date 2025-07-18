
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { billingService } from '@/services/billing';
import { supabase } from '@/integrations/supabase/client';

interface QuoteFormProps {
  onClose: () => void;
  onQuoteCreated?: () => void;
}

interface QuoteFormData {
  clientNom: string;
  clientSociete: string;
  clientEmail: string;
  description: string;
  montantHT: number;
  dateValidite: string;
  observations: string;
  numeroMission: string;
  typeTransport: string;
  lieuDepart: string;
  lieuDestination: string;
}

const transportTypes = [
  'Hydrocarbures',
  'Marchandises générales',
  'Matériaux de construction',
  'Produits alimentaires',
  'Autres'
];

const destinations = [
  'Conakry',
  'Badi',
  'Kamsar',
  'Boké',
  'Kindia',
  'Dubréka',
  'Coyah',
  'Fria',
  'Télimélé',
  'Mamou',
  'Dalaba',
  'Pita',
  'Labé',
  'Mali',
  'Tougué',
  'Koubia',
  'Lélouma',
  'Gaoual',
  'Koundara',
  'Faranah',
  'Kissidougou',
  'Guékédou',
  'Macenta',
  'Nzérékoré',
  'Lola',
  'Yomou',
  'Beyla',
  'Kankan',
  'Kérouané',
  'Kouroussa',
  'Mandiana',
  'Siguiri',
  'Dinguiraye'
];

export const QuoteForm = ({ onClose, onQuoteCreated }: QuoteFormProps) => {
  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm<QuoteFormData>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [missions, setMissions] = useState<any[]>([]);
  
  const typeTransport = watch('typeTransport');

  useEffect(() => {
    loadMissions();
  }, []);

  const loadMissions = async () => {
    try {
      const { data, error } = await supabase
        .from('missions')
        .select('numero, type_transport')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setMissions(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des missions:', error);
    }
  };

  const onSubmit = async (data: QuoteFormData) => {
    setIsSubmitting(true);
    try {
      const TVA_RATE = 0.18;
      const montantTVA = data.montantHT * TVA_RATE;
      const montantTTC = data.montantHT + montantTVA;

      const quoteData = {
        numero: `D${new Date().getFullYear()}-${String(Date.now()).slice(-3)}`,
        client_nom: data.clientNom,
        client_societe: data.clientSociete || null,
        client_email: data.clientEmail || null,
        description: data.description,
        date_creation: new Date().toISOString().split('T')[0],
        date_validite: data.dateValidite,
        montant_ht: data.montantHT,
        montant_tva: montantTVA,
        montant_ttc: montantTTC,
        statut: 'en_attente',
        observations: data.observations || null,
        numero_mission: data.numeroMission || null,
        type_transport: data.typeTransport || null,
        lieu_depart: data.lieuDepart || null,
        lieu_destination: data.lieuDestination || null
      };

      const devis = await billingService.createDevis(quoteData);
      
      toast({
        title: "Devis créé avec succès",
        description: `Le devis ${devis.numero} a été créé et est prêt à être envoyé au client.`,
      });

      onQuoteCreated?.();
      onClose();
    } catch (error) {
      console.error('Erreur lors de la création du devis:', error);
      toast({
        title: "Erreur",
        description: "Une erreur s'est produite lors de la création du devis. Veuillez réessayer.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Informations client</CardTitle>
          <CardDescription>Détails du client pour ce devis</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="clientNom">Nom du client *</Label>
            <Input
              id="clientNom"
              {...register('clientNom', { required: 'Le nom du client est requis' })}
              placeholder="Nom du client"
            />
            {errors.clientNom && (
              <p className="text-sm text-red-600">{errors.clientNom.message}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="clientSociete">Société</Label>
            <Input
              id="clientSociete"
              {...register('clientSociete')}
              placeholder="Nom de la société"
            />
          </div>
          
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="clientEmail">Email *</Label>
            <Input
              id="clientEmail"
              type="email"
              {...register('clientEmail', { required: 'L\'email est requis' })}
              placeholder="email@client.com"
            />
            {errors.clientEmail && (
              <p className="text-sm text-red-600">{errors.clientEmail.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Informations de transport</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="numeroMission">N° Mission</Label>
              <Select onValueChange={(value) => setValue('numeroMission', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une mission" />
                </SelectTrigger>
                <SelectContent>
                  {missions.map((mission) => (
                    <SelectItem key={mission.numero} value={mission.numero}>
                      {mission.numero} - {mission.type_transport}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="typeTransport">Type de transport *</Label>
              <Select onValueChange={(value) => setValue('typeTransport', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner le type" />
                </SelectTrigger>
                <SelectContent>
                  {transportTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.typeTransport && (
                <p className="text-sm text-red-600">{errors.typeTransport.message}</p>
              )}
            </div>
          </div>

          {typeTransport === 'Hydrocarbures' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="lieuDepart">Lieu de départ</Label>
                <Select onValueChange={(value) => setValue('lieuDepart', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner le départ" />
                  </SelectTrigger>
                  <SelectContent>
                    {destinations.map((lieu) => (
                      <SelectItem key={lieu} value={lieu}>
                        {lieu}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="lieuDestination">Lieu de destination</Label>
                <Select onValueChange={(value) => setValue('lieuDestination', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner la destination" />
                  </SelectTrigger>
                  <SelectContent>
                    {destinations.map((lieu) => (
                      <SelectItem key={lieu} value={lieu}>
                        {lieu}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="description">Description du service *</Label>
            <Textarea
              id="description"
              {...register('description', { required: 'La description est requise' })}
              placeholder="Décrivez le service à fournir..."
              rows={3}
            />
            {errors.description && (
              <p className="text-sm text-red-600">{errors.description.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Détails financiers</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="montantHT">Montant HT (GNF) *</Label>
              <Input
                id="montantHT"
                type="number"
                step="1"
                {...register('montantHT', { required: 'Le montant HT est requis', min: 0 })}
                placeholder="0"
              />
              {errors.montantHT && (
                <p className="text-sm text-red-600">{errors.montantHT.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="dateValidite">Date de validité *</Label>
              <Input
                id="dateValidite"
                type="date"
                {...register('dateValidite', { required: 'La date de validité est requise' })}
              />
              {errors.dateValidite && (
                <p className="text-sm text-red-600">{errors.dateValidite.message}</p>
              )}
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="observations">Observations</Label>
            <Textarea
              id="observations"
              {...register('observations')}
              placeholder="Notes particulières..."
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
          Annuler
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Création...' : 'Créer le devis'}
        </Button>
      </div>
    </form>
  );
};
