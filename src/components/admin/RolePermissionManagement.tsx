
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield } from 'lucide-react';

export const RolePermissionManagement = () => {
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
          <div className="text-center py-8 text-muted-foreground">
            <p>La gestion des permissions sera implémentée prochainement.</p>
            <p className="text-sm mt-2">
              Actuellement, les rôles sont gérés directement lors de la création des utilisateurs.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
