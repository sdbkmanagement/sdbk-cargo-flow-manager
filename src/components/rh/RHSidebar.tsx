import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import {
  Users, LayoutDashboard, Bell, CalendarCheck, Wallet,
  Target, Award, GraduationCap, FolderOpen, BarChart3, Truck,
  ChevronDown, PanelLeftClose, PanelLeftOpen,
} from 'lucide-react';

interface RHSidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

export const RH_ITEMS = [
  { id: 'dashboard', label: 'Tableau de bord RH', icon: LayoutDashboard },
  { id: 'collaborateurs', label: 'Collaborateurs', icon: Users },
  { id: 'chauffeurs', label: 'Chauffeurs', icon: Truck },
  { id: 'alertes', label: 'Alertes RH', icon: Bell },
  { id: 'presences', label: 'Présences & Congés', icon: CalendarCheck },
  { id: 'paie', label: 'Paie & Masse salariale', icon: Wallet },
  { id: 'performance', label: 'Performance', icon: Target },
  { id: 'competences', label: 'Compétences & Talents', icon: Award },
  { id: 'formation', label: 'Formation', icon: GraduationCap },
  { id: 'documents', label: 'Documents RH', icon: FolderOpen },
  { id: 'kpi', label: 'KPI & Reporting', icon: BarChart3 },
] as const;

const groupes = [
  { id: 'vue', label: 'Vue d’ensemble', items: ['dashboard', 'alertes', 'kpi'] },
  { id: 'personnel', label: 'Personnel', items: ['collaborateurs', 'chauffeurs', 'documents'] },
  { id: 'temps-paie', label: 'Temps et rémunération', items: ['presences', 'paie'] },
  { id: 'developpement', label: 'Développement', items: ['performance', 'competences', 'formation'] },
] as const;

export const RHSidebar: React.FC<RHSidebarProps> = ({ activeSection, onSectionChange }) => {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const cleSidebar = user?.id ? `rh:sidebar-reduite:${user.id}` : 'rh:sidebar-reduite';
  const [reduite, setReduite] = useState(() => {
    if (typeof window === 'undefined') return false;
    const userId = window.localStorage.getItem('rh:dernier-utilisateur');
    return userId ? window.localStorage.getItem(`rh:sidebar-reduite:${userId}`) === 'true' : false;
  });
  const [groupesOuverts, setGroupesOuverts] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(groupes.map((groupe) => [groupe.id, true]))
  );
  const compacte = reduite && !isMobile;

  useEffect(() => {
    if (!user?.id) return;
    window.localStorage.setItem('rh:dernier-utilisateur', user.id);
    setReduite(window.localStorage.getItem(cleSidebar) === 'true');
  }, [cleSidebar, user?.id]);

  useEffect(() => {
    const groupeActif = groupes.find((groupe) => groupe.items.some((id) => id === activeSection));
    if (!groupeActif) return;
    setGroupesOuverts((actuels) => ({ ...actuels, [groupeActif.id]: true }));
  }, [activeSection]);

  const basculerSidebar = () => {
    setReduite((actuelle) => {
      const nouvelleValeur = !actuelle;
      window.localStorage.setItem(cleSidebar, String(nouvelleValeur));
      return nouvelleValeur;
    });
  };

  const afficherItem = (item: typeof RH_ITEMS[number]) => {
    const Icon = item.icon;
    const isActive = activeSection === item.id;
    const bouton = (
      <Button
        key={item.id}
        type="button"
        variant="ghost"
        size={compacte ? 'icon' : 'default'}
        onClick={() => onSectionChange(item.id)}
        aria-current={isActive ? 'page' : undefined}
        aria-label={item.label}
        className={cn(
          'h-10 text-sm font-medium md:w-full',
          compacte ? 'md:justify-center md:px-0' : 'justify-start px-3 text-left',
          isActive
            ? 'bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 hover:text-primary-foreground'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
        )}
      >
        <Icon className="h-4 w-4 shrink-0" />
        <span className={cn('min-w-0 truncate', compacte && 'md:hidden')}>{item.label}</span>
      </Button>
    );

    if (!compacte) return bouton;
    return (
      <Tooltip key={item.id}>
        <TooltipTrigger asChild>{bouton}</TooltipTrigger>
        <TooltipContent side="right" className="hidden md:block">{item.label}</TooltipContent>
      </Tooltip>
    );
  };

  return (
    <aside className={cn(
      'h-auto w-full shrink-0 overflow-y-auto border-b border-border bg-card transition-[width] duration-200 md:h-[calc(100vh-120px)] md:border-b-0 md:border-r',
      compacte ? 'md:w-16' : 'md:w-64'
    )}>
      <div className="space-y-1 p-3">
        <div className="mb-2 flex min-h-9 items-center justify-between gap-2 px-1">
          <p className={cn('truncate text-xs font-semibold uppercase text-primary', compacte && 'md:hidden')}>
            Module RH
          </p>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={basculerSidebar}
            className="ml-auto hidden h-9 w-9 md:inline-flex"
            aria-label={compacte ? 'Déployer la navigation RH' : 'Réduire la navigation RH'}
            title={compacte ? 'Déployer la navigation' : 'Réduire la navigation'}
          >
            {compacte ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </Button>
        </div>

        <TooltipProvider delayDuration={250}>
          <nav className="grid grid-cols-1 gap-1 sm:grid-cols-2 md:grid-cols-1" aria-label="Navigation du module RH">
            {groupes.map((groupe) => {
              const contientSectionActive = groupe.items.some((id) => id === activeSection);
              const itemsGroupe = RH_ITEMS.filter((item) => groupe.items.some((id) => id === item.id));

              if (compacte) {
                return (
                  <div key={groupe.id} className="contents md:block md:border-t md:border-border md:pt-1 first:md:border-t-0 first:md:pt-0">
                    {itemsGroupe.map(afficherItem)}
                  </div>
                );
              }

              return (
                <Collapsible
                  key={groupe.id}
                  open={groupesOuverts[groupe.id] || contientSectionActive}
                  onOpenChange={(open) => setGroupesOuverts((actuels) => ({ ...actuels, [groupe.id]: open }))}
                >
                  <CollapsibleTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      className="h-9 w-full justify-between px-3 text-xs font-semibold uppercase text-muted-foreground hover:text-foreground"
                    >
                      <span className="truncate">{groupe.label}</span>
                      <ChevronDown className={cn(
                        'h-4 w-4 shrink-0 transition-transform',
                        (groupesOuverts[groupe.id] || contientSectionActive) && 'rotate-180'
                      )} />
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-1 pb-2">
                    {itemsGroupe.map(afficherItem)}
                  </CollapsibleContent>
                </Collapsible>
              );
            })}
          </nav>
        </TooltipProvider>
      </div>
    </aside>
  );
};
