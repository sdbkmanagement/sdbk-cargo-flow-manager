
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MODULES, MODULE_LABELS, PERMISSION_LABELS, ROLE_LABELS } from '@/types/admin';

interface PermissionSummaryProps {
  selectedRole: string;
  rolePermissions: Array<{
    id: string;
    role: string;
    module: string;
    permission: string;
  }>;
}

export const PermissionSummary: React.FC<PermissionSummaryProps> = ({
  selectedRole,
  rolePermissions
}) => {
  const getPermissionsForModule = (module: string): string[] => {
    return rolePermissions
      .filter(p => p.module === module)
      .map(p => p.permission);
  };

  return (
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
        
        {rolePermissions.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Aucune permission configurée pour ce rôle.
          </p>
        )}
      </CardContent>
    </Card>
  );
};
