
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { DriversTabNavigation } from '@/components/drivers/DriversTabNavigation';
import { DriversTabContent } from '@/components/drivers/DriversTabContent';

const Drivers = () => {
  const { user, hasRole } = useAuth();
  const [activeTab, setActiveTab] = useState('liste');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedChauffeur, setSelectedChauffeur] = useState(null);

  // Vérifier les permissions d'écriture (transport, admin, direction)
  const hasWritePermission = hasRole('transport') || hasRole('admin') || hasRole('direction');

  const handleFormSuccess = () => {
    setActiveTab('liste');
    setSelectedChauffeur(null);
  };

  const handleBackToList = () => {
    setActiveTab('liste');
    setSelectedChauffeur(null);
  };

  const handleSelectChauffeur = (chauffeur: any) => {
    setSelectedChauffeur(chauffeur);
    if (hasWritePermission) {
      setActiveTab('modifier');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestion des Chauffeurs</h1>
          <p className="text-gray-600 mt-2">
            Gestion des chauffeurs, documents et planning des missions
          </p>
        </div>
      </div>

      <DriversTabNavigation
        activeTab={activeTab}
        hasWritePermission={hasWritePermission}
        selectedChauffeur={selectedChauffeur}
        onTabChange={setActiveTab}
      />

      <DriversTabContent
        activeTab={activeTab}
        searchTerm={searchTerm}
        selectedChauffeur={selectedChauffeur}
        hasWritePermission={hasWritePermission}
        onSearchChange={setSearchTerm}
        onSelectChauffeur={handleSelectChauffeur}
        onFormSuccess={handleFormSuccess}
        onBackToList={handleBackToList}
      />
    </div>
  );
};

export default Drivers;
