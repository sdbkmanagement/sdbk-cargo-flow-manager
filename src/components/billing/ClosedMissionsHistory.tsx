import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Search, FileCheck, Truck, User, MapPin, Calendar, Eye } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MissionsHistoryExport } from '@/components/missions/MissionsHistoryExport';

interface Mission {
  id: string;
  numero: string;
  type_transport: string;
  site_depart: string;
  site_arrivee: string;
  statut: string;
  facturation_statut: string;
  created_at: string;
  updated_at: string;
  vehicule: { immatriculation: string } | null;
  chauffeur: { nom: string; prenom: string } | null;
}

interface BonLivraison {
  id: string;
  numero: string;
  destination: string;
  produit: string;
  quantite_prevue: number;
  quantite_livree: number | null;
  montant_total: number | null;
  date_emission: string;
  statut: string;
}

export const ClosedMissionsHistory = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);

  const { data: missions = [], isLoading } = useQuery({
    queryKey: ['closed-missions-billing'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('missions')
        .select(`
          id,
          numero,
          type_transport,
          site_depart,
          site_arrivee,
          statut,
          facturation_statut,
          created_at,
          updated_at,
          vehicule:vehicules(immatriculation),
          chauffeur:chauffeurs(nom, prenom)
        `)
        .in('statut', ['cloture', 'terminee'])
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return data as Mission[];
    }
  });

  const { data: bonsLivraison = [] } = useQuery({
    queryKey: ['bons-livraison-mission', selectedMission?.id],
    queryFn: async () => {
      if (!selectedMission?.id) return [];
      const { data, error } = await supabase
        .from('bons_livraison')
        .select('*')
        .eq('mission_id', selectedMission.id)
        .order('date_emission', { ascending: false });

      if (error) throw error;
      return data as BonLivraison[];
    },
    enabled: !!selectedMission?.id
  });

  const filteredMissions = missions.filter(mission => {
    const searchLower = searchTerm.toLowerCase();
    return (
      mission.numero.toLowerCase().includes(searchLower) ||
      mission.site_depart.toLowerCase().includes(searchLower) ||
      mission.site_arrivee.toLowerCase().includes(searchLower) ||
      mission.vehicule?.immatriculation?.toLowerCase().includes(searchLower) ||
      mission.chauffeur?.nom?.toLowerCase().includes(searchLower)
    );
  });

  const getFacturationBadge = (statut: string) => {
    switch (statut) {
      case 'facture':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Facturé</Badge>;
      case 'en_attente':
        return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">En attente</Badge>;
      default:
        return <Badge className="bg-muted text-muted-foreground">Non facturé</Badge>;
    }
  };

  const handleViewDetails = (mission: Mission) => {
    setSelectedMission(mission);
    setShowDetailDialog(true);
  };

  const totalBLs = bonsLivraison.length;
  const totalMontant = bonsLivraison.reduce((sum, bl) => sum + (bl.montant_total || 0), 0);

  if (isLoading) {
    return (
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardContent className="p-8 text-center">
          <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto" />
          <p className="text-muted-foreground mt-4">Chargement des missions clôturées...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <FileCheck className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>Missions clôturées</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {filteredMissions.length} mission(s) en attente de vérification
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 bg-background/50"
                />
              </div>
              <MissionsHistoryExport missions={missions} statusFilter="cloture" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredMissions.length === 0 ? (
            <div className="text-center py-12">
              <FileCheck className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
              <p className="text-muted-foreground">Aucune mission clôturée trouvée</p>
            </div>
          ) : (
            <div className="rounded-lg border border-border/50 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead>N° Mission</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Véhicule</TableHead>
                    <TableHead>Chauffeur</TableHead>
                    <TableHead>Trajet</TableHead>
                    <TableHead>Date clôture</TableHead>
                    <TableHead>Facturation</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMissions.map((mission) => (
                    <TableRow key={mission.id} className="hover:bg-muted/20">
                      <TableCell className="font-medium">{mission.numero}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {mission.type_transport}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Truck className="h-4 w-4 text-muted-foreground" />
                          <span>{mission.vehicule?.immatriculation || '-'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span>
                            {mission.chauffeur 
                              ? `${mission.chauffeur.prenom} ${mission.chauffeur.nom}`
                              : '-'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          <span className="truncate max-w-[150px]">
                            {mission.site_depart} → {mission.site_arrivee}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>{format(new Date(mission.updated_at), 'dd/MM/yyyy', { locale: fr })}</span>
                        </div>
                      </TableCell>
                      <TableCell>{getFacturationBadge(mission.facturation_statut)}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetails(mission)}
                          className="hover:bg-primary/10"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Détails
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog détails mission */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileCheck className="h-5 w-5 text-primary" />
              Détails Mission {selectedMission?.numero}
            </DialogTitle>
          </DialogHeader>
          
          {selectedMission && (
            <div className="space-y-6">
              {/* Infos mission */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-3 rounded-lg bg-muted/30">
                  <p className="text-xs text-muted-foreground">Type transport</p>
                  <p className="font-medium capitalize">{selectedMission.type_transport}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/30">
                  <p className="text-xs text-muted-foreground">Véhicule</p>
                  <p className="font-medium">{selectedMission.vehicule?.immatriculation || '-'}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/30">
                  <p className="text-xs text-muted-foreground">Chauffeur</p>
                  <p className="font-medium">
                    {selectedMission.chauffeur 
                      ? `${selectedMission.chauffeur.prenom} ${selectedMission.chauffeur.nom}`
                      : '-'}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-muted/30">
                  <p className="text-xs text-muted-foreground">Trajet</p>
                  <p className="font-medium text-sm">{selectedMission.site_depart} → {selectedMission.site_arrivee}</p>
                </div>
              </div>

              {/* Bons de livraison */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  Bons de livraison ({totalBLs})
                  {totalMontant > 0 && (
                    <Badge variant="outline" className="ml-auto">
                      Total: {totalMontant.toLocaleString('fr-FR')} GNF
                    </Badge>
                  )}
                </h3>
                
                {bonsLivraison.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">Aucun bon de livraison</p>
                ) : (
                  <div className="rounded-lg border border-border/50 overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/30">
                          <TableHead>N° BL</TableHead>
                          <TableHead>Destination</TableHead>
                          <TableHead>Produit</TableHead>
                          <TableHead className="text-right">Qté prévue</TableHead>
                          <TableHead className="text-right">Qté livrée</TableHead>
                          <TableHead className="text-right">Montant</TableHead>
                          <TableHead>Statut</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {bonsLivraison.map((bl) => (
                          <TableRow key={bl.id}>
                            <TableCell className="font-medium">{bl.numero}</TableCell>
                            <TableCell>{bl.destination}</TableCell>
                            <TableCell>{bl.produit}</TableCell>
                            <TableCell className="text-right">{bl.quantite_prevue?.toLocaleString('fr-FR')}</TableCell>
                            <TableCell className="text-right">{bl.quantite_livree?.toLocaleString('fr-FR') || '-'}</TableCell>
                            <TableCell className="text-right">
                              {bl.montant_total ? `${bl.montant_total.toLocaleString('fr-FR')} GNF` : '-'}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="capitalize">{bl.statut}</Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
