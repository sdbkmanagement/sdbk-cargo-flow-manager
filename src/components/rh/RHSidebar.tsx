import React from 'react';
import { cn } from '@/lib/utils';
import {
  Users, UserPlus, FileText, TrendingUp, FolderOpen, AlertTriangle, HardHat,
  Clock, CalendarCheck, CalendarOff, Timer, CalendarDays,
  Wallet, CalendarRange, Receipt, Coins, CreditCard, Banknote, BookOpen, Settings,
  BarChart3, ClipboardList, FileBarChart, Building2,
  Briefcase, GraduationCap, Star, MessageSquare, Stethoscope, Shield, Globe, Search as SearchIcon, Monitor
} from 'lucide-react';

interface RHSidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

const sections = [
  {
    title: 'GESTION',
    items: [
      { id: 'employes', label: 'Employés', icon: Users },
      { id: 'nouveau-employe', label: 'Nouvel Employé', icon: UserPlus },
      { id: 'contrats', label: 'Contrats', icon: FileText },
      { id: 'carrieres', label: 'Carrières', icon: TrendingUp },
      { id: 'documents-rh', label: 'Documents', icon: FolderOpen },
      { id: 'sanctions', label: 'Sanctions', icon: AlertTriangle },
      { id: 'accidents', label: 'Accidents travail', icon: HardHat },
    ]
  },
  {
    title: 'TEMPS DE TRAVAIL',
    items: [
      { id: 'pointages', label: 'Pointages', icon: Clock },
      { id: 'conges', label: 'Congés', icon: CalendarCheck },
      { id: 'absences', label: 'Absences', icon: CalendarOff },
      { id: 'heures-sup', label: 'Heures Supp.', icon: Timer },
      { id: 'jours-feries', label: 'Jours Fériés', icon: CalendarDays },
    ]
  },
  {
    title: 'PAIE',
    items: [
      { id: 'paie-dashboard', label: 'Tableau de bord', icon: Wallet },
      { id: 'periodes-paie', label: 'Périodes de paie', icon: CalendarRange },
      { id: 'bulletins', label: 'Bulletins', icon: Receipt },
      { id: 'elements-salaire', label: 'Éléments de Salaire', icon: Coins },
      { id: 'rubriques-paie', label: 'Rubriques de Paie', icon: BookOpen },
      { id: 'prets', label: 'Prêts', icon: CreditCard },
      { id: 'notes-frais', label: 'Notes de frais', icon: Banknote },
      { id: 'livre-paie', label: 'Livre de paie', icon: FileBarChart },
      { id: 'config-paie', label: 'Configuration Paie', icon: Settings },
    ]
  },
  {
    title: 'RAPPORTS RH',
    items: [
      { id: 'statistiques', label: 'Statistiques', icon: BarChart3 },
      { id: 'rapport-presence', label: 'Rapport Présence', icon: ClipboardList },
      { id: 'rapport-hs', label: 'Heures Supplémentaires', icon: Timer },
      { id: 'declarations', label: 'Déclarations', icon: Building2 },
    ]
  },
  {
    title: 'MODULES',
    items: [
      { id: 'recrutement', label: 'Recrutement', icon: Briefcase },
      { id: 'evaluations', label: 'Évaluations', icon: Star },
      { id: 'reclamations', label: 'Réclamations', icon: MessageSquare },
      { id: 'medical', label: 'Médical', icon: Stethoscope },
      { id: 'cnss', label: 'CNSS', icon: Shield },
      { id: 'inspections', label: 'Inspection', icon: SearchIcon },
    ]
  }
];

export const RHSidebar: React.FC<RHSidebarProps> = ({ activeSection, onSectionChange }) => {
  return (
    <div className="w-64 min-w-[256px] border-r bg-card overflow-y-auto h-[calc(100vh-120px)]">
      <div className="p-3 space-y-4">
        {sections.map((section) => (
          <div key={section.title}>
            <p className="text-xs font-semibold text-primary mb-1 px-2">{section.title}</p>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onSectionChange(item.id)}
                    className={cn(
                      "w-full flex items-center gap-2.5 px-2 py-1.5 rounded-md text-sm transition-colors",
                      isActive
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
