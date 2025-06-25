
import React from 'react';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { adminService } from '@/services/admin';
import { ROLES, ROLE_LABELS, type SystemUser, type AppRole } from '@/types/admin';
import { toast } from '@/hooks/use-toast';

interface UserFormProps {
  user?: SystemUser;
  onSuccess: () => void;
}

interface UserFormData {
  email: string;
  nom: string;
  prenom: string;
  role: AppRole;
  statut: 'actif' | 'inactif' | 'suspendu';
}

export const UserForm: React.FC<UserFormProps> = ({ user, onSuccess }) => {
  const isEdit = !!user;
  
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<UserFormData>({
    defaultValues: {
      email: user?.email || '',
      nom: user?.nom || '',
      prenom: user?.prenom || '',
      role: user?.role || 'transport',
      statut: user?.statut || 'actif'
    }
  });

  const createMutation = useMutation({
    mutationFn: (data: UserFormData) => adminService.createUser({
      ...data,
      mot_de_passe_change: false
    }),
    onSuccess: () => {
      toast({
        title: "Utilisateur créé",
        description: "Le nouvel utilisateur a été créé avec succès."
      });
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de créer l'utilisateur.",
        variant: "destructive"
      });
    }
  });

  const updateMutation = useMutation({
    mutationFn: (data: UserFormData) => adminService.updateUser(user!.id, data),
    onSuccess: () => {
      toast({
        title: "Utilisateur modifié",
        description: "L'utilisateur a été modifié avec succès."
      });
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de modifier l'utilisateur.",
        variant: "destructive"
      });
    }
  });

  const onSubmit = (data: UserFormData) => {
    if (isEdit) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const watchedRole = watch('role');
  const watchedStatut = watch('statut');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="prenom">Prénom *</Label>
              <Input
                id="prenom"
                {...register('prenom', { required: 'Le prénom est requis' })}
                placeholder="Prénom de l'utilisateur"
              />
              {errors.prenom && (
                <p className="text-sm text-red-600">{errors.prenom.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="nom">Nom *</Label>
              <Input
                id="nom"
                {...register('nom', { required: 'Le nom est requis' })}
                placeholder="Nom de l'utilisateur"
              />
              {errors.nom && (
                <p className="text-sm text-red-600">{errors.nom.message}</p>
              )}
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                {...register('email', { 
                  required: 'L\'email est requis',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Format d\'email invalide'
                  }
                })}
                placeholder="email@sdbk.com"
              />
              {errors.email && (
                <p className="text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Rôle *</Label>
              <Select 
                value={watchedRole} 
                onValueChange={(value: AppRole) => setValue('role', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un rôle" />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((role) => (
                    <SelectItem key={role} value={role}>
                      {ROLE_LABELS[role]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="statut">Statut *</Label>
              <Select 
                value={watchedStatut} 
                onValueChange={(value: 'actif' | 'inactif' | 'suspendu') => setValue('statut', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="actif">Actif</SelectItem>
                  <SelectItem value="inactif">Inactif</SelectItem>
                  <SelectItem value="suspendu">Suspendu</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button 
          type="submit" 
          disabled={createMutation.isPending || updateMutation.isPending}
        >
          {createMutation.isPending || updateMutation.isPending ? 'Traitement...' : (isEdit ? 'Modifier' : 'Créer')}
        </Button>
      </div>
    </form>
  );
};
