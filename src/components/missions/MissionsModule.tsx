
import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { 
  Plus, 
  Search, 
  Filter,
  Calendar,
  Truck,
  MapPin
} from 'lucide-react';
import { MissionForm } from './MissionForm';
import { MissionsList } from './MissionsList';
import { MissionsStats } from './MissionsStats';
import { missionsService, type MissionWithDetails } from '@/services/missions';

export const MissionsModule = () => {
  const { toast } = useToast();
  const [activeView, setActiveView] = useState<'list' | 'form'>('list');
  const [selectedMission, setSelectedMission] = useState<MissionWithDetails | null>(null);
  const [missions, setMissions] = useState<MissionWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filtres
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  useEffect(() => {
    loadMissions();
  }, []);

  const loadMissions = async () => {
    try {
      setLoading(true);
      const data = await missionsService.getAll();
      setMissions(data);
    } catch (error) {
      console.error('Erreur lors du chargement des missions:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les missions.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Calcul des statistiques en temps réel
  const stats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    
    return {
      totalMissions: missions.length,
      missionsEnAttente: missions.filter(m => m.statut === 'en_attente').length,
      missionsEnCours: missions.filter(m => m.statut === 'en_cours').length,
      missionsTerminees: missions.filter(m => m.statut === 'terminee').length,
      missionsAnnulees: missions.filter(m => m.statut === 'annulee').length,
      missionsAujourdhui: missions.filter(m => 
        new Date(m.date_heure_depart).toISOString().split('T')[0] === today
      ).length
    };
  }, [missions]);

  const handleAddMission = () => {
    setSelectedMission(null);
    setActiveView('form');
  };

  const handleEditMission = (mission: MissionWithDetails) => {
    setSelectedMission(mission);
    setActiveView('form');
  };

  const handleSaveMission = () => {
    setActiveView('list');
    setSelectedMission(null);
    loadMissions(); // Recharger la liste
  };

  const handleCancelForm = () => {
    setActiveView('list');
    setSelectedMission(null);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Chargement du module missions...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {activeView === 'list' && (
        <>
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Planification des missions</h2>
              <p className="text-gray-600 mt-1">
                Gestion et suivi des missions de transport
              </p>
            </div>
            <Button 
              onClick={handleAddMission}
              className="bg-orange-500 hover:bg-orange-600"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nouvelle mission
            </Button>
          </div>

          <MissionsStats
            totalMissions={stats.totalMissions}
            missionsEnAttente={stats.missionsEnAttente}
            missionsEnCours={stats.missionsEnCours}
            missionsTerminees={stats.missionsTerminees}
            missionsAnnulees={stats.missionsAnnulees}
            missionsAujourdhui={stats.missionsAujourdhui}
          />

          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Rechercher par numéro, véhicule, chauffeur ou lieu..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrer par statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Tous les statuts</SelectItem>
                <SelectItem value="en_attente">En attente</SelectItem>
                <SelectItem value="en_cours">En cours</SelectItem>
                <SelectItem value="terminee">Terminée</SelectItem>
                <SelectItem value="annulee">Annulée</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrer par type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Tous les types</SelectItem>
                <SelectItem value="hydrocarbures">Hydrocarbures</SelectItem>
                <SelectItem value="bauxite">Bauxite</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <MissionsList
            searchTerm={searchTerm}
            statusFilter={statusFilter}
            typeFilter={typeFilter}
            onEditMission={handleEditMission}
          />
        </>
      )}

      {activeView === 'form' && (
        <MissionForm
          mission={selectedMission || undefined}
          onSave={handleSaveMission}
          onCancel={handleCancelForm}
        />
      )}
    </div>
  );
};
