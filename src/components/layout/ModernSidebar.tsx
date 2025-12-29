
import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useValidationPermissions } from '@/hooks/useValidationPermissions';
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
  LogOut,
  X,
  Building2,
  Briefcase
} from 'lucide-react';

interface ModernSidebarProps {
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

const menuItems = [
  {
    path: '/dashboard',
    label: 'Tableau de bord',
    icon: LayoutDashboard,
    module: 'dashboard'
  },
  {
    path: '/fleet',
    label: 'Flotte',
    icon: Truck,
    module: 'fleet'
  },
  {
    path: '/drivers',
    label: 'Chauffeurs',
    icon: Users,
    module: 'drivers'
  },
  {
    path: '/missions',
    label: 'Missions',
    icon: FileText,
    module: 'missions'
  },
  {
    path: '/billing',
    label: 'Facturation',
    icon: Coins,
    module: 'billing'
  },
  {
    path: '/clients',
    label: 'Clients',
    icon: Building2,
    module: 'clients'
  },
  {
    path: '/rh',
    label: 'RH',
    icon: UserCog,
    module: 'rh'
  },
  {
    path: '/societe',
    label: 'Société',
    icon: Briefcase,
    module: 'societe'
  },
  {
    path: '/validations',
    label: 'Validations',
    icon: CheckCircle,
    module: 'validations',
    requiresValidationRole: true
  },
  {
    path: '/admin',
    label: 'Administration',
    icon: Settings,
    module: 'admin'
  }
];

export const ModernSidebar: React.FC<ModernSidebarProps> = ({ 
  isCollapsed = false,
  onToggleCollapse,
  isMobileOpen = false,
  onMobileClose
}) => {
  const { user, logout, hasRole } = useAuth();
  const { hasValidationAccess } = useValidationPermissions();
  const location = useLocation();

  // Filtrer les éléments du menu selon les permissions
  const filteredMenuItems = menuItems.filter(item => {
    if (!user) return false;

    console.log('🔍 Checking access for module:', item.module, {
      userRoles: user.roles,
      modulePermissions: user.module_permissions,
      itemModule: item.module
    });

    // L'admin a accès à tout
    if (hasRole('admin')) {
      console.log('✅ Admin access granted for:', item.module);
      return true;
    }

    // Vérifier l'accès spécial pour les validations
    if (item.requiresValidationRole) {
      const hasAccess = hasValidationAccess();
      console.log(`${hasAccess ? '✅' : '❌'} Validation access:`, hasAccess);
      return hasAccess;
    }

    // Vérifier les permissions de module
    const modulePermissions = user.module_permissions || [];
    const hasAccess = modulePermissions.includes(item.module);
    
    console.log(`${hasAccess ? '✅' : '❌'} Module access for ${item.module}:`, {
      hasAccess,
      modulePermissions
    });

    return hasAccess;
  });

  const handleLogout = async () => {
    console.log('🚪 Logout initiated from sidebar');
    try {
      await logout();
      console.log('✅ Logout completed successfully');
    } catch (error) {
      console.error('❌ Logout error:', error);
    }
  };

  const handleLinkClick = () => {
    // Fermer le sidebar mobile lors du clic sur un lien
    if (onMobileClose) onMobileClose();
  };

  return (
    <>
      {/* Overlay mobile */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onMobileClose}
        />
      )}
      
      <aside 
        className={cn(
          "fixed top-0 left-0 z-50 h-screen transition-all duration-300 ease-out",
          "bg-gradient-to-b from-sdbk-primary via-sdbk-secondary to-sdbk-primary border-r border-sdbk-medium/20 shadow-elegant",
          // Mobile: slide in/out
          "lg:translate-x-0",
          isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          // Desktop: responsive width
          isCollapsed ? "w-16" : "w-64",
          // Mobile: full width on small screens
          "lg:w-auto w-64"
        )}
      >
        <div className="h-full flex flex-col justify-between">
          <div className="flex-grow flex flex-col py-4 lg:py-6 px-3">
            {/* Header avec bouton fermer mobile */}
            <div className="flex items-center justify-between mb-6 lg:mb-8">
              <Link to="/" className="flex items-center justify-center pl-2.5" onClick={handleLinkClick}>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/15 transition-all duration-300">
                  <Truck className="w-6 lg:w-8 h-6 lg:h-8 text-sdbk-accent drop-shadow-lg" />
                  {!isCollapsed && (
                    <div className="flex flex-col">
                      <span className="text-lg lg:text-xl font-bold text-white drop-shadow-md">
                        SDBK
                      </span>
                      <span className="text-xs text-sdbk-accent font-medium">
                        Transport
                      </span>
                    </div>
                  )}
                </div>
              </Link>
              
              {/* Bouton fermer mobile */}
              <button
                onClick={onMobileClose}
                className="lg:hidden p-2 rounded-lg hover:bg-white/10 text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Menu items */}
            <ul className="space-y-1 lg:space-y-2 font-medium">
              {filteredMenuItems.map((item) => {
                const isActive = location.pathname === item.path;
                const Icon = item.icon;
                
                return (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      onClick={handleLinkClick}
                      className={cn(
                        "flex items-center gap-3 px-3 lg:px-4 py-2 lg:py-3 text-sm font-medium rounded-xl transition-all duration-300 group relative",
                        isActive 
                          ? "bg-gradient-to-r from-sdbk-accent/90 to-sdbk-accent text-white shadow-glow backdrop-blur-sm border border-white/20" 
                          : "hover:bg-white/10 text-white/80 hover:text-white hover:shadow-medium backdrop-blur-sm border border-transparent hover:border-white/10"
                      )}
                    >
                      <Icon className={cn(
                        "w-4 lg:w-5 h-4 lg:h-5 flex-shrink-0 transition-all duration-300",
                        isActive ? "text-white drop-shadow-md" : "text-white/70 group-hover:text-white group-hover:scale-110"
                      )} />
                      {!isCollapsed && (
                        <span className="truncate font-medium text-sm lg:text-base">{item.label}</span>
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
          <div className="py-3 lg:py-4 px-3 border-t border-white/20">
            {user && !isCollapsed && (
              <div className="mb-3 lg:mb-4 p-2 lg:p-3 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
                <div className="text-xs text-white/60 mb-1">Connecté en tant que</div>
                <div className="text-sm font-medium text-white truncate">{user.prenom} {user.nom}</div>
                <div className="text-xs text-sdbk-accent capitalize">{user.role}</div>
              </div>
            )}
            
            <button 
              onClick={handleLogout} 
              className={cn(
                "flex items-center gap-3 px-3 lg:px-4 py-2 lg:py-3 text-sm font-medium rounded-xl w-full transition-all duration-300 group",
                "hover:bg-red-500/20 text-white/80 hover:text-white hover:shadow-medium backdrop-blur-sm border border-transparent hover:border-red-400/30"
              )}
            >
              <LogOut className="w-4 lg:w-5 h-4 lg:h-5 flex-shrink-0 text-red-400 group-hover:scale-110 transition-transform duration-300" />
              {!isCollapsed && <span className="text-sm lg:text-base">Déconnexion</span>}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
