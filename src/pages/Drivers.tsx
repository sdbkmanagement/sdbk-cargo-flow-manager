
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search } from 'lucide-react';
import { DriversTabNavigation } from '@/components/drivers/DriversTabNavigation';
import { DriversTabContent } from '@/components/drivers/DriversTabContent';
import { DriversDashboard } from '@/components/drivers/DriversDashboard';
import { DriversAlerts } from '@/components/drivers/DriversAlerts';
import { DriversDocuments } from '@/components/drivers/DriversDocuments';
import { PlanningView } from '@/components/drivers/planning/PlanningView';
import { ChauffeurDetailDialog } from '@/components/drivers/ChauffeurDetailDialog';
import { ChauffeurForm } from '@/components/drivers/ChauffeurForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { chauffeursService } from '@/services/chauffeurs';

const Drivers = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedChauffeur, setSelectedChauffeur] = useState<any>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showNewChauffeurForm, setShowNewChauffeurForm] = useState(false);

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

  const handleNewChauffeur = () => {
    console.log('Bouton Nouveau chauffeur (header) cliqué');
    setShowNewChauffeurForm(true);
  };

  const handleCreateSuccess = () => {
    setShowNewChauffeurForm(false);
    toast({
      title: "Chauffeur créé",
      description: "Le chauffeur a été ajouté avec succès.",
    });
  };

  const handleFormCancel = () => {
    setShowNewChauffeurForm(false);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DriversDashboard />;
      case 'drivers':
        return (
          <DriversTabContent 
            searchTerm={searchTerm}
            onSelectChauffeur={handleSelectChauffeur}
          />
        );
      case 'planning':
        return <PlanningView chauffeurs={chauffeurs} />;
      case 'alertes':
        return <DriversAlerts />;
      case 'documents':
        return <DriversDocuments />;
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
            Dashboard, planning, documents et alertes de conformité
          </p>
        </div>
        <Button 
          onClick={handleNewChauffeur}
          className="bg-orange-500 hover:bg-orange-600"
        >
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

      {/* Dialog pour nouveau chauffeur */}
      <Dialog open={showNewChauffeurForm} onOpenChange={setShowNewChauffeurForm}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nouveau chauffeur</DialogTitle>
          </DialogHeader>
          <ChauffeurForm 
            onSuccess={handleCreateSuccess}
            onCancel={handleFormCancel}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Drivers;
