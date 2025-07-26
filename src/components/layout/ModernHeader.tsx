import React from 'react';
import { Menu, User, Bell, Search, Settings, Home, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface ModernHeaderProps {
  title?: string;
  onMenuClick: () => void;
  showMenuButton?: boolean;
}

export const ModernHeader: React.FC<ModernHeaderProps> = ({
  title,
  onMenuClick,
  showMenuButton = true
}) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  };

  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-white/20 px-6 py-4 flex items-center justify-between sticky top-0 z-50 shadow-sm">
      <div className="flex items-center gap-6">
        {showMenuButton && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onMenuClick}
            className="lg:hidden hover:bg-blue-50 hover:text-blue-600 transition-colors duration-200"
          >
            <Menu className="h-5 w-5" />
          </Button>
        )}
        
        {/* Logo et navigation */}
        <div className="flex items-center space-x-6">
          <div 
            className="flex items-center space-x-3 cursor-pointer group"
            onClick={() => navigate('/')}
          >
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
              <Truck className="w-6 h-6 text-white" />
            </div>
            <div className="hidden md:block">
              <h1 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                SDBK Transport
              </h1>
            </div>
          </div>

          {/* Navigation rapide */}
          <div className="hidden lg:flex items-center space-x-1">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate('/')}
              className="text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-colors duration-200"
            >
              <Home className="w-4 h-4 mr-2" />
              Accueil
            </Button>
          </div>
        </div>
        
        {title && (
          <div className="hidden sm:block">
            <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
          </div>
        )}
      </div>

      <div className="flex items-center gap-4">
        {/* Barre de recherche moderne */}
        <div className="hidden md:flex relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Rechercher..."
            className="pl-10 w-72 bg-white/50 border-gray-200/50 focus:bg-white focus:border-blue-300 transition-all duration-200 rounded-xl"
          />
        </div>

        {/* Notifications avec animation */}
        <Button 
          variant="ghost" 
          size="sm" 
          className="relative hover:bg-blue-50 hover:text-blue-600 transition-colors duration-200 rounded-xl"
        >
          <Bell className="h-5 w-5" />
          <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-red-500 hover:bg-red-600 transition-colors animate-pulse">
            3
          </Badge>
        </Button>

        {/* Menu utilisateur moderne */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              className="flex items-center gap-3 hover:bg-blue-50 transition-colors duration-200 rounded-xl px-3 py-2"
            >
              <Avatar className="h-9 w-9 border-2 border-blue-100">
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-sm font-semibold">
                  {user?.email?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <span className="hidden md:block text-sm font-medium text-gray-700">
                {user?.email || 'Utilisateur'}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64 bg-white/95 backdrop-blur-md border-white/20 shadow-xl rounded-xl">
            <DropdownMenuLabel className="text-center py-3">
              <div className="font-semibold text-gray-900">Mon compte</div>
              <div className="text-xs text-gray-500 mt-1">{user?.email}</div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="hover:bg-blue-50 transition-colors duration-200 rounded-lg mx-1">
              <User className="mr-3 h-4 w-4 text-blue-600" />
              <span>Profil</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="hover:bg-blue-50 transition-colors duration-200 rounded-lg mx-1">
              <Settings className="mr-3 h-4 w-4 text-blue-600" />
              <span>Paramètres</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={handleLogout} 
              className="text-red-600 hover:bg-red-50 transition-colors duration-200 rounded-lg mx-1"
            >
              Déconnexion
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};