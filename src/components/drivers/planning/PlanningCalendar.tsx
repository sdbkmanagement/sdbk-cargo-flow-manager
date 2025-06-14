
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar,
  Clock,
  MapPin,
  User,
  Plus
} from 'lucide-react';
import { format, addDays, startOfWeek, isSameDay, addWeeks, subWeeks } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Mission {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  location: string;
  status: 'planifie' | 'en_cours' | 'termine' | 'annule';
  chauffeurId: string;
}

interface PlanningCalendarProps {
  chauffeurs: any[];
  missions: Mission[];
  onAddMission: (date: Date, chauffeurId: string) => void;
  onEditMission: (mission: Mission) => void;
}

export const PlanningCalendar = ({ 
  chauffeurs, 
  missions, 
  onAddMission, 
  onEditMission 
}: PlanningCalendarProps) => {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [selectedView, setSelectedView] = useState<'week' | 'day'>('week');

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const getMissionsForDateAndChauffeur = (date: Date, chauffeurId: string) => {
    return missions.filter(mission => 
      mission.chauffeurId === chauffeurId &&
      isSameDay(new Date(mission.startTime), date)
    );
  };

  const getStatusColor = (status: string) => {
    const colors = {
      'planifie': 'bg-blue-100 text-blue-800',
      'en_cours': 'bg-green-100 text-green-800',
      'termine': 'bg-gray-100 text-gray-800',
      'annule': 'bg-red-100 text-red-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const hours = Array.from({ length: 12 }, (_, i) => i + 6); // 6h à 17h

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <Calendar className="w-5 h-5 mr-2" />
            Planning des chauffeurs
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedView(selectedView === 'week' ? 'day' : 'week')}
            >
              {selectedView === 'week' ? 'Vue jour' : 'Vue semaine'}
            </Button>
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
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-8 gap-2 mb-4">
          <div className="font-medium text-sm text-gray-600 p-2">Chauffeur</div>
          {weekDays.map(day => (
            <div key={day.toISOString()} className="font-medium text-sm text-center p-2">
              <div>{format(day, 'EEE', { locale: fr })}</div>
              <div className="text-xs text-gray-500">{format(day, 'dd')}</div>
            </div>
          ))}
        </div>

        <div className="space-y-2 max-h-[600px] overflow-y-auto">
          {chauffeurs.map(chauffeur => (
            <div key={chauffeur.id} className="grid grid-cols-8 gap-2 min-h-[80px]">
              <div className="p-2 bg-gray-50 rounded flex items-center">
                <div>
                  <div className="font-medium text-sm">{chauffeur.prenom} {chauffeur.nom}</div>
                  <div className="text-xs text-gray-500">{chauffeur.telephone}</div>
                </div>
              </div>
              {weekDays.map(day => {
                const dayMissions = getMissionsForDateAndChauffeur(day, chauffeur.id);
                return (
                  <div key={`${chauffeur.id}-${day.toISOString()}`} className="border rounded p-1 min-h-[76px] relative group">
                    <div className="space-y-1">
                      {dayMissions.map(mission => (
                        <div
                          key={mission.id}
                          className="text-xs p-1 rounded cursor-pointer hover:opacity-80"
                          onClick={() => onEditMission(mission)}
                        >
                          <Badge variant="outline" className={`w-full justify-start ${getStatusColor(mission.status)}`}>
                            <div className="truncate">
                              <div className="font-medium">{mission.title}</div>
                              <div className="flex items-center text-xs">
                                <Clock className="w-3 h-3 mr-1" />
                                {mission.startTime} - {mission.endTime}
                              </div>
                              <div className="flex items-center text-xs">
                                <MapPin className="w-3 h-3 mr-1" />
                                <span className="truncate">{mission.location}</span>
                              </div>
                            </div>
                          </Badge>
                        </div>
                      ))}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => onAddMission(day, chauffeur.id)}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
