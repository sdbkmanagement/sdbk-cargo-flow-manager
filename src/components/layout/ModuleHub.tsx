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
          missionsEnAttente: hubStats.validationsEnAttente
        });
        
        console.log('✅ Hub stats loaded:', {
          ...hubStats,
          validationsEnAttente: hubStats.validationsEnAttente
        });
        
      } catch (error) {
        console.error('❌ Error loading hub stats:', error);
      } finally {
        setLoading(false);
      }
    };

    loadHubStats();
    
    // Actualiser les données toutes les 30 secondes pour les validations
    const interval = setInterval(loadHubStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const allModules: ModuleTile[] = [
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

  const modules = allModules.filter(module => {
    if (!user) return false;
    
    if (module.id === 'dashboard') {
      const isAdmin = user.roles?.includes('admin') || user.role === 'admin';
      console.log(`🔍 Vérification accès dashboard - Admin: ${isAdmin}`);
      return isAdmin;
    }
    
    console.log(`🔍 Vérification utilisateur:`, {
      email: user.email,
      roles: user.roles,
      modulePermissions: user.module_permissions
    });
    
    if (user.roles?.includes('admin')) {
      console.log(`✅ Utilisateur admin - accès complet au module ${module.id}`);
      return true;
    }
    
    const modulePermissions = user.module_permissions || [];
    const hasAccess = modulePermissions.includes(module.id);
    
    console.log(`🔍 Vérification accès module ${module.id}:`, {
      userEmail: user.email,
      userPermissions: modulePermissions,
      hasAccess: hasAccess
    });
    
    return hasAccess;
  });

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
      <header className="bg-white/80 backdrop-blur-md border-b border-white/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
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

            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="w-5 h-5" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></div>
              </Button>

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

      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Bienvenue sur votre plateforme
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Accédez rapidement à tous vos modules de gestion transport 
            dans une interface moderne et intuitive.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 max-w-6xl mx-auto">
          {modules.map((module, index) => (
            <div
              key={module.id}
              className="group cursor-pointer animate-fade-in hover:scale-105 transition-all duration-300"
              style={{ animationDelay: `${index * 0.1}s` }}
              onClick={() => handleModuleClick(module.route)}
            >
              <div className="relative overflow-hidden rounded-2xl bg-white/70 backdrop-blur-sm border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300">
                <div className={`h-32 bg-gradient-to-br ${module.gradient} relative`}>
                  <div className="absolute inset-0 bg-black/10"></div>
                  
                  <div className="absolute top-6 left-6">
                    <module.icon className="w-8 h-8 text-white drop-shadow-lg" />
                  </div>
                  
                  {module.isNew && (
                    <div className="absolute top-4 right-4">
                      <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm">
                        Nouveau
                      </Badge>
                    </div>
                  )}

                  {module.stats && (
                    <div className="absolute bottom-4 left-6">
                      <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm">
                        {module.stats}
                      </Badge>
                    </div>
                  )}

                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                </div>

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
      </main>
    </div>
  );
};
