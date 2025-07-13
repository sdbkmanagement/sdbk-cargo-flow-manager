
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
  Shield
} from 'lucide-react';

const navigation = [
  { name: 'Tableau de bord', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Flotte', href: '/fleet', icon: Truck },
  { name: 'Chauffeurs', href: '/drivers', icon: Users },
  { name: 'Missions', href: '/missions', icon: MapPin },
  { name: 'Chargements', href: '/cargo', icon: Package },
  { name: 'Facturation', href: '/billing', icon: FileText },
  { name: 'Validations', href: '/validations', icon: CheckSquare },
  { name: 'Ressources Humaines', href: '/rh', icon: UserCheck },
  { name: 'Administration', href: '/administration', icon: Shield },
  { name: 'Guide', href: '/guide', icon: BookOpen },
];

export const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className={cn(
      "bg-brand-blue shadow-elegant transition-all duration-300 flex flex-col relative",
      collapsed ? "w-16" : "w-64"
    )}>
      {/* Header avec logo et toggle */}
      <div className="p-4 border-b border-blue-700/30">
        <div className="flex items-center justify-between">
          {!collapsed && (
            <div className="flex items-center space-x-3 animate-fade-in">
              <div className="p-2 bg-brand-gold rounded-lg shadow-brand-glow">
                <Truck className="h-6 w-6 text-brand-darkText" />
              </div>
              <div>
                <span className="text-xl font-bold text-white">SDBK</span>
                <p className="text-xs text-blue-200">Cargo Flow Manager</p>
              </div>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCollapsed(!collapsed)}
            className="h-8 w-8 p-0 text-white hover:bg-blue-700/50 hover:text-brand-gold transition-colors"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navigation.map((item, index) => (
          <NavLink
            key={item.name}
            to={item.href}
            className={({ isActive }) =>
              cn(
                "group flex items-center space-x-3 px-3 py-3 rounded-lg text-sm font-medium transition-all duration-200 relative overflow-hidden",
                "hover:bg-blue-700/50 hover:translate-x-1 hover:shadow-md",
                isActive
                  ? "bg-brand-gold text-brand-darkText shadow-brand-glow font-semibold"
                  : "text-blue-100 hover:text-white"
              )
            }
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <item.icon className={cn(
              "h-5 w-5 flex-shrink-0 transition-all duration-200",
              "group-hover:scale-110"
            )} />
            {!collapsed && (
              <span className="animate-fade-in">{item.name}</span>
            )}
            {/* Indicateur actif */}
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-brand-gold rounded-l-full opacity-0 group-hover:opacity-100 transition-opacity" />
          </NavLink>
        ))}
      </nav>

      {/* User Menu et informations */}
      <div className="p-4 border-t border-blue-700/30 bg-blue-900/30">
        {!collapsed ? (
          <div className="space-y-3 animate-fade-in">
            <div className="text-xs text-blue-200 text-center">
              <div className="font-medium">SDBK Cargo Flow Manager</div>
              <div className="text-blue-300">Version 1.0.0</div>
            </div>
            <div className="flex justify-center">
              <UserMenu />
            </div>
          </div>
        ) : (
          <div className="flex justify-center">
            <UserMenu />
          </div>
        )}
      </div>
    </div>
  );
};
