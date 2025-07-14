
import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ROLES, ROLE_LABELS, MODULE_PERMISSIONS, MODULE_LABELS, type SystemUser } from '@/types/admin';
import { toast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { userService } from '@/services/admin/userService';

interface OptimizedUserFormProps {
  user?: SystemUser;
  onSuccess: () => void;
}

export const OptimizedUserForm: React.FC<OptimizedUserFormProps> = ({ user, onSuccess }) => {
  const isEdit = !!user;
  const queryClient = useQueryClient();
  
  // État local optimisé
  const [formData, setFormData] = useState({
    email: user?.email || '',
    nom: user?.nom || '',
    prenom: user?.prenom || '',
    password: '',
    roles: user?.roles || ['transport'],
    module_permissions: user?.module_permissions || [],
    statut: user?.statut || 'actif' as const
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
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
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: "Erreur de création",
        description: error.message || "Impossible de créer l'utilisateur.",
        variant: "destructive"
      });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
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
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
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

  const isLoading = createMutation.isPending || updateMutation.isPending;

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleRoleToggle = (roleId: string, checked: boolean) => {
    const newRoles = checked 
      ? [...formData.roles, roleId]
      : formData.roles.filter(r => r !== roleId);
    handleInputChange('roles', newRoles);
  };

  const handleModuleToggle = (moduleId: string, checked: boolean) => {
    const newModules = checked 
      ? [...formData.module_permissions, moduleId]
      : formData.module_permissions.filter(m => m !== moduleId);
    handleInputChange('module_permissions', newModules);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isEdit && (!formData.password || formData.password.trim() === '')) {
      toast({
        title: "Erreur de validation",
        description: "Le mot de passe est requis pour créer un nouvel utilisateur.",
        variant: "destructive"
      });
      return;
    }

    if (isEdit) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Informations de base */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Informations utilisateur</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="prenom">Prénom *</Label>
            <Input
              id="prenom"
              value={formData.prenom}
              onChange={(e) => handleInputChange('prenom', e.target.value)}
              required
              disabled={isLoading}
            />
          </div>
          <div>
            <Label htmlFor="nom">Nom *</Label>
            <Input
              id="nom"
              value={formData.nom}
              onChange={(e) => handleInputChange('nom', e.target.value)}
              required
              disabled={isLoading}
            />
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              required
              disabled={isEdit || isLoading}
            />
          </div>
          {!isEdit && (
            <div className="md:col-span-2">
              <Label htmlFor="password">Mot de passe *</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                required
                disabled={isLoading}
                minLength={6}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Rôles de validation */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Rôles de validation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {ROLES.map((role) => (
              <div key={role} className="flex items-center space-x-2">
                <Checkbox
                  id={`role-${role}`}
                  checked={formData.roles.includes(role)}
                  onCheckedChange={(checked) => handleRoleToggle(role, !!checked)}
                  disabled={isLoading}
                />
                <Label htmlFor={`role-${role}`} className="text-sm font-normal">
                  {ROLE_LABELS[role] || role}
                </Label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Accès aux modules */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Accès aux modules</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {MODULE_PERMISSIONS.map((module) => (
              <div key={module} className="flex items-center space-x-2">
                <Checkbox
                  id={`module-${module}`}
                  checked={formData.module_permissions.includes(module)}
                  onCheckedChange={(checked) => handleModuleToggle(module, !!checked)}
                  disabled={isLoading}
                />
                <Label htmlFor={`module-${module}`} className="text-sm font-normal">
                  {MODULE_LABELS[module] || module}
                </Label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Boutons d'action */}
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
            isEdit ? 'Enregistrer' : 'Créer'
          )}
        </Button>
      </div>
    </form>
  );
};
