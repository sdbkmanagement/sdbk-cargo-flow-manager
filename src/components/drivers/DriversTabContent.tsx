
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Filter } from 'lucide-react';
import { ChauffeursList } from './ChauffeursList';
import { ChauffeurForm } from './ChauffeurForm';
import { AlertesDocuments } from './AlertesDocuments';
import { PlanningModule } from './planning/PlanningModule';

interface DriversTabContentProps {
  activeTab: string;
  searchTerm: string;
  selectedChauffeur: any;
  hasWritePermission: boolean;
  onSearchChange: (term: string) => void;
  onSelectChauffeur: (chauffeur: any) => void;
  onFormSuccess: () => void;
  onBackToList: () => void;
}

export const DriversTabContent = ({
  activeTab,
  searchTerm,
  selectedChauffeur,
  hasWritePermission,
  onSearchChange,
  onSelectChauffeur,
  onFormSuccess,
  onBackToList
}: DriversTabContentProps) => {
  if (activeTab === 'liste') {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Rechercher un chauffeur..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline">
            <Filter className="w-4 h-4 mr-2" />
            Filtres
          </Button>
        </div>
        <ChauffeursList 
          searchTerm={searchTerm}
          onSelectChauffeur={onSelectChauffeur}
        />
      </div>
    );
  }

  if (activeTab === 'alertes') {
    return <AlertesDocuments />;
  }

  if (activeTab === 'planning') {
    return <PlanningModule />;
  }

  if (activeTab === 'nouveau' && hasWritePermission) {
    return <ChauffeurForm onSuccess={onFormSuccess} />;
  }

  if (activeTab === 'modifier' && hasWritePermission && selectedChauffeur) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Modifier le chauffeur</h2>
          <Button variant="outline" onClick={onBackToList}>
            Retour à la liste
          </Button>
        </div>
        <ChauffeurForm 
          chauffeur={selectedChauffeur} 
          onSuccess={onFormSuccess} 
        />
      </div>
    );
  }

  return null;
};
