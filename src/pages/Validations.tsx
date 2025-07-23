
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, AlertTriangle, FileText } from 'lucide-react';
import { ValidationWorkflowCard } from '@/components/fleet/validation/ValidationWorkflowCard';
import { ValidationStats } from '@/components/fleet/validation/ValidationStats';
import { RefreshButton } from '@/components/common/RefreshButton';
import { validationService } from '@/services/validation';
import { useQueryClient } from '@tanstack/react-query';

const Validations = () => {
  const [activeTab, setActiveTab] = useState('en-attente');
  const queryClient = useQueryClient();

  const { data: workflows = [], isLoading } = useQuery({
    queryKey: ['validation-workflows'],
    queryFn: validationService.getWorkflowsPaginated,
  });

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['validation-workflows'] });
    queryClient.invalidateQueries({ queryKey: ['validation-etapes'] });
    queryClient.invalidateQueries({ queryKey: ['vehicules'] });
  };

  const workflowsByStatus = {
    'en-attente': Array.isArray(workflows) ? workflows.filter(w => w.statut === 'en_attente') : [],
    'en-cours': Array.isArray(workflows) ? workflows.filter(w => w.statut === 'en_cours') : [],
    'terminee': Array.isArray(workflows) ? workflows.filter(w => w.statut === 'terminee') : [],
    'rejetee': Array.isArray(workflows) ? workflows.filter(w => w.statut === 'rejetee') : [],
  };

  const getStatusColor = (statut: string) => {
    switch (statut) {
      case 'en_attente': return 'bg-yellow-100 text-yellow-800';
      case 'en_cours': return 'bg-blue-100 text-blue-800';
      case 'terminee': return 'bg-green-100 text-green-800';
      case 'rejetee': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (statut: string) => {
    switch (statut) {
      case 'en_attente': return Clock;
      case 'en_cours': return FileText;
      case 'terminee': return CheckCircle;
      case 'rejetee': return AlertTriangle;
      default: return FileText;
    }
  };

  const getStatusLabel = (statut: string) => {
    switch (statut) {
      case 'en_attente': return 'En attente';
      case 'en_cours': return 'En cours';
      case 'terminee': return 'Terminée';
      case 'rejetee': return 'Rejetée';
      default: return statut;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Processus de Validation</h1>
          <p className="text-muted-foreground">Gestion des workflows de validation post-mission</p>
        </div>
        <RefreshButton onRefresh={handleRefresh} isLoading={isLoading} />
      </div>

      <ValidationStats />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="en-attente" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            En attente ({workflowsByStatus['en-attente'].length})
          </TabsTrigger>
          <TabsTrigger value="en-cours" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            En cours ({workflowsByStatus['en-cours'].length})
          </TabsTrigger>
          <TabsTrigger value="terminee" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Terminées ({workflowsByStatus['terminee'].length})
          </TabsTrigger>
          <TabsTrigger value="rejetee" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Rejetées ({workflowsByStatus['rejetee'].length})
          </TabsTrigger>
        </TabsList>

        {Object.entries(workflowsByStatus).map(([status, statusWorkflows]) => (
          <TabsContent key={status} value={status} className="space-y-4">
            {statusWorkflows.length === 0 ? (
              <Card>
                <CardContent className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <div className="mx-auto mb-4 h-12 w-12 text-muted-foreground">
                      {React.createElement(getStatusIcon(status), { className: "h-12 w-12" })}
                    </div>
                    <h3 className="text-lg font-semibold text-muted-foreground mb-2">
                      Aucun workflow {getStatusLabel(status).toLowerCase()}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Les workflows avec ce statut apparaîtront ici
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {statusWorkflows.map((workflow) => (
                  <ValidationWorkflowCard 
                    key={workflow.id} 
                    onUpdate={handleRefresh}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default Validations;
