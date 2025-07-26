import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { 
  ArrowLeft,
  Bell,
  User,
  LogOut,
  Truck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ModuleLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

export const ModuleLayout: React.FC<ModuleLayoutProps> = ({
  children,
  title,
  subtitle
}) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleBackToHub = () => {
    navigate('/');
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-indigo-50/30">
      {/* Top Bar fullscreen */}
      <header className="bg-white/80 backdrop-blur-md border-b border-white/20 sticky top-0 z-50">
        <div className="max-w-full mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Gauche: Retour + Logo + Titre module */}
            <div className="flex items-center gap-6">
              {/* Bouton retour */}
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleBackToHub}
                className="flex items-center gap-2 hover:bg-blue-50 text-gray-700 hover:text-blue-600"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="font-medium">Retour aux modules</span>
              </Button>

              {/* Séparateur */}
              <div className="w-px h-6 bg-gray-300"></div>

              {/* Logo + Titre du module */}
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                  <Truck className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
                  {subtitle && (
                    <p className="text-xs text-gray-500">{subtitle}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Droite: Notifications + Utilisateur */}
            <div className="flex items-center gap-4">
              {/* Badge statut système */}
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 hidden sm:flex">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                Opérationnel
              </Badge>

              {/* Notifications */}
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="w-5 h-5" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></div>
              </Button>

              {/* Menu utilisateur */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                    <span className="font-medium hidden sm:inline">{user?.prenom}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-3 py-2">
                    <p className="text-sm font-medium">{user?.prenom} {user?.nom}</p>
                    <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleBackToHub}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Retour aux modules
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="w-4 h-4 mr-2" />
                    Déconnexion
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      {/* Contenu principal fullscreen */}
      <main className="flex-1 p-6">
        <div className="max-w-full">
          {/* Container moderne avec effet glassmorphism */}
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-white/20 shadow-xl p-6 lg:p-8 min-h-[calc(100vh-120px)]">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};