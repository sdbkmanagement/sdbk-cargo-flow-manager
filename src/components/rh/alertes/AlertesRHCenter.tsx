import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertTriangle, Bell, Settings2 } from 'lucide-react';
import { toast } from 'sonner';
import { sirhService } from '@/services/sirhService';

const prioriteBadge = (p: string) => {
  if (p === 'critique') return <Badge variant="destructive">Critique</Badge>;
  if (p === 'importante') return <Badge className="bg-amber-500 text-white hover:bg-amber-500">Importante</Badge>;
  return <Badge variant="secondary">Normale</Badge>;
};

const CATEGORIES: Record<string, string> = {
  documents: 'Documents',
  carriere: 'Carrière',
  formation: 'Formation',
  performance: 'Performance',
};

export const AlertesRHCenter = () => {
  const qc = useQueryClient();
  const [categorie, setCategorie] = useState('toutes');

  const { data: alertes, isLoading } = useQuery({
    queryKey: ['rh-alertes'],
    queryFn: () => sirhService.getAlertes(),
    refetchInterval: 60000,
  });

  const { data: config } = useQuery({
    queryKey: ['rh-alertes-config'],
    queryFn: () => sirhService.getAlertesConfig(),
  });

  const list = (alertes || []).filter((a) => categorie === 'toutes' || a.categorie === categorie);

  const updateConfig = async (id: string, updates: any) => {
    try {
      await sirhService.updateAlerteConfig(id, updates);
      qc.invalidateQueries({ queryKey: ['rh-alertes-config'] });
      qc.invalidateQueries({ queryKey: ['rh-alertes'] });
      toast.success('Configuration mise à jour');
    } catch (e: any) {
      toast.error(e.message || 'Erreur de mise à jour');
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold">Alertes RH</h2>
        <p className="text-sm text-muted-foreground">Moteur d'alertes documents, carrière, formation et performance</p>
      </div>

      <Tabs defaultValue="alertes">
        <TabsList>
          <TabsTrigger value="alertes"><Bell className="w-4 h-4 mr-2" />Alertes ({(alertes || []).length})</TabsTrigger>
          <TabsTrigger value="config"><Settings2 className="w-4 h-4 mr-2" />Configuration</TabsTrigger>
        </TabsList>

        <TabsContent value="alertes" className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {['toutes', ...Object.keys(CATEGORIES)].map((c) => (
              <Button key={c} size="sm" variant={categorie === c ? 'default' : 'outline'} onClick={() => setCategorie(c)}>
                {c === 'toutes' ? 'Toutes' : CATEGORIES[c]}
              </Button>
            ))}
          </div>

          <Card>
            <CardContent className="p-0">
              {isLoading ? (
                <p className="p-6 text-sm text-muted-foreground">Chargement...</p>
              ) : list.length === 0 ? (
                <p className="p-6 text-sm text-muted-foreground text-center">Aucune alerte active</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Priorité</TableHead>
                      <TableHead>Collaborateur</TableHead>
                      <TableHead>Service</TableHead>
                      <TableHead>Alerte</TableHead>
                      <TableHead>Échéance</TableHead>
                      <TableHead className="text-right">Jours</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {list.map((a, i) => (
                      <TableRow key={`${a.employe_id}-${a.type_alerte}-${i}`}>
                        <TableCell>{prioriteBadge(a.priorite)}</TableCell>
                        <TableCell className="font-medium">{a.nom_complet}</TableCell>
                        <TableCell>{a.service}</TableCell>
                        <TableCell className="text-sm">{a.message}</TableCell>
                        <TableCell>{a.date_echeance ? new Date(a.date_echeance).toLocaleDateString('fr-FR') : '—'}</TableCell>
                        <TableCell className={`text-right font-semibold ${a.jours_restants < 0 ? 'text-destructive' : a.jours_restants <= 15 ? 'text-amber-600' : ''}`}>
                          {a.jours_restants < 0 ? `${Math.abs(a.jours_restants)} j de retard` : `${a.jours_restants} j`}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="config">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-primary" />
                Délais de prévenance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Alerte</TableHead>
                    <TableHead>Catégorie</TableHead>
                    <TableHead className="w-40">Délai (jours)</TableHead>
                    <TableHead className="w-24">Active</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(config || []).map((c: any) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.libelle}</TableCell>
                      <TableCell>{CATEGORIES[c.categorie] || c.categorie}</TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min={1}
                          defaultValue={c.delai_jours}
                          className="h-8 w-28"
                          onBlur={(e) => {
                            const v = parseInt(e.target.value, 10);
                            if (!Number.isNaN(v) && v !== c.delai_jours) updateConfig(c.id, { delai_jours: v });
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Switch checked={c.actif} onCheckedChange={(v) => updateConfig(c.id, { actif: v })} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
