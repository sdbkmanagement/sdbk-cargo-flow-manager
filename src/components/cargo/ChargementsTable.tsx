
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Edit, Trash2, FileText, Search, Filter } from 'lucide-react';
import { chargementsService } from '@/services/chargements';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface ChargementsTableProps {
  chargements: any[];
  onEdit: (chargement: any) => void;
  hasWritePermission: boolean;
  onRefresh: () => void;
}

export const ChargementsTable = ({ 
  chargements, 
  onEdit, 
  hasWritePermission, 
  onRefresh 
}: ChargementsTableProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const getStatusBadge = (status: string) => {
    const styles = {
      charge: 'bg-yellow-100 text-yellow-800',
      livre: 'bg-green-100 text-green-800',
      annule: 'bg-red-100 text-red-800'
    };
    
    const labels = {
      charge: 'Chargé',
      livre: 'Livré',
      annule: 'Annulé'
    };

    return (
      <Badge className={styles[status as keyof typeof styles]}>
        {labels[status as keyof typeof labels]}
      </Badge>
    );
  };

  const getTypeBadge = (type: string) => {
    const styles = {
      hydrocarbures: 'bg-blue-100 text-blue-800',
      bauxite: 'bg-orange-100 text-orange-800'
    };

    return (
      <Badge className={styles[type as keyof typeof styles]}>
        {type === 'hydrocarbures' ? 'Hydrocarbures' : 'Bauxite'}
      </Badge>
    );
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce chargement ?')) {
      return;
    }

    try {
      await chargementsService.delete(id);
      toast.success('Chargement supprimé avec succès');
      onRefresh();
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      toast.error('Erreur lors de la suppression du chargement');
    }
  };

  const filteredChargements = chargements.filter(chargement => {
    const matchesSearch = 
      chargement.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
      chargement.client_nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      chargement.lieu_chargement.toLowerCase().includes(searchTerm.toLowerCase()) ||
      chargement.lieu_livraison.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = !statusFilter || chargement.statut === statusFilter;
    const matchesType = !typeFilter || chargement.type_chargement === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Liste des chargements</span>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 w-64"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Tous</SelectItem>
                <SelectItem value="charge">Chargé</SelectItem>
                <SelectItem value="livre">Livré</SelectItem>
                <SelectItem value="annule">Annulé</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Tous</SelectItem>
                <SelectItem value="hydrocarbures">Hydrocarbures</SelectItem>
                <SelectItem value="bauxite">Bauxite</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Numéro</TableHead>
              <TableHead>Mission</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Volume/Poids</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Véhicule</TableHead>
              <TableHead>Chauffeur</TableHead>
              <TableHead>Date chargement</TableHead>
              <TableHead>Statut</TableHead>
              {hasWritePermission && <TableHead>Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredChargements.map((chargement) => (
              <TableRow key={chargement.id}>
                <TableCell className="font-medium">{chargement.numero}</TableCell>
                <TableCell>{chargement.mission?.numero}</TableCell>
                <TableCell>{getTypeBadge(chargement.type_chargement)}</TableCell>
                <TableCell>
                  {chargement.volume_poids} {chargement.unite_mesure}
                </TableCell>
                <TableCell>{chargement.client_nom}</TableCell>
                <TableCell>
                  {chargement.vehicule && (
                    <div className="text-sm">
                      <div className="font-medium">{chargement.vehicule.numero}</div>
                      <div className="text-gray-500">
                        {chargement.vehicule.marque} {chargement.vehicule.modele}
                      </div>
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  {chargement.chauffeur && (
                    <div className="text-sm">
                      {chargement.chauffeur.prenom} {chargement.chauffeur.nom}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  {format(new Date(chargement.date_heure_chargement), 'dd/MM/yyyy HH:mm', { locale: fr })}
                </TableCell>
                <TableCell>{getStatusBadge(chargement.statut)}</TableCell>
                {hasWritePermission && (
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(chargement)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(chargement.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {filteredChargements.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            Aucun chargement trouvé
          </div>
        )}
      </CardContent>
    </Card>
  );
};
