
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, AlertTriangle, Calendar, Download } from 'lucide-react';

import { vehiculesService } from '@/services/vehicules';
import type { Database } from '@/integrations/supabase/types';

type Vehicule = Database['public']['Tables']['vehicules']['Row'];
type DocumentVehicule = Database['public']['Tables']['documents_vehicules']['Row'];

interface DocumentsTabProps {
  vehicles: Vehicule[];
}

export const DocumentsTab = ({ vehicles }: DocumentsTabProps) => {
  const [selectedVehicle, setSelectedVehicle] = useState<string>('');

  const { data: allDocuments = [] } = useQuery({
    queryKey: ['vehicle-documents'],
    queryFn: async () => {
      const allDocs = await Promise.all(
        vehicles.map(async (vehicle) => {
          const docs = await vehiculesService.getDocuments(vehicle.id);
          return docs.map(doc => ({ ...doc, vehicule: vehicle }));
        })
      );
      return allDocs.flat();
    },
    enabled: vehicles.length > 0
  });

  const filteredDocuments = selectedVehicle 
    ? allDocuments.filter((doc: any) => doc.vehicule.id === selectedVehicle)
    : allDocuments;

  const expiredDocuments = allDocuments.filter((doc: any) => 
    doc.date_expiration && new Date(doc.date_expiration) < new Date()
  );

  const expiringDocuments = allDocuments.filter((doc: any) => 
    doc.date_expiration && 
    new Date(doc.date_expiration) > new Date() &&
    new Date(doc.date_expiration) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  );

  const getDocumentStatusBadge = (doc: any) => {
    if (!doc.date_expiration) return <Badge variant="secondary">Permanent</Badge>;
    
    const expDate = new Date(doc.date_expiration);
    const now = new Date();
    const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    if (expDate < now) {
      return <Badge variant="destructive">Expiré</Badge>;
    } else if (expDate <= thirtyDaysFromNow) {
      return <Badge className="bg-orange-100 text-orange-800">À renouveler</Badge>;
    } else {
      return <Badge className="bg-green-100 text-green-800">Valide</Badge>;
    }
  };

  const getDocumentTypeLabel = (type: string) => {
    const types = {
      'carte_grise': 'Carte grise',
      'assurance': 'Assurance',
      'visite_technique': 'Visite technique',
      'vignette': 'Vignette',
      'adr': 'Certificat ADR',
      'autre': 'Autre'
    };
    return types[type as keyof typeof types] || type;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Gestion des documents</h2>
          <p className="text-muted-foreground">
            Suivi des documents et alertes d'expiration
          </p>
        </div>
      </div>

      {/* Alertes documents */}
      {(expiredDocuments.length > 0 || expiringDocuments.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {expiredDocuments.length > 0 && (
            <Card className="border-red-200 bg-red-50">
              <CardHeader>
                <CardTitle className="text-red-800 flex items-center">
                  <AlertTriangle className="mr-2 h-5 w-5" />
                  Documents expirés
                </CardTitle>
                <CardDescription className="text-red-700">
                  {expiredDocuments.length} document(s) expiré(s)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {expiredDocuments.slice(0, 3).map((doc: any) => (
                    <div key={doc.id} className="flex items-center justify-between p-2 bg-white rounded border">
                      <div className="text-sm">
                        <p className="font-medium">{doc.vehicule.numero}</p>
                        <p className="text-muted-foreground">{getDocumentTypeLabel(doc.type)}</p>
                      </div>
                      <Badge variant="destructive" className="text-xs">
                        Expiré le {new Date(doc.date_expiration).toLocaleDateString()}
                      </Badge>
                    </div>
                  ))}
                  {expiredDocuments.length > 3 && (
                    <p className="text-sm text-muted-foreground">
                      Et {expiredDocuments.length - 3} autre(s)...
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {expiringDocuments.length > 0 && (
            <Card className="border-orange-200 bg-orange-50">
              <CardHeader>
                <CardTitle className="text-orange-800 flex items-center">
                  <Calendar className="mr-2 h-5 w-5" />
                  À renouveler prochainement
                </CardTitle>
                <CardDescription className="text-orange-700">
                  {expiringDocuments.length} document(s) à renouveler dans les 30 jours
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {expiringDocuments.slice(0, 3).map((doc: any) => (
                    <div key={doc.id} className="flex items-center justify-between p-2 bg-white rounded border">
                      <div className="text-sm">
                        <p className="font-medium">{doc.vehicule.numero}</p>
                        <p className="text-muted-foreground">{getDocumentTypeLabel(doc.type)}</p>
                      </div>
                      <Badge className="bg-orange-100 text-orange-800 text-xs">
                        Expire le {new Date(doc.date_expiration).toLocaleDateString()}
                      </Badge>
                    </div>
                  ))}
                  {expiringDocuments.length > 3 && (
                    <p className="text-sm text-muted-foreground">
                      Et {expiringDocuments.length - 3} autre(s)...
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Filtre par véhicule */}
      <div className="flex items-center space-x-4">
        <div className="flex-1 max-w-xs">
          <Select value={selectedVehicle} onValueChange={setSelectedVehicle}>
            <SelectTrigger>
              <SelectValue placeholder="Tous les véhicules" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Tous les véhicules</SelectItem>
              {vehicles.map((vehicle) => (
                <SelectItem key={vehicle.id} value={vehicle.id}>
                  {vehicle.numero} - {vehicle.immatriculation}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tableau des documents */}
      <Card>
        <CardHeader>
          <CardTitle>Documents des véhicules</CardTitle>
          <CardDescription>
            {filteredDocuments.length} document(s) trouvé(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Véhicule</TableHead>
                <TableHead>Type de document</TableHead>
                <TableHead>Nom du fichier</TableHead>
                <TableHead>Date d'expiration</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDocuments.map((document: any) => (
                <TableRow key={document.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{document.vehicule.numero}</p>
                      <p className="text-sm text-muted-foreground">
                        {document.vehicule.immatriculation}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <FileText className="mr-2 h-4 w-4" />
                      {getDocumentTypeLabel(document.type)}
                    </div>
                  </TableCell>
                  <TableCell>{document.nom}</TableCell>
                  <TableCell>
                    {document.date_expiration 
                      ? new Date(document.date_expiration).toLocaleDateString()
                      : 'Permanent'
                    }
                  </TableCell>
                  <TableCell>
                    {getDocumentStatusBadge(document)}
                  </TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4" />
                    </Button>
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
