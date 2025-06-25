
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Truck, Users, FileText, BarChart3 } from 'lucide-react';

const Index = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-full">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Bienvenue dans SDBK Cargo Flow Manager
        </h1>
        <p className="text-gray-600">
          Bonjour {user?.prenom} {user?.nom}, vous êtes connecté en tant que {user?.role}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Flotte</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">45</div>
            <p className="text-xs text-muted-foreground">
              Véhicules actifs
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Chauffeurs</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">28</div>
            <p className="text-xs text-muted-foreground">
              Chauffeurs disponibles
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Missions</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">
              Missions en cours
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Performance</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">94%</div>
            <p className="text-xs text-muted-foreground">
              Taux de réussite
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Alertes récentes</CardTitle>
            <CardDescription>
              Notifications importantes du système
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center p-3 bg-orange-50 rounded-lg border border-orange-200">
                <div className="flex-1">
                  <p className="text-sm font-medium">Maintenance programmée</p>
                  <p className="text-xs text-muted-foreground">Véhicule TRK-001 - Échéance dans 2 jours</p>
                </div>
              </div>
              <div className="flex items-center p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex-1">
                  <p className="text-sm font-medium">Nouvelle mission</p>
                  <p className="text-xs text-muted-foreground">Transport vers Dakar - À affecter</p>
                </div>
              </div>
              <div className="flex items-center p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="flex-1">
                  <p className="text-sm font-medium">Formation terminée</p>
                  <p className="text-xs text-muted-foreground">3 chauffeurs certifiés HSE</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Accès rapide</CardTitle>
            <CardDescription>
              Fonctionnalités disponibles selon votre rôle
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {user?.role === 'admin' && (
                <p className="text-sm text-green-600 font-medium">
                  ✓ Accès administrateur - Tous les modules disponibles
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Utilisez la navigation latérale pour accéder aux différents modules.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Index;
