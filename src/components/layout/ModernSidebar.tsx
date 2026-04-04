
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
  Briefcase,
  ShieldCheck,
  GraduationCap,
  ChevronRight
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
    module: 'missions',
    allowedRoles: ['transitaire']
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
    path: '/societe',
    label: 'Société',
    icon: Briefcase,
    module: 'societe'
  },
  {
    path: '/rh',
    label: 'RH',
    icon: UserCog,
    module: 'rh'
  },
  {
    path: '/formations',
    label: 'Formations',
    icon: GraduationCap,
    module: 'formations'
  },
  {
    path: '/hseq',
    label: 'HSEQ',
    icon: ShieldCheck,
    module: 'hseq'
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

  const filteredMenuItems = menuItems.filter(item => {
    if (!user) return false;
    if (hasRole('admin')) return true;
    if (item.requiresValidationRole) return hasValidationAccess();
    if ('allowedRoles' in item && item.allowedRoles) {
      const hasAllowedRole = (item.allowedRoles as string[]).some(role => hasRole(role as any));
      if (hasAllowedRole) return true;
    }
    const modulePermissions = user.module_permissions || [];
    return modulePermissions.includes(item.module);
  });

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleLinkClick = () => {
    if (onMobileClose) onMobileClose();
  };

  return (
    <>
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden transition-opacity"
          onClick={onMobileClose}
        />
      )}
      
      <aside 
        className={cn(
          "fixed top-0 left-0 z-50 h-screen transition-all duration-300 ease-out",
          "bg-sidebar-bg border-r border-white/[0.06]",
          "lg:translate-x-0",
          isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          isCollapsed ? "w-[68px]" : "w-[260px]",
          "lg:w-auto w-[260px]"
        )}
      >
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-5 border-b border-white/[0.06]">
            <Link to="/" className="flex items-center gap-3" onClick={handleLinkClick}>
              <img src="/images/logo-sdbk.png" alt="SDBK" className="h-9 object-contain" />
              {!isCollapsed && (
                <span className="text-sm font-semibold text-white/90 tracking-tight">SDBK - AMS</span>
              )}
            </Link>
            <button
              onClick={onMobileClose}
              className="lg:hidden p-1.5 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-4 px-3">
            <div className="space-y-1">
              {filteredMenuItems.map((item) => {
                const isActive = location.pathname === item.path;
                const Icon = item.icon;
                
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={handleLinkClick}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 text-[13px] font-medium rounded-lg transition-all duration-200 group relative",
                      isActive 
                        ? "bg-sidebar-accent text-white shadow-glow" 
                        : "text-white/55 hover:text-white hover:bg-white/[0.06]"
                    )}
                  >
                    <Icon className={cn(
                      "w-[18px] h-[18px] shrink-0 transition-all duration-200",
                      isActive ? "text-white" : "text-white/45 group-hover:text-white/80"
                    )} />
                    {!isCollapsed && (
                      <span className="truncate">{item.label}</span>
                    )}
                    {isActive && !isCollapsed && (
                      <ChevronRight className="w-3.5 h-3.5 ml-auto text-white/60" />
                    )}
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* Footer */}
          <div className="px-3 py-4 border-t border-white/[0.06]">
            {user && !isCollapsed && (
              <div className="mb-3 px-3 py-2.5 rounded-lg bg-white/[0.04]">
                <div className="text-[11px] text-white/35 uppercase tracking-wider font-medium">Connecté</div>
                <div className="text-sm font-medium text-white/80 truncate mt-0.5">{user.prenom} {user.nom}</div>
                <div className="text-[11px] text-sidebar-accent/80 capitalize font-medium mt-0.5">{user.role}</div>
              </div>
            )}
            
            <button 
              onClick={handleLogout} 
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 text-[13px] font-medium rounded-lg w-full transition-all duration-200 group",
                "text-white/45 hover:text-red-400 hover:bg-red-500/10"
              )}
            >
              <LogOut className="w-[18px] h-[18px] shrink-0 group-hover:text-red-400 transition-colors" />
              {!isCollapsed && <span>Déconnexion</span>}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
