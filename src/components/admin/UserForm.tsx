
import React from 'react';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { InfoIcon, Shield } from 'lucide-react';
import { userService } from '@/services/userService';
import { ROLE_LABELS, VALIDATION_ROLES, type User, type UserRole, type CreateUserData, type UpdateUserData } from '@/types/user';
import { toast } from '@/hooks/use-toast';

interface UserFormProps {
  user?: User;
  onSuccess: () => void;
}

interface UserFormData {
  first_name: string;
  last_name: string;
  email: string;
  password?: string;
  roles: UserRole[];
  status: 'active' | 'inactive';
}

export const UserForm: React.FC<UserFormProps> = ({ user, onSuccess }) => {
  const isEdit = !!user;
  
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<UserFormData>({
    defaultValues: {
      first_name: user?.first_name || '',
      last_name: user?.last_name || '',
      email: user?.email || '',
      password: '',
      roles: user?.roles || [],
      status: user?.status || 'active'
    }
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateUserData) => userService.createUser(data),
    onSuccess: () => {
      toast({
        title: "Utilisateur créé",
        description: "Le nouvel utilisateur a été créé avec succès. Il peut maintenant se connecter."
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
    mutationFn: (data: UpdateUserData) => userService.updateUser(user!.id, data),
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
      const updateData: UpdateUserData = {
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email,
        roles: data.roles,
        status: data.status
      };
      if (data.password && data.password.trim()) {
        updateData.password = data.password;
      }
      updateMutation.mutate(updateData);
    } else {
      if (!data.password || data.password.length < 6) {
        toast({
          title: "Erreur",
          description: "Le mot de passe doit contenir au moins 6 caractères.",
          variant: "destructive"
        });
        return;
      }
      
      const createData: CreateUserData = {
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email,
        password: data.password,
        roles: data.roles,
        status: data.status
      };
      createMutation.mutate(createData);
    }
  };

  const watchedRoles = watch('roles');
  const watchedStatus = watch('status');

  const handleRoleChange = (role: UserRole, checked: boolean) => {
    const currentRoles = watchedRoles || [];
    if (checked) {
      setValue('roles', [...currentRoles, role]);
    } else {
      setValue('roles', currentRoles.filter(r => r !== role));
    }
  };

  const isValidationRole = (role: UserRole) => VALIDATION_ROLES.includes(role);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {!isEdit && (
        <Alert>
          <InfoIcon className="h-4 w-4" />
          <AlertDescription>
            Le compte sera immédiatement actif après création. L'utilisateur pourra se connecter avec l'email et le mot de passe définis.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Informations personnelles</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name">Prénom *</Label>
              <Input
                id="first_name"
                {...register('first_name', { required: 'Le prénom est requis' })}
                placeholder="Prénom"
              />
              {errors.first_name && (
                <p className="text-sm text-red-600">{errors.first_name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="last_name">Nom *</Label>
              <Input
                id="last_name"
                {...register('last_name', { required: 'Le nom est requis' })}
                placeholder="Nom"
              />
              {errors.last_name && (
                <p className="text-sm text-red-600">{errors.last_name.message}</p>
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

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="password">
                {isEdit ? 'Nouveau mot de passe (laisser vide pour ne pas changer)' : 'Mot de passe *'}
              </Label>
              <Input
                id="password"
                type="password"
                {...register('password', { 
                  required: isEdit ? false : 'Le mot de passe est requis',
                  minLength: {
                    value: 6,
                    message: 'Le mot de passe doit contenir au moins 6 caractères'
                  }
                })}
                placeholder="••••••••"
              />
              {errors.password && (
                <p className="text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Statut *</Label>
              <Select 
                value={watchedStatus} 
                onValueChange={(value: 'active' | 'inactive') => setValue('status', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Actif</SelectItem>
                  <SelectItem value="inactive">Inactif</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Rôles métiers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(ROLE_LABELS).map(([role, label]) => (
              <div key={role} className="flex items-center space-x-2">
                <Checkbox
                  id={role}
                  checked={watchedRoles?.includes(role as UserRole) || false}
                  onCheckedChange={(checked) => handleRoleChange(role as UserRole, checked as boolean)}
                />
                <Label htmlFor={role} className="flex items-center gap-2">
                  {isValidationRole(role as UserRole) && <Shield className="h-4 w-4 text-purple-600" />}
                  <span className={role === 'admin' ? 'font-semibold text-blue-600' : ''}>
                    {label}
                  </span>
                  {role === 'admin' && <span className="text-xs text-blue-500">(Droits complets)</span>}
                  {isValidationRole(role as UserRole) && <span className="text-xs text-purple-500">(Validation)</span>}
                </Label>
              </div>
            ))}
          </div>
          
          <Alert className="mt-4">
            <Shield className="h-4 w-4" />
            <AlertDescription>
              Les rôles avec l'icône bouclier (Maintenance, Administratif, HSECQ, OBC) 
              donnent accès au workflow de validation interservices.
            </AlertDescription>
          </Alert>
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
