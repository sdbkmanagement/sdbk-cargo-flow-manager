
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search } from 'lucide-react';
import { DriversTabNavigation } from '@/components/drivers/DriversTabNavigation';
import { DriversTabContent } from '@/components/drivers/DriversTabContent';
import { PlanningView } from '@/components/drivers/planning/PlanningView';
import { ChauffeurDetailDialog } from '@/components/drivers/ChauffeurDetailDialog';
import { useQuery } from '@tanstack/react-query';
import { chauffeursService } from '@/services/chauffeurs';

const Drivers = () => {
  const [activeTab, setActiveTab] = useState('drivers');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedChauffeur, setSelectedChauffeur] = useState<any>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);

  // Récupération des chauffeurs avec actualisation automatique
  const { data: chauffeurs = [] } = useQuery({
    queryKey: ['chauffeurs'],
    queryFn: chauffeursService.getAll,
    refetchInterval: 30 * 1000, // Actualisation toutes les 30 secondes
    refetchIntervalInBackground: true,
  });

  const handleSelectChauffeur = (chauffeur: any) => {
    setSelectedChauffeur(chauffeur);
    setShowDetailDialog(true);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'drivers':
        return (
          <DriversTabContent 
            searchTerm={searchTerm}
            onSelectChauffeur={handleSelectChauffeur}
          />
        );
      case 'planning':
        return <PlanningView chauffeurs={chauffeurs} />;
      case 'documents':
        return (
          <div className="text-center py-8">
            <p className="text-gray-500">Gestion des documents des chauffeurs - En cours de développement</p>
          </div>
        );
      case 'stats':
        return (
          <div className="text-center py-8">
            <p className="text-gray-500">Statistiques des chauffeurs - En cours de développement</p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestion des chauffeurs</h1>
          <p className="text-gray-600 mt-1">
            Gestion des chauffeurs, planning et documents
          </p>
        </div>
        <Button className="bg-orange-500 hover:bg-orange-600">
          <Plus className="w-4 h-4 mr-2" />
          Nouveau chauffeur
        </Button>
      </div>

      <DriversTabNavigation 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
      />

      {activeTab === 'drivers' && (
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Rechercher un chauffeur..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      )}

      {renderTabContent()}

      {/* Dialog de détails du chauffeur */}
      {selectedChauffeur && (
        <ChauffeurDetailDialog
          chauffeur={selectedChauffeur}
          open={showDetailDialog}
          onOpenChange={setShowDetailDialog}
        />
      )}
    </div>
  );
};

export default Drivers;
