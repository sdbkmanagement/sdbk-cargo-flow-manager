import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Search, Users, Wrench, Truck } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rhService } from '@/services/rh';
import { chauffeursService } from '@/services/chauffeurs';
import {
  matriceFormationService,
  MatriceEntry,
  MODULES_ADMINISTRATION,
  MODULES_MECANICIENS,
  MODULES_CONDUCTEURS,
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
}

const MatriceTab = ({ categorie, modules, persons, personType, isLoading }: MatriceTabProps) => {
  const [search, setSearch] = useState('');
  const queryClient = useQueryClient();

  const { data: entries = [] } = useQuery({
    queryKey: ['matrice-formation', categorie],
    queryFn: () => matriceFormationService.getByCategorie(categorie),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ personId, moduleNom, completed }: { personId: string; moduleNom: string; completed: boolean }) =>
      matriceFormationService.toggleModule(personType, personId, categorie, moduleNom, completed),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matrice-formation', categorie] });
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
    return Math.round((done / modules.length) * 100);
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

      {filtered.length === 0 ? (
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
  const { data: employes = [], isLoading: loadingEmployes } = useQuery({
    queryKey: ['employes-matrice'],
    queryFn: () => rhService.getEmployes(),
  });

  const { data: chauffeurs = [], isLoading: loadingChauffeurs } = useQuery({
    queryKey: ['chauffeurs'],
    queryFn: chauffeursService.getAll,
  });

  const adminPersons: Person[] = employes.map((e: any) => ({
    id: e.id,
    nom: e.nom,
    prenom: e.prenom,
    fonction: e.poste || e.service,
    statut: e.statut,
  }));

  // For mécaniciens, filter employes with maintenance-related fonctions
  const mecaKeywords = ['mécanicien', 'mecanicien', 'electricien', 'pneumatique', 'riveur', 'graisseur', 'vulcanisateur', 'vulganisateur', 'chef garage', 'chef mécanicien'];
  const mecaPersons: Person[] = employes
    .filter((e: any) => {
      const poste = (e.poste || '').toLowerCase();
      const service = (e.service || '').toLowerCase();
      return mecaKeywords.some(k => poste.includes(k) || service.includes(k)) || service === 'maintenance';
    })
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
        <CardTitle>Matrice de Formation 2026</CardTitle>
        <p className="text-sm text-muted-foreground">
          Suivi des formations pour le personnel administratif, mécaniciens et conducteurs
        </p>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="administration" className="space-y-4">
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
              modules={MODULES_ADMINISTRATION}
              persons={adminPersons}
              personType="employe"
              isLoading={loadingEmployes}
            />
          </TabsContent>
          <TabsContent value="mecaniciens">
            <MatriceTab
              categorie="mecaniciens"
              modules={MODULES_MECANICIENS}
              persons={mecaPersons.length > 0 ? mecaPersons : adminPersons}
              personType="employe"
              isLoading={loadingEmployes}
            />
          </TabsContent>
          <TabsContent value="conducteurs">
            <MatriceTab
              categorie="conducteurs"
              modules={MODULES_CONDUCTEURS}
              persons={conducteurPersons}
              personType="chauffeur"
              isLoading={loadingChauffeurs}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
