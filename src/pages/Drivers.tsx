
import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, AlertTriangle } from 'lucide-react';
import { DriversStats } from '@/components/drivers/DriversStats';
import { DriversTabNavigation } from '@/components/drivers/DriversTabNavigation';
import { DriversTabContent } from '@/components/drivers/DriversTabContent';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { chauffeursService } from '@/services/chauffeurs';

const Drivers = () => {
  const { hasPermission } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('liste');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedChauffeur, setSelectedChauffeur] = useState(null);

  const { data: chauffeurs = [], isLoading, error, isError } = useQuery({
    queryKey: ['chauffeurs'],
    queryFn: chauffeursService.getAll,
    retry: 3,
    retryDelay: 1000,
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
  });

  const stats = useMemo(() => {
    const today = new Date();
    let alertes = 0;
    let actifs = 0;
    let inactifs = 0;

    chauffeurs.forEach(chauffeur => {
      if (chauffeur.statut === 'actif') {
        actifs++;
      } else {
        inactifs++;
      }

      if (chauffeur.date_expiration_permis) {
        const expirationDate = new Date(chauffeur.date_expiration_permis);
        const diffTime = expirationDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays <= 30 && diffDays >= 0) {
          alertes++;
        }
      }
    });

    return {
      total: chauffeurs.length,
      actifs,
      inactifs,
      alertes
    };
  }, [chauffeurs]);

  const handleSelectChauffeur = (chauffeur: any) => {
    setSelectedChauffeur(chauffeur);
    setActiveTab('modifier');
  };

  const handleFormSuccess = () => {
    setSelectedChauffeur(null);
    setActiveTab('liste');
    queryClient.invalidateQueries({ queryKey: ['chauffeurs'] });
  };

  const handleNewChauffeur = () => {
    setSelectedChauffeur(null);
    setActiveTab('nouveau');
  };

  if (!hasPermission('drivers_read')) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Accès non autorisé</h1>
          <p className="text-gray-600 mt-2">Vous n'avez pas les permissions pour accéder à ce module.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-lg font-medium">Chargement des chauffeurs...</p>
          <p className="text-sm text-gray-500 mt-2">Connexion à la base de données</p>
        </div>
      </div>
    );
  }

  if (isError || error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-red-600 mb-2">Erreur de chargement</h2>
          <p className="text-gray-600 mb-4">Impossible de charger les données des chauffeurs</p>
          <Button 
            onClick={() => queryClient.invalidateQueries({ queryKey: ['chauffeurs'] })}
            variant="outline"
          >
            Réessayer
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestion des chauffeurs</h1>
          <p className="text-gray-600 mt-1">
            Gestion complète du personnel de conduite
          </p>
        </div>
        {hasPermission('drivers_write') && (
          <Button 
            onClick={handleNewChauffeur}
            className="bg-orange-500 hover:bg-orange-600"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nouveau chauffeur
          </Button>
        )}
      </div>

      <DriversStats {...stats} />

      <DriversTabNavigation
        activeTab={activeTab}
        hasWritePermission={hasPermission('drivers_write')}
        selectedChauffeur={selectedChauffeur}
        onTabChange={setActiveTab}
      />

      <div className="mt-6">
        <DriversTabContent
          activeTab={activeTab}
          searchTerm={searchTerm}
          selectedChauffeur={selectedChauffeur}
          hasWritePermission={hasPermission('drivers_write')}
          onSearchChange={setSearchTerm}
          onSelectChauffeur={handleSelectChauffeur}
          onFormSuccess={handleFormSuccess}
          onBackToList={() => setActiveTab('liste')}
        />
      </div>
    </div>
  );
};

export default Drivers;
