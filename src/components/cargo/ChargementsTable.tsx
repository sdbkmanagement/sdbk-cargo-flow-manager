import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Search, Filter, Download, Package } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { ChargementActions } from './ChargementActions';
import { exportChargementsToCSV } from '@/utils/chargementsExport';

interface ChargementsTableProps {
  data: any[];
  onEdit: (chargement: any) => void;
  hasWritePermission: boolean;
  onRefresh: () => Promise<void>;
  onFiltersChange: (filters: any) => void;
}

const getStatutBadgeVariant = (statut: string) => {
  switch (statut) {
    case 'charge':
      return 'info';
    case 'livre':
      return 'success';
    case 'annule':
      return 'error';
    default:
      return 'secondary';
  }
};

const getStatutLabel = (statut: string) => {
  switch (statut) {
    case 'charge':
      return 'Chargé';
    case 'livre':
      return 'Livré';
    case 'annule':
      return 'Annulé';
    default:
      return statut;
  }
};

export const ChargementsTable = ({ data, onEdit, hasWritePermission, onRefresh, onFiltersChange }: ChargementsTableProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statutFilter, setStatutFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const filteredChargements = data?.filter(chargement => {
    const matchesSearch = 
      chargement.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
      chargement.client_nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      chargement.lieu_chargement.toLowerCase().includes(searchTerm.toLowerCase()) ||
      chargement.lieu_livraison.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatut = statutFilter === 'all' || chargement.statut === statutFilter;
    const matchesType = typeFilter === 'all' || chargement.type_chargement === typeFilter;

    return matchesSearch && matchesStatut && matchesType;
  });

  const handleExport = () => {
    if (filteredChargements && filteredChargements.length > 0) {
      exportChargementsToCSV(filteredChargements);
      toast({
        title: "Export réussi",
        description: "Le fichier CSV a été téléchargé avec succès.",
      });
    } else {
      toast({
        title: "Aucune donnée",
        description: "Aucun chargement à exporter.",
        variant: "destructive",
      });
    }
  };

  const handleRefresh = () => {
    onRefresh();
    toast({
      title: "Données actualisées",
      description: "La liste des chargements a été rechargée.",
    });
  };

  // Update filters when they change
  React.useEffect(() => {
    onFiltersChange({
      search: searchTerm,
      statut: statutFilter === 'all' ? undefined : statutFilter,
      type_chargement: typeFilter === 'all' ? undefined : typeFilter
    });
  }, [searchTerm, statutFilter, typeFilter, onFiltersChange]);

  return (
    <div className="space-y-4">
      {/* Filtres */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle className="flex items-center space-x-2">
              <Filter className="w-5 h-5" />
              <span>Filtres et recherche</span>
            </CardTitle>
            <Button onClick={handleRefresh} variant="outline" size="sm">
              Actualiser
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
              <Input
                placeholder="Rechercher par numéro, client, lieu..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={statutFilter} onValueChange={setStatutFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrer par statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="charge">Chargé</SelectItem>
                <SelectItem value="livre">Livré</SelectItem>
                <SelectItem value="annule">Annulé</SelectItem>
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrer par type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                <SelectItem value="hydrocarbures">Hydrocarbures</SelectItem>
                <SelectItem value="bauxite">Bauxite</SelectItem>
              </SelectContent>
            </Select>

            <Button onClick={handleExport} variant="outline" className="w-full">
              <Download className="w-4 h-4 mr-2" />
              Exporter
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tableau */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Numéro</TableHead>
                  <TableHead>Mission</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Volume/Poids</TableHead>
                  <TableHead>Véhicule</TableHead>
                  <TableHead>Chauffeur</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Date chargement</TableHead>
                  <TableHead>Statut</TableHead>
                  {hasWritePermission && <TableHead>Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredChargements?.map((chargement) => (
                  <TableRow key={chargement.id}>
                    <TableCell className="font-medium">
                      {chargement.numero}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{chargement.missions?.numero}</div>
                        <div className="text-sm text-gray-500">
                          {chargement.missions?.site_depart} → {chargement.missions?.site_arrivee}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {chargement.type_chargement}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {chargement.volume_poids} {chargement.unite_mesure}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{chargement.vehicules?.immatriculation}</div>
                        <div className="text-sm text-gray-500">
                          {chargement.vehicules?.marque} {chargement.vehicules?.modele}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {chargement.chauffeurs?.prenom} {chargement.chauffeurs?.nom}
                    </TableCell>
                    <TableCell>{chargement.client_nom}</TableCell>
                    <TableCell>
                      {format(new Date(chargement.date_heure_chargement), 'dd/MM/yyyy HH:mm', { locale: fr })}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatutBadgeVariant(chargement.statut) as any}>
                        {getStatutLabel(chargement.statut)}
                      </Badge>
                    </TableCell>
                    {hasWritePermission && (
                      <TableCell>
                        <ChargementActions chargement={chargement} />
                      </TableCell>
                    )}
                  </TableRow>
                ))}
                {filteredChargements?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={hasWritePermission ? 10 : 9} className="text-center py-8">
                      <div className="text-gray-500">
                        <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>Aucun chargement trouvé</p>
                        <p className="text-sm">Créez votre premier chargement pour commencer</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
