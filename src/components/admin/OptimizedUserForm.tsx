
import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ROLES, ROLE_LABELS, MODULE_PERMISSIONS, MODULE_LABELS, type SystemUser } from '@/types/admin';
import { toast } from '@/hooks/use-toast';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { userService } from '@/services/admin/userService';

interface OptimizedUserFormProps {
  user?: SystemUser;
  onSuccess: () => void;
}

export const OptimizedUserForm: React.FC<OptimizedUserFormProps> = ({ user, onSuccess }) => {
  const isEdit = !!user;
  const queryClient = useQueryClient();
  const [showPassword, setShowPassword] = useState(false);
  
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
      console.log('🔧 Creating user with data:', data);
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
      console.error('❌ Create user error:', error);
      let errorMessage = "Impossible de créer l'utilisateur.";
      
      if (error.message?.includes('duplicate')) {
        errorMessage = "Un utilisateur avec cet email existe déjà.";
      } else if (error.message?.includes('permission')) {
        errorMessage = "Vous n'avez pas les permissions nécessaires.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Erreur de création",
        description: errorMessage,
        variant: "destructive"
      });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      console.log('🔧 Updating user with data:', data);
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
      console.error('❌ Update user error:', error);
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
    
    if (!formData.email || !formData.nom || !formData.prenom) {
      toast({
        title: "Erreur de validation",
        description: "Veuillez remplir tous les champs obligatoires.",
        variant: "destructive"
      });
      return;
    }

    if (!isEdit && (!formData.password || formData.password.trim() === '')) {
      toast({
        title: "Erreur de validation",
        description: "Veuillez définir un mot de passe pour le nouvel utilisateur.",
        variant: "destructive"
      });
      return;
    }

    if (formData.roles.length === 0) {
      toast({
        title: "Erreur de validation",
        description: "Veuillez sélectionner au moins un rôle.",
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
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6">
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
                placeholder="Prénom de l'utilisateur"
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
                placeholder="Nom de l'utilisateur"
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
                placeholder="email@example.com"
              />
            </div>
            
            {!isEdit && (
              <div className="md:col-span-2">
                <Label htmlFor="password">Mot de passe *</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    required
                    disabled={isLoading}
                    placeholder="Définir un mot de passe sécurisé"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            )}
            
            <div className="md:col-span-2">
              <Label htmlFor="statut">Statut</Label>
              <Select value={formData.statut} onValueChange={(value) => handleInputChange('statut', value)}>
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
          </CardContent>
        </Card>

        {/* Rôles de validation */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Rôles de validation *</CardTitle>
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
                  <Label htmlFor={`role-${role}`} className="text-sm font-normal cursor-pointer">
                    {ROLE_LABELS[role] || role}
                  </Label>
                </div>
              ))}
            </div>
            {formData.roles.length === 0 && (
              <p className="text-sm text-red-600 mt-2">Veuillez sélectionner au moins un rôle</p>
            )}
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
                  <Label htmlFor={`module-${module}`} className="text-sm font-normal cursor-pointer">
                    {MODULE_LABELS[module] || module}
                  </Label>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Boutons d'action */}
        <div className="flex justify-end gap-3 pt-4">
          <Button 
            type="submit" 
            disabled={isLoading}
            className="min-w-[120px] bg-blue-600 hover:bg-blue-700"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isEdit ? 'Modification...' : 'Création...'}
              </>
            ) : (
              isEdit ? 'Enregistrer' : 'Créer l\'utilisateur'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};
