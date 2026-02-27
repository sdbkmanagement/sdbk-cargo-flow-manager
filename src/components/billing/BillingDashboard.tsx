
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Euro, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  TrendingUp,
  Users,
  Calendar,
  Calculator,
  Filter,
  X
} from 'lucide-react';
import { billingService } from '@/services/billing';
import { toast } from '@/hooks/use-toast';

type FilterMode = 'all' | 'month' | 'period';

export const BillingDashboard = () => {
  const [stats, setStats] = useState({
    totalFacture: 0,
    facturesEnAttente: 0,
    facturesEnRetard: 0,
    facturesReglees: 0,
    totalDevis: 0,
    chiffreAffaireMois: 0
  });
  const [loading, setLoading] = useState(true);

  // Filtres
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');

  const months = [
    { value: '01', label: 'Janvier' },
    { value: '02', label: 'Février' },
    { value: '03', label: 'Mars' },
    { value: '04', label: 'Avril' },
    { value: '05', label: 'Mai' },
    { value: '06', label: 'Juin' },
    { value: '07', label: 'Juillet' },
    { value: '08', label: 'Août' },
    { value: '09', label: 'Septembre' },
    { value: '10', label: 'Octobre' },
    { value: '11', label: 'Novembre' },
    { value: '12', label: 'Décembre' },
  ];

  const years = Array.from({ length: 5 }, (_, i) => {
    const y = new Date().getFullYear() - i;
    return { value: y.toString(), label: y.toString() };
  });

  useEffect(() => {
    loadStats();
  }, []);

  const getFilters = (): { dateDebut?: string; dateFin?: string } | undefined => {
    if (filterMode === 'month' && selectedMonth && selectedYear) {
      const monthNum = parseInt(selectedMonth);
      const yearNum = parseInt(selectedYear);
      const start = `${selectedYear}-${selectedMonth}-01`;
      const end = monthNum === 12 
        ? `${yearNum + 1}-01-01` 
        : `${selectedYear}-${(monthNum + 1).toString().padStart(2, '0')}-01`;
      return { dateDebut: start, dateFin: end };
    }
    if (filterMode === 'period' && dateDebut && dateFin) {
      return { dateDebut, dateFin };
    }
    return undefined;
  };

  const loadStats = async (filters?: { dateDebut?: string; dateFin?: string }) => {
    try {
      setLoading(true);
      const data = await billingService.getStats(filters);
      setStats(data);
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les statistiques.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const applyFilter = () => {
    const filters = getFilters();
    loadStats(filters);
  };

  const resetFilter = () => {
    setFilterMode('all');
    setSelectedMonth('');
    setSelectedYear(new Date().getFullYear().toString());
    setDateDebut('');
    setDateFin('');
    loadStats();
  };

  const getFilterLabel = () => {
    if (filterMode === 'month' && selectedMonth && selectedYear) {
      const monthLabel = months.find(m => m.value === selectedMonth)?.label;
      return `${monthLabel} ${selectedYear}`;
    }
    if (filterMode === 'period' && dateDebut && dateFin) {
      return `Du ${new Date(dateDebut).toLocaleDateString('fr-FR')} au ${new Date(dateFin).toLocaleDateString('fr-FR')}`;
    }
    return 'Toutes les données';
  };

  const recentActivity = [
    { action: "Nouvelles factures créées", date: "Disponibles dans l'onglet Factures", type: "info" },
    { action: "Nouveaux devis créés", date: "Disponibles dans l'onglet Devis", type: "info" },
    { action: "Système connecté à la base de données", date: "Toutes les données sont sauvegardées", type: "success" }
  ];

  if (loading) {
    return <div className="flex justify-center p-8">Chargement du tableau de bord...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Filtres */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filtrer les données
            {filterMode !== 'all' && (
              <Badge variant="secondary" className="ml-2">{getFilterLabel()}</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <Label className="text-xs">Type de filtre</Label>
              <Select value={filterMode} onValueChange={(v: FilterMode) => setFilterMode(v)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les données</SelectItem>
                  <SelectItem value="month">Par mois</SelectItem>
                  <SelectItem value="period">Par période</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {filterMode === 'month' && (
              <>
                <div>
                  <Label className="text-xs">Mois</Label>
                  <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Mois" />
                    </SelectTrigger>
                    <SelectContent>
                      {months.map(m => (
                        <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Année</Label>
                  <Select value={selectedYear} onValueChange={setSelectedYear}>
                    <SelectTrigger className="w-[100px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {years.map(y => (
                        <SelectItem key={y.value} value={y.value}>{y.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {filterMode === 'period' && (
              <>
                <div>
                  <Label className="text-xs">Date début</Label>
                  <Input type="date" value={dateDebut} onChange={e => setDateDebut(e.target.value)} className="w-[160px]" />
                </div>
                <div>
                  <Label className="text-xs">Date fin</Label>
                  <Input type="date" value={dateFin} onChange={e => setDateFin(e.target.value)} className="w-[160px]" />
                </div>
              </>
            )}

            {filterMode !== 'all' && (
              <div className="flex gap-2">
                <Button size="sm" onClick={applyFilter}>
                  <Filter className="h-3 w-3 mr-1" />
                  Appliquer
                </Button>
                <Button size="sm" variant="outline" onClick={resetFilter}>
                  <X className="h-3 w-3 mr-1" />
                  Réinitialiser
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Statistiques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total facturé</CardTitle>
            <Euro className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalFacture.toLocaleString('fr-FR')} GNF</div>
            <p className="text-xs text-muted-foreground">Toutes factures confondues</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Factures en attente</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.facturesEnAttente}</div>
            <p className="text-xs text-muted-foreground">À traiter</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Factures en retard</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats.facturesEnRetard}</div>
            <p className="text-xs text-muted-foreground">Relance requise</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Devis créés</CardTitle>
            <Calculator className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats.totalDevis}</div>
            <p className="text-xs text-muted-foreground">Total des devis</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Chiffre d'affaires
            </CardTitle>
            <CardDescription>Performance financière {filterMode !== 'all' ? `– ${getFilterLabel()}` : 'actuelle'}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600 mb-2">
              {stats.chiffreAffaireMois.toLocaleString('fr-FR')} GNF
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Factures créées</span>
                <span>{stats.facturesEnAttente + stats.facturesReglees}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Devis en attente</span>
                <span>{stats.totalDevis}</span>
              </div>
              <p className="text-xs text-muted-foreground">Module facturation opérationnel</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Répartition des factures
            </CardTitle>
            <CardDescription>État actuel des factures</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                  <span className="text-sm font-medium">En attente</span>
                </div>
                <span className="text-sm font-bold">{stats.facturesEnAttente}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <span className="text-sm font-medium">Réglées</span>
                </div>
                <span className="text-sm font-bold">{stats.facturesReglees}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-500"></div>
                  <span className="text-sm font-medium">En retard</span>
                </div>
                <span className="text-sm font-bold">{stats.facturesEnRetard}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            État du système
          </CardTitle>
          <CardDescription>Module facturation connecté à la base de données</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentActivity.map((activity, index) => (
              <div key={index} className="flex items-center justify-between py-2 border-b last:border-b-0">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${
                    activity.type === 'success' ? 'bg-green-500' :
                    activity.type === 'warning' ? 'bg-yellow-500' :
                    'bg-blue-500'
                  }`}></div>
                  <span className="text-sm">{activity.action}</span>
                </div>
                <span className="text-xs text-muted-foreground">{activity.date}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
