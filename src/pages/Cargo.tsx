
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Package } from 'lucide-react';
import { ChargementsStats } from '@/components/cargo/ChargementsStats';
import { ChargementsForm } from '@/components/cargo/ChargementsForm';
import { ChargementsTable } from '@/components/cargo/ChargementsTable';

const Cargo = () => {
  const [activeTab, setActiveTab] = useState('liste');

  const handleChargementCreated = () => {
    // Rediriger vers la liste après création
    setActiveTab('liste');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <Package className="w-8 h-8 text-orange-500" />
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Suivi des chargements</h1>
          <p className="text-gray-600 mt-1">
            Traçabilité complète des marchandises transportées
          </p>
        </div>
      </div>

      <ChargementsStats />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="liste">Liste des chargements</TabsTrigger>
          <TabsTrigger value="nouveau">Nouveau chargement</TabsTrigger>
        </TabsList>

        <TabsContent value="liste" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Historique des chargements</CardTitle>
              <CardDescription>
                Consultez et filtrez tous les chargements effectués
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChargementsTable />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="nouveau" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Créer un nouveau chargement</CardTitle>
              <CardDescription>
                Enregistrez un nouveau chargement lié à une mission
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChargementsForm onSuccess={handleChargementCreated} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Cargo;
