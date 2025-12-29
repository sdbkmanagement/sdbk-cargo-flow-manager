import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Shield, 
  FileCheck, 
  AlertTriangle, 
  BarChart3, 
  Plus,
  CheckCircle2,
  XCircle,
  Truck,
  Download,
  FileSpreadsheet,
  FileText,
  RefreshCw,
  User
} from 'lucide-react';
import { hseqService } from '@/services/hseqService';
import { useHSEQPermissions } from '@/hooks/useHSEQPermissions';
import { SafeToLoadForm } from '@/components/hseq/SafeToLoadForm';
import { supabase } from '@/lib/supabase';
import { 
  exportSTLControlsToExcel, 
  exportNCToExcel, 
  exportHSEQStatsToExcel,
  generateSTLReportPDF,
  generateNCReportPDF
} from '@/utils/hseqExportUtils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const HSEQ: React.FC = () => {
  const { canViewHSEQ, canManageControls, canExport } = useHSEQPermissions();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showNewControlDialog, setShowNewControlDialog] = useState(false);
  const [showControlForm, setShowControlForm] = useState(false);
  const [selectedVehicule, setSelectedVehicule] = useState<string>('');
  const [selectedChauffeur, setSelectedChauffeur] = useState<string>('');

  // Charger les véhicules disponibles
  const { data: vehicules } = useQuery({
    queryKey: ['vehicules-hseq'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vehicules')
        .select('id, numero, immatriculation, remorque_immatriculation')
        .in('statut', ['disponible', 'validation_requise', 'en_mission'])
        .order('numero');
      if (error) throw error;
      return data;
    },
    enabled: canManageControls,
  });

  // Charger le chauffeur assigné au véhicule sélectionné
  const { data: chauffeurAssigne } = useQuery({
    queryKey: ['chauffeur-assigne', selectedVehicule],
    queryFn: async () => {
      // Chercher l'affectation active pour ce véhicule
      const { data, error } = await supabase
        .from('affectations_chauffeurs')
        .select('chauffeur_id, chauffeurs(id, nom, prenom)')
        .eq('vehicule_id', selectedVehicule)
        .eq('statut', 'active')
        .maybeSingle();
      if (error) throw error;
      const chauffeurData = data?.chauffeurs;
      if (chauffeurData && typeof chauffeurData === 'object' && !Array.isArray(chauffeurData)) {
        return chauffeurData as { id: string; nom: string; prenom: string };
      }
      return null;
    },
    enabled: !!selectedVehicule && canManageControls,
  });

  // Auto-sélectionner le chauffeur quand le véhicule change
  React.useEffect(() => {
    if (chauffeurAssigne) {
      setSelectedChauffeur(chauffeurAssigne.id);
    } else {
      setSelectedChauffeur('');
    }
  }, [chauffeurAssigne]);

  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useQuery({
    queryKey: ['hseq-stats'],
    queryFn: () => hseqService.getStats(),
    enabled: canViewHSEQ,
  });

  const { data: controls, isLoading: controlsLoading, refetch: refetchControls } = useQuery({
    queryKey: ['stl-controls'],
    queryFn: () => hseqService.getControls(),
    enabled: canViewHSEQ,
  });

  const { data: nonConformites, refetch: refetchNC } = useQuery({
    queryKey: ['non-conformites'],
    queryFn: () => hseqService.getNonConformites(),
    enabled: canViewHSEQ,
  });

  const handleRefresh = () => {
    refetchStats();
    refetchControls();
    refetchNC();
    toast.success('Données actualisées');
  };

  const handleExportExcel = (type: 'stl' | 'nc' | 'full') => {
    try {
      if (type === 'stl' && controls) {
        exportSTLControlsToExcel(controls);
        toast.success('Export Excel des contrôles STL généré');
      } else if (type === 'nc' && nonConformites) {
        exportNCToExcel(nonConformites);
        toast.success('Export Excel des NC généré');
      } else if (type === 'full' && stats && controls && nonConformites) {
        exportHSEQStatsToExcel(stats, controls, nonConformites);
        toast.success('Rapport HSEQ complet exporté');
      }
    } catch (error) {
      console.error('Erreur export:', error);
      toast.error('Erreur lors de l\'export');
    }
  };

  const handleStartControl = () => {
    if (!selectedVehicule || !selectedChauffeur) {
      toast.error('Veuillez sélectionner un véhicule et un chauffeur');
      return;
    }
    setShowNewControlDialog(false);
    setShowControlForm(true);
  };

  const handleControlComplete = () => {
    setShowControlForm(false);
    setSelectedVehicule('');
    setSelectedChauffeur('');
    refetchControls();
    refetchStats();
    refetchNC();
  };

  const handleControlCancel = () => {
    setShowControlForm(false);
    setSelectedVehicule('');
    setSelectedChauffeur('');
  };

  // Afficher le formulaire de contrôle en plein écran
  if (showControlForm) {
    const vehiculeInfo = vehicules?.find(v => v.id === selectedVehicule);
    
    return (
      <div className="fixed inset-0 z-50 bg-background overflow-auto">
        <div className="max-w-2xl mx-auto p-4">
          <SafeToLoadForm
            vehiculeId={selectedVehicule}
            chauffeurId={selectedChauffeur}
            vehiculeInfo={vehiculeInfo ? { 
              numero: vehiculeInfo.numero || '', 
              immatriculation: vehiculeInfo.immatriculation || '' 
            } : undefined}
            chauffeurInfo={chauffeurAssigne ? { 
              nom: chauffeurAssigne.nom, 
              prenom: chauffeurAssigne.prenom 
            } : undefined}
            onComplete={handleControlComplete}
            onCancel={handleControlCancel}
          />
        </div>
      </div>
    );
  }

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
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Module HSEQ</h1>
            <p className="text-muted-foreground">Hygiène, Sécurité, Environnement & Qualité</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
          
          {canExport && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Exporter
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleExportExcel('full')}>
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Rapport complet (Excel)
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleExportExcel('stl')}>
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Contrôles STL (Excel)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExportExcel('nc')}>
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Non-conformités (Excel)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          
          {canManageControls && (
            <Button onClick={() => setShowNewControlDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nouveau contrôle
            </Button>
          )}
        </div>
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
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Historique des contrôles SAFE TO LOAD</CardTitle>
              {canExport && controls && controls.length > 0 && (
                <Button variant="outline" size="sm" onClick={() => handleExportExcel('stl')}>
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Excel
                </Button>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {controls?.map((control) => (
                  <div key={control.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors">
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
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => generateSTLReportPDF(control)}
                        title="Générer PDF"
                      >
                        <FileText className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                {(!controls || controls.length === 0) && (
                  <p className="text-center text-muted-foreground py-8">
                    Aucun contrôle SAFE TO LOAD enregistré
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="nc">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Non-conformités</CardTitle>
              {canExport && nonConformites && nonConformites.length > 0 && (
                <Button variant="outline" size="sm" onClick={() => handleExportExcel('nc')}>
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Excel
                </Button>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {nonConformites?.map((nc) => (
                  <div key={nc.id} className={cn(
                    'flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors',
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
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{nc.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{nc.statut}</Badge>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => generateNCReportPDF(nc)}
                        title="Générer PDF"
                      >
                        <FileText className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                {(!nonConformites || nonConformites.length === 0) && (
                  <p className="text-center text-muted-foreground py-8">
                    Aucune non-conformité enregistrée
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog pour nouveau contrôle */}
      <Dialog open={showNewControlDialog} onOpenChange={setShowNewControlDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileCheck className="h-5 w-5 text-primary" />
              Nouveau contrôle SAFE TO LOAD
            </DialogTitle>
            <DialogDescription>
              Sélectionnez le véhicule et le chauffeur pour démarrer le contrôle.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Truck className="h-4 w-4" />
                Véhicule
              </Label>
              <Select value={selectedVehicule} onValueChange={setSelectedVehicule}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un véhicule" />
                </SelectTrigger>
                <SelectContent>
                  {vehicules?.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.numero} - {v.immatriculation}
                      {v.remorque_immatriculation ? ` - Citerne ${v.remorque_immatriculation}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Chauffeur assigné
              </Label>
              <div className="flex items-center gap-2 p-3 bg-muted rounded-md border">
                {chauffeurAssigne ? (
                  <span className="text-foreground font-medium">
                    {chauffeurAssigne.prenom} {chauffeurAssigne.nom}
                  </span>
                ) : selectedVehicule ? (
                  <span className="text-muted-foreground italic">
                    Aucun chauffeur assigné à ce véhicule
                  </span>
                ) : (
                  <span className="text-muted-foreground italic">
                    Sélectionnez d'abord un véhicule
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowNewControlDialog(false)}>
              Annuler
            </Button>
            <Button 
              onClick={handleStartControl}
              disabled={!selectedVehicule || !selectedChauffeur}
            >
              Démarrer le contrôle
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default HSEQ;
