import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  Popover, PopoverContent, PopoverTrigger
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  LayoutDashboard, Truck, Wrench, CalendarClock, Package, Coins, BarChart3,
  Bell, Plus, RefreshCw, ChevronRight, ChevronDown, ShieldCheck, CalendarCheck,
  PanelLeftClose, PanelLeftOpen,
} from 'lucide-react';
import { GmaoProvider, useGmao, GmaoSection } from '@/components/gmao/GmaoContext';
import { GmaoDashboard } from '@/components/gmao/GmaoDashboard';
import { GmaoEquipements } from '@/components/gmao/GmaoEquipements';
import { GmaoInterventions } from '@/components/gmao/GmaoInterventions';
import { GmaoPreventif } from '@/components/gmao/GmaoPreventif';
import { GmaoPieces } from '@/components/gmao/GmaoPieces';
import { GmaoCouts } from '@/components/gmao/GmaoCouts';
import { GmaoRapports } from '@/components/gmao/GmaoRapports';
import { SocotacModule } from '@/components/gmao/socotac/SocotacModule';
import { ControleAnnuelModule } from '@/components/gmao/annuel/ControleAnnuelModule';
import { GmaoDemandeForm } from '@/components/gmao/GmaoDemandeForm';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

const SECTIONS: { value: GmaoSection; label: string; icon: React.ElementType }[] = [
  { value: 'dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
  { value: 'equipements', label: 'Équipements', icon: Truck },
  { value: 'interventions', label: 'Interventions', icon: Wrench },
  { value: 'preventif', label: 'Maintenance préventive', icon: CalendarClock },
  { value: 'pieces', label: 'Pièces / Stock', icon: Package },
  { value: 'couts', label: 'Coûts', icon: Coins },
  { value: 'socotac', label: 'Contrôles SOCOTAC', icon: ShieldCheck },
  { value: 'controle_annuel', label: 'Contrôle Annuel', icon: CalendarCheck },
  { value: 'rapports', label: 'Rapports', icon: BarChart3 },
];

type GroupeNavigation = {
  id: string;
  label: string;
  sections: GmaoSection[];
};

const GROUPES: GroupeNavigation[] = [
  { id: 'vue', label: 'Vue d’ensemble', sections: ['dashboard', 'equipements'] },
  { id: 'maintenance', label: 'Maintenance', sections: ['interventions', 'preventif'] },
  { id: 'pilotage', label: 'Stocks et pilotage', sections: ['pieces', 'couts', 'rapports'] },
  { id: 'controles', label: 'Contrôles', sections: ['socotac', 'controle_annuel'] },
];

const estSectionGmao = (value: string | null): value is GmaoSection =>
  SECTIONS.some((item) => item.value === value);

const Contenu: React.FC = () => {
  const { section, allerA, alertes, rafraichir, chargement } = useGmao();
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [nouvelleIntervention, setNouvelleIntervention] = useState(false);
  const [sidebarReduite, setSidebarReduite] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem('gmao:sidebar-reduite') === 'true';
  });
  const [groupesOuverts, setGroupesOuverts] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(GROUPES.map((groupe) => [groupe.id, true]))
  );
  const sectionActive = SECTIONS.find((item) => item.value === section);
  const cleOnglet = user?.id ? `gmao:onglet-actif:${user.id}` : null;
  const navigationCompacte = sidebarReduite && !isMobile;

  const sectionsParGroupe = useMemo(
    () => GROUPES.map((groupe) => ({
      ...groupe,
      items: SECTIONS.filter((item) => groupe.sections.includes(item.value)),
    })),
    []
  );

  useEffect(() => {
    if (!cleOnglet) return;
    const ongletMemorise = window.localStorage.getItem(cleOnglet);
    if (estSectionGmao(ongletMemorise)) allerA(ongletMemorise);
  }, [allerA, cleOnglet]);

  useEffect(() => {
    const groupeActif = GROUPES.find((groupe) => groupe.sections.includes(section));
    if (!groupeActif) return;
    setGroupesOuverts((actuels) => ({ ...actuels, [groupeActif.id]: true }));
  }, [section]);

  const naviguer = useCallback((destination: GmaoSection, equipementId?: string) => {
    if (cleOnglet) window.localStorage.setItem(cleOnglet, destination);
    allerA(destination, equipementId);
  }, [allerA, cleOnglet]);

  const basculerSidebar = () => {
    setSidebarReduite((actuelle) => {
      const nouvelleValeur = !actuelle;
      window.localStorage.setItem('gmao:sidebar-reduite', String(nouvelleValeur));
      return nouvelleValeur;
    });
  };

  const boutonNavigation = (item: typeof SECTIONS[number]) => {
    const Icon = item.icon;
    const bouton = (
      <Button
        key={item.value}
        type="button"
        variant="ghost"
        size={navigationCompacte ? 'icon' : 'default'}
        onClick={() => naviguer(item.value)}
        aria-current={section === item.value ? 'page' : undefined}
        aria-label={item.label}
        className={cn(
          'h-10 text-sm font-medium md:w-full',
          navigationCompacte ? 'md:justify-center md:px-0' : 'justify-start px-3 text-left',
          section === item.value
            ? 'bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 hover:text-primary-foreground'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
        )}
      >
        <Icon className="h-4 w-4 shrink-0" />
        <span className={cn('min-w-0 whitespace-normal leading-tight', navigationCompacte && 'md:hidden')}>
          {item.label}
        </span>
      </Button>
    );

    if (!navigationCompacte) return bouton;

    return (
      <Tooltip key={item.value}>
        <TooltipTrigger asChild>{bouton}</TooltipTrigger>
        <TooltipContent side="right" className="hidden md:block">{item.label}</TooltipContent>
      </Tooltip>
    );
  };

  return (
    <div className="flex flex-col gap-5 md:flex-row md:items-start">
      <aside className={cn(
        'w-full shrink-0 border-b border-border bg-card pb-4 transition-[width] duration-200 md:sticky md:top-24 md:border-b-0 md:border-r md:pb-0 md:pr-3',
        sidebarReduite ? 'md:w-16' : 'md:w-60'
      )}>
        <div className="mb-3 flex min-h-10 items-start justify-between gap-2 px-2">
          <div className={cn('min-w-0', navigationCompacte && 'md:hidden')}>
            <p className="text-xs font-semibold uppercase text-muted-foreground">Navigation GMAO</p>
            <p className="mt-1 truncate text-sm font-medium text-foreground">{sectionActive?.label}</p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={basculerSidebar}
            className="ml-auto hidden h-9 w-9 md:inline-flex"
            aria-label={sidebarReduite ? 'Déployer la navigation GMAO' : 'Réduire la navigation GMAO'}
            title={sidebarReduite ? 'Déployer la navigation' : 'Réduire la navigation'}
          >
            {sidebarReduite ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </Button>
        </div>
        <TooltipProvider delayDuration={250}>
          <nav className="grid grid-cols-1 gap-1 sm:grid-cols-2 md:grid-cols-1" aria-label="Navigation du module GMAO">
            {sectionsParGroupe.map((groupe) => {
              const contientSectionActive = groupe.sections.includes(section);

              if (navigationCompacte) {
                return (
                  <div key={groupe.id} className="contents md:block md:border-t md:border-border md:pt-1 first:md:border-t-0 first:md:pt-0">
                    {groupe.items.map(boutonNavigation)}
                  </div>
                );
              }

              return (
                <Collapsible
                  key={groupe.id}
                  open={groupesOuverts[groupe.id] || contientSectionActive}
                  onOpenChange={(open) => setGroupesOuverts((actuels) => ({ ...actuels, [groupe.id]: open }))}
                  className="min-w-0"
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
                    {groupe.items.map(boutonNavigation)}
                  </CollapsibleContent>
                </Collapsible>
              );
            })}
          </nav>
        </TooltipProvider>
      </aside>

      <div className="min-w-0 flex-1 space-y-5">
        {/* Barre d'actions */}
        <div className="flex flex-wrap items-center justify-end gap-2 border-b border-border pb-3">
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="relative">
                <Bell className="h-4 w-4" />
                {alertes.length > 0 && (
                  <Badge className="absolute -right-2 -top-2 h-5 min-w-5 justify-center bg-destructive px-1 text-[11px] text-destructive-foreground">
                    {alertes.length}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-96 p-0">
              <div className="border-b border-border px-4 py-3 text-sm font-semibold">
                Alertes maintenance ({alertes.length})
              </div>
              <ScrollArea className="max-h-80">
                {alertes.length === 0 ? (
                  <p className="p-6 text-center text-sm text-muted-foreground">Aucune alerte en cours.</p>
                ) : (
                  <div className="divide-y divide-border">
                    {alertes.map((a) => (
                      <button
                        key={a.id}
                        onClick={() => naviguer(a.section, a.equipementId || undefined)}
                        className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-muted/60"
                      >
                        <span className={cn('h-2 w-2 shrink-0 rounded-full', a.gravite === 'danger' ? 'bg-destructive' : 'bg-warning')} />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium">{a.titre}</span>
                          <span className="block truncate text-xs text-muted-foreground">{a.detail}</span>
                        </span>
                        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                      </button>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </PopoverContent>
          </Popover>

          <Button variant="outline" size="sm" onClick={() => rafraichir()} disabled={chargement}>
            <RefreshCw className={cn('h-4 w-4', chargement && 'animate-spin')} />
          </Button>

          <Button size="sm" onClick={() => setNouvelleIntervention(true)}>
            <Plus className="mr-2 h-4 w-4" /> Demande d'intervention
          </Button>
        </div>
        </div>

        {section === 'dashboard' && <GmaoDashboard />}
        {section === 'equipements' && <GmaoEquipements />}
        {section === 'interventions' && <GmaoInterventions />}
        {section === 'preventif' && <GmaoPreventif />}
        {section === 'pieces' && <GmaoPieces />}
        {section === 'couts' && <GmaoCouts />}
        {section === 'socotac' && <SocotacModule />}
        {section === 'controle_annuel' && <ControleAnnuelModule />}
        {section === 'rapports' && <GmaoRapports />}
      </div>

      <GmaoDemandeForm open={nouvelleIntervention} onOpenChange={setNouvelleIntervention} />
    </div>
  );
};

const GMAO: React.FC = () => (
  <GmaoProvider>
    <Contenu />
  </GmaoProvider>
);

export default GMAO;
