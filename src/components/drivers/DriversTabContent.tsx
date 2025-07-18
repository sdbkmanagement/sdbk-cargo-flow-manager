
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Plus } from 'lucide-react';
import { ChauffeursList } from './ChauffeursList';
import { ChauffeurForm } from './ChauffeurForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { chauffeursService } from '@/services/chauffeurs';

interface DriversTabContentProps {
  searchTerm: string;
  onSelectChauffeur: (chauffeur: any) => void;
}

export const DriversTabContent = ({ searchTerm, onSelectChauffeur }: DriversTabContentProps) => {
  const [showForm, setShowForm] = useState(false);
  const [selectedChauffeur, setSelectedChauffeur] = useState<any>(null);

  const { data: chauffeurs = [], isLoading, error } = useQuery({
    queryKey: ['chauffeurs'],
    queryFn: chauffeursService.getAll,
    refetchInterval: 30000, // Actualisation automatique
  });

  const handleCreateSuccess = () => {
    setShowForm(false);
    setSelectedChauffeur(null);
    toast({
      title: "Chauffeur créé",
      description: "Le chauffeur a été ajouté avec succès et les documents requis ont été assignés automatiquement.",
    });
  };

  const handleEditChauffeur = (chauffeur: any) => {
    setSelectedChauffeur(chauffeur);
    setShowForm(true);
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setSelectedChauffeur(null);
  };

  if (isLoading) {
    return <div className="flex justify-center p-8">Chargement des chauffeurs...</div>;
  }

  if (error) {
    return <div className="flex justify-center p-8 text-red-600">Erreur lors du chargement des chauffeurs</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Liste des chauffeurs
              </CardTitle>
              <CardDescription>
                Gestion des chauffeurs et de leurs informations
              </CardDescription>
            </div>
            <Button onClick={() => setShowForm(true)} className="gap-2 bg-orange-500 hover:bg-orange-600">
              <Plus className="h-4 w-4" />
              Nouveau chauffeur
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <ChauffeursList 
            chauffeurs={chauffeurs}
            onSelectChauffeur={onSelectChauffeur}
            onEditChauffeur={handleEditChauffeur}
            searchTerm={searchTerm}
            hasWritePermission={true}
          />
        </CardContent>
      </Card>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedChauffeur ? 'Modifier le chauffeur' : 'Nouveau chauffeur'}
            </DialogTitle>
          </DialogHeader>
          <ChauffeurForm 
            chauffeur={selectedChauffeur}
            onSuccess={handleCreateSuccess}
            onCancel={handleFormCancel}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};
