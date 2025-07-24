import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Plus, Search, Edit, Trash2, UserCheck, UserX, Key } from 'lucide-react';
import { userService } from '@/services/admin/userService';
import { OptimizedUserForm } from './OptimizedUserForm';
import { PasswordManagement } from './PasswordManagement';
import { ROLE_LABELS, MODULE_LABELS, type SystemUser } from '@/types/admin';
import { toast } from '@/hooks/use-toast';

export const UserManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<SystemUser | null>(null);
  const [passwordUser, setPasswordUser] = useState<SystemUser | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);

  const queryClient = useQueryClient();

  // Fetch users with better error handling
  const { data: users = [], isLoading, error } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      console.log('🔧 Fetching users from database...');
      try {
        const result = await userService.getUsers();
        console.log('✅ Users fetched successfully:', result);
        return result;
      } catch (error) {
        console.error('❌ Error fetching users:', error);
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const deleteUserMutation = useMutation({
    mutationFn: (userId: string) => userService.deleteUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast({
        title: "Utilisateur supprimé",
        description: "L'utilisateur a été supprimé avec succès."
      });
    },
    onError: (error: any) => {
      console.error('❌ Delete user error:', error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de supprimer l'utilisateur.",
        variant: "destructive"
      });
    }
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ userId, status }: { userId: string; status: SystemUser['statut'] }) => 
      userService.toggleUserStatus(userId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast({
        title: "Statut modifié",
        description: "Le statut de l'utilisateur a été modifié avec succès."
      });
    },
    onError: (error: any) => {
      console.error('❌ Toggle status error:', error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de modifier le statut de l'utilisateur.",
        variant: "destructive"
      });
    }
  });

  const resetPasswordMutation = useMutation({
    mutationFn: (userId: string) => userService.resetPassword(userId),
    onSuccess: () => {
      toast({
        title: "Mot de passe réinitialisé",
        description: "Un email de réinitialisation a été envoyé à l'utilisateur."
      });
    },
    onError: (error: any) => {
      console.error('❌ Reset password error:', error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de réinitialiser le mot de passe.",
        variant: "destructive"
      });
    }
  });

  // Filter users
  const filteredUsers = React.useMemo(() => {
    return users.filter(user => {
      const matchesSearch = !searchTerm || 
        user.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase());
      
      const userRoles = user.roles || [user.role];
      const matchesRole = roleFilter === 'all' || userRoles.includes(roleFilter);
      const matchesStatus = statusFilter === 'all' || user.statut === statusFilter;
      
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchTerm, roleFilter, statusFilter]);

  const getStatusBadge = (statut: SystemUser['statut']) => {
    switch (statut) {
      case 'actif':
        return <Badge className="bg-green-100 text-green-700 border-green-200">Actif</Badge>;
      case 'inactif':
        return <Badge className="bg-red-100 text-red-700 border-red-200">Inactif</Badge>;
      case 'suspendu':
        return <Badge className="bg-orange-100 text-orange-700 border-orange-200">Suspendu</Badge>;
      default:
        return <Badge variant="secondary">{statut}</Badge>;
    }
  };

  const getRolesBadges = (user: SystemUser) => {
    const roles = user.roles || [user.role];
    return roles.slice(0, 2).map(role => (
      <Badge key={role} variant="outline" className="text-xs">
        {ROLE_LABELS[role] || role}
      </Badge>
    ));
  };

  const getModulesBadges = (modulePermissions: string[] = []) => {
    return modulePermissions.slice(0, 2).map(module => (
      <Badge key={module} variant="secondary" className="text-xs">
        {MODULE_LABELS[module] || module}
      </Badge>
    ));
  };

  const handleCreateSuccess = () => {
    setIsCreateDialogOpen(false);
    queryClient.invalidateQueries({ queryKey: ['admin-users'] });
  };

  const handleEditSuccess = () => {
    setIsEditDialogOpen(false);
    setSelectedUser(null);
    queryClient.invalidateQueries({ queryKey: ['admin-users'] });
  };

  const handlePasswordManagement = (user: SystemUser) => {
    setPasswordUser(user);
    setIsPasswordDialogOpen(true);
  };

  if (error) {
    console.error('❌ User management error:', error);
    return (
      <div className="flex items-center justify-center py-8">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Erreur de connexion</CardTitle>
            <CardDescription>
              Impossible de se connecter à la base de données des utilisateurs.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => queryClient.invalidateQueries({ queryKey: ['admin-users'] })}
              variant="outline"
            >
              Réessayer
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Chargement des utilisateurs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Gestion des Utilisateurs</CardTitle>
              <CardDescription>
                Gérez les comptes utilisateurs, leurs rôles et permissions ({users.length} utilisateur{users.length > 1 ? 's' : ''})
              </CardDescription>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Nouvel utilisateur
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Créer un nouvel utilisateur</DialogTitle>
                  <DialogDescription>
                    Les comptes sont créés sans confirmation email requise.
                  </DialogDescription>
                </DialogHeader>
                <OptimizedUserForm onSuccess={handleCreateSuccess} />
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filtres */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par nom, prénom ou email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Filtrer par rôle" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les rôles</SelectItem>
                {Object.entries(ROLE_LABELS).map(([role, label]) => (
                  <SelectItem key={role} value={role}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Filtrer par statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="actif">Actif</SelectItem>
                <SelectItem value="inactif">Inactif</SelectItem>
                <SelectItem value="suspendu">Suspendu</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tableau */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Utilisateur</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Rôles</TableHead>
                  <TableHead>Modules</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{user.prenom} {user.nom}</div>
                        <div className="text-sm text-muted-foreground">
                          Créé le {new Date(user.created_at).toLocaleDateString('fr-FR')}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{user.email}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {getRolesBadges(user)}
                        {(user.roles || [user.role]).length > 2 && (
                          <Badge variant="secondary" className="text-xs">
                            +{(user.roles || [user.role]).length - 2}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {getModulesBadges(user.module_permissions)}
                        {user.module_permissions && user.module_permissions.length > 2 && (
                          <Badge variant="secondary" className="text-xs">
                            +{user.module_permissions.length - 2}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(user.statut)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            setSelectedUser(user);
                            setIsEditDialogOpen(true);
                          }}
                          title="Modifier l'utilisateur"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>

                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handlePasswordManagement(user)}
                          title="Gérer le mot de passe"
                        >
                          <Key className="h-3 w-3" />
                        </Button>

                        {user.statut === 'actif' ? (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => toggleStatusMutation.mutate({ userId: user.id, status: 'inactif' })}
                            title="Désactiver l'utilisateur"
                          >
                            <UserX className="h-3 w-3" />
                          </Button>
                        ) : (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => toggleStatusMutation.mutate({ userId: user.id, status: 'actif' })}
                            title="Activer l'utilisateur"
                          >
                            <UserCheck className="h-3 w-3" />
                          </Button>
                        )}

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700" title="Supprimer l'utilisateur">
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Supprimer l'utilisateur</AlertDialogTitle>
                              <AlertDialogDescription>
                                Êtes-vous sûr de vouloir supprimer l'utilisateur "{user.prenom} {user.nom}" ? 
                                Cette action est irréversible.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Annuler</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteUserMutation.mutate(user.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Supprimer
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredUsers.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              {users.length === 0 ? (
                <div>
                  <p className="mb-4">Aucun utilisateur trouvé dans la base de données.</p>
                  <Button 
                    onClick={() => setIsCreateDialogOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Créer le premier utilisateur
                  </Button>
                </div>
              ) : (
                "Aucun utilisateur trouvé avec les critères de recherche actuels."
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog d'édition */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Modifier l'utilisateur</DialogTitle>
            <DialogDescription>
              Modifiez les rôles et permissions de l'utilisateur
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <OptimizedUserForm 
              user={selectedUser} 
              onSuccess={handleEditSuccess}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog de gestion des mots de passe */}
      {passwordUser && (
        <PasswordManagement
          user={passwordUser}
          open={isPasswordDialogOpen}
          onOpenChange={setIsPasswordDialogOpen}
        />
      )}
    </div>
  );
};
