import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, 
  FileCheck, 
  AlertTriangle, 
  BarChart3, 
  Plus,
  CheckCircle2,
  XCircle,
  Clock,
  Truck
} from 'lucide-react';
import { hseqService } from '@/services/hseqService';
import { useHSEQPermissions } from '@/hooks/useHSEQPermissions';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const HSEQ: React.FC = () => {
  const { canViewHSEQ, canManageControls } = useHSEQPermissions();
  const [activeTab, setActiveTab] = useState('dashboard');

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['hseq-stats'],
    queryFn: () => hseqService.getStats(),
    enabled: canViewHSEQ,
  });

  const { data: controls, isLoading: controlsLoading } = useQuery({
    queryKey: ['stl-controls'],
    queryFn: () => hseqService.getControls(),
    enabled: canViewHSEQ,
  });

  const { data: nonConformites } = useQuery({
    queryKey: ['non-conformites'],
    queryFn: () => hseqService.getNonConformites(),
    enabled: canViewHSEQ,
  });

  if (!canViewHSEQ) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Accès non autorisé</p>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Taux de conformité',
      value: `${stats?.tauxConformite.toFixed(1) || 0}%`,
      icon: CheckCircle2,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Contrôles effectués',
      value: stats?.totalControles || 0,
      icon: FileCheck,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Véhicules refusés',
      value: stats?.refuses || 0,
      icon: XCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
    },
    {
      title: 'NC ouvertes',
      value: stats?.ncOuvertes || 0,
      icon: AlertTriangle,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Module HSEQ</h1>
            <p className="text-muted-foreground">Hygiène, Sécurité, Environnement & Qualité</p>
          </div>
        </div>
        {canManageControls && (
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nouveau contrôle
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={cn('p-2 rounded-lg', stat.bgColor)}>
                  <stat.icon className={cn('h-5 w-5', stat.color)} />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.title}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="dashboard">
            <BarChart3 className="h-4 w-4 mr-2" />
            Tableau de bord
          </TabsTrigger>
          <TabsTrigger value="controls">
            <FileCheck className="h-4 w-4 mr-2" />
            SAFE TO LOAD
          </TabsTrigger>
          <TabsTrigger value="nc">
            <AlertTriangle className="h-4 w-4 mr-2" />
            Non-conformités
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Derniers contrôles</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {controls?.slice(0, 5).map((control) => (
                  <div key={control.id} className="flex items-center justify-between p-2 border rounded">
                    <div className="flex items-center gap-2">
                      <Truck className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{control.vehicule?.numero}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(control.date_controle), 'dd/MM HH:mm')}
                      </span>
                      <Badge variant={
                        control.statut === 'conforme' ? 'default' :
                        control.statut === 'refuse' ? 'destructive' : 'secondary'
                      } className={control.statut === 'conforme' ? 'bg-green-600' : ''}>
                        {control.statut}
                      </Badge>
                    </div>
                  </div>
                ))}
                {(!controls || controls.length === 0) && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Aucun contrôle effectué
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">NC critiques</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {nonConformites?.filter(nc => nc.type_nc === 'critique').slice(0, 5).map((nc) => (
                  <div key={nc.id} className="flex items-center justify-between p-2 border rounded border-red-200 bg-red-50/50">
                    <div>
                      <p className="font-medium text-sm">{nc.numero}</p>
                      <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                        {nc.description}
                      </p>
                    </div>
                    <Badge variant="destructive">{nc.statut}</Badge>
                  </div>
                ))}
                {(!nonConformites || nonConformites.filter(nc => nc.type_nc === 'critique').length === 0) && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Aucune NC critique
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="controls">
          <Card>
            <CardHeader>
              <CardTitle>Historique des contrôles SAFE TO LOAD</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {controls?.map((control) => (
                  <div key={control.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="font-medium">{control.vehicule?.numero}</p>
                        <p className="text-sm text-muted-foreground">
                          {control.chauffeur?.prenom} {control.chauffeur?.nom}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-sm">
                          {format(new Date(control.date_controle), 'PPp', { locale: fr })}
                        </p>
                        {control.lieu_controle && (
                          <p className="text-xs text-muted-foreground">{control.lieu_controle}</p>
                        )}
                      </div>
                      <Badge variant={
                        control.statut === 'conforme' ? 'default' :
                        control.statut === 'refuse' ? 'destructive' : 'secondary'
                      } className={control.statut === 'conforme' ? 'bg-green-600' : ''}>
                        {control.statut}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="nc">
          <Card>
            <CardHeader>
              <CardTitle>Non-conformités</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {nonConformites?.map((nc) => (
                  <div key={nc.id} className={cn(
                    'flex items-center justify-between p-3 border rounded-lg',
                    nc.type_nc === 'critique' && 'border-red-200 bg-red-50/30'
                  )}>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{nc.numero}</p>
                        <Badge variant={
                          nc.type_nc === 'critique' ? 'destructive' :
                          nc.type_nc === 'majeure' ? 'default' : 'secondary'
                        }>
                          {nc.type_nc}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{nc.description}</p>
                    </div>
                    <Badge variant="outline">{nc.statut}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default HSEQ;
