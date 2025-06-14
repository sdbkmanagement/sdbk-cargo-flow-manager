
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
    <div className="border-b border-gray-200">
      <nav className="-mb-px flex space-x-8">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const baseClasses = "whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center";
          const activeClasses = isActive 
            ? "border-orange-500 text-orange-600" 
            : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300";
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`${baseClasses} ${activeClasses}`}
            >
              <Icon className="w-4 h-4 mr-2" />
              {tab.label}
            </button>
          );
        })}
      </nav>
    </div>
  );
};
