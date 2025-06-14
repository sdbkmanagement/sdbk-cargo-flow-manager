
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { User } from 'lucide-react';
import { UseFormReturn } from 'react-hook-form';

interface PersonalInfoStepProps {
  form: UseFormReturn<any>;
}

export const PersonalInfoStep = ({ form }: PersonalInfoStepProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <User className="w-5 h-5 mr-2" />
          Informations personnelles
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="nom"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nom *</FormLabel>
                <FormControl>
                  <Input placeholder="Nom de famille" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="prenom"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Prénom *</FormLabel>
                <FormControl>
                  <Input placeholder="Prénom" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="dateNaissance"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date de naissance *</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="telephone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Téléphone *</FormLabel>
                <FormControl>
                  <Input placeholder="+225 XX XX XX XX XX" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="email@exemple.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="adresse"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Adresse</FormLabel>
                <FormControl>
                  <Input placeholder="Adresse complète" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="ville"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ville</FormLabel>
                <FormControl>
                  <Input placeholder="Ville" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="codePostal"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Code postal</FormLabel>
                <FormControl>
                  <Input placeholder="Code postal" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </CardContent>
    </Card>
  );
};
