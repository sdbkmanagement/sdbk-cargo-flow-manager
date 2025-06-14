
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  AlertTriangle, 
  Clock, 
  User,
  FileText,
  Calendar
} from 'lucide-react';

const alertesDemo = [
  {
    id: '1',
    chauffeur: 'Ibrahim Koné',
    document: 'Visite médicale',
    dateExpiration: new Date('2024-07-25'),
    joursRestants: 5,
    niveau: 'warning'
  },
  {
    id: '2',
    chauffeur: 'Aminata Traoré',
    document: 'Permis de conduire',
    dateExpiration: new Date('2024-12-30'),
    joursRestants: 160,
    niveau: 'info'
  },
  {
    id: '3',
    chauffeur: 'Seydou Ouattara',
    document: 'Formation sécurité',
    dateExpiration: new Date('2024-08-01'),
    joursRestants: 12,
    niveau: 'warning'
  },
  {
    id: '4',
    chauffeur: 'Fatou Diabaté',
    document: 'Carte d\'identité',
    dateExpiration: new Date('2024-07-20'),
    joursRestants: 0,
    niveau: 'danger'
  }
];

export const AlertesDocuments = () => {
  const getNiveauBadge = (niveau: string) => {
    const variants = {
      'info': { variant: 'secondary', text: 'Information', color: 'text-blue-600' },
      'warning': { variant: 'default', text: 'Attention', color: 'text-orange-600' },
      'danger': { variant: 'destructive', text: 'Urgent', color: 'text-red-600' }
    };

    const config = variants[niveau] || variants.info;
    
    return (
      <Badge variant={config.variant}>
        {config.text}
      </Badge>
    );
  };

  const getIconeNiveau = (niveau: string) => {
    if (niveau === 'danger') {
      return <AlertTriangle className="w-4 h-4 text-red-500" />;
    }
    if (niveau === 'warning') {
      return <Clock className="w-4 h-4 text-orange-500" />;
    }
    return <FileText className="w-4 h-4 text-blue-500" />;
  };

  const formatJoursRestants = (jours: number) => {
    if (jours === 0) return 'Expiré';
    if (jours < 0) return `Expiré depuis ${Math.abs(jours)} jours`;
    return `${jours} jours`;
  };

  return (
    <div className="space-y-6">
      {/* Résumé des alertes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Documents expirés</p>
                <p className="text-2xl font-bold text-red-600">1</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Expire sous 30 jours</p>
                <p className="text-2xl font-bold text-orange-600">2</p>
              </div>
              <Clock className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">À surveiller</p>
                <p className="text-2xl font-bold text-blue-600">1</p>
              </div>
              <FileText className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Liste des alertes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2 text-orange-500" />
            Alertes documents
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Niveau</TableHead>
                  <TableHead>Chauffeur</TableHead>
                  <TableHead>Document</TableHead>
                  <TableHead>Date d'expiration</TableHead>
                  <TableHead>Jours restants</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {alertesDemo
                  .sort((a, b) => {
                    const ordre = { 'danger': 1, 'warning': 2, 'info': 3 };
                    return ordre[a.niveau] - ordre[b.niveau];
                  })
                  .map((alerte) => (
                    <TableRow key={alerte.id} className={
                      alerte.niveau === 'danger' ? 'bg-red-50' :
                      alerte.niveau === 'warning' ? 'bg-orange-50' : ''
                    }>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {getIconeNiveau(alerte.niveau)}
                          {getNiveauBadge(alerte.niveau)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                            <User className="w-4 h-4" />
                          </div>
                          <span className="font-medium">{alerte.chauffeur}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <FileText className="w-4 h-4 text-gray-500" />
                          {alerte.document}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4 text-gray-500" />
                          {alerte.dateExpiration.toLocaleDateString('fr-FR')}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={
                          alerte.joursRestants <= 0 ? 'text-red-600 font-medium' :
                          alerte.joursRestants <= 30 ? 'text-orange-600 font-medium' :
                          'text-gray-600'
                        }>
                          {formatJoursRestants(alerte.joursRestants)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button variant="outline" size="sm">
                            Voir
                          </Button>
                          <Button variant="outline" size="sm">
                            Rappel
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
