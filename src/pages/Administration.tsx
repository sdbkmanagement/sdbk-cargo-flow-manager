
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Users, Shield, Activity, AlertTriangle } from 'lucide-react';
import { UserManagement } from '@/components/admin/UserManagement';
import { RolePermissionManagement } from '@/components/admin/RolePermissionManagement';
import { AuditLogs } from '@/components/admin/AuditLogs';
import { AdminStats } from '@/components/admin/AdminStats';
import { CreateAdminButton } from '@/components/admin/CreateAdminButton';

const Administration = () => {
  const { user, hasRole } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  // Si aucun utilisateur connecté, afficher le bouton de création admin
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Shield className="h-12 w-12 text-blue-500 mx-auto mb-4" />
            <CardTitle>Configuration initiale</CardTitle>
            <CardDescription>
              Créez votre premier compte administrateur pour commencer à utiliser le système.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <CreateAdminButton />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Vérifier si l'utilisateur est admin
  if (!hasRole('admin')) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <AlertTriangle className="h-12 w-12 text-orange-500 mx-auto mb-4" />
            <CardTitle>Accès non autorisé</CardTitle>
            <CardDescription>
              Vous devez avoir le rôle "Admin Système" pour accéder à cette section.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Administration & Gestion des accès
          </h1>
          <p className="text-gray-600 mt-2">
            Gestion des utilisateurs, rôles, permissions et sécurité du système
          </p>
        </div>
        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
          Admin Système
        </Badge>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Vue d'ensemble
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Utilisateurs
          </TabsTrigger>
          <TabsTrigger value="roles" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Rôles & Permissions
          </TabsTrigger>
          <TabsTrigger value="audit" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Audit & Logs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <AdminStats />
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <UserManagement />
        </TabsContent>

        <TabsContent value="roles" className="space-y-6">
          <RolePermissionManagement />
        </TabsContent>

        <TabsContent value="audit" className="space-y-6">
          <AuditLogs />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Administration;
