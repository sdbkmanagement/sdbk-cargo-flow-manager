
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Shield, Save } from 'lucide-react';
import { adminService } from '@/services/admin';
import { ROLES, ROLE_LABELS, MODULES, MODULE_LABELS, PERMISSIONS, PERMISSION_LABELS } from '@/types/admin';
import { toast } from '@/hooks/use-toast';

interface RolePermission {
  id: string;
  role: string;
  module: string;
  permission: string;
  created_at: string;
}

export const RolePermissionManagement = () => {
  const [selectedRole, setSelectedRole] = useState<string>('transport');
  const queryClient = useQueryClient();

  const { data: allPermissions = [], isLoading } = useQuery({
    queryKey: ['role-permissions'],
    queryFn: () => adminService.getRolePermissions(),
  });

  const { data: rolePermissions = [] } = useQuery({
    queryKey: ['role-permissions', selectedRole],
    queryFn: () => adminService.getPermissionsByRole(selectedRole),
    enabled: !!selectedRole,
  });

  const updatePermissionsMutation = useMutation({
    mutationFn: ({ role, module, permissions }: { 
      role: string; 
      module: string; 
      permissions: string[] 
    }) => adminService.updateRolePermissions(role, module, permissions),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['role-permissions'] });
      toast({
        title: "Permissions mises à jour",
        description: "Les permissions du rôle ont été mises à jour avec succès."
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour les permissions.",
        variant: "destructive"
      });
    }
  });

  const getPermissionsForModule = (module: string): string[] => {
    return (rolePermissions as RolePermission[])
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
      hsecq: 'bg-indigo-100 text-indigo-700 border-indigo-200',
      obc: 'bg-cyan-100 text-cyan-700 border-cyan-200',
      administratif: 'bg-gray-100 text-gray-700 border-gray-200'
    };
    return colors[role] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  if (isLoading) {
    return <div>Chargement des permissions...</div>;
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
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px]">Module</TableHead>
                    {PERMISSIONS.map(permission => (
                      <TableHead key={permission} className="text-center min-w-[120px]">
                        <div className="flex flex-col items-center gap-1">
                          <Badge variant="outline" className="text-xs">
                            {PERMISSION_LABELS[permission] || permission}
                          </Badge>
                        </div>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {MODULES.map(module => {
                    const modulePermissions = getPermissionsForModule(module);
                    
                    return (
                      <TableRow key={module}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">
                              {MODULE_LABELS[module] || module}
                            </Badge>
                          </div>
                        </TableCell>
                        {PERMISSIONS.map(permission => (
                          <TableCell key={permission} className="text-center">
                            <Checkbox
                              checked={modulePermissions.includes(permission)}
                              onCheckedChange={(checked) => 
                                handlePermissionChange(module, permission, checked as boolean)
                              }
                              disabled={updatePermissionsMutation.isPending}
                            />
                          </TableCell>
                        ))}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Résumé des permissions pour le rôle sélectionné */}
            <Card className="bg-slate-50">
              <CardHeader>
                <CardTitle className="text-lg">
                  Résumé des permissions - {ROLE_LABELS[selectedRole] || selectedRole}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {MODULES.map(module => {
                    const modulePermissions = getPermissionsForModule(module);
                    
                    if (modulePermissions.length === 0) return null;
                    
                    return (
                      <div key={module} className="space-y-2">
                        <h4 className="font-medium text-sm">
                          {MODULE_LABELS[module] || module}
                        </h4>
                        <div className="flex flex-wrap gap-1">
                          {modulePermissions.map(permission => (
                            <Badge 
                              key={permission} 
                              variant="outline" 
                              className="text-xs"
                            >
                              {PERMISSION_LABELS[permission] || permission}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                {(rolePermissions as RolePermission[]).length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    Aucune permission configurée pour ce rôle.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
