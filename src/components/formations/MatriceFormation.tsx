import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Search, Users, Wrench, Truck, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { MatricePlanDialog } from './MatricePlanDialog';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { chauffeursService } from '@/services/chauffeurs';
import {
  matriceFormationService,
  MatriceEntry,
} from '@/services/matriceFormationService';
import { toast } from '@/hooks/use-toast';

interface Person {
  id: string;
  nom: string;
  prenom: string;
  fonction?: string;
  statut?: string;
}

interface MatriceTabProps {
  categorie: string;
  modules: string[];
  persons: Person[];
  personType: 'employe' | 'chauffeur';
  isLoading: boolean;
  annee: number;
  canManage: boolean;
}

const MatriceTab = ({ categorie, modules, persons, personType, isLoading, annee, canManage }: MatriceTabProps) => {
  const [search, setSearch] = useState('');
  const queryClient = useQueryClient();

  const { data: entries = [] } = useQuery({
    queryKey: ['matrice-formation', categorie, annee],
    queryFn: () => matriceFormationService.getByCategorie(categorie, annee),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ personId, moduleNom, completed }: { personId: string; moduleNom: string; completed: boolean }) =>
      matriceFormationService.toggleModule(personType, personId, categorie, moduleNom, completed, annee),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matrice-formation', categorie, annee] });
    },
    onError: () => {
      toast({ title: 'Erreur', description: 'Impossible de mettre à jour', variant: 'destructive' });
    },
  });

  const entryMap = new Map<string, boolean>();
  entries.forEach((e: MatriceEntry) => {
    entryMap.set(`${e.person_id}-${e.module_nom}`, e.completed);
  });

  const searchLower = search.toLowerCase();
  const filtered = persons.filter(p => {
    if (!search) return true;
    return (
      p.nom?.toLowerCase().includes(searchLower) ||
      p.prenom?.toLowerCase().includes(searchLower) ||
      p.fonction?.toLowerCase().includes(searchLower)
    );
  });

  const getPersonScore = (personId: string) => {
    let done = 0;
    modules.forEach(m => {
      if (entryMap.get(`${personId}-${m}`)) done++;
    });
    return modules.length ? Math.round((done / modules.length) * 100) : 0;
  };

  if (isLoading) {
    return <p className="text-center py-8 text-muted-foreground">Chargement...</p>;
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          placeholder="Rechercher par nom, prénom ou fonction..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {modules.length === 0 ? (
        <p className="text-center py-8 text-muted-foreground">Aucune formation au plan {annee} pour cette catégorie.</p>
      ) : filtered.length === 0 ? (
        <p className="text-center py-8 text-muted-foreground">Aucune personne trouvée</p>
      ) : (
        <div className="overflow-x-auto border rounded-lg">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="text-left p-2 font-medium sticky left-0 bg-muted/30 min-w-[50px] text-xs">N°</th>
                <th className="text-left p-2 font-medium sticky left-[50px] bg-muted/30 min-w-[180px] text-xs">Nom/Prénom</th>
                <th className="text-left p-2 font-medium min-w-[120px] text-xs">Fonction</th>
                {modules.map(m => (
                  <th key={m} className="text-center p-2 font-medium min-w-[90px]">
                    <span className="text-[10px] leading-tight block">{m}</span>
                  </th>
                ))}
                <th className="text-center p-2 font-medium min-w-[60px] text-xs">Total</th>
                <th className="text-center p-2 font-medium min-w-[60px] text-xs">Suivi</th>
                <th className="text-center p-2 font-medium min-w-[70px] text-xs">%</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((person, idx) => {
                const score = getPersonScore(person.id);
                const done = modules.filter(m => entryMap.get(`${person.id}-${m}`)).length;
                const scoreColor = score === 100
                  ? 'text-green-600 bg-green-50'
                  : score >= 50
                    ? 'text-orange-600 bg-orange-50'
                    : 'text-red-600 bg-red-50';

                return (
                  <tr key={person.id} className="border-b hover:bg-muted/20 transition-colors">
                    <td className="p-2 sticky left-0 bg-background text-xs text-muted-foreground">{idx + 1}</td>
                    <td className="p-2 sticky left-[50px] bg-background">
                      <p className="font-medium text-xs">{person.nom} {person.prenom}</p>
                    </td>
                    <td className="p-2 text-xs text-muted-foreground">{person.fonction || '-'}</td>
                    {modules.map(m => {
                      const isChecked = entryMap.get(`${person.id}-${m}`) || false;
                      return (
                        <td key={m} className="p-2 text-center">
                          <Checkbox
                            checked={isChecked}
                            disabled={!canManage || toggleMutation.isPending}
                            onCheckedChange={(checked) => {
                              toggleMutation.mutate({
                                personId: person.id,
                                moduleNom: m,
                                completed: !!checked,
                              });
                            }}
                          />
                        </td>
                      );
                    })}
                    <td className="p-2 text-center text-xs font-medium">{modules.length}</td>
                    <td className="p-2 text-center text-xs font-medium">{done}</td>
                    <td className="p-2 text-center">
                      <Badge className={`${scoreColor} border-0 text-[10px]`}>
                        {score}%
                      </Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export const MatriceFormation = () => {
  const [annee, setAnnee] = useState(new Date().getFullYear());
  const [categorie, setCategorie] = useState('administration');
  const [planOpen, setPlanOpen] = useState(false);
  const { hasRole } = useAuth();
  const canManage = ['admin', 'hsecq', 'transport'].some(role => hasRole(role));
  const { data: planModules = [], isLoading: loadingModules, isError: modulesError } = useQuery({
    queryKey: ['matrice-modules', annee],
    queryFn: () => matriceFormationService.getModules(annee),
  });
  const modulesFor = (category: string) => planModules.filter(m => m.categorie === category && m.actif).map(m => m.module_nom);
  const { data: employes = [], isLoading: loadingEmployes } = useQuery({
    queryKey: ['employes-matrice'],
    queryFn: async () => {
      const { data, error } = await (supabase as any).rpc('get_formations_collaborateurs');
      if (error) throw error;
      return data || [];
    },
  });

  const { data: chauffeurs = [], isLoading: loadingChauffeurs } = useQuery({
    queryKey: ['chauffeurs'],
    queryFn: chauffeursService.getAll,
  });

  // Personnel mécanicien / maintenance : affiché uniquement dans l'onglet Mécaniciens
  const mecaKeywords = ['mécanicien', 'mecanicien', 'electricien', 'électricien', 'pneumatique', 'riveur', 'graisseur', 'vulcanisateur', 'vulganisateur', 'chef garage', 'maintenancier'];
  const isMeca = (e: any) => {
    const poste = (e.poste || '').toLowerCase();
    const service = (e.service || '').toLowerCase();
    return mecaKeywords.some(k => poste.includes(k)) || service === 'maintenance';
  };

  const adminPersons: Person[] = employes
    .filter((e: any) => !isMeca(e))
    .map((e: any) => ({
      id: e.id,
      nom: e.nom,
      prenom: e.prenom,
      fonction: e.poste || e.service,
      statut: e.statut,
    }));

  const mecaPersons: Person[] = employes
    .filter((e: any) => isMeca(e))
    .map((e: any) => ({
      id: e.id,
      nom: e.nom,
      prenom: e.prenom,
      fonction: e.poste,
      statut: e.statut,
    }));

  const conducteurPersons: Person[] = chauffeurs.map((c: any) => ({
    id: c.id,
    nom: c.nom,
    prenom: c.prenom,
    fonction: c.statut || 'Chauffeur',
    statut: c.statut,
  }));

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <CardTitle>Matrice de Formation {annee}</CardTitle>
          <div className="flex flex-wrap items-center gap-3">
            <Label htmlFor="matrice-annee">Année</Label>
            <Input id="matrice-annee" type="number" min={2000} max={2100} value={annee} className="w-24" onChange={e => {
              const value = Number(e.target.value);
              if (Number.isInteger(value) && value >= 2000 && value <= 2100) setAnnee(value);
            }} />
            {canManage && <Button onClick={() => setPlanOpen(true)} disabled={loadingModules || modulesError}><Plus className="w-4 h-4 mr-2" />Gérer les formations</Button>}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {modulesError && <p role="alert" className="text-destructive mb-4">Impossible de charger le plan de formation.</p>}
        <Tabs value={categorie} onValueChange={setCategorie} className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="administration" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Administration</span>
              <span className="sm:hidden">Admin</span>
            </TabsTrigger>
            <TabsTrigger value="mecaniciens" className="flex items-center gap-2">
              <Wrench className="w-4 h-4" />
              Mécaniciens
            </TabsTrigger>
            <TabsTrigger value="conducteurs" className="flex items-center gap-2">
              <Truck className="w-4 h-4" />
              Conducteurs
            </TabsTrigger>
          </TabsList>

          <TabsContent value="administration">
            <MatriceTab
              categorie="administration"
              modules={modulesFor('administration')}
              annee={annee}
              canManage={canManage}
              persons={adminPersons}
              personType="employe"
              isLoading={loadingEmployes || loadingModules}
            />
          </TabsContent>
          <TabsContent value="mecaniciens">
            <MatriceTab
              categorie="mecaniciens"
              modules={modulesFor('mecaniciens')}
              annee={annee}
              canManage={canManage}
              persons={mecaPersons}
              personType="employe"
              isLoading={loadingEmployes || loadingModules}
            />
          </TabsContent>
          <TabsContent value="conducteurs">
            <MatriceTab
              categorie="conducteurs"
              modules={modulesFor('conducteurs')}
              annee={annee}
              canManage={canManage}
              persons={conducteurPersons}
              personType="chauffeur"
              isLoading={loadingChauffeurs || loadingModules}
            />
          </TabsContent>
        </Tabs>
        {planOpen && <MatricePlanDialog open={planOpen} onOpenChange={setPlanOpen} annee={annee} modules={planModules} categorie={categorie} />}
      </CardContent>
    </Card>
  );
};
