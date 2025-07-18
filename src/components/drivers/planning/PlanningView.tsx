
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, MapPin, User, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, addDays, startOfWeek, isSameDay, addWeeks, subWeeks } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useQuery } from '@tanstack/react-query';
import { missionsService } from '@/services/missions';

interface PlanningViewProps {
  chauffeurs: any[];
}

export const PlanningView = ({ chauffeurs }: PlanningViewProps) => {
  const [currentWeek, setCurrentWeek] = useState(new Date());

  // Récupérer les missions pour le planning
  const { data: missions = [] } = useQuery({
    queryKey: ['missions-planning'],
    queryFn: missionsService.getAll,
    refetchInterval: 30 * 1000, // Actualisation toutes les 30 secondes
  });

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  // Organiser les missions par chauffeur et par jour
  const missionsByDay = useMemo(() => {
    const organized: Record<string, Record<string, any[]>> = {};
    
    chauffeurs.forEach(chauffeur => {
      organized[chauffeur.id] = {};
      weekDays.forEach(day => {
        const dayKey = format(day, 'yyyy-MM-dd');
        organized[chauffeur.id][dayKey] = [];
      });
    });

    missions.forEach(mission => {
      if (mission.chauffeur_id && mission.date_heure_depart) {
        const missionDate = new Date(mission.date_heure_depart);
        const dayKey = format(missionDate, 'yyyy-MM-dd');
        
        if (organized[mission.chauffeur_id] && organized[mission.chauffeur_id][dayKey]) {
          organized[mission.chauffeur_id][dayKey].push(mission);
        }
      }
    });

    return organized;
  }, [chauffeurs, missions, weekDays]);

  const getStatusColor = (status: string) => {
    const colors = {
      'en_attente': 'bg-yellow-100 text-yellow-800',
      'en_cours': 'bg-green-100 text-green-800',
      'terminee': 'bg-blue-100 text-blue-800',
      'annulee': 'bg-red-100 text-red-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getChauffeurStatus = (chauffeurId: string, day: Date) => {
    const dayKey = format(day, 'yyyy-MM-dd');
    const dayMissions = missionsByDay[chauffeurId]?.[dayKey] || [];
    
    if (dayMissions.length === 0) return 'Disponible';
    
    const activeMissions = dayMissions.filter(m => m.statut === 'en_cours' || m.statut === 'en_attente');
    if (activeMissions.length > 0) return 'En mission';
    
    return 'Missions terminées';
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <Calendar className="w-5 h-5 mr-2" />
            Planning informatif des chauffeurs
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentWeek(subWeeks(currentWeek, 1))}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm font-medium min-w-[120px] text-center">
              {format(weekStart, 'dd MMM', { locale: fr })} - {format(addDays(weekStart, 6), 'dd MMM yyyy', { locale: fr })}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <p className="text-sm text-gray-600">
          Vue d'ensemble pour la planification - Informations en temps réel
        </p>
      </CardHeader>
      <CardContent>
        {/* En-têtes des jours */}
        <div className="grid grid-cols-8 gap-2 mb-4">
          <div className="font-medium text-sm text-gray-600 p-2">Chauffeur</div>
          {weekDays.map(day => (
            <div key={day.toISOString()} className="font-medium text-sm text-center p-2">
              <div>{format(day, 'EEE', { locale: fr })}</div>
              <div className="text-xs text-gray-500">{format(day, 'dd')}</div>
            </div>
          ))}
        </div>

        {/* Planning par chauffeur */}
        <div className="space-y-2 max-h-[600px] overflow-y-auto">
          {chauffeurs.map(chauffeur => (
            <div key={chauffeur.id} className="grid grid-cols-8 gap-2 min-h-[80px]">
              {/* Nom du chauffeur */}
              <div className="p-2 bg-gray-50 rounded flex items-center">
                <div>
                  <div className="font-medium text-sm">{chauffeur.prenom} {chauffeur.nom}</div>
                  <div className="text-xs text-gray-500">{chauffeur.telephone}</div>
                  <Badge 
                    variant="outline" 
                    className={`text-xs mt-1 ${chauffeur.statut === 'actif' ? 'border-green-500 text-green-700' : 'border-gray-500 text-gray-700'}`}
                  >
                    {chauffeur.statut}
                  </Badge>
                </div>
              </div>
              
              {/* Missions par jour */}
              {weekDays.map(day => {
                const dayKey = format(day, 'yyyy-MM-dd');
                const dayMissions = missionsByDay[chauffeur.id]?.[dayKey] || [];
                const status = getChauffeurStatus(chauffeur.id, day);
                
                return (
                  <div key={`${chauffeur.id}-${dayKey}`} className="border rounded p-1 min-h-[76px] bg-white">
                    {/* Indicateur de statut */}
                    <div className="mb-2">
                      <Badge 
                        variant="outline" 
                        className={`text-xs w-full justify-center ${
                          status === 'Disponible' ? 'border-green-200 text-green-700 bg-green-50' :
                          status === 'En mission' ? 'border-orange-200 text-orange-700 bg-orange-50' :
                          'border-blue-200 text-blue-700 bg-blue-50'
                        }`}
                      >
                        {status}
                      </Badge>
                    </div>
                    
                    {/* Liste des missions */}
                    <div className="space-y-1">
                      {dayMissions.map(mission => (
                        <div
                          key={mission.id}
                          className="text-xs p-1 rounded bg-gray-50 border"
                          title={`${mission.numero} - ${mission.site_depart} → ${mission.site_arrivee}`}
                        >
                          <div className="font-medium truncate">{mission.numero}</div>
                          <div className="flex items-center text-xs text-gray-600">
                            <Clock className="w-3 h-3 mr-1" />
                            {format(new Date(mission.date_heure_depart), 'HH:mm')}
                          </div>
                          <div className="flex items-center text-xs text-gray-600">
                            <MapPin className="w-3 h-3 mr-1" />
                            <span className="truncate">{mission.site_depart}</span>
                          </div>
                          <Badge 
                            variant="outline" 
                            className={`text-xs w-full justify-center mt-1 ${getStatusColor(mission.statut)}`}
                          >
                            {mission.statut}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Légende */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <h4 className="text-sm font-medium mb-2">Légende :</h4>
          <div className="flex flex-wrap gap-4 text-xs">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-100 border border-green-200 rounded mr-1"></div>
              <span>Disponible</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-orange-100 border border-orange-200 rounded mr-1"></div>
              <span>En mission</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-blue-100 border border-blue-200 rounded mr-1"></div>
              <span>Missions terminées</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
