
import React from 'react';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { adminService } from '@/services/admin';
import { ROLES, ROLE_LABELS, type SystemUser } from '@/types/admin';
import { toast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface UserFormProps {
  user?: SystemUser;
  onSuccess: () => void;
}

interface UserFormData {
  email: string;
  nom: string;
  prenom: string;
  password?: string;
  role: string;
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
    mutationFn: async (data: UserFormData) => {
      console.log('UserForm: Starting user creation with Supabase Auth:', data);
      try {
        const result = await adminService.createUser({
          email: data.email,
          nom: data.nom,
          prenom: data.prenom,
          role: data.role as any,
          statut: data.statut,
          password: data.password!
        });
        console.log('UserForm: User creation successful:', result);
        return result;
      } catch (error) {
        console.error('UserForm: User creation failed:', error);
        throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: "Utilisateur créé",
        description: "Le nouvel utilisateur a été créé avec succès via Supabase Auth."
      });
      onSuccess();
    },
    onError: (error: any) => {
      console.error('UserForm: Creation error:', error);
      toast({
        title: "Erreur de création",
        description: error.message || "Impossible de créer l'utilisateur.",
        variant: "destructive"
      });
    }
  });

  const updateMutation = useMutation({
    mutationFn: (data: UserFormData) => adminService.updateUser(user!.id, {
      nom: data.nom,
      prenom: data.prenom,
      role: data.role as any,
      statut: data.statut,
      email: data.email,
      id: user!.id,
      created_at: user!.created_at,
      updated_at: user!.updated_at,
      created_by: user!.created_by
    }),
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
    console.log('UserForm: Form submitted with data:', data);
    if (isEdit) {
      updateMutation.mutate(data);
    } else {
      if (!data.password || data.password.trim() === '') {
        toast({
          title: "Erreur de validation",
          description: "Le mot de passe est requis pour créer un nouvel utilisateur.",
          variant: "destructive"
        });
        return;
      }
      createMutation.mutate(data);
    }
  };

  const watchedRole = watch('role');
  const watchedStatut = watch('statut');
  const isLoading = createMutation.isPending || updateMutation.isPending;

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
                disabled={isLoading}
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
                disabled={isLoading}
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
                disabled={isEdit || isLoading}
              />
              {errors.email && (
                <p className="text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            {!isEdit && (
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="password">Mot de passe *</Label>
                <Input
                  id="password"
                  type="password"
                  {...register('password', { 
                    required: 'Le mot de passe est requis',
                    minLength: {
                      value: 6,
                      message: 'Le mot de passe doit contenir au moins 6 caractères'
                    }
                  })}
                  placeholder="Saisissez le mot de passe (min. 6 caractères)"
                  disabled={isLoading}
                />
                {errors.password && (
                  <p className="text-sm text-red-600">{errors.password.message}</p>
                )}
                <p className="text-xs text-gray-500">
                  L'utilisateur pourra changer son mot de passe après sa première connexion
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="role">Rôle *</Label>
              <Select 
                value={watchedRole} 
                onValueChange={(value: string) => setValue('role', value)}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un rôle" />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((role) => (
                    <SelectItem key={role} value={role}>
                      {ROLE_LABELS[role as keyof typeof ROLE_LABELS] || role}
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
                disabled={isLoading}
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

          {!isEdit && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Authentification Supabase :</strong> Un compte sera créé automatiquement 
                avec l'email et le mot de passe fournis. L'utilisateur pourra se connecter 
                immédiatement après la création.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button 
          type="submit" 
          disabled={isLoading}
          className="min-w-[120px]"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {isEdit ? 'Modification...' : 'Création...'}
            </>
          ) : (
            isEdit ? 'Modifier' : 'Créer'
          )}
        </Button>
      </div>
    </form>
  );
};
