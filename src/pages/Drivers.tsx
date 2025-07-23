
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DriversTabNavigation } from '@/components/drivers/DriversTabNavigation';
import { DriversTabContent } from '@/components/drivers/DriversTabContent';
import { RefreshButton } from '@/components/common/RefreshButton';
import { chauffeurService } from '@/services/chauffeurs';
import { useQueryClient } from '@tanstack/react-query';

const Drivers = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const queryClient = useQueryClient();

  const { data: chauffeurs = [], isLoading } = useQuery({
    queryKey: ['chauffeurs'],
    queryFn: chauffeurService.getChauffeurs,
  });

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['chauffeurs'] });
    queryClient.invalidateQueries({ queryKey: ['available-chauffeurs'] });
    queryClient.invalidateQueries({ queryKey: ['documents-chauffeurs'] });
    queryClient.invalidateQueries({ queryKey: ['alertes-documents-chauffeurs'] });
    queryClient.invalidateQueries({ queryKey: ['affectations'] });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gestion des Chauffeurs</h1>
          <p className="text-muted-foreground">Suivi du personnel de conduite</p>
        </div>
        <RefreshButton onRefresh={handleRefresh} isLoading={isLoading} />
      </div>

      <DriversTabNavigation 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
        chauffeurs={chauffeurs}
      />
      
      <DriversTabContent 
        activeTab={activeTab} 
        chauffeurs={chauffeurs}
        onRefresh={handleRefresh}
      />
    </div>
  );
};

export default Drivers;
