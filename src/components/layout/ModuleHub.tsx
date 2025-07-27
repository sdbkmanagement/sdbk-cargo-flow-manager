import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Truck, 
  Users, 
  Route, 
  FileText, 
  Coins, 
  UserCog, 
  CheckCircle, 
  Settings,
  BarChart3,
  Bell,
  User,
  LogOut
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { statsService } from '@/services/admin/statsService';

interface ModuleTile {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  route: string;
  gradient: string;
  stats?: string;
  isNew?: boolean;
}

interface HubStats {
  vehicules: number;
  chauffeurs: number;
  missionsEnCours: number;
  factures: number;
  employes: number;
  missionsEnAttente: number;
}

export const ModuleHub: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [stats, setStats] = useState<HubStats>({
    vehicules: 0,
    chauffeurs: 0,
    missionsEnCours: 0,
    factures: 0,
    employes: 0,
    missionsEnAttente: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadHubStats = async () => {
      try {
        console.log('🔄 Loading hub stats with real data...');
        
        const hubStats = await statsService.getDashboardStats();
        const financialStats = await statsService.getFinancialStats();
        
        setStats({
          vehicules: hubStats.vehicules,
          chauffeurs: hubStats.chauffeurs,
          missionsEnCours: hubStats.missionsEnCours,
          factures: financialStats.totalFactures,
          employes: hubStats.employes,
          missionsEnAttente: hubStats.missionsEnAttente
        });
        
        console.log('✅ Hub stats loaded:', hubStats);
        
      } catch (error) {
        console.error('❌ Error loading hub stats:', error);
      } finally {
        setLoading(false);
      }
    };

    loadHubStats();
    
    // Actualiser les données toutes les 60 secondes
    const interval = setInterval(loadHubStats, 60000);
    return () => clearInterval(interval);
  }, []);

  const modules: ModuleTile[] = [
    {
      id: 'dashboard',
      title: 'Dashboard',
      description: 'Vue d\'ensemble et analytics en temps réel',
      icon: BarChart3,
      route: '/dashboard',
      gradient: 'from-violet-500 to-purple-600',
      stats: 'Temps réel'
    },
    {
      id: 'fleet',
      title: 'Flotte',
      description: 'Gestion véhicules et maintenance',
      icon: Truck,
      route: '/fleet',
      gradient: 'from-blue-500 to-cyan-600',
      stats: loading ? '...' : `${stats.vehicules} véhicules`
    },
    {
      id: 'drivers',
      title: 'Chauffeurs',
      description: 'Gestion conducteurs et documents',
      icon: Users,
      route: '/drivers',
      gradient: 'from-emerald-500 to-teal-600',
      stats: loading ? '...' : `${stats.chauffeurs} chauffeurs`
    },
    {
      id: 'missions',
      title: 'Missions',
      description: 'Planification et suivi transports',
      icon: Route,
      route: '/missions',
      gradient: 'from-orange-500 to-red-600',
      stats: loading ? '...' : `${stats.missionsEnCours} en cours`
    },
    {
      id: 'billing',
      title: 'Facturation',
      description: 'Devis, factures et paiements',
      icon: Coins,
      route: '/billing',
      gradient: 'from-yellow-500 to-orange-600',
      stats: loading ? '...' : `${stats.factures} factures`
    },
    {
      id: 'rh',
      title: 'RH',
      description: 'Ressources humaines et formations',
      icon: UserCog,
      route: '/rh',
      gradient: 'from-pink-500 to-rose-600',
      stats: loading ? '...' : `${stats.employes} employés`
    },
    {
      id: 'validations',
      title: 'Validations',
      description: 'Workflows validation véhicules',
      icon: CheckCircle,
      route: '/validations',
      gradient: 'from-indigo-500 to-blue-600',
      stats: loading ? '...' : `${stats.missionsEnAttente} en attente`
    },
    {
      id: 'admin',
      title: 'Administration',
      description: 'Utilisateurs, rôles et paramètres',
      icon: Settings,
      route: '/admin',
      gradient: 'from-gray-500 to-slate-600',
      isNew: true
    }
  ];

  const handleModuleClick = (route: string) => {
    navigate(route);
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-indigo-50/30">
      {/* Top Bar moderne */}
      <header className="bg-white/80 backdrop-blur-md border-b border-white/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo et titre */}
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <Truck className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                  SDBK Transport
                </h1>
                <p className="text-sm text-gray-500 font-medium">Hub Modules</p>
              </div>
            </div>

            {/* Actions droite */}
            <div className="flex items-center gap-4">
              {/* Notifications */}
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="w-5 h-5" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></div>
              </Button>

              {/* Menu utilisateur */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                    <span className="font-medium">{user?.prenom} {user?.nom}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-3 py-2">
                    <p className="text-sm font-medium">{user?.prenom} {user?.nom}</p>
                    <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="w-4 h-4 mr-2" />
                    Déconnexion
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      {/* Contenu principal Hub */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Titre et description */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Bienvenue sur votre plateforme
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Accédez rapidement à tous vos modules de gestion transport 
            dans une interface moderne et intuitive.
          </p>
        </div>

        {/* Grille des modules - Layout optimisé */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 max-w-6xl mx-auto">
          {modules.map((module, index) => (
            <div
              key={module.id}
              className="group cursor-pointer animate-fade-in hover:scale-105 transition-all duration-300"
              style={{ animationDelay: `${index * 0.1}s` }}
              onClick={() => handleModuleClick(module.route)}
            >
              {/* Carte module */}
              <div className="relative overflow-hidden rounded-2xl bg-white/70 backdrop-blur-sm border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300">
                {/* Header avec gradient */}
                <div className={`h-32 bg-gradient-to-br ${module.gradient} relative`}>
                  <div className="absolute inset-0 bg-black/10"></div>
                  
                  {/* Icône */}
                  <div className="absolute top-6 left-6">
                    <module.icon className="w-8 h-8 text-white drop-shadow-lg" />
                  </div>
                  
                  {/* Badge nouveau */}
                  {module.isNew && (
                    <div className="absolute top-4 right-4">
                      <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm">
                        Nouveau
                      </Badge>
                    </div>
                  )}

                  {/* Statistiques */}
                  {module.stats && (
                    <div className="absolute bottom-4 left-6">
                      <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm">
                        {module.stats}
                      </Badge>
                    </div>
                  )}

                  {/* Effet brillance hover */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                </div>

                {/* Contenu */}
                <div className="p-6">
                  <h3 className="font-semibold text-lg text-gray-900 mb-2">
                    {module.title}
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {module.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Section actions rapides */}
        <div className="mt-20 bg-white/60 backdrop-blur-sm rounded-2xl p-8 border border-white/20 max-w-4xl mx-auto">
          <h3 className="text-2xl font-semibold text-gray-900 mb-6 text-center">
            Actions Rapides
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Button 
              variant="outline" 
              className="h-20 flex flex-col gap-2 bg-blue-50 hover:bg-blue-100 border-blue-200"
              onClick={() => navigate('/missions')}
            >
              <Route className="w-6 h-6 text-blue-600" />
              <span className="font-medium">Nouvelle Mission</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex flex-col gap-2 bg-emerald-50 hover:bg-emerald-100 border-emerald-200"
              onClick={() => navigate('/drivers')}
            >
              <Users className="w-6 h-6 text-emerald-600" />
              <span className="font-medium">Gérer Chauffeurs</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex flex-col gap-2 bg-orange-50 hover:bg-orange-100 border-orange-200"
              onClick={() => navigate('/fleet')}
            >
              <Truck className="w-6 h-6 text-orange-600" />
              <span className="font-medium">Ajouter Véhicule</span>
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};