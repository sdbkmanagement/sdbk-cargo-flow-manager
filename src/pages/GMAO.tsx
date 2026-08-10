import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GmaoDashboard } from '@/components/gmao/GmaoDashboard';
import { GmaoEquipements } from '@/components/gmao/GmaoEquipements';
import { GmaoPreventif } from '@/components/gmao/GmaoPreventif';
import { GmaoDemandes } from '@/components/gmao/GmaoDemandes';
import { GmaoOrdresTravail } from '@/components/gmao/GmaoOrdresTravail';
import { GmaoPieces } from '@/components/gmao/GmaoPieces';
import { GmaoFournisseurs } from '@/components/gmao/GmaoFournisseurs';

const GMAO: React.FC = () => {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="flex flex-wrap h-auto">
          <TabsTrigger value="dashboard">Tableau de bord</TabsTrigger>
          <TabsTrigger value="equipements">Équipements</TabsTrigger>
          <TabsTrigger value="preventif">Préventif</TabsTrigger>
          <TabsTrigger value="demandes">Demandes</TabsTrigger>
          <TabsTrigger value="ot">Ordres de travail</TabsTrigger>
          <TabsTrigger value="pieces">Pièces & stock</TabsTrigger>
          <TabsTrigger value="fournisseurs">Fournisseurs</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="mt-6"><GmaoDashboard /></TabsContent>
        <TabsContent value="equipements" className="mt-6"><GmaoEquipements /></TabsContent>
        <TabsContent value="preventif" className="mt-6"><GmaoPreventif /></TabsContent>
        <TabsContent value="demandes" className="mt-6"><GmaoDemandes /></TabsContent>
        <TabsContent value="ot" className="mt-6"><GmaoOrdresTravail /></TabsContent>
        <TabsContent value="pieces" className="mt-6"><GmaoPieces /></TabsContent>
        <TabsContent value="fournisseurs" className="mt-6"><GmaoFournisseurs /></TabsContent>
      </Tabs>
    </div>
  );
};

export default GMAO;
