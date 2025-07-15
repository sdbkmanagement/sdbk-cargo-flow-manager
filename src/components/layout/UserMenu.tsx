
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { LogOut, User, Settings, Loader2 } from 'lucide-react';

export const UserMenu = () => {
  const { user, logout, loading } = useAuth();

  const handleLogout = async () => {
    console.log('🚪 Logout initiated from UserMenu');
    try {
      await logout();
      console.log('✅ Logout completed successfully');
    } catch (error) {
      console.error('❌ Logout error:', error);
    }
  };

  if (loading) {
    return (
      <Button variant="ghost" className="relative h-12 w-12 rounded-xl border border-sdbk-medium/20 hover:border-sdbk-accent/30 hover:shadow-soft">
        <Loader2 className="h-5 w-5 animate-spin text-sdbk-accent" />
      </Button>
    );
  }

  if (!user) return null;

  const initials = `${user.prenom.charAt(0)}${user.nom.charAt(0)}`.toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-12 w-12 rounded-xl border border-sdbk-medium/20 hover:border-sdbk-accent/30 hover:shadow-soft transition-all duration-300">
          <Avatar className="h-10 w-10 border-2 border-sdbk-accent/20">
            <AvatarFallback className="bg-gradient-to-br from-sdbk-accent via-sdbk-primary to-sdbk-secondary text-white font-bold text-sm">
              {initials}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64 bg-white/95 backdrop-blur-md border border-sdbk-medium/20 shadow-elegant rounded-xl" align="end" forceMount>
        <DropdownMenuLabel className="font-normal p-4">
          <div className="flex flex-col space-y-2">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 border-2 border-sdbk-accent/30">
                <AvatarFallback className="bg-gradient-to-br from-sdbk-accent to-sdbk-primary text-white font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-semibold text-sdbk-primary">
                  {user.prenom} {user.nom}
                </p>
                <p className="text-xs text-sdbk-medium">
                  {user.email}
                </p>
              </div>
            </div>
            <div className="px-3 py-1 rounded-lg bg-gradient-to-r from-sdbk-accent/10 to-sdbk-primary/10 border border-sdbk-accent/20">
              <p className="text-xs font-medium text-sdbk-accent capitalize">
                {user.role}
              </p>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-sdbk-medium/20" />
        <DropdownMenuItem disabled className="px-4 py-3 cursor-not-allowed opacity-60">
          <User className="mr-3 h-4 w-4 text-sdbk-medium" />
          <span className="text-sdbk-medium">Profil</span>
        </DropdownMenuItem>
        <DropdownMenuItem disabled className="px-4 py-3 cursor-not-allowed opacity-60">
          <Settings className="mr-3 h-4 w-4 text-sdbk-medium" />
          <span className="text-sdbk-medium">Paramètres</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-sdbk-medium/20" />
        <DropdownMenuItem 
          onClick={handleLogout} 
          className="px-4 py-3 text-sdbk-danger hover:bg-red-50 hover:text-red-700 focus:bg-red-50 focus:text-red-700 transition-colors duration-200"
        >
          <LogOut className="mr-3 h-4 w-4" />
          <span>Se déconnecter</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
