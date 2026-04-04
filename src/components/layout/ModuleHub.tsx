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
  LogOut,
  Building2,
  Briefcase,
  ShieldCheck,
  GraduationCap,
  ArrowRight,
  Sun,
  Moon
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
  color: string;
  bgColor: string;
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
  const { user, logout, hasRole } = useAuth();
  const [stats, setStats] = useState<HubStats>({
    vehicules: 0,
    chauffeurs: 0,
    missionsEnCours: 0,
    factures: 0,
    employes: 0,
    missionsEnAttente: 0
  });
  const [loading, setLoading] = useState(true);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('sdbk-dark-mode');
    if (saved === 'true') {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    const newVal = !isDark;
    setIsDark(newVal);
    localStorage.setItem('sdbk-dark-mode', String(newVal));
    document.documentElement.classList.toggle('dark', newVal);
  };

  useEffect(() => {
    const loadHubStats = async () => {
      try {
        const hubStats = await statsService.getDashboardStats();
        const financialStats = await statsService.getFinancialStats();
        setStats({
          vehicules: hubStats.vehicules,
          chauffeurs: hubStats.chauffeurs,
          missionsEnCours: hubStats.missionsEnCours,
          factures: financialStats.facturesMensuelles,
          employes: hubStats.employes,
          missionsEnAttente: hubStats.validationsEnAttente
        });
      } catch (error) {
        console.error('Error loading hub stats:', error);
      } finally {
        setLoading(false);
      }
    };
    loadHubStats();
    const interval = setInterval(loadHubStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const allModules: ModuleTile[] = [
    {
      id: 'dashboard',
      title: 'Dashboard',
      description: 'Vue d\'ensemble et analytics',
      icon: BarChart3,
      route: '/dashboard',
      color: 'text-violet-600 dark:text-violet-400',
      bgColor: 'bg-violet-50 dark:bg-violet-500/10',
      stats: 'Temps réel'
    },
    {
      id: 'fleet',
      title: 'Flotte',
      description: 'Véhicules et maintenance',
      icon: Truck,
      route: '/fleet',
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-500/10',
      stats: loading ? '...' : `${stats.vehicules} véhicules`
    },
    {
      id: 'drivers',
      title: 'Chauffeurs',
      description: 'Conducteurs et documents',
      icon: Users,
      route: '/drivers',
      color: 'text-emerald-600 dark:text-emerald-400',
      bgColor: 'bg-emerald-50 dark:bg-emerald-500/10',
      stats: loading ? '...' : `${stats.chauffeurs} chauffeurs`
    },
    {
      id: 'missions',
      title: 'Missions',
      description: 'Planification et suivi',
      icon: Route,
      route: '/missions',
      color: 'text-orange-600 dark:text-orange-400',
      bgColor: 'bg-orange-50 dark:bg-orange-500/10',
      stats: loading ? '...' : `${stats.missionsEnCours} en cours`
    },
    {
      id: 'billing',
      title: 'Facturation',
      description: 'Devis, factures et paiements',
      icon: Coins,
      route: '/billing',
      color: 'text-amber-600 dark:text-amber-400',
      bgColor: 'bg-amber-50 dark:bg-amber-500/10',
      stats: loading ? '...' : `${stats.factures} factures`
    },
    {
      id: 'clients',
      title: 'Clients',
      description: 'Gestion des clients',
      icon: Building2,
      route: '/clients',
      color: 'text-teal-600 dark:text-teal-400',
      bgColor: 'bg-teal-50 dark:bg-teal-500/10'
    },
    {
      id: 'societe',
      title: 'Société',
      description: 'Documents administratifs',
      icon: Briefcase,
      route: '/societe',
      color: 'text-slate-600 dark:text-slate-400',
      bgColor: 'bg-slate-100 dark:bg-slate-500/10',
      isNew: true
    },
    {
      id: 'rh',
      title: 'RH',
      description: 'Ressources humaines',
      icon: UserCog,
      route: '/rh',
      color: 'text-pink-600 dark:text-pink-400',
      bgColor: 'bg-pink-50 dark:bg-pink-500/10',
      stats: loading ? '...' : `${stats.employes} employés`
    },
    {
      id: 'validations',
      title: 'Validations',
      description: 'Workflows de validation',
      icon: CheckCircle,
      route: '/validations',
      color: 'text-indigo-600 dark:text-indigo-400',
      bgColor: 'bg-indigo-50 dark:bg-indigo-500/10',
      stats: loading ? '...' : `${stats.missionsEnAttente} en attente`
    },
    {
      id: 'formations',
      title: 'Formations',
      description: 'Formations et recyclage',
      icon: GraduationCap,
      route: '/formations',
      color: 'text-yellow-600 dark:text-yellow-400',
      bgColor: 'bg-yellow-50 dark:bg-yellow-500/10',
      isNew: true
    },
    {
      id: 'hseq',
      title: 'HSEQ',
      description: 'Sécurité et qualité',
      icon: ShieldCheck,
      route: '/hseq',
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-50 dark:bg-green-500/10',
      isNew: true
    },
    {
      id: 'admin',
      title: 'Administration',
      description: 'Utilisateurs et paramètres',
      icon: Settings,
      route: '/admin',
      color: 'text-gray-600 dark:text-gray-400',
      bgColor: 'bg-gray-100 dark:bg-gray-500/10'
    }
  ];

  const modules = allModules.filter(module => {
    if (!user) return false;
    if (hasRole('admin')) return true;
    if (module.id === 'dashboard') return false;
    if (module.id === 'missions') {
      const isTransitaire = user.roles?.includes('transitaire') || user.role === 'transitaire';
      if (isTransitaire) return true;
    }
    const modulePermissions = user.module_permissions || [];
    return modulePermissions.includes(module.id);
  });

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card/80 backdrop-blur-xl border-b border-border/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/images/logo-sdbk.png" alt="SDBK" className="h-9 object-contain" />
            <div className="hidden sm:block">
              <h1 className="text-base font-bold text-foreground tracking-tight">SDBK - AMS</h1>
              <p className="text-[11px] text-muted-foreground font-medium -mt-0.5">Administration Management System</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleDarkMode}
              className="h-9 w-9 rounded-lg text-muted-foreground hover:text-foreground"
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>

            <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-lg text-muted-foreground">
              <Bell className="w-4 h-4" />
              <span className="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 bg-destructive rounded-full border-2 border-card" />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 h-9 px-2 rounded-lg">
                  <div className="w-7 h-7 bg-primary/10 rounded-lg flex items-center justify-center">
                    <User className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <span className="hidden sm:block text-[13px] font-medium text-foreground">{user?.prenom} {user?.nom}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-popover/95 backdrop-blur-xl rounded-xl shadow-elegant">
                <div className="px-3 py-2.5">
                  <p className="text-sm font-semibold text-foreground">{user?.prenom} {user?.nom}</p>
                  <p className="text-[11px] text-muted-foreground capitalize">{user?.role}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive text-[13px] rounded-lg mx-1">
                  <LogOut className="w-3.5 h-3.5 mr-2" />
                  Déconnexion
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight mb-3">
            Bienvenue, {user?.prenom} 👋
          </h2>
          <p className="text-base text-muted-foreground max-w-xl mx-auto">
            Accédez à vos modules de gestion
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {modules.map((module, index) => {
            const Icon = module.icon;
            return (
              <button
                key={module.id}
                className="group text-left bg-card border border-border/50 rounded-xl p-5 hover:shadow-card-hover hover:border-border transition-all duration-300 animate-fade-in relative overflow-hidden"
                style={{ animationDelay: `${index * 0.05}s` }}
                onClick={() => navigate(module.route)}
              >
                {/* Hover gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                <div className="relative">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-11 h-11 ${module.bgColor} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className={`w-5 h-5 ${module.color}`} />
                    </div>
                    {module.isNew && (
                      <Badge className="bg-primary/10 text-primary border-0 text-[10px] font-semibold px-2 py-0.5">
                        Nouveau
                      </Badge>
                    )}
                  </div>
                  
                  <h3 className="font-semibold text-[15px] text-foreground mb-1 group-hover:text-primary transition-colors duration-200">
                    {module.title}
                  </h3>
                  <p className="text-[12px] text-muted-foreground leading-relaxed mb-3">
                    {module.description}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    {module.stats && (
                      <span className="text-[11px] font-medium text-muted-foreground bg-secondary/80 px-2 py-1 rounded-md">
                        {module.stats}
                      </span>
                    )}
                    <ArrowRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-1 transition-all duration-200 ml-auto" />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/30 py-6 mt-8">
        <p className="text-center text-[11px] text-muted-foreground/50">
          © {new Date().getFullYear()} SDBK — Société Diallo-Bah-Kane · Administration Management System
        </p>
      </footer>
    </div>
  );
};
