
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Plus, 
  Search, 
  Filter,
  Calendar,
  Clock,
  MapPin,
  User
} from 'lucide-react';
import { PlanningCalendar } from './PlanningCalendar';
import { MissionForm } from './MissionForm';
import { PlanningStats } from './PlanningStats';
import { useQuery } from '@tanstack/react-query';
import { chauffeursService } from '@/services/chauffeurs';

interface Mission {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  location: string;
  description?: string;
  status: 'planifie' | 'en_cours' | 'termine' | 'annule';
  chauffeurId: string;
  date: string;
}

export const PlanningModule = () => {
  const { toast } = useToast();
  const [activeView, setActiveView] = useState<'calendar' | 'form'>('calendar');
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null);
  const [defaultDate, setDefaultDate] = useState<Date | undefined>();
  const [defaultChauffeurId, setDefaultChauffeurId] = useState<string | undefined>();
  const [searchTerm, setSearchTerm] = useState('');

  // Données mockées pour les missions (en attendant l'intégration avec Supabase)
  const [missions, setMissions] = useState<Mission[]>([
    {
      id: '1',
      title: 'Livraison client ABC',
      startTime: '08:00',
      endTime: '10:00',
      location: 'Paris 15ème',
      status: 'planifie',
      chauffeurId: '1',
      date: new Date().toISOString().split('T')[0]
    },
    {
      id: '2',
      title: 'Transport personnel',
      startTime: '14:00',
      endTime: '16:00',
      location: 'Aéroport CDG',
      status: 'en_cours',
      chauffeurId: '2',
      date: new Date().toISOString().split('T')[0]
    }
  ]);

  const { data: chauffeurs = [], isLoading } = useQuery({
    queryKey: ['chauffeurs'],
    queryFn: chauffeursService.getAll
  });

  const handleAddMission = (date: Date, chauffeurId: string) => {
    setDefaultDate(date);
    setDefaultChauffeurId(chauffeurId);
    setSelectedMission(null);
    setActiveView('form');
  };

  const handleEditMission = (mission: Mission) => {
    setSelectedMission(mission);
    setDefaultDate(undefined);
    setDefaultChauffeurId(undefined);
    setActiveView('form');
  };

  const handleSaveMission = (missionData: Mission) => {
    if (missionData.id) {
      // Mise à jour
      setMissions(prev => prev.map(m => m.id === missionData.id ? missionData : m));
      toast({
        title: "Mission mise à jour",
        description: "La mission a été mise à jour avec succès."
      });
    } else {
      // Création
      const newMission = { ...missionData, id: Date.now().toString() };
      setMissions(prev => [...prev, newMission]);
      toast({
        title: "Mission créée",
        description: "La nouvelle mission a été créée avec succès."
      });
    }
    setActiveView('calendar');
    setSelectedMission(null);
  };

  const handleCancelForm = () => {
    setActiveView('calendar');
    setSelectedMission(null);
    setDefaultDate(undefined);
    setDefaultChauffeurId(undefined);
  };

  // Calcul des statistiques
  const today = new Date().toISOString().split('T')[0];
  const missionsAujourdhui = missions.filter(m => m.date === today).length;
  const missionsEnCours = missions.filter(m => m.status === 'en_cours').length;
  const missionsTerminees = missions.filter(m => m.status === 'termine').length;
  const missionsAnnulees = missions.filter(m => m.status === 'annule').length;
  const chauffeursActifs = chauffeurs.filter(c => c.statut === 'actif').length;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Chargement du planning...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {activeView === 'calendar' && (
        <>
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Planning des chauffeurs</h2>
              <p className="text-gray-600 mt-1">
                Gestion des missions et emplois du temps
              </p>
            </div>
            <Button 
              onClick={() => setActiveView('form')}
              className="bg-orange-500 hover:bg-orange-600"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nouvelle mission
            </Button>
          </div>

          <PlanningStats
            totalChauffeurs={chauffeurs.length}
            chauffeursDisponibles={chauffeursActifs}
            missionsAujourdhui={missionsAujourdhui}
            missionsEnCours={missionsEnCours}
            missionsTerminees={missionsTerminees}
            missionsAnnulees={missionsAnnulees}
          />

          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Rechercher une mission..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              Filtres
            </Button>
          </div>

          <PlanningCalendar
            chauffeurs={chauffeurs}
            missions={missions}
            onAddMission={handleAddMission}
            onEditMission={handleEditMission}
          />
        </>
      )}

      {activeView === 'form' && (
        <MissionForm
          mission={selectedMission || undefined}
          chauffeurs={chauffeurs}
          onSave={handleSaveMission}
          onCancel={handleCancelForm}
          defaultDate={defaultDate}
          defaultChauffeurId={defaultChauffeurId}
        />
      )}
    </div>
  );
};
