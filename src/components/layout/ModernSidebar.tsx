import React, { useState, useEffect } from 'react';
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

const getIconColor = (isActive: boolean) => {
  return isActive ? 'text-primary-foreground' : 'text-muted-foreground';
};

const getItemStyle = (isActive: boolean) => {
  return isActive ? 'modern-nav-item-active' : 'modern-nav-item';
};

export const ModernSidebar: React.FC<ModernSidebarProps> = ({ 
  isCollapsed = false,
  onToggleCollapse 
}) => {
  const { user } = useAuth();
  const location = useLocation();
  const [mounted, setMounted] = useState(false);

  // Ensure proper mounting and re-mounting
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Force re-render on location change to prevent UI degradation
  useEffect(() => {
    if (mounted) {
      // Small delay to ensure proper rendering
      const timer = setTimeout(() => {
        // Force style recalculation
        const sidebar = document.querySelector('[data-sidebar="main"]');
        if (sidebar) {
          sidebar.classList.add('ui-refreshing');
          setTimeout(() => {
            sidebar.classList.remove('ui-refreshing');
          }, 200);
        }
      }, 10);
      return () => clearTimeout(timer);
    }
  }, [location.pathname, mounted]);

  if (!mounted) {
    return null;
  }

  const handleLogout = () => {
    // TODO: Implement logout functionality
    console.log('Logout clicked');
  };

  return (
    <aside 
      data-sidebar="main"
      className={cn(
        "fixed top-0 left-0 z-40 h-screen transition-all duration-300 ease-out force-repaint",
        "bg-card border-r border-border shadow-lg",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      <div className="h-full flex flex-col justify-between">
        <div className="flex-grow flex flex-col py-4 px-3 bg-card">
          <Link to="/" className="flex items-center pl-2.5 mb-8">
            <img
              src="/logo.png"
              className="mr-3 h-6 sm:h-7"
              alt="SDBK Logo"
            />
            <span className={cn("self-center text-xl font-semibold whitespace-nowrap text-foreground", isCollapsed && "hidden")}>
              SDBK Transport
            </span>
          </Link>
          <ul className="space-y-2 font-medium">
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={getItemStyle(isActive)}
                  >
                    <item.icon className={cn("w-5 h-5", getIconColor(isActive))} />
                    <span className={cn("ml-3", isCollapsed && "hidden")}>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
        <div className="py-4 px-3 bg-card border-t border-border">
          <button onClick={handleLogout} className="modern-nav-item">
            <LogOut className="w-5 h-5 text-muted-foreground" />
            <span className={cn("ml-3", isCollapsed && "hidden")}>Déconnexion</span>
          </button>
        </div>
      </div>
    </aside>
  );
};
