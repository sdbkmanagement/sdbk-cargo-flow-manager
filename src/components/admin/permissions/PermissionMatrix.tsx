
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { MODULES, MODULE_LABELS, PERMISSIONS, PERMISSION_LABELS } from '@/types/admin';

interface PermissionMatrixProps {
  selectedRole: string;
  rolePermissions: Array<{
    id: string;
    role: string;
    module: string;
    permission: string;
  }>;
  onPermissionChange: (module: string, permission: string, checked: boolean) => void;
  isUpdating: boolean;
}

export const PermissionMatrix: React.FC<PermissionMatrixProps> = ({
  selectedRole,
  rolePermissions,
  onPermissionChange,
  isUpdating
}) => {
  const getPermissionsForModule = (module: string): string[] => {
    return rolePermissions
      .filter(p => p.module === module)
      .map(p => p.permission);
  };

  return (
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
                        onPermissionChange(module, permission, checked as boolean)
                      }
                      disabled={isUpdating}
                    />
                  </TableCell>
                ))}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};
