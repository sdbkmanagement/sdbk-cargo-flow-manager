
import React from 'react';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
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

// Fonction helper pour mapper les rôles vers les types de base de données
const mapRoleToDbType = (role: string) => {
  const roleMapping: Record<string, string> = {
    'maintenance': 'maintenance',
    'administratif': 'administratif',
    'hsecq': 'hsecq',
    'obc': 'obc',
    'transport': 'transport',
    'rh': 'rh',
    'facturation': 'facturation',
    'direction': 'direction',
    'admin': 'admin',
    'transitaire': 'transport', // Fallback vers transport
    'directeur_exploitation': 'direction' // Fallback vers direction
  };
  
  return roleMapping[role] || 'transport';
};

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
      console.log('Creating user with Supabase Auth:', data);
      
      if (!data.password) {
        throw new Error('Le mot de passe est requis');
      }

      const mappedRole = mapRoleToDbType(data.role);

      // 1. Créer l'utilisateur via Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: data.email,
        password: data.password,
        user_metadata: {
          first_name: data.prenom,
          last_name: data.nom
        },
        email_confirm: true
      });

      if (authError) {
        throw new Error(`Impossible de créer le compte: ${authError.message}`);
      }

      if (!authData.user) {
        throw new Error('Aucun utilisateur créé');
      }

      // 2. Attendre que le trigger fonctionne
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 3. Mettre à jour le rôle
      const { error: updateError } = await supabase
        .from('users')
        .update({
          roles: [mappedRole],
          first_name: data.prenom,
          last_name: data.nom,
          status: data.statut === 'actif' ? 'active' : 'inactive',
          updated_at: new Date().toISOString()
        })
        .eq('id', authData.user.id);

      if (updateError) {
        // Nettoyer l'utilisateur auth en cas d'erreur
        await supabase.auth.admin.deleteUser(authData.user.id);
        throw new Error(`Erreur de configuration: ${updateError.message}`);
      }

      return authData.user;
    },
    onSuccess: () => {
      toast({
        title: "Utilisateur créé",
        description: "Le nouvel utilisateur a été créé avec succès."
      });
      onSuccess();
    },
    onError: (error: any) => {
      console.error('Creation error:', error);
      toast({
        title: "Erreur de création",
        description: error.message || "Impossible de créer l'utilisateur.",
        variant: "destructive"
      });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async (data: UserFormData) => {
      const mappedRole = mapRoleToDbType(data.role);
      
      const { error } = await supabase
        .from('users')
        .update({
          first_name: data.prenom,
          last_name: data.nom,
          roles: [mappedRole],
          status: data.statut === 'actif' ? 'active' : 'inactive',
          updated_at: new Date().toISOString()
        })
        .eq('id', user!.id);

      if (error) throw error;
    },
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
                <Label htmlFor="password">Mot de passe personnalisé *</Label>
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
                  placeholder="Saisissez un mot de passe sécurisé (min. 6 caractères)"
                  disabled={isLoading}
                />
                {errors.password && (
                  <p className="text-sm text-red-600">{errors.password.message}</p>
                )}
                <p className="text-xs text-gray-500">
                  Choisissez un mot de passe personnalisé pour cet utilisateur
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
            <div className="mt-4 p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-green-800">
                <strong>Authentification sécurisée :</strong> L'utilisateur pourra se connecter 
                immédiatement avec son email et le mot de passe que vous avez défini.
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
