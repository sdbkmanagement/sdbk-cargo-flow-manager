import React from 'react';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ROLES, ROLE_LABELS, MODULE_PERMISSIONS, MODULE_LABELS, type SystemUser } from '@/types/admin';
import { toast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { userService } from '@/services/admin/userService';

interface UserFormProps {
  user?: SystemUser;
  onSuccess: () => void;
}

interface UserFormData {
  email: string;
  nom: string;
  prenom: string;
  password?: string;
  role: string; // Rôle principal pour compatibilité
  roles: string[];
  module_permissions: string[];
  statut: 'actif' | 'inactif' | 'suspendu';
}

export const UserForm: React.FC<UserFormProps> = ({ user, onSuccess }) => {
  const isEdit = !!user;
  
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<UserFormData>({
    defaultValues: {
      email: user?.email || '',
      nom: user?.nom || '',
      prenom: user?.prenom || '',
      role: user?.roles?.[0] || user?.role || 'transport',
      roles: user?.roles || [user?.role] || ['transport'],
      module_permissions: user?.module_permissions || [],
      statut: user?.statut || 'actif'
    }
  });

  const createMutation = useMutation({
    mutationFn: async (data: UserFormData) => {
      console.log('Creating user:', data);
      // Assurer que le rôle principal est le premier des rôles
      const userData = {
        ...data,
        role: data.roles[0] || 'transport'
      };
      return userService.createUser(userData);
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
      const userData = {
        ...data,
        role: data.roles[0] || 'transport'
      };
      return userService.updateUser(user!.id, userData);
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

  const watchedRoles = watch('roles') || [];
  const watchedModulePermissions = watch('module_permissions') || [];
  const watchedStatut = watch('statut');
  const isLoading = createMutation.isPending || updateMutation.isPending;

  const handleRoleChange = (roleId: string, checked: boolean) => {
    const currentRoles = watchedRoles;
    if (checked) {
      setValue('roles', [...currentRoles, roleId]);
    } else {
      setValue('roles', currentRoles.filter(r => r !== roleId));
    }
  };

  const handleModulePermissionChange = (moduleId: string, checked: boolean) => {
    const currentPermissions = watchedModulePermissions;
    if (checked) {
      setValue('module_permissions', [...currentPermissions, moduleId]);
    } else {
      setValue('module_permissions', currentPermissions.filter(m => m !== moduleId));
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Informations personnelles</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
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
                  placeholder="Saisissez un mot de passe sécurisé (min. 6 caractères)"
                  disabled={isLoading}
                />
                {errors.password && (
                  <p className="text-sm text-red-600">{errors.password.message}</p>
                )}
              </div>
            )}

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
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Rôles de validation</CardTitle>
          <p className="text-sm text-muted-foreground">
            Sélectionnez les rôles permettant d'interagir avec les étapes du workflow de validation
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {ROLES.map((role) => (
              <div key={role} className="flex items-center space-x-2">
                <Checkbox
                  id={`role-${role}`}
                  checked={watchedRoles.includes(role)}
                  onCheckedChange={(checked) => handleRoleChange(role, !!checked)}
                  disabled={isLoading}
                />
                <Label htmlFor={`role-${role}`} className="text-sm">
                  {ROLE_LABELS[role] || role}
                </Label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Accès aux modules</CardTitle>
          <p className="text-sm text-muted-foreground">
            Sélectionnez les modules auxquels l'utilisateur aura un accès complet
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {MODULE_PERMISSIONS.map((module) => (
              <div key={module} className="flex items-center space-x-2">
                <Checkbox
                  id={`module-${module}`}
                  checked={watchedModulePermissions.includes(module)}
                  onCheckedChange={(checked) => handleModulePermissionChange(module, !!checked)}
                  disabled={isLoading}
                />
                <Label htmlFor={`module-${module}`} className="text-sm">
                  {MODULE_LABELS[module] || module}
                </Label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {!isEdit && (
        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Note :</strong> L'utilisateur pourra se connecter avec l'email et le mot de passe définis.
            Un profil sera automatiquement créé dans le système.
          </p>
        </div>
      )}

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
