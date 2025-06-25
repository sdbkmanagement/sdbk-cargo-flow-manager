
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Truck, 
  Users, 
  CheckSquare, 
  Calendar, 
  Package, 
  FileText, 
  BarChart3, 
  Settings,
  UserCheck,
  MapPin,
  BookOpen
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const navigationItems = [
  {
    title: 'Tableau de bord',
    icon: BarChart3,
    path: '/dashboard',
    roles: ['all']
  },
  {
    title: 'Flotte',
    icon: Truck,
    path: '/fleet',
    roles: ['maintenance', 'admin', 'transport']
  },
  {
    title: 'Chauffeurs',
    icon: Users,
    path: '/drivers',
    roles: ['rh', 'admin', 'transport']
  },
  {
    title: 'Missions',
    icon: MapPin,
    path: '/missions',
    roles: ['transport', 'admin', 'obc']
  },
  {
    title: 'Validations',
    icon: CheckSquare,
    path: '/validations',
    roles: ['maintenance', 'administratif', 'hsecq', 'obc', 'admin']
  },
  {
    title: 'Chargements',
    icon: Package,
    path: '/cargo',
    roles: ['transport', 'obc', 'admin']
  },
  {
    title: 'Facturation',
    icon: FileText,
    path: '/billing',
    roles: ['facturation', 'admin', 'direction']
  },
  {
    title: 'RH',
    icon: UserCheck,
    path: '/hr',
    roles: ['rh', 'admin']
  },
  {
    title: 'Guide d\'utilisation',
    icon: BookOpen,
    path: '/guide',
    roles: ['all']
  },
  {
    title: 'Administration',
    icon: Settings,
    path: '/admin',
    roles: ['admin']
  }
];

export const Sidebar = () => {
  const location = useLocation();
  const { user, hasRole } = useAuth();

  const filteredItems = navigationItems.filter(item => 
    item.roles.includes('all') || item.roles.some(role => hasRole(role as any))
  );

  return (
    <div className="w-64 bg-slate-900 text-white min-h-screen p-4">
      <div className="mb-8">
        <h1 className="text-xl font-bold text-orange-400">SDBK Transport</h1>
        <p className="text-sm text-slate-400">Gestion de flotte</p>
      </div>

      <div className="mb-6">
        <div className="flex items-center space-x-3 p-3 bg-slate-800 rounded-lg">
          <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
            {user?.prenom.charAt(0)}
          </div>
          <div>
            <p className="text-sm font-medium">{user?.prenom} {user?.nom}</p>
            <p className="text-xs text-slate-400 capitalize">{user?.role}</p>
          </div>
        </div>
      </div>

      <nav className="space-y-2">
        {filteredItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname.startsWith(item.path);
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                isActive 
                  ? 'bg-orange-500 text-white' 
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon size={20} />
              <span className="text-sm font-medium">{item.title}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
};
