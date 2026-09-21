import React, { useCallback, useEffect, useState } from 'react';
import { RH_ITEMS, RHSidebar } from '@/components/rh/RHSidebar';
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
import { useAuth } from '@/contexts/AuthContext';

const estSectionRH = (value: string | null) => RH_ITEMS.some((item) => item.id === value);

const RH = () => {
  const { user } = useAuth();
  const cleOnglet = user?.id ? `rh:onglet-actif:${user.id}` : null;
  const [activeSection, setActiveSection] = useState('dashboard');

  const { data: employes, isLoading, refetch } = useQuery({
    queryKey: ['employes'],
    queryFn: () => rhService.getEmployes(),
  });

  useEffect(() => {
    if (!cleOnglet) return;
    const ongletMemorise = window.localStorage.getItem(cleOnglet);
    if (estSectionRH(ongletMemorise)) setActiveSection(ongletMemorise);
  }, [cleOnglet]);

  const changerSection = useCallback((section: string) => {
    if (!estSectionRH(section)) return;
    setActiveSection(section);
    if (cleOnglet) window.localStorage.setItem(cleOnglet, section);
  }, [cleOnglet]);

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard': return <RHDashboard />;
      case 'collaborateurs': return <EmployesList employes={employes || []} isLoading={isLoading} onRefresh={refetch} />;
      case 'chauffeurs': return (
        <div className="space-y-4">
          <div>
            <h2 className="text-2xl font-bold">Chauffeurs</h2>
            <p className="text-muted-foreground text-sm">Dossiers RH complets des chauffeurs (permis, contrat, salaire brut, documents…)</p>
          </div>
          <EmployesList employes={employes || []} isLoading={isLoading} onRefresh={refetch} lockedService="Chauffeurs" />
        </div>
      );
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
    <div className="-m-6 flex min-h-[calc(100vh-120px)] flex-col md:h-[calc(100vh-120px)] md:flex-row">
      <RHSidebar activeSection={activeSection} onSectionChange={changerSection} />
      <div className="min-w-0 flex-1 overflow-y-auto p-6">
        {renderContent()}
      </div>
    </div>
  );
};

export default RH;
