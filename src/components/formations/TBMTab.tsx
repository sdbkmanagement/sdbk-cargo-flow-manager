import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tbmService, Collaborateur, TbmPresence, TbmSession } from '@/services/tbmService';
import { Calendar, Users, CheckCircle, Search, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const CURRENT_YEAR = new Date().getFullYear();
const CURRENT_MONTH = new Date().getMonth() + 1;

export const TBMTab = () => {
  const queryClient = useQueryClient();
  const [mois, setMois] = useState(CURRENT_MONTH);
  const [annee, setAnnee] = useState(CURRENT_YEAR);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'tous' | 'employe' | 'chauffeur'>('tous');

  // Init sessions for selected month
  const { data: sessions = [], isLoading: loadingSessions } = useQuery({
    queryKey: ['tbm-sessions', mois, annee],
    queryFn: async () => {
      let sessions = await tbmService.getSessions(mois, annee);
      const nbLundis = tbmService.getMondaysInMonth(mois, annee);
      if (sessions.length < nbLundis) {
        sessions = await tbmService.initSessions(mois, annee);
      }
      return sessions;
    },
  });

  const sessionIds = sessions.map(s => s.id);

  const { data: collaborateurs = [] } = useQuery({
    queryKey: ['tbm-collaborateurs'],
    queryFn: tbmService.getAllCollaborateurs,
  });

  const { data: presences = [], isLoading: loadingPresences } = useQuery({
    queryKey: ['tbm-presences', sessionIds.join(',')],
    queryFn: () => tbmService.getAllPresences(sessionIds),
    enabled: sessionIds.length > 0,
  });

  const updateSessionMutation = useMutation({
    mutationFn: (params: { mois: number; annee: number; numero_reunion: number; theme?: string; date_reunion?: string }) =>
      tbmService.upsertSession(params),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tbm-sessions', mois, annee] }),
  });

  const toggleMutation = useMutation({
    mutationFn: (params: { sessionId: string; collaborateur: Collaborateur; present: boolean; datePresence?: string }) =>
      tbmService.togglePresence(params.sessionId, params.collaborateur, params.present, params.datePresence),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tbm-presences'] }),
  });

  const filteredCollabs = useMemo(() => {
    return collaborateurs.filter(c => {
      if (filterType !== 'tous' && c.type !== filterType) return false;
      if (search) {
        const s = search.toLowerCase();
        return `${c.nom} ${c.prenom}`.toLowerCase().includes(s);
      }
      return true;
    });
  }, [collaborateurs, filterType, search]);

  // Split into employes and chauffeurs
  const employesFiltered = filteredCollabs.filter(c => c.type === 'employe');
  const chauffeursFiltered = filteredCollabs.filter(c => c.type === 'chauffeur');

  const stats = tbmService.getStats(collaborateurs, presences, sessionIds);

  const isPresent = (sessionId: string, collab: Collaborateur) => {
    return presences.some(p => {
      if (p.session_id !== sessionId || !p.present) return false;
      if (collab.type === 'chauffeur') return p.chauffeur_id === collab.id;
      return p.employe_id === collab.id;
    });
  };

  const getDatePresence = (sessionId: string, collab: Collaborateur) => {
    const p = presences.find(p => {
      if (p.session_id !== sessionId) return false;
      if (collab.type === 'chauffeur') return p.chauffeur_id === collab.id;
      return p.employe_id === collab.id;
    });
    return p?.date_presence || '';
  };

  const handleToggle = (sessionId: string, collab: Collaborateur, checked: boolean) => {
    const session = sessions.find(s => s.id === sessionId);
    toggleMutation.mutate({
      sessionId,
      collaborateur: collab,
      present: checked,
      datePresence: checked ? (session?.date_reunion || new Date().toISOString().split('T')[0]) : undefined,
    });
  };

  const handleDateChange = (sessionId: string, collab: Collaborateur, date: string) => {
    toggleMutation.mutate({
      sessionId,
      collaborateur: collab,
      present: true,
      datePresence: date,
    });
  };

  const getCumulForCollab = (collab: Collaborateur) => {
    return sessionIds.filter(sid => isPresent(sid, collab)).length;
  };

  const renderCollabRows = (collabs: Collaborateur[], label: string) => {
    if (collabs.length === 0) return null;
    return (
      <>
        <tr className="bg-primary/10">
          <td colSpan={sessions.length * 2 + 4} className="px-3 py-2 font-bold text-sm text-primary">
            {label} ({collabs.length})
          </td>
        </tr>
        {collabs.map((collab, idx) => {
          const cumul = getCumulForCollab(collab);
          const pct = sessions.length > 0 ? Math.round((cumul / sessions.length) * 100) : 0;
          return (
            <tr key={collab.id} className="border-b hover:bg-muted/30">
              <td className="px-3 py-1 text-sm font-medium whitespace-nowrap">{String(idx + 1).padStart(2, '0')}</td>
              <td className="px-3 py-1 text-sm whitespace-nowrap">{collab.nom} {collab.prenom}</td>
              <td className="px-3 py-1 text-sm text-muted-foreground whitespace-nowrap">
                {collab.type === 'employe' ? collab.poste || '-' : collab.vehicule_assigne || 'Réserve'}
              </td>
              {sessions.map(session => (
                <React.Fragment key={session.id}>
                  <td className="px-1 py-1 text-center">
                    <Checkbox
                      checked={isPresent(session.id, collab)}
                      onCheckedChange={(checked) => handleToggle(session.id, collab, !!checked)}
                    />
                  </td>
                  <td className="px-1 py-1">
                    {isPresent(session.id, collab) && (
                      <Input
                        type="date"
                        className="h-7 text-xs w-[120px]"
                        value={getDatePresence(session.id, collab)}
                        onChange={(e) => handleDateChange(session.id, collab, e.target.value)}
                      />
                    )}
                  </td>
                </React.Fragment>
              ))}
              <td className="px-3 py-1 text-center font-bold text-sm">{cumul}</td>
              <td className="px-3 py-1 text-center text-sm">
                <Badge variant={pct === 100 ? 'default' : pct >= 50 ? 'secondary' : 'destructive'}>
                  {pct}%
                </Badge>
              </td>
            </tr>
          );
        })}
      </>
    );
  };

  if (loadingSessions) return <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card><CardContent className="p-3 text-center">
          <p className="text-2xl font-bold">{stats.totalPersonnes}</p>
          <p className="text-xs text-muted-foreground">Personnel planifié</p>
        </CardContent></Card>
        <Card><CardContent className="p-3 text-center">
          <p className="text-2xl font-bold">{stats.reunionsPlanifiees}</p>
          <p className="text-xs text-muted-foreground">Réunions planifiées</p>
        </CardContent></Card>
        <Card><CardContent className="p-3 text-center">
          <p className="text-2xl font-bold text-green-600">{stats.reunionsRealisees}</p>
          <p className="text-xs text-muted-foreground">Réunions réalisées</p>
        </CardContent></Card>
        <Card><CardContent className="p-3 text-center">
          <p className="text-2xl font-bold">{stats.totalPresences}</p>
          <p className="text-xs text-muted-foreground">Participations</p>
        </CardContent></Card>
        <Card><CardContent className="p-3 text-center">
          <p className="text-2xl font-bold text-primary">{stats.tauxParticipation}%</p>
          <p className="text-xs text-muted-foreground">Taux participation</p>
        </CardContent></Card>
      </div>

      {/* Controls */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              SDBK - Plan de suivi TBM - {tbmService.getMoisNom(mois)} {annee}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Select value={String(mois)} onValueChange={v => setMois(Number(v))}>
                <SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => (
                    <SelectItem key={i + 1} value={String(i + 1)}>{tbmService.getMoisNom(i + 1)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={String(annee)} onValueChange={v => setAnnee(Number(v))}>
                <SelectTrigger className="w-[90px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[2025, 2026, 2027].map(y => (
                    <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Session themes */}
          <div className={`grid grid-cols-1 gap-3 ${sessions.length === 5 ? 'md:grid-cols-5' : 'md:grid-cols-4'}`}>
            {sessions.map(session => (
              <div key={session.id} className="border rounded-lg p-3 space-y-2">
                <p className="font-medium text-sm">R{session.numero_reunion}</p>
                <Input
                  placeholder="Thème de la réunion"
                  value={session.theme || ''}
                  onChange={(e) => updateSessionMutation.mutate({
                    mois, annee, numero_reunion: session.numero_reunion, theme: e.target.value, date_reunion: session.date_reunion || undefined,
                  })}
                  className="h-8 text-sm"
                />
                <Input
                  type="date"
                  value={session.date_reunion || ''}
                  onChange={(e) => updateSessionMutation.mutate({
                    mois, annee, numero_reunion: session.numero_reunion, theme: session.theme || undefined, date_reunion: e.target.value,
                  })}
                  className="h-8 text-sm"
                />
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-2 top-2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} className="pl-8 h-8" />
            </div>
            <Select value={filterType} onValueChange={v => setFilterType(v as any)}>
              <SelectTrigger className="w-[150px] h-8"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="tous">Tous</SelectItem>
                <SelectItem value="employe">Personnel</SelectItem>
                <SelectItem value="chauffeur">Chauffeurs</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="overflow-x-auto border rounded-lg">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-3 py-2 text-left">N°</th>
                  <th className="px-3 py-2 text-left">Nom / Prénoms</th>
                  <th className="px-3 py-2 text-left">Statut</th>
                  {sessions.map(s => (
                    <th key={s.id} colSpan={2} className="px-2 py-2 text-center">
                      <div>R{s.numero_reunion}</div>
                      {s.theme && <div className="text-xs font-normal text-muted-foreground truncate max-w-[120px]">{s.theme}</div>}
                    </th>
                  ))}
                  <th className="px-3 py-2 text-center">Cumul</th>
                  <th className="px-3 py-2 text-center">%</th>
                </tr>
              </thead>
              <tbody>
                {(filterType === 'tous' || filterType === 'employe') && renderCollabRows(employesFiltered, 'Personnel')}
                {(filterType === 'tous' || filterType === 'chauffeur') && renderCollabRows(chauffeursFiltered, 'Conducteurs')}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
