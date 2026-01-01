
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, AlertTriangle } from 'lucide-react';
import { MissionsStats } from '@/components/missions/MissionsStats';
import { MissionsTable } from '@/components/missions/MissionsTable';
import { MissionForm } from '@/components/missions/MissionForm';
import { MissionsHistoryExport } from '@/components/missions/MissionsHistoryExport';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { missionsService } from '@/services/missions';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const Missions = () => {
  const { hasPermission, hasRole } = useAuth();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [selectedMission, setSelectedMission] = useState(null);
  const [activeTab, setActiveTab] = useState('en-cours');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateDebut, setDateDebut] = useState<Date>();
  const [dateFin, setDateFin] = useState<Date>();

  // Actualisation automatique toutes les 30 secondes
  const { data: missions = [], isLoading, error, isError } = useQuery({
    queryKey: ['missions'],
    queryFn: missionsService.getAll,
    retry: 3,
    retryDelay: 1000,
    staleTime: 30 * 1000, // 30 secondes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchInterval: 30 * 1000, // Actualisation toutes les 30 secondes
    refetchIntervalInBackground: true, // Continue même en arrière-plan
  });

  // Actualisation automatique des stats
  const { data: stats } = useQuery({
    queryKey: ['missions-stats'],
    queryFn: missionsService.getStats,
    retry: 2,
    enabled: !isError,
    refetchInterval: 30 * 1000, // Actualisation toutes les 30 secondes
    refetchIntervalInBackground: true,
  });

  // Filtrer les missions selon l'onglet actif et les filtres
  const filterMissions = (missionsToFilter: any[]) => {
    return missionsToFilter.filter(mission => {
      const searchLower = searchTerm.toLowerCase();
      
      // Recherche par numéro de mission
      const matchesNumero = mission.numero?.toLowerCase().includes(searchLower);
      
      // Recherche par N° Citerne (remorque_immatriculation ou immatriculation véhicule)
      const matchesCiterne = 
        mission.vehicule?.remorque_immatriculation?.toLowerCase().includes(searchLower) ||
        mission.vehicule?.immatriculation?.toLowerCase().includes(searchLower) ||
        mission.vehicule?.numero?.toLowerCase().includes(searchLower);
      
      // Recherche par N° Tournée (dans les bons de livraison)
      const matchesTournee = mission.bons_livraison?.some((bl: any) => 
        bl.numero_tournee?.toLowerCase().includes(searchLower)
      );
      
      // Recherche par chauffeur
      const matchesChauffeur = 
        mission.chauffeur?.nom?.toLowerCase().includes(searchLower) ||
        mission.chauffeur?.prenom?.toLowerCase().includes(searchLower);
      
      // Recherche par lieu (départ/arrivée)
      const matchesLieu = 
        mission.site_depart?.toLowerCase().includes(searchLower) ||
        mission.site_arrivee?.toLowerCase().includes(searchLower);
      
      const matchesSearch = !searchTerm || 
        matchesNumero || matchesCiterne || matchesTournee || matchesChauffeur || matchesLieu;
      
      const matchesStatus = statusFilter === 'all' || mission.statut === statusFilter;
      
      // Filtre par date
      let matchesDate = true;
      if (dateDebut || dateFin) {
        const missionDate = new Date(mission.created_at);
        if (dateDebut && missionDate < dateDebut) matchesDate = false;
        if (dateFin && missionDate > dateFin) matchesDate = false;
      }
      
      return matchesSearch && matchesStatus && matchesDate;
    });
  };
  
  const missionsEnCours = filterMissions(
    missions.filter(mission => 
      mission.statut === 'en_attente' || mission.statut === 'en_cours'
    )
  );
  
  // Missions terminées non facturées (en attente de facturation)
  const missionsTermineesNonFacturees = filterMissions(
    missions.filter(mission => 
      mission.statut === 'terminee' && mission.facturation_statut !== 'facturee'
    )
  );

  // Missions terminées et facturées
  const missionsTermineesFacturees = filterMissions(
    missions.filter(mission => 
      mission.statut === 'terminee' && mission.facturation_statut === 'facturee'
    )
  );

  const missionsHistorique = filterMissions(
    missions.filter(mission => 
      mission.statut === 'terminee' || mission.statut === 'annulee'
    )
  );

  const handleCreateMission = () => {
    setSelectedMission(null);
    setShowForm(true);
  };

  const handleEditMission = (mission: any) => {
    setSelectedMission(mission);
    setShowForm(true);
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setSelectedMission(null);
    // Actualisation immédiate après modification
    queryClient.invalidateQueries({ queryKey: ['missions'] });
    queryClient.invalidateQueries({ queryKey: ['missions-stats'] });
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setSelectedMission(null);
  };

  // Vérifier les permissions pour les missions - inclut transitaires, transport et ceux avec accès au module missions
  const canReadMissions = hasPermission('missions_read') || hasPermission('missions') || hasRole('transitaire') || hasRole('transport');
  const canWriteMissions = hasPermission('missions_write') || hasPermission('missions') || hasRole('transitaire') || hasRole('transport');

  if (!canReadMissions) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Accès non autorisé</h1>
          <p className="text-gray-600 mt-2">Vous n'avez pas les permissions pour accéder à ce module.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-lg font-medium">Chargement des missions...</p>
          <p className="text-sm text-gray-500 mt-2">Connexion à la base de données</p>
        </div>
      </div>
    );
  }

  if (isError || error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-red-600 mb-2">Erreur de chargement</h2>
          <p className="text-gray-600 mb-4">Impossible de charger les données des missions</p>
          <Button 
            onClick={() => queryClient.invalidateQueries({ queryKey: ['missions'] })}
            variant="outline"
          >
            Réessayer
          </Button>
        </div>
      </div>
    );
  }

  if (showForm) {
    return (
      <MissionForm
        mission={selectedMission}
        onSuccess={handleFormSuccess}
        onCancel={handleFormCancel}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Planification des missions</h1>
          <p className="text-gray-600 mt-1">
            Gestion et planification des missions de transport
          </p>
        </div>
        {canWriteMissions && (
          <Button 
            onClick={handleCreateMission}
            className="bg-orange-500 hover:bg-orange-600"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nouvelle mission
          </Button>
        )}
      </div>

      {stats && (
        <MissionsStats
          total={stats.total}
          en_attente={stats.en_attente}
          en_cours={stats.en_cours}
          terminees={stats.terminees}
          annulees={stats.annulees}
        />
      )}

      {/* Filtres de recherche avancés */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
        <div className="md:col-span-2">
          <Input
            placeholder="Rechercher par n° mission, n° citerne, n° tournée, chauffeur, lieu..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="en_attente">En attente</SelectItem>
            <SelectItem value="en_cours">En cours</SelectItem>
            <SelectItem value="terminee">Terminée</SelectItem>
            <SelectItem value="annulee">Annulée</SelectItem>
          </SelectContent>
        </Select>
        <MissionsHistoryExport missions={missions} statusFilter={statusFilter} />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="en-cours" className="flex items-center gap-2">
            En cours ({missionsEnCours.length})
          </TabsTrigger>
          <TabsTrigger value="non-facturees" className="flex items-center gap-2 text-orange-600">
            Non facturées ({missionsTermineesNonFacturees.length})
          </TabsTrigger>
          <TabsTrigger value="facturees" className="flex items-center gap-2 text-green-600">
            Facturées ({missionsTermineesFacturees.length})
          </TabsTrigger>
          <TabsTrigger value="historique" className="flex items-center gap-2">
            Historique ({missionsHistorique.length})
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="en-cours" className="mt-6">
          <MissionsTable
            missions={missionsEnCours}
            onEdit={handleEditMission}
            hasWritePermission={canWriteMissions}
            onRefresh={() => queryClient.invalidateQueries({ queryKey: ['missions'] })}
          />
        </TabsContent>

        <TabsContent value="non-facturees" className="mt-6">
          <MissionsTable
            missions={missionsTermineesNonFacturees}
            onEdit={handleEditMission}
            hasWritePermission={canWriteMissions}
            onRefresh={() => queryClient.invalidateQueries({ queryKey: ['missions'] })}
          />
        </TabsContent>

        <TabsContent value="facturees" className="mt-6">
          <MissionsTable
            missions={missionsTermineesFacturees}
            onEdit={handleEditMission}
            hasWritePermission={canWriteMissions}
            onRefresh={() => queryClient.invalidateQueries({ queryKey: ['missions'] })}
          />
        </TabsContent>

        <TabsContent value="historique" className="mt-6">
          <MissionsTable
            missions={missionsHistorique}
            onEdit={handleEditMission}
            hasWritePermission={canWriteMissions}
            onRefresh={() => queryClient.invalidateQueries({ queryKey: ['missions'] })}
            showHistoryFilters={true}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Missions;
