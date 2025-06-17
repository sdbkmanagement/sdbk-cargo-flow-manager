
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Search, 
  Filter, 
  Download, 
  Mail, 
  Eye, 
  Edit,
  MoreHorizontal,
  FileText
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const InvoiceList = () => {
  const [searchTerm, setSearchTerm] = useState('');

  // Données simulées - à remplacer par des données réelles
  const invoices = [
    {
      id: 'F2024-001',
      client: 'Total Guinée',
      mission: 'M2024-045',
      dateEmission: '2024-01-15',
      dateEcheance: '2024-02-15',
      montantHT: 5200.00,
      montantTTC: 6136.00,
      statut: 'en_attente',
      chauffeur: 'Mamadou Diallo',
      vehicule: 'CAM-001'
    },
    {
      id: 'F2024-002',
      client: 'CBG Bauxite',
      mission: 'M2024-046',
      dateEmission: '2024-01-14',
      dateEcheance: '2024-02-14',
      montantHT: 3800.00,
      montantTTC: 4484.00,
      statut: 'paye',
      chauffeur: 'Ibrahima Sow',
      vehicule: 'CAM-002'
    },
    {
      id: 'F2024-003',
      client: 'SMB Mining',
      mission: 'M2024-047',
      dateEmission: '2024-01-10',
      dateEcheance: '2024-02-10',
      montantHT: 4500.00,
      montantTTC: 5310.00,
      statut: 'en_retard',
      chauffeur: 'Fatou Keita',
      vehicule: 'CAM-003'
    }
  ];

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

  const filteredInvoices = invoices.filter(invoice =>
    invoice.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
    invoice.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    invoice.mission.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* En-tête et actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher une facture..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filtrer
          </Button>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
          <Button variant="outline" size="sm">
            <Mail className="h-4 w-4 mr-2" />
            Relance groupe
          </Button>
        </div>
      </div>

      {/* Tableau des factures */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Liste des factures
          </CardTitle>
          <CardDescription>
            Gestion de toutes vos factures émises
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>N° Facture</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Mission</TableHead>
                <TableHead>Date émission</TableHead>
                <TableHead>Échéance</TableHead>
                <TableHead>Montant HT</TableHead>
                <TableHead>Montant TTC</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInvoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-medium">{invoice.id}</TableCell>
                  <TableCell>{invoice.client}</TableCell>
                  <TableCell>{invoice.mission}</TableCell>
                  <TableCell>{new Date(invoice.dateEmission).toLocaleDateString('fr-FR')}</TableCell>
                  <TableCell>{new Date(invoice.dateEcheance).toLocaleDateString('fr-FR')}</TableCell>
                  <TableCell>{invoice.montantHT.toLocaleString('fr-FR')} €</TableCell>
                  <TableCell className="font-medium">{invoice.montantTTC.toLocaleString('fr-FR')} €</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(invoice.statut)}>
                      {getStatusLabel(invoice.statut)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem>
                          <Eye className="mr-2 h-4 w-4" />
                          Voir détails
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit className="mr-2 h-4 w-4" />
                          Modifier
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>
                          <Download className="mr-2 h-4 w-4" />
                          Télécharger PDF
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Mail className="mr-2 h-4 w-4" />
                          Envoyer par email
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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
