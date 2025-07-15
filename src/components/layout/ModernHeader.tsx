
import React from 'react';
import { UserMenu } from '@/components/layout/UserMenu';
import { Bell, Search, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModernHeaderProps {
  title?: string;
  onMenuClick?: () => void;
  showMenuButton?: boolean;
}

export const ModernHeader: React.FC<ModernHeaderProps> = ({ 
  title = "SDBK Transport Manager",
  onMenuClick,
  showMenuButton = false
}) => {
  return (
    <header className="bg-gradient-to-r from-white via-sdbk-light to-white border-b border-sdbk-medium/20 px-6 py-4 shadow-soft backdrop-blur-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {showMenuButton && (
            <button
              onClick={onMenuClick}
              className="p-3 rounded-xl hover:bg-sdbk-accent/10 transition-all duration-300 lg:hidden border border-sdbk-medium/20 hover:border-sdbk-accent/30 hover:shadow-soft"
              aria-label="Toggle menu"
            >
              <Menu className="w-5 h-5 text-sdbk-primary" />
            </button>
          )}
          
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-sdbk-primary to-sdbk-accent bg-clip-text text-transparent">
              {title}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Barre de recherche */}
          <div className="relative hidden md:block">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-sdbk-medium" />
            <input
              type="text"
              placeholder="Rechercher..."
              className="pl-12 pr-4 py-3 w-80 rounded-xl border border-sdbk-medium/30 bg-white/70 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-sdbk-accent/50 focus:border-sdbk-accent transition-all duration-300 text-sdbk-primary placeholder-sdbk-medium hover:shadow-soft"
            />
          </div>

          {/* Notifications */}
          <button className="relative p-3 rounded-xl hover:bg-sdbk-accent/10 transition-all duration-300 border border-sdbk-medium/20 hover:border-sdbk-accent/30 hover:shadow-soft group">
            <Bell className="w-5 h-5 text-sdbk-medium group-hover:text-sdbk-accent transition-colors duration-300" />
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-sdbk-danger to-red-500 rounded-full border-2 border-white shadow-sm animate-pulse-soft">
              <div className="w-full h-full rounded-full bg-gradient-to-r from-sdbk-danger to-red-500 animate-ping opacity-75"></div>
            </div>
          </button>

          {/* Menu utilisateur */}
          <UserMenu />
        </div>
      </div>
    </header>
  );
};
