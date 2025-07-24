
import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, EyeOff, Copy, RefreshCw } from 'lucide-react';
import { userService } from '@/services/admin/userService';
import { toast } from '@/hooks/use-toast';
import { SystemUser } from '@/types/admin';

interface PasswordManagementProps {
  user: SystemUser;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const PasswordManagement: React.FC<PasswordManagementProps> = ({
  user,
  open,
  onOpenChange
}) => {
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [action, setAction] = useState<'reset' | 'update'>('reset');

  const resetPasswordMutation = useMutation({
    mutationFn: (userId: string) => userService.resetPassword(userId),
    onSuccess: (password) => {
      setGeneratedPassword(password);
      toast({
        title: "Mot de passe réinitialisé",
        description: "Un nouveau mot de passe a été généré automatiquement."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de réinitialiser le mot de passe.",
        variant: "destructive"
      });
    }
  });

  const updatePasswordMutation = useMutation({
    mutationFn: ({ userId, password }: { userId: string; password: string }) => 
      userService.updateUserPassword(userId, password),
    onSuccess: () => {
      setNewPassword('');
      onOpenChange(false);
      toast({
        title: "Mot de passe modifié",
        description: "Le mot de passe a été modifié avec succès."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de modifier le mot de passe.",
        variant: "destructive"
      });
    }
  });

  const handleResetPassword = () => {
    setAction('reset');
    setShowConfirmDialog(true);
  };

  const handleUpdatePassword = () => {
    if (!newPassword || newPassword.length < 6) {
      toast({
        title: "Erreur de validation",
        description: "Le mot de passe doit contenir au moins 6 caractères.",
        variant: "destructive"
      });
      return;
    }
    setAction('update');
    setShowConfirmDialog(true);
  };

  const confirmAction = () => {
    if (action === 'reset') {
      resetPasswordMutation.mutate(user.id);
    } else {
      updatePasswordMutation.mutate({ userId: user.id, password: newPassword });
    }
    setShowConfirmDialog(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copié",
      description: "Le mot de passe a été copié dans le presse-papiers."
    });
  };

  const isLoading = resetPasswordMutation.isPending || updatePasswordMutation.isPending;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Gestion du mot de passe</DialogTitle>
            <DialogDescription>
              Modifier le mot de passe pour {user.prenom} {user.nom}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Générer un nouveau mot de passe automatiquement */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Réinitialisation automatique</CardTitle>
                <CardDescription>
                  Générer automatiquement un nouveau mot de passe sécurisé
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={handleResetPassword}
                  disabled={isLoading}
                  className="w-full"
                  variant="outline"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Générer un nouveau mot de passe
                </Button>
                
                {generatedPassword && (
                  <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-green-800">Nouveau mot de passe :</span>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => copyToClipboard(generatedPassword)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="mt-1 font-mono text-sm bg-white p-2 rounded border">
                      {generatedPassword}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Définir un mot de passe personnalisé */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Mot de passe personnalisé</CardTitle>
                <CardDescription>
                  Définir un mot de passe spécifique
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">Nouveau mot de passe</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Saisir un nouveau mot de passe (min. 6 caractères)"
                      disabled={isLoading}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                
                <Button 
                  onClick={handleUpdatePassword}
                  disabled={isLoading || !newPassword}
                  className="w-full"
                >
                  Modifier le mot de passe
                </Button>
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmation */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la modification</AlertDialogTitle>
            <AlertDialogDescription>
              {action === 'reset' 
                ? "Êtes-vous sûr de vouloir générer un nouveau mot de passe automatiquement ?"
                : "Êtes-vous sûr de vouloir modifier le mot de passe de cet utilisateur ?"
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={confirmAction}>
              Confirmer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
