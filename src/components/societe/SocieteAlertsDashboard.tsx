import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  AlertTriangle, 
  Clock, 
  XCircle,
  Bell,
  ExternalLink,
  Calendar
} from 'lucide-react';
import { documentsSocieteService, DocumentSociete } from '@/services/documentsSociete';
import { format, differenceInDays } from 'date-fns';
import { fr } from 'date-fns/locale';

export const SocieteAlertsDashboard: React.FC = () => {
  const [documentsExpirant, setDocumentsExpirant] = useState<DocumentSociete[]>([]);
  const [documentsExpires, setDocumentsExpires] = useState<DocumentSociete[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAlerts();
  }, []);

  const loadAlerts = async () => {
    try {
      setLoading(true);
      const [expirant, expires] = await Promise.all([
        documentsSocieteService.getDocumentsExpirant(30),
        documentsSocieteService.getDocumentsExpires()
      ]);
      setDocumentsExpirant(expirant);
      setDocumentsExpires(expires);
    } catch (error) {
      console.error('Erreur chargement alertes:', error);
    } finally {
      setLoading(false);
    }
  };

  const getUrgencyBadge = (dateExpiration: string) => {
    const jours = differenceInDays(new Date(dateExpiration), new Date());

    if (jours < 0) {
      return <Badge variant="destructive">Expiré depuis {Math.abs(jours)}j</Badge>;
    } else if (jours <= 7) {
      return <Badge className="bg-red-500 text-white">Urgent - {jours}j</Badge>;
    } else if (jours <= 15) {
      return <Badge className="bg-orange-500 text-white">{jours} jours</Badge>;
    } else {
      return <Badge className="bg-amber-500 text-white">{jours} jours</Badge>;
    }
  };

  const renderDocumentRow = (doc: DocumentSociete, isExpired: boolean = false) => (
    <TableRow key={doc.id} className={isExpired ? 'bg-destructive/5' : ''}>
      <TableCell>
        <div>
          <p className="font-medium">{doc.nom}</p>
          <p className="text-sm text-muted-foreground">{doc.type_document}</p>
        </div>
      </TableCell>
      <TableCell className="hidden md:table-cell">
        <Badge variant="outline" style={{ borderColor: doc.categorie?.couleur }}>
          {doc.categorie?.nom || 'Non classé'}
        </Badge>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          {doc.date_expiration && format(new Date(doc.date_expiration), 'dd/MM/yyyy', { locale: fr })}
        </div>
      </TableCell>
      <TableCell>
        {doc.date_expiration && getUrgencyBadge(doc.date_expiration)}
      </TableCell>
      <TableCell>
        {doc.fichiers && doc.fichiers.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.open(doc.fichiers![0].url, '_blank')}
          >
            <ExternalLink className="h-4 w-4" />
          </Button>
        )}
      </TableCell>
    </TableRow>
  );

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[...Array(2)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-48 bg-muted rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Résumé des alertes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-full bg-red-100 dark:bg-red-900/30">
              <XCircle className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Documents expirés</p>
              <p className="text-2xl font-bold text-red-600">{documentsExpires.length}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/20">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-full bg-orange-100 dark:bg-orange-900/30">
              <AlertTriangle className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Expirent sous 7j</p>
              <p className="text-2xl font-bold text-orange-600">
                {documentsExpirant.filter(d => 
                  differenceInDays(new Date(d.date_expiration!), new Date()) <= 7
                ).length}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-full bg-amber-100 dark:bg-amber-900/30">
              <Clock className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Expirent sous 30j</p>
              <p className="text-2xl font-bold text-amber-600">{documentsExpirant.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Listes détaillées */}
      <Tabs defaultValue="expirant" className="w-full">
        <TabsList>
          <TabsTrigger value="expirant" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            À renouveler ({documentsExpirant.length})
          </TabsTrigger>
          <TabsTrigger value="expires" className="flex items-center gap-2">
            <XCircle className="h-4 w-4" />
            Expirés ({documentsExpires.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="expirant" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-amber-500" />
                Documents à renouveler (30 jours)
              </CardTitle>
              <CardDescription>
                Documents dont l'expiration approche et nécessitant un renouvellement
              </CardDescription>
            </CardHeader>
            <CardContent>
              {documentsExpirant.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">
                  Aucun document n'expire dans les 30 prochains jours
                </p>
              ) : (
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Document</TableHead>
                        <TableHead className="hidden md:table-cell">Catégorie</TableHead>
                        <TableHead>Expiration</TableHead>
                        <TableHead>Délai</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {documentsExpirant.map(doc => renderDocumentRow(doc))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expires" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <XCircle className="h-5 w-5" />
                Documents expirés
              </CardTitle>
              <CardDescription>
                Documents dont la date de validité est dépassée
              </CardDescription>
            </CardHeader>
            <CardContent>
              {documentsExpires.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">
                  Aucun document expiré
                </p>
              ) : (
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Document</TableHead>
                        <TableHead className="hidden md:table-cell">Catégorie</TableHead>
                        <TableHead>Date expiration</TableHead>
                        <TableHead>Retard</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {documentsExpires.map(doc => renderDocumentRow(doc, true))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
