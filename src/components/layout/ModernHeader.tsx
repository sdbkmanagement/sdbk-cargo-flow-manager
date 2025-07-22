
import React from 'react';
import { UserMenu } from '@/components/layout/UserMenu';
import { Search, Menu } from 'lucide-react';
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
    <header className="bg-gradient-to-r from-slate-50 via-blue-50/50 to-slate-50 border-b border-slate-200/60 px-3 sm:px-4 lg:px-6 py-3 lg:py-4 shadow-sm backdrop-blur-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 sm:gap-4">
          {showMenuButton && (
            <button
              onClick={onMenuClick}
              className="p-2 lg:p-3 rounded-xl hover:bg-blue-100/80 transition-all duration-300 lg:hidden border border-slate-200/60 hover:border-blue-300/50 hover:shadow-sm"
              aria-label="Toggle menu"
            >
              <Menu className="w-5 h-5 text-slate-700" />
            </button>
          )}
          
          <div>
            <h1 className="text-lg sm:text-xl lg:text-2xl font-bold bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-600 bg-clip-text text-transparent">
              <span className="hidden sm:inline">{title}</span>
              <span className="sm:hidden">SDBK</span>
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          {/* Barre de recherche - cachée sur mobile */}
          <div className="relative hidden md:block">
            <Search className="absolute left-3 lg:left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Rechercher..."
              className="pl-10 lg:pl-12 pr-3 lg:pr-4 py-2 lg:py-3 w-60 lg:w-80 rounded-xl border border-slate-200/80 bg-white/90 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all duration-300 text-slate-700 placeholder-slate-500 hover:shadow-sm text-sm lg:text-base"
            />
          </div>

          {/* Menu utilisateur */}
          <UserMenu />
        </div>
      </div>
    </header>
  );
};
