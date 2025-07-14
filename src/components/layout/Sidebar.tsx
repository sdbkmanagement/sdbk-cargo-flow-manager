
import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { UserMenu } from './UserMenu';
import { 
  LayoutDashboard,
  Truck, 
  Users, 
  MapPin, 
  Package, 
  FileText, 
  CheckSquare,
  UserCheck,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Shield,
  Zap
} from 'lucide-react';

const navigation = [
  { name: 'Tableau de bord', href: '/dashboard', icon: LayoutDashboard, color: 'text-white' },
  { name: 'Flotte', href: '/fleet', icon: Truck, color: 'text-white' },
  { name: 'Chauffeurs', href: '/drivers', icon: Users, color: 'text-white' },
  { name: 'Missions', href: '/missions', icon: MapPin, color: 'text-white' },
  { name: 'Chargements', href: '/cargo', icon: Package, color: 'text-white' },
  { name: 'Facturation', href: '/billing', icon: FileText, color: 'text-white' },
  { name: 'Validations', href: '/validations', icon: CheckSquare, color: 'text-white' },
  { name: 'Ressources Humaines', href: '/rh', icon: UserCheck, color: 'text-white' },
  { name: 'Administration', href: '/administration', icon: Shield, color: 'text-white' },
  { name: 'Guide', href: '/guide', icon: BookOpen, color: 'text-white' },
];

export const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className={cn(
      "bg-sdbk-blue shadow-2xl transition-all duration-300 flex flex-col relative border-r border-blue-800/20",
      collapsed ? "w-20" : "w-72"
    )}>
      {/* Header avec logo SDBK */}
      <div className="p-6 border-b border-blue-800/20">
        <div className="flex items-center justify-between">
          {!collapsed && (
            <div className="flex items-center space-x-4 animate-fade-in">
              <div className="relative">
                <div className="p-2 bg-white rounded-xl shadow-lg">
                  <img 
                    src="/lovable-uploads/5c1b1d8b-3d62-4847-8e12-3e4dd4c0ba33.png" 
                    alt="Logo SDBK" 
                    className="h-12 w-12 object-contain"
                  />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-sdbk-red rounded-full flex items-center justify-center">
                  <Zap className="h-2.5 w-2.5 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">SDBK</h1>
                <p className="text-sm text-blue-200 font-medium">Cargo Flow Manager</p>
                <p className="text-xs text-blue-300">Version 2.0</p>
              </div>
            </div>
          )}
          {collapsed && (
            <div className="flex justify-center w-full">
              <div className="p-1 bg-white rounded-lg">
                <img 
                  src="/lovable-uploads/5c1b1d8b-3d62-4847-8e12-3e4dd4c0ba33.png" 
                  alt="Logo SDBK" 
                  className="h-8 w-8 object-contain"
                />
              </div>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCollapsed(!collapsed)}
            className="h-10 w-10 p-0 text-white hover:bg-blue-700/50 hover:text-sdbk-green transition-all duration-200 rounded-lg"
          >
            {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {navigation.map((item, index) => (
          <NavLink
            key={item.name}
            to={item.href}
            className={({ isActive }) =>
              cn(
                "group flex items-center space-x-4 px-4 py-3.5 rounded-xl text-sm font-medium transition-all duration-200 relative overflow-hidden",
                "hover:bg-blue-700/50 hover:translate-x-1 hover:shadow-lg hover:scale-[1.02]",
                isActive
                  ? "bg-sdbk-green text-white shadow-sdbk-green font-semibold scale-[1.02]"
                  : "text-blue-100 hover:text-white"
              )
            }
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="relative">
              <item.icon className={cn(
                "h-6 w-6 flex-shrink-0 transition-all duration-200",
                "group-hover:scale-110 group-hover:rotate-3"
              )} />
            </div>
            {!collapsed && (
              <span className="animate-fade-in font-medium">{item.name}</span>
            )}
            {/* Indicateur actif */}
            <div className="absolute right-2 top-1/2 -translate-y-1/2 w-2 h-8 bg-sdbk-green rounded-full opacity-0 group-hover:opacity-50 transition-opacity" />
          </NavLink>
        ))}
      </nav>

      {/* User Menu et informations */}
      <div className="p-4 border-t border-blue-800/20 bg-blue-900/30">
        {!collapsed ? (
          <div className="space-y-4 animate-fade-in">
            <div className="text-center">
              <div className="text-xs text-blue-200 font-medium">SDBK Cargo Flow Manager</div>
              <div className="text-xs text-blue-300">Système de gestion intégré</div>
              <div className="mt-2 flex items-center justify-center space-x-2">
                <div className="w-2 h-2 bg-sdbk-green rounded-full animate-pulse" />
                <span className="text-xs text-blue-300">Système opérationnel</span>
              </div>
            </div>
            <div className="flex justify-center">
              <UserMenu />
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-3">
            <div className="w-2 h-2 bg-sdbk-green rounded-full animate-pulse" />
            <UserMenu />
          </div>
        )}
      </div>
    </div>
  );
};
