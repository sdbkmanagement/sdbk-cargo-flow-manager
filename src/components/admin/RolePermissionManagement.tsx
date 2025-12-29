
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Shield } from 'lucide-react';
import { rolePermissionService } from '@/services/admin/rolePermissionService';
import { ROLES, ROLE_LABELS } from '@/types/admin';
import { PermissionMatrix } from './permissions/PermissionMatrix';
import { PermissionSummary } from './permissions/PermissionSummary';
import { toast } from '@/hooks/use-toast';

export const RolePermissionManagement = () => {
  const [selectedRole, setSelectedRole] = useState<string>('transport');
  const queryClient = useQueryClient();

  const { data: allPermissions = [], isLoading } = useQuery({
    queryKey: ['role-permissions'],
    queryFn: () => rolePermissionService.getRolePermissions(),
  });

  const { data: rolePermissions = [] } = useQuery({
    queryKey: ['role-permissions', selectedRole],
    queryFn: () => rolePermissionService.getPermissionsByRole(selectedRole),
    enabled: !!selectedRole,
  });

  const updatePermissionsMutation = useMutation({
    mutationFn: ({ role, module, permissions }: { 
      role: string; 
      module: string; 
      permissions: string[] 
    }) => rolePermissionService.updateRolePermissions(role, module, permissions),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['role-permissions'] });
      toast({
        title: "Permissions mises à jour",
        description: "Les permissions du rôle ont été mises à jour avec succès."
      });
    },
    onError: (error: any) => {
      console.error('Erreur mise à jour permissions:', error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de mettre à jour les permissions.",
        variant: "destructive"
      });
    }
  });

  const getPermissionsForModule = (module: string): string[] => {
    return rolePermissions
      .filter(p => p.module === module)
      .map(p => p.permission);
  };

  const handlePermissionChange = (module: string, permission: string, checked: boolean) => {
    const currentPermissions = getPermissionsForModule(module);
    let newPermissions: string[];

    if (checked) {
      newPermissions = [...currentPermissions, permission];
    } else {
      newPermissions = currentPermissions.filter(p => p !== permission);
    }

    updatePermissionsMutation.mutate({
      role: selectedRole,
      module,
      permissions: newPermissions
    });
  };

  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      admin: 'bg-red-100 text-red-700 border-red-200',
      direction: 'bg-purple-100 text-purple-700 border-purple-200',
      transport: 'bg-blue-100 text-blue-700 border-blue-200',
      maintenance: 'bg-green-100 text-green-700 border-green-200',
      rh: 'bg-orange-100 text-orange-700 border-orange-200',
      facturation: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      hseq: 'bg-indigo-100 text-indigo-700 border-indigo-200',
      obc: 'bg-cyan-100 text-cyan-700 border-cyan-200',
      administratif: 'bg-gray-100 text-gray-700 border-gray-200'
    };
    return colors[role] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Chargement des permissions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Gestion des Rôles & Permissions
          </CardTitle>
          <CardDescription>
            Configurez les permissions d'accès pour chaque rôle système
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Sélection du rôle */}
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">
                  Sélectionner un rôle à configurer :
                </label>
                <Select value={selectedRole} onValueChange={(value: string) => setSelectedRole(value)}>
                  <SelectTrigger className="w-full max-w-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES.map((role) => (
                      <SelectItem key={role} value={role}>
                        <div className="flex items-center gap-2">
                          <Badge className={getRoleColor(role)}>
                            {ROLE_LABELS[role] || role}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Matrice des permissions */}
            <PermissionMatrix
              selectedRole={selectedRole}
              rolePermissions={rolePermissions}
              onPermissionChange={handlePermissionChange}
              isUpdating={updatePermissionsMutation.isPending}
            />

            {/* Résumé des permissions */}
            <PermissionSummary
              selectedRole={selectedRole}
              rolePermissions={rolePermissions}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
