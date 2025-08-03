import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Upload } from 'lucide-react';
import { DriversTabNavigation } from '@/components/drivers/DriversTabNavigation';
import { DriversTabContent } from '@/components/drivers/DriversTabContent';
import { DriversDashboard } from '@/components/drivers/DriversDashboard';
import { DriversAlerts } from '@/components/drivers/DriversAlerts';
import { DriversDocuments } from '@/components/drivers/DriversDocuments';
import { PlanningView } from '@/components/drivers/planning/PlanningView';
import { ChauffeurDetailDialog } from '@/components/drivers/ChauffeurDetailDialog';
import { ChauffeurForm } from '@/components/drivers/ChauffeurForm';
import { DriversImport } from '@/components/drivers/DriversImport';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { chauffeursService } from '@/services/chauffeurs';
import { ExportButton } from '@/components/common/ExportButton';
import { exportDriversService } from '@/services/exportDriversService';

const Drivers = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedChauffeur, setSelectedChauffeur] = useState<any>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showNewChauffeurForm, setShowNewChauffeurForm] = useState(false);
  const [showEditChauffeurForm, setShowEditChauffeurForm] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);

  // Récupération des chauffeurs avec actualisation automatique
  const { data: chauffeurs = [], refetch } = useQuery({
    queryKey: ['chauffeurs'],
    queryFn: chauffeursService.getAll,
    refetchInterval: 30 * 1000, // Actualisation toutes les 30 secondes
    refetchIntervalInBackground: true,
  });

  const handleSelectChauffeur = (chauffeur: any) => {
    setSelectedChauffeur(chauffeur);
    setShowDetailDialog(true);
  };

  const handleEditChauffeur = (chauffeur: any) => {
    setSelectedChauffeur(chauffeur);
    setShowEditChauffeurForm(true);
  };

  const handleNewChauffeur = () => {
    console.log('Bouton Nouveau chauffeur (header) cliqué');
    setShowNewChauffeurForm(true);
  };

  const handleImport = () => {
    setShowImportDialog(true);
  };

  const handleExportExcel = () => {
    exportDriversService.exportToExcel(chauffeurs, 'liste_chauffeurs');
  };

  const handleExportCSV = () => {
    exportDriversService.exportToCSV(chauffeurs, 'liste_chauffeurs');
  };

  const handleExportAlerts = () => {
    exportDriversService.exportAlertsToExcel(chauffeurs, 'alertes_chauffeurs');
  };

  const handleCreateSuccess = () => {
    setShowNewChauffeurForm(false);
    refetch();
    toast({
      title: "Chauffeur créé",
      description: "Le chauffeur a été ajouté avec succès.",
    });
  };

  const handleEditSuccess = () => {
    setShowEditChauffeurForm(false);
    setSelectedChauffeur(null);
    refetch();
    toast({
      title: "Chauffeur modifié",
      description: "Les informations ont été mises à jour avec succès.",
    });
  };

  const handleImportSuccess = () => {
    setShowImportDialog(false);
    refetch();
    toast({
      title: "Import réussi",
      description: "Les chauffeurs ont été importés avec succès.",
    });
  };

  const handleFormCancel = () => {
    setShowNewChauffeurForm(false);
  };

  const handleEditFormCancel = () => {
    setShowEditChauffeurForm(false);
    setSelectedChauffeur(null);
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
            onEditChauffeur={handleEditChauffeur}
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
        <div className="flex gap-2">
          <ExportButton
            onExportExcel={handleExportExcel}
            onExportCSV={handleExportCSV}
            onExportAlerts={handleExportAlerts}
            disabled={chauffeurs.length === 0}
          />
          <Button 
            onClick={handleImport}
            variant="outline"
            className="bg-green-500 hover:bg-green-600 text-white border-green-500"
          >
            <Upload className="w-4 h-4 mr-2" />
            Importer Excel
          </Button>
          <Button 
            onClick={handleNewChauffeur}
            className="bg-orange-500 hover:bg-orange-600"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nouveau chauffeur
          </Button>
        </div>
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

      {/* Dialog pour modification de chauffeur */}
      <Dialog open={showEditChauffeurForm} onOpenChange={setShowEditChauffeurForm}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Modifier le chauffeur</DialogTitle>
          </DialogHeader>
          <ChauffeurForm 
            chauffeur={selectedChauffeur}
            onSuccess={handleEditSuccess}
            onCancel={handleEditFormCancel}
          />
        </DialogContent>
      </Dialog>

      {/* Dialog pour import Excel */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Importer des chauffeurs depuis Excel</DialogTitle>
          </DialogHeader>
          <DriversImport 
            onSuccess={handleImportSuccess}
            onClose={() => setShowImportDialog(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Drivers;
