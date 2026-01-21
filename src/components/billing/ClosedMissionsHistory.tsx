import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Search, FileCheck, Calendar, X } from 'lucide-react';
import { MissionsHistoryExport } from '@/components/missions/MissionsHistoryExport';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';

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
  vehicule: { 
    numero: string;
    immatriculation: string;
    remorque_immatriculation: string | null;
    capacite_max: number | null;
  } | null;
  chauffeur: { nom: string; prenom: string } | null;
}

interface BonLivraison {
  id: string;
  numero: string;
  numero_tournee: string | null;
  destination: string;
  lieu_depart: string | null;
  lieu_arrivee: string | null;
  produit: string;
  quantite_prevue: number;
  quantite_livree: number | null;
  prix_unitaire: number | null;
  date_emission: string;
  date_chargement_reelle: string | null;
  date_depart: string | null;
  date_arrivee_reelle: string | null;
  date_dechargement: string | null;
  manquant_citerne: number | null;
  manquant_cuve: number | null;
  manquant_compteur: number | null;
  manquant_total: number | null;
  statut: string;
  mission_id: string;
}

interface MissionWithBLs extends Mission {
  bons_livraison: BonLivraison[];
}

export const ClosedMissionsHistory = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [dateDebut, setDateDebut] = useState<Date | undefined>(undefined);
  const [dateFin, setDateFin] = useState<Date | undefined>(undefined);

  const setQuickPeriod = (months: number) => {
    const now = new Date();
    if (months === 0) {
      // Mois en cours
      setDateDebut(startOfMonth(now));
      setDateFin(endOfMonth(now));
    } else {
      // X derniers mois
      setDateDebut(subMonths(now, months));
      setDateFin(now);
    }
  };

  const clearDateFilter = () => {
    setDateDebut(undefined);
    setDateFin(undefined);
  };

  const safeFormatDate = (
    value: string | Date | null | undefined,
    fmt: string = 'dd/MM/yyyy'
  ) => {
    if (!value) return '-';
    const d = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(d.getTime())) return '-';
    return format(d, fmt);
  };

  // Charger les tarifs pour calculer dynamiquement les prix manquants
  const { data: tarifs = [] } = useQuery({
    queryKey: ['tarifs-hydrocarbures'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tarifs_hydrocarbures')
        .select('*');
      if (error) throw error;
      return data;
    }
  });

  // Fonction pour trouver le tarif correspondant à une destination
  const findTarifForDestination = (destination: string): number | null => {
    if (!destination || tarifs.length === 0) return null;
    
    const normalizeStr = (str: string) => 
      str.toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    
    const destinationNormalized = normalizeStr(destination);
    const destinationWords = destinationNormalized.split(' ').filter(w => w.length > 2);
    const mainCity = destinationWords[0] || '';
    
    let bestTarif = null;
    let bestScore = 0;
    
    for (const tarif of tarifs) {
      const tarifNormalized = normalizeStr(tarif.destination || '');
      const tarifWords = tarifNormalized.split(' ').filter((w: string) => w.length > 2);
      
      let score = 0;
      
      if (mainCity && tarifNormalized.startsWith(mainCity)) {
        score += 200;
      } else if (mainCity && tarifNormalized.includes(mainCity)) {
        score += 150;
      }
      
      if (tarifWords[0] && destinationWords[0] && tarifWords[0] === destinationWords[0]) {
        score += 100;
      }
      
      for (const word of destinationWords) {
        if (tarifNormalized.includes(word)) {
          score += word.length * 2;
        }
      }
      
      if (tarifNormalized.includes(destinationNormalized) || destinationNormalized.includes(tarifNormalized)) {
        score += 50;
      }
      
      if (score > bestScore) {
        bestScore = score;
        bestTarif = tarif;
      }
    }
    
    return bestScore >= 10 && bestTarif ? bestTarif.prix_litre : null;
  };

  const { data: missions = [], isLoading, isError, error } = useQuery({
    queryKey: ['closed-missions-billing-full'],
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
          vehicule:vehicules(numero, immatriculation, remorque_immatriculation, capacite_max),
          chauffeur:chauffeurs(nom, prenom),
          bons_livraison(
            id,
            numero,
            numero_tournee,
            destination,
            lieu_depart,
            lieu_arrivee,
            produit,
            quantite_prevue,
            quantite_livree,
            prix_unitaire,
            date_emission,
            date_chargement_reelle,
            date_depart,
            date_arrivee_reelle,
            date_dechargement,
            manquant_citerne,
            manquant_cuve,
            manquant_compteur,
            manquant_total,
            statut,
            mission_id
          )
        `)
        .eq('statut', 'terminee')
        .neq('facturation_statut', 'facturee')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return data as MissionWithBLs[];
    }
  });

  // Créer les lignes de données au format export (une ligne par BL)
  const tableRows: any[] = [];
  
  missions.forEach(mission => {
    const bls = mission.bons_livraison || [];
    
    if (bls.length === 0) {
      // Mission sans BL
       tableRows.push({
         missionId: mission.id,
         numero: mission.numero,
         citerne: mission.vehicule?.remorque_immatriculation || mission.vehicule?.immatriculation || mission.vehicule?.numero || '-',
         chauffeur: mission.chauffeur ? `${mission.chauffeur.prenom} ${mission.chauffeur.nom}` : '-',
         numeroBL: '-',
         numeroTournee: '-',
         nombreBL: 0,
         capacite: mission.vehicule?.capacite_max || '-',
         quantite: '-',
         prixUnitaire: '-',
         montant: '-',
         produit: mission.type_transport === 'hydrocarbures' ? 'Hydrocarbures' : 'Bauxite',
         provenance: mission.site_depart,
         destination: mission.site_arrivee,
         dateReceptionDS: '-',
         dateChargement: '-',
         dateDepart: safeFormatDate(mission.created_at),
         dateArrivee: '-',
         dateDechargement: safeFormatDate(mission.updated_at),
         manquantCiterne: '-',
         manquantCuve: '-',
         manquantCompteur: '-',
         manquantTotal: '-',
         isFirstRow: true,
         facturationStatut: mission.facturation_statut
       });
    } else {
      // Une ligne par BL
      bls.forEach((bl, index) => {
        const isFirst = index === 0;
        const quantite = bl.quantite_livree || bl.quantite_prevue || 0;
        const prixUnitaire = bl.prix_unitaire || 0;
        const montant = quantite * prixUnitaire;
         tableRows.push({
           missionId: mission.id,
           numero: isFirst ? mission.numero : '',
           citerne: isFirst ? (mission.vehicule?.remorque_immatriculation || mission.vehicule?.immatriculation || mission.vehicule?.numero || '-') : '',
           chauffeur: isFirst ? (mission.chauffeur ? `${mission.chauffeur.prenom} ${mission.chauffeur.nom}` : '-') : '',
           numeroBL: bl.numero || '-',
           numeroTournee: bl.numero_tournee || '-',
           nombreBL: isFirst ? bls.length : '',
           capacite: isFirst ? (mission.vehicule?.capacite_max || '-') : '',
           quantite: bl.quantite_livree || bl.quantite_prevue || '-',
           prixUnitaire: prixUnitaire || '-',
           montant: montant || '-',
           produit: bl.produit === 'essence' ? 'ESSENCE' : bl.produit === 'gasoil' ? 'GASOIL' : bl.produit || 'Hydrocarbures',
           provenance: bl.lieu_depart || mission.site_depart,
           destination: bl.lieu_arrivee || bl.destination || mission.site_arrivee,
           dateReceptionDS: safeFormatDate(bl.date_emission),
           dateChargement: safeFormatDate(bl.date_chargement_reelle),
           dateDepart: bl.date_depart ? safeFormatDate(bl.date_depart) : (isFirst ? safeFormatDate(mission.created_at) : '-'),
           dateArrivee: safeFormatDate(bl.date_arrivee_reelle),
           dateDechargement: safeFormatDate(bl.date_dechargement),
           manquantCiterne: bl.manquant_citerne ?? '-',
           manquantCuve: bl.manquant_cuve ?? '-',
           manquantCompteur: bl.manquant_compteur ?? '-',
           manquantTotal: bl.manquant_total ?? '-',
           isFirstRow: isFirst,
           facturationStatut: mission.facturation_statut
         });
      });
    }
  });

  // Filtrer les missions par période
  const filteredMissions = missions.filter(mission => {
    if (!dateDebut && !dateFin) return true;
    
    const missionDate = new Date(mission.updated_at || mission.created_at);
    
    if (dateDebut && dateFin) {
      return missionDate >= dateDebut && missionDate <= dateFin;
    } else if (dateDebut) {
      return missionDate >= dateDebut;
    } else if (dateFin) {
      return missionDate <= dateFin;
    }
    return true;
  });

  // Recalculer les tableRows avec les missions filtrées
  const filteredTableRows: any[] = [];
  
  filteredMissions.forEach(mission => {
    const bls = mission.bons_livraison || [];
    
    if (bls.length === 0) {
       filteredTableRows.push({
         missionId: mission.id,
         numero: mission.numero,
         citerne: mission.vehicule?.remorque_immatriculation || mission.vehicule?.immatriculation || mission.vehicule?.numero || '-',
         chauffeur: mission.chauffeur ? `${mission.chauffeur.prenom} ${mission.chauffeur.nom}` : '-',
         numeroBL: '-',
         numeroTournee: '-',
         nombreBL: 0,
         capacite: mission.vehicule?.capacite_max || '-',
         quantite: '-',
         prixUnitaire: '-',
         montant: '-',
         produit: mission.type_transport === 'hydrocarbures' ? 'Hydrocarbures' : 'Bauxite',
         provenance: mission.site_depart,
         destination: mission.site_arrivee,
         dateReceptionDS: '-',
         dateChargement: '-',
         dateDepart: safeFormatDate(mission.created_at),
         dateArrivee: '-',
         dateDechargement: safeFormatDate(mission.updated_at),
         manquantCiterne: '-',
         manquantCuve: '-',
         manquantCompteur: '-',
         manquantTotal: '-',
         isFirstRow: true,
         facturationStatut: mission.facturation_statut
       });
    } else {
      bls.forEach((bl, index) => {
        const isFirst = index === 0;
        const quantite = bl.quantite_livree || bl.quantite_prevue || 0;
        
        // Utiliser le prix du BL, ou calculer dynamiquement à partir de la destination
        let prixUnitaire = bl.prix_unitaire || 0;
        if (!prixUnitaire) {
          // Essayer de trouver le tarif via la destination du BL, sinon via site_arrivee de la mission
          const destinationToUse = bl.destination || bl.lieu_arrivee || mission.site_arrivee;
          const tarifTrouve = findTarifForDestination(destinationToUse);
          if (tarifTrouve) {
            prixUnitaire = tarifTrouve;
          }
        }
        
        const montant = quantite * prixUnitaire;
         filteredTableRows.push({
           missionId: mission.id,
           numero: isFirst ? mission.numero : '',
           citerne: isFirst ? (mission.vehicule?.remorque_immatriculation || mission.vehicule?.immatriculation || mission.vehicule?.numero || '-') : '',
           chauffeur: isFirst ? (mission.chauffeur ? `${mission.chauffeur.prenom} ${mission.chauffeur.nom}` : '-') : '',
           numeroBL: bl.numero || '-',
           numeroTournee: bl.numero_tournee || '-',
           nombreBL: isFirst ? bls.length : '',
           capacite: isFirst ? (mission.vehicule?.capacite_max || '-') : '',
           quantite: bl.quantite_livree || bl.quantite_prevue || '-',
           prixUnitaire: prixUnitaire > 0 ? prixUnitaire : '-',
           montant: montant > 0 ? montant : '-',
           produit: bl.produit === 'essence' ? 'ESSENCE' : bl.produit === 'gasoil' ? 'GASOIL' : bl.produit || 'Hydrocarbures',
           provenance: bl.lieu_depart || mission.site_depart,
           destination: bl.lieu_arrivee || bl.destination || mission.site_arrivee,
           dateReceptionDS: safeFormatDate(bl.date_emission),
           dateChargement: safeFormatDate(bl.date_chargement_reelle),
           dateDepart: bl.date_depart ? safeFormatDate(bl.date_depart) : (isFirst ? safeFormatDate(mission.created_at) : '-'),
           dateArrivee: safeFormatDate(bl.date_arrivee_reelle),
           dateDechargement: safeFormatDate(bl.date_dechargement),
           manquantCiterne: bl.manquant_citerne ?? '-',
           manquantCuve: bl.manquant_cuve ?? '-',
           manquantCompteur: bl.manquant_compteur ?? '-',
           manquantTotal: bl.manquant_total ?? '-',
           isFirstRow: isFirst,
           facturationStatut: mission.facturation_statut
         });
      });
    }
  });

  const filteredRows = filteredTableRows.filter(row => {
    const searchLower = searchTerm.toLowerCase();
    return (
      row.numero?.toLowerCase().includes(searchLower) ||
      row.citerne?.toLowerCase().includes(searchLower) ||
      row.chauffeur?.toLowerCase().includes(searchLower) ||
      row.numeroBL?.toLowerCase().includes(searchLower) ||
      row.provenance?.toLowerCase().includes(searchLower) ||
      row.destination?.toLowerCase().includes(searchLower)
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
                <CardTitle>Missions clôturées - Vérification avant facturation</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {filteredMissions.length} mission(s) sur {missions.length} | {filteredRows.length} ligne(s) affichée(s)
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-3 w-full">
              {/* Filtres rapides de période */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm text-muted-foreground">Période :</span>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setQuickPeriod(0)}
                  className={cn(dateDebut && dateFin && format(dateDebut, 'MM/yyyy') === format(new Date(), 'MM/yyyy') ? 'bg-primary/20 border-primary' : '')}
                >
                  Mois en cours
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setQuickPeriod(1)}
                >
                  30 derniers jours
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setQuickPeriod(3)}
                >
                  3 derniers mois
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setQuickPeriod(6)}
                >
                  6 derniers mois
                </Button>
                
                {/* Date début */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className={cn("w-[130px] justify-start text-left font-normal", !dateDebut && "text-muted-foreground")}>
                      <Calendar className="mr-2 h-4 w-4" />
                      {dateDebut ? format(dateDebut, 'dd/MM/yyyy') : 'Du'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={dateDebut}
                      onSelect={setDateDebut}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>

                {/* Date fin */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className={cn("w-[130px] justify-start text-left font-normal", !dateFin && "text-muted-foreground")}>
                      <Calendar className="mr-2 h-4 w-4" />
                      {dateFin ? format(dateFin, 'dd/MM/yyyy') : 'Au'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={dateFin}
                      onSelect={setDateFin}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>

                {(dateDebut || dateFin) && (
                  <Button variant="ghost" size="sm" onClick={clearDateFilter} className="text-muted-foreground">
                    <X className="h-4 w-4 mr-1" />
                    Effacer
                  </Button>
                )}
              </div>

              {/* Recherche et export */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1 sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 bg-background/50"
                  />
                </div>
                <MissionsHistoryExport missions={filteredMissions} statusFilter="terminee" />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredRows.length === 0 ? (
            <div className="text-center py-12">
              <FileCheck className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
              <p className="text-muted-foreground">Aucune mission clôturée trouvée</p>
            </div>
          ) : (
            <ScrollArea className="w-full">
              <div className="rounded-lg border border-border/50 overflow-hidden min-w-[1800px]">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead className="whitespace-nowrap">N°</TableHead>
                      <TableHead className="whitespace-nowrap">Citerne</TableHead>
                      <TableHead className="whitespace-nowrap">Chauffeur</TableHead>
                      <TableHead className="whitespace-nowrap">N°BL</TableHead>
                      <TableHead className="whitespace-nowrap">N° Tournée</TableHead>
                      <TableHead className="whitespace-nowrap text-center">Nb BL</TableHead>
                      <TableHead className="whitespace-nowrap text-right">Capacité</TableHead>
                      <TableHead className="whitespace-nowrap text-right">Quantité</TableHead>
                      <TableHead className="whitespace-nowrap text-right">Péréquation</TableHead>
                      <TableHead className="whitespace-nowrap text-right">Montant</TableHead>
                      <TableHead className="whitespace-nowrap">Produit</TableHead>
                      <TableHead className="whitespace-nowrap">Provenance</TableHead>
                      <TableHead className="whitespace-nowrap">Destination</TableHead>
                      <TableHead className="whitespace-nowrap">Réception DS</TableHead>
                      <TableHead className="whitespace-nowrap">Chargement</TableHead>
                      <TableHead className="whitespace-nowrap">Départ</TableHead>
                      <TableHead className="whitespace-nowrap">Arrivée</TableHead>
                      <TableHead className="whitespace-nowrap">Déchargement</TableHead>
                      <TableHead className="whitespace-nowrap text-right">Manq. Citerne</TableHead>
                      <TableHead className="whitespace-nowrap text-right">Manq. Cuve</TableHead>
                      <TableHead className="whitespace-nowrap text-right">Manq. Compteur</TableHead>
                      <TableHead className="whitespace-nowrap text-right">Manq. Total</TableHead>
                      <TableHead className="whitespace-nowrap">Facturation</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRows.map((row, idx) => (
                      <TableRow 
                        key={`${row.missionId}-${idx}`} 
                        className={`hover:bg-muted/20 ${row.isFirstRow ? 'border-t-2 border-border' : ''}`}
                      >
                        <TableCell className="font-medium">{row.numero}</TableCell>
                        <TableCell>{row.citerne}</TableCell>
                        <TableCell>{row.chauffeur}</TableCell>
                        <TableCell>{row.numeroBL}</TableCell>
                        <TableCell>{row.numeroTournee}</TableCell>
                        <TableCell className="text-center">{row.nombreBL}</TableCell>
                        <TableCell className="text-right">{row.capacite !== '-' ? `${row.capacite} L` : '-'}</TableCell>
                        <TableCell className="text-right">{row.quantite !== '-' ? row.quantite.toLocaleString?.('fr-FR') || row.quantite : '-'}</TableCell>
                        <TableCell className="text-right">{row.prixUnitaire !== '-' ? `${row.prixUnitaire.toLocaleString?.('fr-FR') || row.prixUnitaire} GNF` : '-'}</TableCell>
                        <TableCell className="text-right font-medium">{row.montant !== '-' ? `${row.montant.toLocaleString?.('fr-FR') || row.montant} GNF` : '-'}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize text-xs">
                            {row.produit}
                          </Badge>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">{row.provenance}</TableCell>
                        <TableCell className="min-w-[200px] whitespace-normal">{row.destination}</TableCell>
                        <TableCell>{row.dateReceptionDS}</TableCell>
                        <TableCell>{row.dateChargement}</TableCell>
                        <TableCell>{row.dateDepart}</TableCell>
                        <TableCell>{row.dateArrivee}</TableCell>
                        <TableCell>{row.dateDechargement}</TableCell>
                        <TableCell className="text-right">{row.manquantCiterne}</TableCell>
                        <TableCell className="text-right">{row.manquantCuve}</TableCell>
                        <TableCell className="text-right">{row.manquantCompteur}</TableCell>
                        <TableCell className="text-right">{row.manquantTotal}</TableCell>
                        <TableCell>{row.isFirstRow ? getFacturationBadge(row.facturationStatut) : ''}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
