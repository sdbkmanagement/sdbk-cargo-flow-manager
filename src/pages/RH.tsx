import React, { useState } from 'react';
import { RHSidebar } from '@/components/rh/RHSidebar';
import { EmployesList } from '@/components/rh/EmployesList';
import { EmployeForm } from '@/components/rh/EmployeForm';
import { AbsencesList } from '@/components/rh/AbsencesList';
import { RHStats } from '@/components/rh/RHStats';
import { ContratsList } from '@/components/rh/contrats/ContratsList';
import { CarrieresList } from '@/components/rh/carrieres/CarrieresList';
import { SanctionsList } from '@/components/rh/sanctions/SanctionsList';
import { AccidentsList } from '@/components/rh/accidents/AccidentsList';
import { PointagesList } from '@/components/rh/temps/PointagesList';
import { CongesList } from '@/components/rh/temps/CongesList';
import { HeuresSupList } from '@/components/rh/temps/HeuresSupList';
import { JoursFeriesList } from '@/components/rh/temps/JoursFeriesList';
import { PaieDashboard } from '@/components/rh/paie/PaieDashboard';
import { PeriodesPaieList } from '@/components/rh/paie/PeriodesPaieList';
import { BulletinsPaieList } from '@/components/rh/paie/BulletinsPaieList';
import { ElementsSalaireList } from '@/components/rh/paie/ElementsSalaireList';
import { RubriquesPaieList } from '@/components/rh/paie/RubriquesPaieList';
import { PretsList } from '@/components/rh/paie/PretsList';
import { NotesFraisList } from '@/components/rh/paie/NotesFraisList';
import { LivrePaie } from '@/components/rh/paie/LivrePaie';
import { ConfigPaie } from '@/components/rh/paie/ConfigPaie';
import { RecrutementList } from '@/components/rh/modules/RecrutementList';
import { EvaluationsList } from '@/components/rh/modules/EvaluationsList';
import { VisitesMedicalesList } from '@/components/rh/modules/VisitesMedicalesList';
import { PlaceholderSection } from '@/components/rh/PlaceholderSection';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const RH = () => {
  const [activeSection, setActiveSection] = useState('employes');
  const [showEmployeForm, setShowEmployeForm] = useState(false);

  const { data: employes, isLoading, refetch } = useQuery({
    queryKey: ['employes'],
    queryFn: async () => {
      const { data, error } = await supabase.from('employes').select('*').order('nom');
      if (error) throw error;
      return data;
    }
  });

  const renderContent = () => {
    switch (activeSection) {
      // GESTION
      case 'employes':
        return <EmployesList employes={employes || []} isLoading={isLoading} onRefresh={refetch} />;
      case 'nouveau-employe':
        return showEmployeForm ? (
          <EmployeForm onClose={() => { setShowEmployeForm(false); setActiveSection('employes'); }} onSuccess={() => { setShowEmployeForm(false); refetch(); setActiveSection('employes'); }} />
        ) : (
          <div className="text-center py-8">
            <button onClick={() => setShowEmployeForm(true)} className="px-4 py-2 bg-primary text-primary-foreground rounded-md">Créer un nouvel employé</button>
          </div>
        );
      case 'contrats': return <ContratsList />;
      case 'carrieres': return <CarrieresList />;
      case 'documents-rh': return <PlaceholderSection title="Documents RH" description="Gestion documentaire des dossiers employés" />;
      case 'sanctions': return <SanctionsList />;
      case 'accidents': return <AccidentsList />;

      // TEMPS DE TRAVAIL
      case 'pointages': return <PointagesList />;
      case 'conges': return <CongesList />;
      case 'absences': return <AbsencesList />;
      case 'heures-sup': return <HeuresSupList />;
      case 'jours-feries': return <JoursFeriesList />;

      // PAIE
      case 'paie-dashboard': return <PaieDashboard />;
      case 'periodes-paie': return <PeriodesPaieList />;
      case 'bulletins': return <BulletinsPaieList />;
      case 'elements-salaire': return <ElementsSalaireList />;
      case 'rubriques-paie': return <RubriquesPaieList />;
      case 'prets': return <PretsList />;
      case 'notes-frais': return <NotesFraisList />;
      case 'livre-paie': return <LivrePaie />;
      case 'config-paie': return <ConfigPaie />;

      // RAPPORTS RH
      case 'statistiques': return <RHStats />;
      case 'rapport-presence': return <PlaceholderSection title="Rapport de présence" description="Rapport de présence mensuel par service" />;
      case 'rapport-hs': return <PlaceholderSection title="Heures supplémentaires" description="Rapport détaillé des heures supplémentaires" />;
      case 'declarations': return <PlaceholderSection title="Déclarations" description="Déclarations sociales et fiscales" />;

      // MODULES
      case 'recrutement': return <RecrutementList />;
      case 'evaluations': return <EvaluationsList />;
      case 'reclamations': return <PlaceholderSection title="Réclamations" description="Gestion des réclamations des employés" />;
      case 'medical': return <VisitesMedicalesList />;
      case 'cnss': return <PlaceholderSection title="CNSS" description="Déclarations et suivi CNSS" />;
      case 'inspections': return <PlaceholderSection title="Inspections du travail" description="Suivi des inspections du travail" />;

      default: return <EmployesList employes={employes || []} isLoading={isLoading} onRefresh={refetch} />;
    }
  };

  // Auto-open form for nouveau-employe
  React.useEffect(() => {
    if (activeSection === 'nouveau-employe') setShowEmployeForm(true);
  }, [activeSection]);

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
