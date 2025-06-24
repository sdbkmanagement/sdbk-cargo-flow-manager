import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Home, BarChart3, Users, Truck, FileText, MapPin } from 'lucide-react';

interface MenuItem {
  icon: React.ComponentType<any>;
  label: string;
  path: string;
}

const Sidebar = () => {
  const location = useLocation();
  
  const menuItems = [
    { icon: Home, label: 'Accueil', path: '/' },
    { icon: BarChart3, label: 'Dashboard', path: '/dashboard' },
    { icon: Users, label: 'Chauffeurs', path: '/drivers' },
    { icon: Truck, label: 'Flotte', path: '/fleet' },
    { icon: MapPin, label: 'Missions', path: '/missions' },
    { icon: FileText, label: 'Facturation', path: '/billing' },
  ];

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-gray-800 text-white">
      <div className="p-6">
        <Link to="/" className="flex items-center text-lg font-semibold">
          <Truck className="mr-2 w-6 h-6" />
          SDBK Cargo
        </Link>
      </div>
      <nav className="py-4">
        <ul>
          {menuItems.map((item) => (
            <li key={item.label} className="mb-1">
              <Link
                to={item.path}
                className={`flex items-center p-4 hover:bg-gray-700 transition-colors ${location.pathname === item.path ? 'bg-gray-700' : ''}`}
              >
                <item.icon className="mr-3 w-5 h-5" />
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;
