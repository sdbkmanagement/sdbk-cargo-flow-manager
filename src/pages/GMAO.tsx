import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover, PopoverContent, PopoverTrigger
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  LayoutDashboard, Truck, Wrench, CalendarClock, Package, Coins, BarChart3,
  Bell, Plus, RefreshCw, ChevronRight, ShieldCheck, CalendarCheck,
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
import { GmaoInterventionForm } from '@/components/gmao/GmaoInterventionForm';
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

const Contenu: React.FC = () => {
  const { section, allerA, alertes, rafraichir, chargement } = useGmao();
  const [nouvelleIntervention, setNouvelleIntervention] = useState(false);

  return (
    <div className="space-y-5">
      {/* Barre d'actions */}
      <div className="flex flex-col gap-3 rounded-xl border border-border/60 bg-card p-3 lg:flex-row lg:items-center lg:justify-between">
        <nav className="flex flex-wrap gap-1">
          {SECTIONS.map((s) => (
            <button
              key={s.value}
              onClick={() => allerA(s.value)}
              className={cn(
                'inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                section === s.value
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <s.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{s.label}</span>
            </button>
          ))}
        </nav>

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
                        onClick={() => allerA(a.section, a.equipementId || undefined)}
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
            <Plus className="mr-2 h-4 w-4" /> Nouvelle intervention
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
      {section === 'rapports' && <GmaoRapports />}

      <GmaoInterventionForm open={nouvelleIntervention} onOpenChange={setNouvelleIntervention} />
    </div>
  );
};

const GMAO: React.FC = () => (
  <GmaoProvider>
    <Contenu />
  </GmaoProvider>
);

export default GMAO;
