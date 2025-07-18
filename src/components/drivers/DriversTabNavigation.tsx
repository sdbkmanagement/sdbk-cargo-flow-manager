
import React from 'react';
import { Button } from '@/components/ui/button';
import { Users, Calendar, FileText, AlertTriangle, BarChart3 } from 'lucide-react';

interface DriversTabNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const DriversTabNavigation = ({ activeTab, onTabChange }: DriversTabNavigationProps) => {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'drivers', label: 'Chauffeurs', icon: Users },
    { id: 'planning', label: 'Planning', icon: Calendar },
    { id: 'alertes', label: 'Alertes', icon: AlertTriangle },
    { id: 'documents', label: 'Documents', icon: FileText },
  ];

  return (
    <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        return (
          <Button
            key={tab.id}
            variant={activeTab === tab.id ? "default" : "ghost"}
            onClick={() => onTabChange(tab.id)}
            className={`flex items-center space-x-2 ${
              activeTab === tab.id 
                ? 'bg-orange-500 text-white hover:bg-orange-600' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Icon className="w-4 h-4" />
            <span>{tab.label}</span>
          </Button>
        );
      })}
    </div>
  );
};
