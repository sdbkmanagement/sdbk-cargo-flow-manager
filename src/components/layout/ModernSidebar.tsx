
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
  const { user } = useAuth();
  const location = useLocation();

  const handleLogout = () => {
    // TODO: Implement logout functionality
    console.log('Logout clicked');
  };

  return (
    <aside 
      className={cn(
        "fixed top-0 left-0 z-40 h-screen transition-all duration-300 ease-out",
        "bg-card border-r border-border shadow-lg",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      <div className="h-full flex flex-col justify-between">
        <div className="flex-grow flex flex-col py-4 px-3">
          {/* Logo */}
          <Link to="/" className="flex items-center pl-2.5 mb-8">
            <img
              src="/logo.png"
              className="mr-3 h-6 sm:h-7"
              alt="SDBK Logo"
            />
            {!isCollapsed && (
              <span className="self-center text-xl font-semibold whitespace-nowrap text-foreground">
                SDBK Transport
              </span>
            )}
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
                      "flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200",
                      isActive 
                        ? "bg-primary text-primary-foreground shadow-sm" 
                        : "hover:bg-accent hover:text-accent-foreground text-muted-foreground"
                    )}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    {!isCollapsed && (
                      <span className="truncate">{item.label}</span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Logout button */}
        <div className="py-4 px-3 border-t border-border">
          <button 
            onClick={handleLogout} 
            className={cn(
              "flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg w-full",
              "hover:bg-accent hover:text-accent-foreground text-muted-foreground transition-all duration-200"
            )}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {!isCollapsed && <span>Déconnexion</span>}
          </button>
        </div>
      </div>
    </aside>
  );
};
