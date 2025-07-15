
import React from 'react';
import { useLocation, Link } from 'react-router-dom';
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
  Book,
  LogOut 
} from 'lucide-react';

interface ModernSidebarProps {
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

const menuItems = [
  {
    path: '/dashboard',
    label: 'Tableau de bord',
    icon: LayoutDashboard
  },
  {
    path: '/fleet',
    label: 'Flotte',
    icon: Truck
  },
  {
    path: '/drivers',
    label: 'Chauffeurs',
    icon: Users
  },
  {
    path: '/missions',
    label: 'Missions',
    icon: FileText
  },
  {
    path: '/cargo',
    label: 'Cargaison',
    icon: FileText
  },
  {
    path: '/billing',
    label: 'Facturation',
    icon: Coins
  },
  {
    path: '/rh',
    label: 'RH',
    icon: UserCog
  },
  {
    path: '/validations',
    label: 'Validations',
    icon: CheckCircle
  },
  {
    path: '/administration',
    label: 'Administration',
    icon: Settings
  },
  {
    path: '/documents',
    label: 'Documents',
    icon: FileText
  },
  {
    path: '/guide',
    label: 'Guide',
    icon: Book
  }
];

export const ModernSidebar: React.FC<ModernSidebarProps> = ({ 
  isCollapsed = false,
  onToggleCollapse 
}) => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const handleLogout = async () => {
    console.log('🚪 Logout initiated from sidebar');
    try {
      await logout();
      console.log('✅ Logout completed successfully');
    } catch (error) {
      console.error('❌ Logout error:', error);
    }
  };

  return (
    <aside 
      className={cn(
        "fixed top-0 left-0 z-50 h-screen transition-all duration-300 ease-out",
        "bg-gradient-to-b from-sdbk-primary via-sdbk-secondary to-sdbk-primary border-r border-sdbk-medium/20 shadow-elegant",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      <div className="h-full flex flex-col justify-between">
        <div className="flex-grow flex flex-col py-6 px-3">
          {/* Logo avec icône de camion */}
          <Link to="/" className="flex items-center justify-center pl-2.5 mb-8">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/15 transition-all duration-300">
              <Truck className="w-8 h-8 text-sdbk-accent drop-shadow-lg" />
              {!isCollapsed && (
                <div className="flex flex-col">
                  <span className="text-xl font-bold text-white drop-shadow-md">
                    SDBK
                  </span>
                  <span className="text-xs text-sdbk-accent font-medium">
                    Transport
                  </span>
                </div>
              )}
            </div>
          </Link>

          {/* Menu items */}
          <ul className="space-y-2 font-medium">
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;
              
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-300 group relative",
                      isActive 
                        ? "bg-gradient-to-r from-sdbk-accent/90 to-sdbk-accent text-white shadow-glow backdrop-blur-sm border border-white/20" 
                        : "hover:bg-white/10 text-white/80 hover:text-white hover:shadow-medium backdrop-blur-sm border border-transparent hover:border-white/10"
                    )}
                  >
                    <Icon className={cn(
                      "w-5 h-5 flex-shrink-0 transition-all duration-300",
                      isActive ? "text-white drop-shadow-md" : "text-white/70 group-hover:text-white group-hover:scale-110"
                    )} />
                    {!isCollapsed && (
                      <span className="truncate font-medium">{item.label}</span>
                    )}
                    {isActive && (
                      <div className="absolute right-2 w-2 h-2 bg-white rounded-full shadow-sm animate-pulse-soft"></div>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        {/* User info et logout */}
        <div className="py-4 px-3 border-t border-white/20">
          {user && !isCollapsed && (
            <div className="mb-4 p-3 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
              <div className="text-xs text-white/60 mb-1">Connecté en tant que</div>
              <div className="text-sm font-medium text-white">{user.prenom} {user.nom}</div>
              <div className="text-xs text-sdbk-accent capitalize">{user.role}</div>
            </div>
          )}
          
          <button 
            onClick={handleLogout} 
            className={cn(
              "flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl w-full transition-all duration-300 group",
              "hover:bg-red-500/20 text-white/80 hover:text-white hover:shadow-medium backdrop-blur-sm border border-transparent hover:border-red-400/30"
            )}
          >
            <LogOut className="w-5 h-5 flex-shrink-0 text-red-400 group-hover:scale-110 transition-transform duration-300" />
            {!isCollapsed && <span>Déconnexion</span>}
          </button>
        </div>
      </div>
    </aside>
  );
};
