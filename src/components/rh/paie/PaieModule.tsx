import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MasseSalariale } from './MasseSalariale';
import { PeriodesPaieList } from './PeriodesPaieList';
import { BulletinsPaieList } from './BulletinsPaieList';
import { ElementsSalaireList } from './ElementsSalaireList';
import { RubriquesPaieList } from './RubriquesPaieList';
import { PretsList } from './PretsList';
import { NotesFraisList } from './NotesFraisList';
import { LivrePaie } from './LivrePaie';
import { ConfigPaie } from './ConfigPaie';

export const PaieModule = () => (
  <div className="space-y-5">
    <div>
      <h2 className="text-2xl font-bold">Paie & Masse salariale</h2>
      <p className="text-sm text-muted-foreground">Bulletins, cotisations CNSS/IRG, prêts et coûts employeur</p>
    </div>
    <Tabs defaultValue="masse">
      <TabsList className="flex-wrap h-auto">
        <TabsTrigger value="masse">Masse salariale</TabsTrigger>
        <TabsTrigger value="periodes">Périodes</TabsTrigger>
        <TabsTrigger value="bulletins">Bulletins</TabsTrigger>
        <TabsTrigger value="elements">Éléments</TabsTrigger>
        <TabsTrigger value="rubriques">Rubriques</TabsTrigger>
        <TabsTrigger value="prets">Prêts</TabsTrigger>
        <TabsTrigger value="frais">Notes de frais</TabsTrigger>
        <TabsTrigger value="livre">Livre de paie</TabsTrigger>
        <TabsTrigger value="config">Configuration</TabsTrigger>
      </TabsList>
      <TabsContent value="masse"><MasseSalariale /></TabsContent>
      <TabsContent value="periodes"><PeriodesPaieList /></TabsContent>
      <TabsContent value="bulletins"><BulletinsPaieList /></TabsContent>
      <TabsContent value="elements"><ElementsSalaireList /></TabsContent>
      <TabsContent value="rubriques"><RubriquesPaieList /></TabsContent>
      <TabsContent value="prets"><PretsList /></TabsContent>
      <TabsContent value="frais"><NotesFraisList /></TabsContent>
      <TabsContent value="livre"><LivrePaie /></TabsContent>
      <TabsContent value="config"><ConfigPaie /></TabsContent>
    </Tabs>
  </div>
);
