
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  UserPlus, 
  Calendar, 
  GraduationCap, 
  AlertTriangle,
  FileText,
  Search,
  Download,
  Upload
} from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { EmployeForm } from '@/components/rh/EmployeForm';
import { EmployesList } from '@/components/rh/EmployesList';
import { AbsencesList } from '@/components/rh/AbsencesList';
import { FormationsList } from '@/components/rh/FormationsList';
import { AlertesRH } from '@/components/rh/AlertesRH';
import { RHStats } from '@/components/rh/RHStats';
import { EmployeesImport } from '@/components/rh/EmployeesImport';

const RH = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedService, setSelectedService] = useState('tous');
  const [showEmployeForm, setShowEmployeForm] = useState(false);
  const [showImport, setShowImport] = useState(false);

  // Fetch employés
  const { data: employes, isLoading: employesLoading, refetch: refetchEmployes } = useQuery({
    queryKey: ['employes', searchTerm, selectedService],
    queryFn: async () => {
      let query = supabase
        .from('employes')
        .select('*')
        .order('nom', { ascending: true });

      if (searchTerm) {
        query = query.or(`nom.ilike.%${searchTerm}%,prenom.ilike.%${searchTerm}%,poste.ilike.%${searchTerm}%`);
      }

      if (selectedService !== 'tous') {
        query = query.eq('service', selectedService);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    }
  });

  // Fetch alertes RH
  const { data: alertes } = useQuery({
    queryKey: ['alertes-rh'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('alertes_rh')
        .select('*')
        .order('priorite', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  const services = ['tous', 'Transport', 'Maintenance', 'HSECQ', 'Administration', 'Direction'];

  const exportToExcel = () => {
    // Logique d'export Excel (à implémenter)
    console.log('Export Excel des données RH');
  };

  const handleImportSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['employes'] });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Ressources Humaines</h1>
          <p className="text-muted-foreground">
            Gestion du personnel et suivi administratif
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={exportToExcel} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Excel
          </Button>
          <Button variant="outline" onClick={() => setShowImport(true)}>
            <Upload className="w-4 h-4 mr-2" />
            Importer Excel
          </Button>
          <Button onClick={() => setShowEmployeForm(true)}>
            <UserPlus className="w-4 h-4 mr-2" />
            Nouveau Personnel
          </Button>
        </div>
      </div>

      {/* Statistiques RH */}
      <RHStats />

      {/* Alertes RH */}
      {alertes && alertes.length > 0 && (
        <AlertesRH alertes={alertes} />
      )}

      <Tabs defaultValue="personnel" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="personnel" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Personnel
          </TabsTrigger>
          <TabsTrigger value="absences" className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Absences
          </TabsTrigger>
          <TabsTrigger value="formations" className="flex items-center gap-2">
            <GraduationCap className="w-4 h-4" />
            Formations
          </TabsTrigger>
          <TabsTrigger value="historique" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Historique
          </TabsTrigger>
        </TabsList>

        <TabsContent value="personnel" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Liste du Personnel</CardTitle>
                  <CardDescription>
                    Gestion des fiches personnel et informations contractuelles
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Rechercher..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-64"
                    />
                  </div>
                  <select
                    value={selectedService}
                    onChange={(e) => setSelectedService(e.target.value)}
                    className="px-3 py-2 border rounded-md"
                  >
                    {services.map(service => (
                      <option key={service} value={service}>
                        {service === 'tous' ? 'Tous les services' : service}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <EmployesList 
                employes={employes || []} 
                isLoading={employesLoading}
                onRefresh={refetchEmployes}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="absences">
          <AbsencesList />
        </TabsContent>

        <TabsContent value="formations">
          <FormationsList />
        </TabsContent>

        <TabsContent value="historique">
          <Card>
            <CardHeader>
              <CardTitle>Historique RH</CardTitle>
              <CardDescription>
                Suivi des événements RH (embauches, changements de poste, etc.)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-center text-muted-foreground py-8">
                Fonctionnalité d'historique en cours de développement
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Formulaire d'ajout d'employé */}
      {showEmployeForm && (
        <EmployeForm 
          onClose={() => setShowEmployeForm(false)}
          onSuccess={() => {
            setShowEmployeForm(false);
            refetchEmployes();
          }}
        />
      )}

      {showImport && (
        <EmployeesImport
          onClose={() => setShowImport(false)}
          onSuccess={handleImportSuccess}
        />
      )}
    </div>
  );
};

export default RH;
