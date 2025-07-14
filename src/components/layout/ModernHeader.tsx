
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
    <header className="bg-card border-b border-border px-6 py-4 smooth-transition">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {showMenuButton && (
            <button
              onClick={onMenuClick}
              className="p-2 rounded-lg hover:bg-accent smooth-transition lg:hidden"
              aria-label="Toggle menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}
          
          <div>
            <h1 className="text-xl font-semibold text-foreground">{title}</h1>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Barre de recherche */}
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Rechercher..."
              className="modern-input pl-10 w-64 h-9"
            />
          </div>

          {/* Notifications */}
          <button className="relative p-2 rounded-lg hover:bg-accent smooth-transition">
            <Bell className="w-5 h-5 text-muted-foreground" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-destructive rounded-full border-2 border-card"></div>
          </button>

          {/* Menu utilisateur */}
          <UserMenu />
        </div>
      </div>
    </header>
  );
};
