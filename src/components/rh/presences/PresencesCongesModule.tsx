import React, { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { PointagesList } from '../temps/PointagesList';
import { CongesList } from '../temps/CongesList';
import { AbsencesList } from '../AbsencesList';
import { HeuresSupList } from '../temps/HeuresSupList';
import { JoursFeriesList } from '../temps/JoursFeriesList';
import { sirhService } from '@/services/sirhService';
import { rhService } from '@/services/rh';

const SoldesConges = () => {
  const qc = useQueryClient();
  const annee = new Date().getFullYear();

  const { data: employes } = useQuery({ queryKey: ['employes'], queryFn: () => rhService.getEmployes() });
  const { data: droits } = useQuery({ queryKey: ['droits-conges', annee], queryFn: () => sirhService.getDroitsConges(annee) });

  const map = useMemo(() => {
    const m: Record<string, any> = {};
    (droits || []).forEach((d: any) => { m[d.employe_id] = d; });
    return m;
  }, [droits]);

  const save = async (employeId: string, acquis: number, consommes: number) => {
    try {
      await sirhService.setDroitConge(employeId, annee, acquis, consommes);
      qc.invalidateQueries({ queryKey: ['droits-conges', annee] });
      toast.success('Solde mis à jour');
    } catch (e: any) {
      toast.error(e.message || 'Erreur');
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Compteurs de congés {annee}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Collaborateur</TableHead>
              <TableHead>Service</TableHead>
              <TableHead className="w-36">Jours acquis</TableHead>
              <TableHead className="w-36">Jours consommés</TableHead>
              <TableHead className="w-32">Solde</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {((employes || []) as any[]).map((e) => {
              const d = map[e.id] || { jours_acquis: 0, jours_consommes: 0 };
              const solde = Number(d.jours_acquis || 0) - Number(d.jours_consommes || 0);
              return (
                <TableRow key={e.id}>
                  <TableCell className="font-medium">{e.nom} {e.prenom}</TableCell>
                  <TableCell>{e.service}</TableCell>
                  <TableCell>
                    <Input
                      type="number" className="h-8 w-28" defaultValue={d.jours_acquis || 0}
                      onBlur={(ev) => save(e.id, Number(ev.target.value), Number(d.jours_consommes || 0))}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number" className="h-8 w-28" defaultValue={d.jours_consommes || 0}
                      onBlur={(ev) => save(e.id, Number(d.jours_acquis || 0), Number(ev.target.value))}
                    />
                  </TableCell>
                  <TableCell>
                    <Badge className={solde < 0 ? 'bg-destructive text-white' : 'bg-emerald-600 text-white hover:bg-emerald-600'}>
                      {solde} j
                    </Badge>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export const PresencesCongesModule = () => {
  const [tab, setTab] = useState('pointages');
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold">Présences & Congés</h2>
        <p className="text-sm text-muted-foreground">Pointages, absences, retards, heures supplémentaires et soldes de congés</p>
      </div>
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex-wrap">
          <TabsTrigger value="pointages">Pointages</TabsTrigger>
          <TabsTrigger value="absences">Absences</TabsTrigger>
          <TabsTrigger value="conges">Demandes de congé</TabsTrigger>
          <TabsTrigger value="soldes">Soldes de congés</TabsTrigger>
          <TabsTrigger value="heures-sup">Heures supplémentaires</TabsTrigger>
          <TabsTrigger value="feries">Jours fériés</TabsTrigger>
        </TabsList>
        <TabsContent value="pointages"><PointagesList /></TabsContent>
        <TabsContent value="absences"><AbsencesList /></TabsContent>
        <TabsContent value="conges"><CongesList /></TabsContent>
        <TabsContent value="soldes"><SoldesConges /></TabsContent>
        <TabsContent value="heures-sup"><HeuresSupList /></TabsContent>
        <TabsContent value="feries"><JoursFeriesList /></TabsContent>
      </Tabs>
    </div>
  );
};
