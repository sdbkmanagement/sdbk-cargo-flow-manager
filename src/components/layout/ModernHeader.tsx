import React, { useState, useEffect } from 'react';
import { Menu, User, Bell, Search, Settings, Home, Truck, AlertTriangle, FileWarning, Calendar } from 'lucide-react';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { alertesService, AlerteDocument } from '@/services/alertesService';

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
  const [alertes, setAlertes] = useState<AlerteDocument[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadAlertes();
  }, []);

  const loadAlertes = async () => {
    setLoading(true);
    try {
      const data = await alertesService.getToutesAlertes();
      setAlertes(data);
    } catch (error) {
      console.error('Erreur chargement alertes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  };

  const getAlerteBadgeColor = (niveau: string) => {
    if (niveau.includes('EXPIRÉ')) return 'bg-red-600';
    if (niveau === 'URGENT') return 'bg-orange-500';
    return 'bg-yellow-500';
  };

  const handleAlerteClick = (alerte: AlerteDocument) => {
    if (alerte.type === 'chauffeur') {
      navigate('/drivers');
    } else {
      navigate('/fleet');
    }
  };

  const urgentCount = alertes.filter(a => 
    a.niveau_alerte.includes('EXPIRÉ') || a.niveau_alerte === 'URGENT'
  ).length;

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

        {/* Notifications avec dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm" 
              className="relative hover:bg-blue-50 hover:text-blue-600 transition-colors duration-200 rounded-xl"
            >
              <Bell className="h-5 w-5" />
              {alertes.length > 0 && (
                <Badge className={`absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs ${urgentCount > 0 ? 'bg-red-500 animate-pulse' : 'bg-orange-500'} hover:bg-red-600 transition-colors`}>
                  {alertes.length > 9 ? '9+' : alertes.length}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 bg-white/95 backdrop-blur-md border-white/20 shadow-xl rounded-xl">
            <DropdownMenuLabel className="flex items-center justify-between py-3">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-blue-600" />
                <span className="font-semibold text-gray-900">Notifications</span>
              </div>
              <Badge variant="secondary" className="text-xs">
                {alertes.length} alerte{alertes.length > 1 ? 's' : ''}
              </Badge>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            
            {loading ? (
              <div className="py-8 text-center text-gray-500">
                <div className="animate-spin h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                Chargement...
              </div>
            ) : alertes.length === 0 ? (
              <div className="py-8 text-center text-gray-500">
                <Bell className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                <p>Aucune alerte en cours</p>
              </div>
            ) : (
              <ScrollArea className="h-[300px]">
                {alertes.slice(0, 10).map((alerte) => (
                  <DropdownMenuItem
                    key={alerte.id}
                    className="flex flex-col items-start gap-1 p-3 cursor-pointer hover:bg-blue-50 transition-colors duration-200 border-b border-gray-100 last:border-0"
                    onClick={() => handleAlerteClick(alerte)}
                  >
                    <div className="flex items-center gap-2 w-full">
                      <div className={`p-1.5 rounded-full ${alerte.type === 'chauffeur' ? 'bg-blue-100' : 'bg-green-100'}`}>
                        {alerte.type === 'chauffeur' ? (
                          <User className="h-3 w-3 text-blue-600" />
                        ) : (
                          <Truck className="h-3 w-3 text-green-600" />
                        )}
                      </div>
                      <span className="font-medium text-sm text-gray-900 flex-1 truncate">
                        {alerte.type === 'chauffeur' ? alerte.chauffeur_nom : `${alerte.vehicule_numero}`}
                      </span>
                      <Badge className={`text-[10px] px-1.5 py-0 ${getAlerteBadgeColor(alerte.niveau_alerte)} text-white`}>
                        {alerte.niveau_alerte}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500 pl-7">
                      <FileWarning className="h-3 w-3" />
                      <span className="truncate">{alerte.document_nom}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-400 pl-7">
                      <Calendar className="h-3 w-3" />
                      <span>
                        {alerte.jours_restants !== null && alerte.jours_restants < 0 
                          ? `Expiré depuis ${Math.abs(alerte.jours_restants)} jour(s)`
                          : `Expire dans ${alerte.jours_restants} jour(s)`
                        }
                      </span>
                    </div>
                  </DropdownMenuItem>
                ))}
                {alertes.length > 10 && (
                  <div className="p-3 text-center">
                    <Button 
                      variant="link" 
                      size="sm" 
                      className="text-blue-600"
                      onClick={() => navigate('/fleet')}
                    >
                      Voir toutes les alertes ({alertes.length})
                    </Button>
                  </div>
                )}
              </ScrollArea>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

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