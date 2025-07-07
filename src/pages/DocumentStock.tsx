
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  FileText, 
  Search, 
  AlertTriangle,
  Calendar,
  BarChart3,
  Filter,
  Eye,
  Download,
  Trash2
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { documentService } from '@/services/documentService';
import { useToast } from '@/hooks/use-toast';

const DocumentStock = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const { toast } = useToast();

  const { data: documents = [], isLoading, refetch } = useQuery({
    queryKey: ['documents', 'all'],
    queryFn: () => documentService.getAll(),
    refetchInterval: 30000,
  });

  const { data: stats } = useQuery({
    queryKey: ['documents', 'stats'],
    queryFn: documentService.getStats,
    refetchInterval: 60000,
  });

  const filteredDocuments = useMemo(() => {
    return documents.filter(doc => {
      const matchesSearch = !searchTerm || 
        doc.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.entity_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.entity_id?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesType = !selectedType || doc.type === selectedType;
      const matchesStatus = !selectedStatus || doc.statut === selectedStatus;
      
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [documents, searchTerm, selectedType, selectedStatus]);

  const handleView = (document: any) => {
    window.open(document.url, '_blank');
  };

  const handleDownload = (document: any) => {
    const link = window.document.createElement('a');
    link.href = document.url;
    link.download = document.nom;
    link.click();
  };

  const handleDelete = async (document: any) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce document ?')) {
      return;
    }

    try {
      await documentService.deleteFile(document.url);
      await documentService.delete(document.id);
      
      toast({
        title: 'Document supprimé',
        description: 'Le document a été supprimé avec succès'
      });
      
      refetch();
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer le document',
        variant: 'destructive'
      });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getEntityTypeLabel = (entityType: string) => {
    const types = {
      'chauffeur': 'Chauffeur',
      'vehicule': 'Véhicule',
      'employe': 'Employé',
      'mission': 'Mission',
      'facture': 'Facture',
      'chargement': 'Chargement'
    };
    return types[entityType] || entityType;
  };

  const isExpiring = (document: any) => {
    if (!document.date_expiration) return false;
    const expirationDate = new Date(document.date_expiration);
    const today = new Date();
    const diffDays = Math.ceil((expirationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays <= 30 && diffDays >= 0;
  };

  const isExpired = (document: any) => {
    if (!document.date_expiration) return false;
    return new Date(document.date_expiration) < new Date();
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Chargement...</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Stock documentaire</h1>
          <p className="text-gray-600 mt-1">
            Gestion centralisée de tous les documents
          </p>
        </div>
      </div>

      {/* Statistiques */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total documents</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
                </div>
                <FileText className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Documents expirant</p>
                  <p className="text-2xl font-bold text-orange-600">{stats.expiringCount}</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Types différents</p>
                  <p className="text-2xl font-bold text-green-600">{Object.keys(stats.byType).length}</p>
                </div>
                <BarChart3 className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Statuts actifs</p>
                  <p className="text-2xl font-bold text-purple-600">{Object.keys(stats.byStatus).length}</p>
                </div>
                <Filter className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filtres et recherche */}
      <Card>
        <CardHeader>
          <CardTitle>Filtres</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Rechercher un document..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-3 py-2 border rounded-md"
            >
              <option value="">Tous les types</option>
              {stats && Object.keys(stats.byType).map(type => (
                <option key={type} value={type}>
                  {type} ({stats.byType[type]})
                </option>
              ))}
            </select>
            
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 border rounded-md"
            >
              <option value="">Tous les statuts</option>
              {stats && Object.keys(stats.byStatus).map(status => (
                <option key={status} value={status}>
                  {status} ({stats.byStatus[status]})
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Liste des documents */}
      <Card>
        <CardHeader>
          <CardTitle>
            Documents ({filteredDocuments.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Document</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Module</TableHead>
                  <TableHead>Entité</TableHead>
                  <TableHead>Taille</TableHead>
                  <TableHead>Date d'ajout</TableHead>
                  <TableHead>Expiration</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDocuments.map((document) => (
                  <TableRow key={document.id}>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <FileText className="w-4 h-4 text-blue-500" />
                        <span className="font-medium">{document.nom}</span>
                        {isExpired(document) && (
                          <AlertTriangle className="w-4 h-4 text-red-500" />
                        )}
                        {isExpiring(document) && !isExpired(document) && (
                          <AlertTriangle className="w-4 h-4 text-orange-500" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{document.type}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {getEntityTypeLabel(document.entity_type || '')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-600">{document.entity_id}</span>
                    </TableCell>
                    <TableCell>
                      {formatFileSize(document.taille)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3 text-gray-400" />
                        <span className="text-sm">
                          {new Date(document.created_at!).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {document.date_expiration ? (
                        <span className={`text-sm ${
                          isExpired(document) ? 'text-red-600 font-medium' :
                          isExpiring(document) ? 'text-orange-600 font-medium' :
                          'text-gray-600'
                        }`}>
                          {new Date(document.date_expiration).toLocaleDateString('fr-FR')}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-sm">Aucune</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={document.statut === 'valide' ? 'default' : 'destructive'}>
                        {document.statut}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline" 
                          size="sm"
                          onClick={() => handleView(document)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDownload(document)}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDelete(document)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DocumentStock;
