
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation, Link } from 'react-router-dom';
import { useValidationPermissions } from '@/hooks/useValidationPermissions';
import { 
  LayoutDashboard, 
  Truck, 
  Users, 
  FileText, 
  Calculator, 
  UserCog, 
  Shield,
  Briefcase,
  Settings
} from 'lucide-react';
import { cn } from '@/lib/utils';

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
    title: 'Société',
    icon: Briefcase,
    href: '/societe',
    permissions: ['societe', 'all']
  },
  {
    title: 'Validations',
    icon: Shield,
    href: '/validations',
    permissions: ['validations'], // Utilisation spéciale pour les validations
    requiresValidationRole: true
  },
  {
    title: 'Administration',
    icon: Settings,
    href: '/admin',
    permissions: ['admin', 'all']
  }
];

export const Sidebar = () => {
  const { user, hasPermission, loading } = useAuth();
  const { hasValidationAccess } = useValidationPermissions();
  const location = useLocation();

  if (loading) {
    return (
      <div className="w-64 bg-white shadow-lg border-r border-gray-200 h-full">
        <div className="p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded mb-6"></div>
            <div className="space-y-3">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-10 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Filtrer les éléments de navigation selon les permissions de l'utilisateur
  const visibleItems = navigationItems.filter(item => {
    // L'admin a accès à tout
    if (user.roles?.includes('admin')) return true;
    
    // Cas spécial pour les validations
    if (item.requiresValidationRole) {
      return hasValidationAccess();
    }
    
    // Vérifier si l'utilisateur a au moins une des permissions requises
    return item.permissions.some(permission => 
      hasPermission(permission) || 
      user.module_permissions?.includes(permission) ||
      user.permissions?.includes(permission)
    );
  });

  console.log('🔧 Sidebar - User:', user);
  console.log('🔧 Sidebar - Has validation access:', hasValidationAccess());
  console.log('🔧 Sidebar - Visible items:', visibleItems.map(item => item.title));

  return (
    <div className="w-64 bg-white shadow-lg border-r border-gray-200 h-full flex flex-col">
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center space-x-3">
          <img 
            src="/lovable-uploads/5c1b1d8b-3d62-4847-8e12-3e4dd4c0ba33.png" 
            alt="Logo SDBK" 
            className="h-10 w-10 object-contain"
          />
          <div>
            <h1 className="text-lg font-bold text-gray-900">SDBK</h1>
            <p className="text-xs text-gray-500">Transport Manager</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4">
        <div className="space-y-2">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;
            
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sdbk-blue text-white shadow-sdbk-blue"
                    : "text-gray-700 hover:bg-gray-100 hover:text-sdbk-blue"
                )}
              >
                <Icon className="h-5 w-5" />
                <span>{item.title}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="p-4 border-t border-gray-100">
        <div className="text-xs text-gray-500">
          <p>Connecté en tant que:</p>
          <p className="font-medium text-gray-700 capitalize">
            {user.prenom} {user.nom}
          </p>
          <p className="text-sdbk-blue font-medium">
            {user.role}
          </p>
        </div>
      </div>
    </div>
  );
};
