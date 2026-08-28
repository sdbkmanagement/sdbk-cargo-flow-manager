import React from 'react';
import { cn } from '@/lib/utils';
import {
  Users, LayoutDashboard, Bell, CalendarCheck, Wallet,
  Target, Award, GraduationCap, FolderOpen, BarChart3, Truck
} from 'lucide-react';

interface RHSidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

const items = [
  { id: 'dashboard', label: 'Tableau de bord RH', icon: LayoutDashboard },
  { id: 'collaborateurs', label: 'Collaborateurs', icon: Users },
  { id: 'alertes', label: 'Alertes RH', icon: Bell },
  { id: 'presences', label: 'Présences & Congés', icon: CalendarCheck },
  { id: 'paie', label: 'Paie & Masse salariale', icon: Wallet },
  { id: 'performance', label: 'Performance', icon: Target },
  { id: 'competences', label: 'Compétences & Talents', icon: Award },
  { id: 'formation', label: 'Formation', icon: GraduationCap },
  { id: 'documents', label: 'Documents RH', icon: FolderOpen },
  { id: 'kpi', label: 'KPI & Reporting', icon: BarChart3 },
];

export const RHSidebar: React.FC<RHSidebarProps> = ({ activeSection, onSectionChange }) => {
  return (
    <div className="w-64 min-w-[256px] border-r bg-card overflow-y-auto h-[calc(100vh-120px)]">
      <div className="p-3 space-y-1">
        <p className="text-xs font-semibold text-primary mb-2 px-2">MODULE RH</p>
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSectionChange(item.id)}
              className={cn(
                'w-full flex items-center gap-2.5 px-2 py-2 rounded-md text-sm transition-colors',
                isActive
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
