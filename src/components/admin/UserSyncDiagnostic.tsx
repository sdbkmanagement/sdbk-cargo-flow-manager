
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { userSyncDiagnostic } from '@/utils/userSyncDiagnostic';
import { RefreshCw, AlertTriangle, CheckCircle, Trash2 } from 'lucide-react';

export const UserSyncDiagnostic: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [diagnostic, setDiagnostic] = useState<any>(null);
  const [cleanupResult, setCleanupResult] = useState<any>(null);

  const runDiagnostic = async () => {
    setIsLoading(true);
    setDiagnostic(null);
    setCleanupResult(null);
    
    try {
      const result = await userSyncDiagnostic.diagnoseUserSync();
      setDiagnostic(result);
    } catch (error) {
      console.error('Erreur diagnostic:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const cleanupUsers = async () => {
    setIsLoading(true);
    setCleanupResult(null);
    
    try {
      const result = await userSyncDiagnostic.cleanupUsers();
      setCleanupResult(result);
      
      // Relancer le diagnostic après nettoyage
      if (result.success) {
        await runDiagnostic();
      }
    } catch (error) {
      console.error('Erreur nettoyage:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5" />
          Diagnostic de Synchronisation des Utilisateurs
        </CardTitle>
        <CardDescription>
          Vérifiez et corrigez les problèmes de synchronisation entre auth.users et la table users
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button 
            onClick={runDiagnostic}
            disabled={isLoading}
            variant="outline"
          >
            {isLoading ? (
              <RefreshCw className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Lancer le diagnostic
          </Button>
          
          {diagnostic?.syncIssues?.length > 0 && (
            <Button 
              onClick={cleanupUsers}
              disabled={isLoading}
              variant="destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Nettoyer les utilisateurs
            </Button>
          )}
        </div>

        {cleanupResult && (
          <Alert className={cleanupResult.success ? "border-green-500" : "border-red-500"}>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {cleanupResult.success ? (
                <span className="text-green-600">{cleanupResult.message}</span>
              ) : (
                <span className="text-red-600">Erreur: {cleanupResult.error}</span>
              )}
            </AlertDescription>
          </Alert>
        )}

        {diagnostic && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">{diagnostic.stats?.totalDbUsers || 0}</div>
                  <p className="text-sm text-muted-foreground">Total utilisateurs DB</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-green-600">{diagnostic.stats?.validUsers || 0}</div>
                  <p className="text-sm text-muted-foreground">Utilisateurs valides</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-red-600">{diagnostic.stats?.syncIssues || 0}</div>
                  <p className="text-sm text-muted-foreground">Problèmes de sync</p>
                </CardContent>
              </Card>
            </div>

            {diagnostic.validUsers && diagnostic.validUsers.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    Utilisateurs Valides
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {diagnostic.validUsers.map((user: any) => (
                      <div key={user.email} className="flex items-center justify-between p-2 border rounded">
                        <span>{user.email}</span>
                        <Badge variant={user.synced ? "default" : "secondary"}>
                          {user.synced ? "Synchronisé" : "ID différent"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {diagnostic.syncIssues && diagnostic.syncIssues.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                    Problèmes de Synchronisation
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {diagnostic.syncIssues.map((issue: any) => (
                      <div key={issue.email} className="p-2 border rounded border-red-200">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{issue.email}</span>
                          <Badge variant="destructive">{issue.issue}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{issue.details}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
