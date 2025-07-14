
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation, Link } from 'react-router-dom';
import { useValidationPermissions } from '@/hooks/useValidationPermissions';
import { 
  LayoutDashboard, 
  Truck, 
  Users, 
  FileText, 
  Package, 
  Calculator, 
  UserCog, 
  Shield,
  Settings,
  Building2,
  BookOpen,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ModernSkeleton } from '@/components/ui/loading-states';

const navigationItems = [
  {
    title: 'Tableau de bord',
    icon: LayoutDashboard,
    href: '/dashboard',
    permissions: ['dashboard', 'all']
  },
  {
    title: 'Flotte',
    icon: Truck,
    href: '/fleet',
    permissions: ['fleet', 'all']
  },
  {
    title: 'Chauffeurs',
    icon: Users,
    href: '/drivers',
    permissions: ['drivers', 'all']
  },
  {
    title: 'Missions',
    icon: FileText,
    href: '/missions',
    permissions: ['missions', 'all']
  },
  {
    title: 'Chargements',
    icon: Package,
    href: '/cargo',
    permissions: ['cargo', 'all']
  },
  {
    title: 'Facturation',
    icon: Calculator,
    href: '/billing',
    permissions: ['billing', 'all']
  },
  {
    title: 'RH',
    icon: UserCog,
    href: '/rh',
    permissions: ['rh', 'all']
  },
  {
    title: 'Validations',
    icon: Shield,
    href: '/validations',
    permissions: ['validations'],
    requiresValidationRole: true
  },
  {
    title: 'Administration',
    icon: Settings,
    href: '/administration',
    permissions: ['admin', 'all']
  },
  {
    title: 'Stock Documents',
    icon: Building2,
    href: '/documents',
    permissions: ['documents', 'all']
  },
  {
    title: 'Guide',
    icon: BookOpen,
    href: '/guide',
    permissions: ['all']
  }
];

interface ModernSidebarProps {
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const ModernSidebar: React.FC<ModernSidebarProps> = ({ 
  isCollapsed = false, 
  onToggleCollapse 
}) => {
  const { user, hasPermission, loading } = useAuth();
  const { hasValidationAccess } = useValidationPermissions();
  const location = useLocation();

  if (loading) {
    return (
      <div className={cn(
        "h-full bg-card border-r border-border smooth-transition",
        isCollapsed ? "w-16" : "w-64"
      )}>
        <div className="p-6">
          <ModernSkeleton variant="avatar" className="mb-6" />
          <div className="space-y-3">
            {[...Array(8)].map((_, i) => (
              <ModernSkeleton key={i} variant="button" className="w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const visibleItems = navigationItems.filter(item => {
    if (user.roles?.includes('admin')) return true;
    
    if (item.requiresValidationRole) {
      return hasValidationAccess();
    }
    
    return item.permissions.some(permission => 
      hasPermission(permission) || 
      user.module_permissions?.includes(permission) ||
      user.permissions?.includes(permission)
    );
  });

  return (
    <div className={cn(
      "h-full bg-card border-r border-border smooth-transition flex flex-col",
      isCollapsed ? "w-16" : "w-64"
    )}>
      {/* Header avec logo */}
      <div className={cn(
        "p-6 border-b border-border",
        isCollapsed && "p-4"
      )}>
        <div className="flex items-center justify-between">
          <div className={cn(
            "flex items-center space-x-3",
            isCollapsed && "justify-center"
          )}>
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <Truck className="w-5 h-5 text-primary-foreground" />
            </div>
            {!isCollapsed && (
              <div>
                <h1 className="text-lg font-bold text-foreground">SDBK</h1>
                <p className="text-xs text-muted-foreground">Transport Manager</p>
              </div>
            )}
          </div>
          
          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              className="p-1.5 rounded-md hover:bg-accent smooth-transition"
            >
              {isCollapsed ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <ChevronLeft className="w-4 h-4" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <div className="space-y-1">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;
            
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium smooth-transition",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-soft"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent",
                  isCollapsed && "justify-center px-2"
                )}
                title={isCollapsed ? item.title : undefined}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {!isCollapsed && <span>{item.title}</span>}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Footer utilisateur */}
      <div className={cn(
        "p-4 border-t border-border",
        isCollapsed && "p-2"
      )}>
        {!isCollapsed ? (
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Connecté en tant que:</p>
            <p className="text-sm font-medium text-foreground capitalize">
              {user.prenom} {user.nom}
            </p>
            <p className="text-xs font-medium text-primary">
              {user.role}
            </p>
          </div>
        ) : (
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
            <span className="text-xs font-semibold text-primary-foreground">
              {user.prenom.charAt(0)}{user.nom.charAt(0)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
