
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Euro, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  TrendingUp,
  Users,
  Calendar,
  Calculator
} from 'lucide-react';
import { billingService } from '@/services/billing';
import { toast } from '@/hooks/use-toast';

export const BillingDashboard = () => {
  const [stats, setStats] = useState({
    totalFacture: 0,
    facturesEnAttente: 0,
    facturesEnRetard: 0,
    facturesReglees: 0,
    totalDevis: 0,
    chiffreAffaireMois: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const data = await billingService.getStats();
      setStats(data);
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les statistiques.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const recentActivity = [
    { action: "Nouvelles factures créées", date: "Disponibles dans l'onglet Factures", type: "info" },
    { action: "Nouveaux devis créés", date: "Disponibles dans l'onglet Devis", type: "info" },
    { action: "Système connecté à la base de données", date: "Toutes les données sont sauvegardées", type: "success" }
  ];

  if (loading) {
    return <div className="flex justify-center p-8">Chargement du tableau de bord...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Statistiques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total facturé</CardTitle>
            <Euro className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalFacture.toLocaleString('fr-FR')} GNF</div>
            <p className="text-xs text-muted-foreground">Toutes factures confondues</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Factures en attente</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.facturesEnAttente}</div>
            <p className="text-xs text-muted-foreground">À traiter</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Factures en retard</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.facturesEnRetard}</div>
            <p className="text-xs text-muted-foreground">Relance requise</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Devis créés</CardTitle>
            <Calculator className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.totalDevis}</div>
            <p className="text-xs text-muted-foreground">Total des devis</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chiffre d'affaires mensuel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Chiffre d'affaires
            </CardTitle>
            <CardDescription>Performance financière actuelle</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600 mb-2">
              {stats.chiffreAffaireMois.toLocaleString('fr-FR')} GNF
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Factures créées</span>
                <span>{stats.facturesEnAttente + stats.facturesReglees}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Devis en attente</span>
                <span>{stats.totalDevis}</span>
              </div>
              <p className="text-xs text-muted-foreground">Module facturation opérationnel</p>
            </div>
          </CardContent>
        </Card>

        {/* Répartition des statuts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Répartition des factures
            </CardTitle>
            <CardDescription>État actuel des factures</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                  <span className="text-sm font-medium">En attente</span>
                </div>
                <span className="text-sm font-bold">{stats.facturesEnAttente}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <span className="text-sm font-medium">Réglées</span>
                </div>
                <span className="text-sm font-bold">{stats.facturesReglees}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-500"></div>
                  <span className="text-sm font-medium">En retard</span>
                </div>
                <span className="text-sm font-bold">{stats.facturesEnRetard}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activités récentes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            État du système
          </CardTitle>
          <CardDescription>Module facturation connecté à la base de données</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentActivity.map((activity, index) => (
              <div key={index} className="flex items-center justify-between py-2 border-b last:border-b-0">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${
                    activity.type === 'success' ? 'bg-green-500' :
                    activity.type === 'warning' ? 'bg-yellow-500' :
                    'bg-blue-500'
                  }`}></div>
                  <span className="text-sm">{activity.action}</span>
                </div>
                <span className="text-xs text-muted-foreground">{activity.date}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
