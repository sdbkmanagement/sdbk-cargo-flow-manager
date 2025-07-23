
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  Truck, 
  Users, 
  FileText, 
  Coins, 
  UserCog, 
  CheckCircle, 
  Settings,
  LogOut
} from 'lucide-react';

const moduleItems = [
  {
    path: '/dashboard',
    label: 'Tableau de bord',
    icon: LayoutDashboard,
    color: 'from-blue-500 to-blue-600',
    description: 'Vue d\'ensemble et statistiques'
  },
  {
    path: '/fleet',
    label: 'Flotte',
    icon: Truck,
    color: 'from-green-500 to-green-600',
    description: 'Gestion des véhicules'
  },
  {
    path: '/drivers',
    label: 'Chauffeurs',
    icon: Users,
    color: 'from-purple-500 to-purple-600',
    description: 'Gestion des chauffeurs'
  },
  {
    path: '/missions',
    label: 'Missions',
    icon: FileText,
    color: 'from-orange-500 to-orange-600',
    description: 'Planification et suivi'
  },
  {
    path: '/billing',
    label: 'Facturation',
    icon: Coins,
    color: 'from-yellow-500 to-yellow-600',
    description: 'Gestion financière'
  },
  {
    path: '/rh',
    label: 'RH',
    icon: UserCog,
    color: 'from-pink-500 to-pink-600',
    description: 'Ressources humaines'
  },
  {
    path: '/validations',
    label: 'Validations',
    icon: CheckCircle,
    color: 'from-teal-500 to-teal-600',
    description: 'Processus de validation'
  },
  {
    path: '/administration',
    label: 'Administration',
    icon: Settings,
    color: 'from-gray-500 to-gray-600',
    description: 'Configuration système'
  }
];

export const ModuleGrid: React.FC = () => {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    console.log('🚪 Logout initiated from module grid');
    try {
      await logout();
      console.log('✅ Logout completed successfully');
    } catch (error) {
      console.error('❌ Logout error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=\"60\" height=\"60\" viewBox=\"0 0 60 60\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cg fill=\"none\" fill-rule=\"evenodd\"%3E%3Cg fill=\"%23ffffff\" fill-opacity=\"0.02\"%3E%3Ccircle cx=\"30\" cy=\"30\" r=\"2\"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-50"></div>
      
      {/* Header */}
      <div className="relative z-10 py-8 px-6 text-center">
        <div className="flex items-center justify-center mb-6">
          <div className="flex items-center gap-4 p-6 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20">
            <Truck className="w-12 h-12 text-blue-400 drop-shadow-lg" />
            <div className="text-left">
              <h1 className="text-4xl font-bold text-white drop-shadow-md">
                SDBK Transport
              </h1>
              <p className="text-blue-300 text-lg font-medium">
                Système de gestion intégré
              </p>
            </div>
          </div>
        </div>
        
        {user && (
          <div className="mb-8 p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 max-w-md mx-auto">
            <p className="text-white/80 text-sm mb-1">Bienvenue,</p>
            <p className="text-white font-semibold text-lg">{user.prenom} {user.nom}</p>
            <p className="text-blue-300 text-sm capitalize">{user.role}</p>
          </div>
        )}
      </div>

      {/* Modules Grid */}
      <div className="relative z-10 px-6 pb-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {moduleItems.map((module) => {
              const Icon = module.icon;
              return (
                <Link
                  key={module.path}
                  to={module.path}
                  className="group relative overflow-hidden rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 hover:border-white/40 transition-all duration-300 hover:transform hover:scale-105 hover:shadow-2xl"
                >
                  <div className={cn(
                    "absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-20 transition-opacity duration-300",
                    module.color
                  )}></div>
                  
                  <div className="relative p-6 text-center">
                    <div className={cn(
                      "mx-auto mb-4 w-16 h-16 rounded-xl bg-gradient-to-br flex items-center justify-center group-hover:scale-110 transition-transform duration-300",
                      module.color
                    )}>
                      <Icon className="w-8 h-8 text-white drop-shadow-md" />
                    </div>
                    
                    <h3 className="text-white font-semibold text-lg mb-2 group-hover:text-blue-300 transition-colors">
                      {module.label}
                    </h3>
                    
                    <p className="text-white/70 text-sm group-hover:text-white/90 transition-colors">
                      {module.description}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer with Logout */}
      <div className="relative z-10 py-6 px-6 text-center">
        <button
          onClick={handleLogout}
          className="inline-flex items-center gap-3 px-6 py-3 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-white border border-red-400/30 hover:border-red-400/50 transition-all duration-300 group"
        >
          <LogOut className="w-5 h-5 text-red-400 group-hover:scale-110 transition-transform duration-300" />
          <span>Déconnexion</span>
        </button>
      </div>
    </div>
  );
};
