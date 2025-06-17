
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Euro, 
  FileText, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  TrendingUp,
  Users,
  Calendar
} from 'lucide-react';

export const BillingDashboard = () => {
  // Données simulées - à remplacer par des données réelles depuis la base
  const stats = {
    totalFacture: 45760.50,
    facturesEnAttente: 12,
    facturesEnRetard: 3,
    facturesReglees: 28,
    totalDevis: 8,
    chiffreAffaireMois: 38420.00,
    topClients: [
      { nom: "Total Guinée", montant: 15650.00 },
      { nom: "CBG Bauxite", montant: 12300.00 },
      { nom: "SMB Mining", montant: 8970.00 }
    ]
  };

  const recentActivity = [
    { action: "Facture F2024-001 créée", date: "Il y a 2h", type: "success" },
    { action: "Paiement reçu - F2024-002", date: "Il y a 4h", type: "success" },
    { action: "Relance envoyée - F2024-003", date: "Il y a 1j", type: "warning" },
    { action: "Devis D2024-004 validé", date: "Il y a 2j", type: "info" }
  ];

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
            <div className="text-2xl font-bold">{stats.totalFacture.toLocaleString('fr-FR')} €</div>
            <p className="text-xs text-muted-foreground">+20.1% ce mois</p>
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
            <CardTitle className="text-sm font-medium">Factures réglées</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.facturesReglees}</div>
            <p className="text-xs text-muted-foreground">Ce mois</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chiffre d'affaires mensuel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Chiffre d'affaires mensuel
            </CardTitle>
            <CardDescription>Performance financière du mois en cours</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600 mb-2">
              {stats.chiffreAffaireMois.toLocaleString('fr-FR')} €
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Objectif mensuel</span>
                <span>45 000 €</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-600 h-2 rounded-full" 
                  style={{ width: `${(stats.chiffreAffaireMois / 45000) * 100}%` }}
                ></div>
              </div>
              <p className="text-xs text-muted-foreground">85% de l'objectif atteint</p>
            </div>
          </CardContent>
        </Card>

        {/* Top clients */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Top clients par montant
            </CardTitle>
            <CardDescription>Les clients les plus rentables ce mois</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.topClients.map((client, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    <span className="text-sm font-medium">{client.nom}</span>
                  </div>
                  <span className="text-sm font-bold">
                    {client.montant.toLocaleString('fr-FR')} €
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activités récentes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Activités récentes
          </CardTitle>
          <CardDescription>Dernières actions effectuées dans le module facturation</CardDescription>
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
