
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  CreditCard, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Mail,
  Phone,
  MoreHorizontal
} from 'lucide-react';

export const PaymentTracking = () => {
  // Données simulées pour le suivi des paiements
  const payments = [
    {
      id: 'F2024-001',
      client: 'Total Guinée',
      montant: 6136.00,
      dateEcheance: '2024-02-15',
      statut: 'en_attente',
      joursRetard: 0,
      derniereRelance: null,
      modePaiement: 'virement'
    },
    {
      id: 'F2024-003',
      client: 'SMB Mining',
      montant: 5310.00,
      dateEcheance: '2024-02-10',
      statut: 'en_retard',
      joursRetard: 5,
      derniereRelance: '2024-02-12',
      modePaiement: 'cheque'
    },
    {
      id: 'F2024-002',
      client: 'CBG Bauxite',
      montant: 4484.00,
      dateEcheance: '2024-02-14',
      statut: 'paye',
      joursRetard: 0,
      derniereRelance: null,
      modePaiement: 'virement'
    }
  ];

  // Statistiques des paiements
  const stats = {
    enAttente: payments.filter(p => p.statut === 'en_attente').length,
    enRetard: payments.filter(p => p.statut === 'en_retard').length,
    payes: payments.filter(p => p.statut === 'paye').length,
    montantEnAttente: payments.filter(p => p.statut === 'en_attente').reduce((sum, p) => sum + p.montant, 0),
    montantEnRetard: payments.filter(p => p.statut === 'en_retard').reduce((sum, p) => sum + p.montant, 0),
    tauxRecouvrement: 85 // Pourcentage calculé
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paye': return 'bg-green-100 text-green-800';
      case 'en_attente': return 'bg-yellow-100 text-yellow-800';
      case 'en_retard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'paye': return 'Payé';
      case 'en_attente': return 'En attente';
      case 'en_retard': return 'En retard';
      default: return status;
    }
  };

  const sendReminder = (invoiceId: string) => {
    console.log(`Envoi de relance pour la facture ${invoiceId}`);
    // Logique d'envoi de relance à implémenter
  };

  return (
    <div className="space-y-6">
      {/* Statistiques de paiement */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En attente</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.enAttente}</div>
            <p className="text-xs text-muted-foreground">
              {stats.montantEnAttente.toLocaleString('fr-FR')} € en attente
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En retard</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.enRetard}</div>
            <p className="text-xs text-muted-foreground">
              {stats.montantEnRetard.toLocaleString('fr-FR')} € en retard
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Payés</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.payes}</div>
            <p className="text-xs text-muted-foreground">Ce mois</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taux de recouvrement</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.tauxRecouvrement}%</div>
            <Progress value={stats.tauxRecouvrement} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Tableau de suivi des paiements */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Suivi des paiements
          </CardTitle>
          <CardDescription>
            Statut et relances des factures émises
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Facture</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Montant</TableHead>
                <TableHead>Échéance</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Retard</TableHead>
                <TableHead>Dernière relance</TableHead>
                <TableHead>Mode paiement</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell className="font-medium">{payment.id}</TableCell>
                  <TableCell>{payment.client}</TableCell>
                  <TableCell>{payment.montant.toLocaleString('fr-FR')} €</TableCell>
                  <TableCell>{new Date(payment.dateEcheance).toLocaleDateString('fr-FR')}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(payment.statut)}>
                      {getStatusLabel(payment.statut)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {payment.joursRetard > 0 ? (
                      <span className="text-red-600 font-medium">
                        {payment.joursRetard} jour(s)
                      </span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {payment.derniereRelance ? 
                      new Date(payment.derniereRelance).toLocaleDateString('fr-FR') : 
                      '-'
                    }
                  </TableCell>
                  <TableCell className="capitalize">{payment.modePaiement}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {payment.statut !== 'paye' && (
                        <>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => sendReminder(payment.id)}
                            title="Envoyer une relance"
                          >
                            <Mail className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" title="Appeler le client">
                            <Phone className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
