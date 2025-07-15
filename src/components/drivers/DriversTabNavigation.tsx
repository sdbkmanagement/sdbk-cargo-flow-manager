
import React from 'react';
import { Users, AlertTriangle, Calendar, Plus, Settings } from 'lucide-react';

interface Tab {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
}

interface DriversTabNavigationProps {
  activeTab: string;
  hasWritePermission: boolean;
  selectedChauffeur: any;
  onTabChange: (tabId: string) => void;
}

export const DriversTabNavigation = ({ 
  activeTab, 
  hasWritePermission, 
  selectedChauffeur, 
  onTabChange 
}: DriversTabNavigationProps) => {
  const tabs: Tab[] = [
    { id: 'liste', label: 'Liste des chauffeurs', icon: Users },
    { id: 'alertes', label: 'Alertes documents', icon: AlertTriangle },
    { id: 'planning', label: 'Planning', icon: Calendar },
    ...(hasWritePermission ? [
      { id: 'nouveau', label: 'Nouveau', icon: Plus },
      ...(selectedChauffeur ? [{ id: 'modifier', label: 'Modifier', icon: Settings }] : [])
    ] : [])
  ];

  return (
    <div className="border-b border-sdbk-medium/20 bg-gradient-to-r from-sdbk-light/50 to-white">
      <nav className="-mb-px flex space-x-2 px-6 py-2">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`
                whitespace-nowrap py-3 px-6 border-b-3 font-medium text-sm flex items-center gap-2 rounded-t-lg transition-all duration-300 hover:shadow-soft
                ${isActive 
                  ? "border-sdbk-accent text-sdbk-accent bg-white shadow-soft" 
                  : "border-transparent text-sdbk-medium hover:text-sdbk-primary hover:border-sdbk-accent/30 hover:bg-white/70"
                }
              `}
            >
              <Icon className={`w-4 h-4 transition-all duration-300 ${isActive ? 'text-sdbk-accent scale-110' : 'text-sdbk-medium group-hover:text-sdbk-primary'}`} />
              {tab.label}
            </button>
          );
        })}
      </nav>
    </div>
  );
};
