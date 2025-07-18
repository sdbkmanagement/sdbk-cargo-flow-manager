
import React from 'react';
import { Button } from '@/components/ui/button';
import { Users, Calendar, FileText, BarChart3 } from 'lucide-react';

interface DriversTabNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const DriversTabNavigation = ({ activeTab, onTabChange }: DriversTabNavigationProps) => {
  const tabs = [
    { id: 'drivers', label: 'Chauffeurs', icon: Users },
    { id: 'planning', label: 'Planning', icon: Calendar },
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'stats', label: 'Statistiques', icon: BarChart3 }
  ];

  return (
    <div className="border-b border-gray-200 mb-6">
      <nav className="-mb-px flex space-x-8">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <Button
              key={tab.id}
              variant="ghost"
              onClick={() => onTabChange(tab.id)}
              className={`${
                activeTab === tab.id
                  ? 'border-orange-500 text-orange-600 border-b-2'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center`}
            >
              <Icon className="w-4 h-4 mr-2" />
              {tab.label}
            </Button>
          );
        })}
      </nav>
    </div>
  );
};
