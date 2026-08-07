import React, { useState } from 'react';
import { RHSidebar } from '@/components/rh/RHSidebar';
import { RHDashboard } from '@/components/rh/dashboard/RHDashboard';
import { AlertesRHCenter } from '@/components/rh/alertes/AlertesRHCenter';
import { DocumentsRHList } from '@/components/rh/documents/DocumentsRHList';
import { PresencesCongesModule } from '@/components/rh/presences/PresencesCongesModule';
import { PaieModule } from '@/components/rh/paie/PaieModule';
import { PerformanceModule } from '@/components/rh/performance/PerformanceModule';
import { CompetencesModule } from '@/components/rh/competences/CompetencesModule';
import { FormationRHModule } from '@/components/rh/formation/FormationRHModule';
import { KpiRHModule } from '@/components/rh/kpi/KpiRHModule';
import { EmployesList } from '@/components/rh/EmployesList';
import { useQuery } from '@tanstack/react-query';
import { rhService } from '@/services/rh';

const RH = () => {
  const [activeSection, setActiveSection] = useState('dashboard');

  const { data: employes, isLoading, refetch } = useQuery({
    queryKey: ['employes'],
    queryFn: () => rhService.getEmployes(),
  });

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard': return <RHDashboard />;
      case 'collaborateurs': return <EmployesList employes={employes || []} isLoading={isLoading} onRefresh={refetch} />;
      case 'alertes': return <AlertesRHCenter />;
      case 'presences': return <PresencesCongesModule />;
      case 'paie': return <PaieModule />;
      case 'performance': return <PerformanceModule />;
      case 'competences': return <CompetencesModule />;
      case 'formation': return <FormationRHModule />;
      case 'documents': return <DocumentsRHList />;
      case 'kpi': return <KpiRHModule />;
      default: return <RHDashboard />;
    }
  };

  return (
    <div className="flex h-[calc(100vh-120px)] -m-6">
      <RHSidebar activeSection={activeSection} onSectionChange={setActiveSection} />
      <div className="flex-1 overflow-y-auto p-6">
        {renderContent()}
      </div>
    </div>
  );
};

export default RH;
