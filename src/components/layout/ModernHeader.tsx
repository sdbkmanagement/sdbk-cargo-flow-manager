import React, { useState, useEffect } from 'react';
import { Menu, User, Bell, Search, Settings, Home, Truck, AlertTriangle, FileWarning, Calendar, Sun, Moon } from 'lucide-react';
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
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    loadAlertes();
    // Check for saved dark mode preference
    const saved = localStorage.getItem('sdbk-dark-mode');
    if (saved === 'true') {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    const newVal = !isDark;
    setIsDark(newVal);
    localStorage.setItem('sdbk-dark-mode', String(newVal));
    document.documentElement.classList.toggle('dark', newVal);
  };

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
    if (niveau.includes('EXPIRÉ')) return 'bg-destructive';
    if (niveau === 'URGENT') return 'bg-warning';
    return 'bg-warning/80';
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
    <header className="bg-card/80 backdrop-blur-xl border-b border-border/50 px-4 sm:px-6 h-16 flex items-center justify-between sticky top-0 z-50">
      <div className="flex items-center gap-4">
        {showMenuButton && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuClick}
            className="lg:hidden h-9 w-9 rounded-lg"
          >
            <Menu className="h-[18px] w-[18px]" />
          </Button>
        )}
        
        <div className="flex items-center gap-4">
          <div 
            className="flex items-center gap-2.5 cursor-pointer group"
            onClick={() => navigate('/')}
          >
            <img src="/images/logo-sdbk.png" alt="SDBK" className="h-8 object-contain group-hover:scale-105 transition-transform duration-200" />
          </div>

          <div className="hidden lg:flex items-center">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate('/')}
              className="text-muted-foreground hover:text-foreground text-[13px] h-8 px-3 rounded-lg"
            >
              <Home className="w-3.5 h-3.5 mr-1.5" />
              Accueil
            </Button>
          </div>
        </div>
        
        {title && (
          <div className="hidden sm:flex items-center gap-2">
            <div className="w-px h-5 bg-border" />
            <h2 className="text-sm font-semibold text-foreground">{title}</h2>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        {/* Search */}
        <div className="hidden md:flex relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-3.5 w-3.5" />
          <Input
            placeholder="Rechercher..."
            className="pl-9 w-56 h-9 bg-secondary/50 border-border/50 focus:bg-card text-[13px] rounded-lg"
          />
        </div>

        {/* Dark mode toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleDarkMode}
          className="h-9 w-9 rounded-lg text-muted-foreground hover:text-foreground"
        >
          {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              className="relative h-9 w-9 rounded-lg text-muted-foreground hover:text-foreground"
            >
              <Bell className="h-4 w-4" />
              {alertes.length > 0 && (
                <span className={`absolute -top-0.5 -right-0.5 h-4 min-w-4 flex items-center justify-center px-1 text-[10px] font-bold rounded-full text-white ${urgentCount > 0 ? 'bg-destructive animate-pulse-soft' : 'bg-warning'}`}>
                  {alertes.length > 9 ? '9+' : alertes.length}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 bg-popover/95 backdrop-blur-xl border-border/50 shadow-elegant rounded-xl">
            <DropdownMenuLabel className="flex items-center justify-between py-3">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-primary" />
                <span className="font-semibold text-foreground text-sm">Notifications</span>
              </div>
              <Badge variant="secondary" className="text-[10px] font-semibold">
                {alertes.length}
              </Badge>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            
            {loading ? (
              <div className="py-8 text-center text-muted-foreground">
                <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
                <p className="text-xs">Chargement...</p>
              </div>
            ) : alertes.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                <Bell className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="text-xs">Aucune alerte en cours</p>
              </div>
            ) : (
              <ScrollArea className="h-[280px]">
                {alertes.slice(0, 10).map((alerte) => (
                  <DropdownMenuItem
                    key={alerte.id}
                    className="flex flex-col items-start gap-1.5 p-3 cursor-pointer hover:bg-accent transition-colors border-b border-border/30 last:border-0"
                    onClick={() => handleAlerteClick(alerte)}
                  >
                    <div className="flex items-center gap-2 w-full">
                      <div className={`p-1.5 rounded-lg ${alerte.type === 'chauffeur' ? 'bg-primary/10' : 'bg-success/10'}`}>
                        {alerte.type === 'chauffeur' ? (
                          <User className="h-3 w-3 text-primary" />
                        ) : (
                          <Truck className="h-3 w-3 text-success" />
                        )}
                      </div>
                      <span className="font-medium text-[13px] text-foreground flex-1 truncate">
                        {alerte.type === 'chauffeur' ? alerte.chauffeur_nom : `${alerte.vehicule_numero}`}
                      </span>
                      <Badge className={`text-[9px] px-1.5 py-0 ${getAlerteBadgeColor(alerte.niveau_alerte)} text-white border-0`}>
                        {alerte.niveau_alerte}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground pl-8">
                      <FileWarning className="h-3 w-3" />
                      <span className="truncate">{alerte.document_nom}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground/60 pl-8">
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
                      className="text-primary text-xs"
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

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              className="flex items-center gap-2 h-9 px-2 rounded-lg"
            >
              <Avatar className="h-7 w-7 border border-border">
                <AvatarFallback className="bg-primary/10 text-primary text-[11px] font-semibold">
                  {user?.email?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <span className="hidden md:block text-[13px] font-medium text-foreground max-w-[120px] truncate">
                {user?.email || 'Utilisateur'}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-popover/95 backdrop-blur-xl border-border/50 shadow-elegant rounded-xl">
            <DropdownMenuLabel className="py-3">
              <div className="font-semibold text-foreground text-sm">Mon compte</div>
              <div className="text-[11px] text-muted-foreground mt-0.5 truncate">{user?.email}</div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="rounded-lg mx-1 text-[13px]">
              <User className="mr-2.5 h-3.5 w-3.5 text-muted-foreground" />
              Profil
            </DropdownMenuItem>
            <DropdownMenuItem className="rounded-lg mx-1 text-[13px]">
              <Settings className="mr-2.5 h-3.5 w-3.5 text-muted-foreground" />
              Paramètres
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={handleLogout} 
              className="text-destructive rounded-lg mx-1 text-[13px]"
            >
              Déconnexion
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};
