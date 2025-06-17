
import React from 'react';
import { useForm } from 'react-hook-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';

interface QuoteFormProps {
  onClose: () => void;
}

interface QuoteFormData {
  clientNom: string;
  clientSociete: string;
  clientEmail: string;
  description: string;
  montantHT: number;
  dateValidite: string;
  observations: string;
}

export const QuoteForm = ({ onClose }: QuoteFormProps) => {
  const { register, handleSubmit, formState: { errors } } = useForm<QuoteFormData>();

  const onSubmit = (data: QuoteFormData) => {
    const TVA_RATE = 0.18;
    const montantTVA = data.montantHT * TVA_RATE;
    const montantTTC = data.montantHT + montantTVA;

    const quoteData = {
      ...data,
      montantTVA,
      montantTTC,
      statut: 'en_attente',
      numero: `D${new Date().getFullYear()}-${String(Date.now()).slice(-3)}`,
      dateCreation: new Date().toISOString().split('T')[0]
    };

    console.log('Données du devis:', quoteData);
    
    toast({
      title: "Devis créé avec succès",
      description: `Le devis ${quoteData.numero} a été créé et envoyé au client.`,
    });

    onClose();
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
          <CardTitle>Détails du devis</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
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
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="montantHT">Montant HT *</Label>
              <Input
                id="montantHT"
                type="number"
                step="0.01"
                {...register('montantHT', { required: 'Le montant HT est requis', min: 0 })}
                placeholder="0.00"
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
        <Button type="button" variant="outline" onClick={onClose}>
          Annuler
        </Button>
        <Button type="submit">
          Créer le devis
        </Button>
      </div>
    </form>
  );
};
