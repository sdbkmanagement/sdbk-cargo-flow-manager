
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
  Menu
} from 'lucide-react';

const navigation = [
  { name: 'Accueil', href: '/', icon: LayoutDashboard },
  { name: 'Tableau de bord', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Flotte', href: '/fleet', icon: Truck },
  { name: 'Chauffeurs', href: '/drivers', icon: Users },
  { name: 'Missions', href: '/missions', icon: MapPin },
  { name: 'Chargements', href: '/cargo', icon: Package },
  { name: 'Facturation', href: '/billing', icon: FileText },
  { name: 'Validations', href: '/validations', icon: CheckSquare },
  { name: 'Ressources Humaines', href: '/rh', icon: UserCheck },
  { name: 'Guide', href: '/guide', icon: BookOpen },
];

export const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className={cn(
      "bg-white shadow-lg transition-all duration-300 flex flex-col",
      collapsed ? "w-16" : "w-64"
    )}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          {!collapsed && (
            <div className="flex items-center space-x-2">
              <Truck className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">SDBK</span>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCollapsed(!collapsed)}
            className="h-8 w-8 p-0"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            className={({ isActive }) =>
              cn(
                "flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-blue-100 text-blue-700"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              )
            }
          >
            <item.icon className="h-5 w-5 flex-shrink-0" />
            {!collapsed && <span>{item.name}</span>}
          </NavLink>
        ))}
      </nav>

      {/* User Menu */}
      <div className="p-4 border-t border-gray-200">
        {!collapsed ? (
          <div className="flex items-center justify-between">
            <div className="text-xs text-gray-500">
              SDBK Cargo Flow Manager
              <br />
              v1.0.0
            </div>
            <UserMenu />
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
