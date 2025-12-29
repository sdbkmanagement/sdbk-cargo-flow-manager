
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { X, Plus, UserCheck, Calendar, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { chauffeursService } from '@/services/chauffeurs';
import { affectationsService } from '@/services/affectations';
import type { Vehicule } from '@/services/vehicules';

interface ChauffeurAssignmentManagerProps {
  vehicule: Vehicule;
}

export const ChauffeurAssignmentManager = ({ vehicule }: ChauffeurAssignmentManagerProps) => {
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [selectedChauffeurId, setSelectedChauffeurId] = useState('');
  const [motifChangement, setMotifChangement] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();

  // Récupérer tous les chauffeurs disponibles
  const { data: chauffeurs = [] } = useQuery({
    queryKey: ['chauffeurs'],
    queryFn: chauffeursService.getAll,
  });

  // Récupérer les affectations actuelles du véhicule
  const { data: affectations = [], isLoading: loadingAffectations } = useQuery({
    queryKey: ['affectations-vehicule', vehicule.id],
    queryFn: () => affectationsService.getAffectationsVehicule(vehicule.id),
  });

  const chauffeursDisponibles = chauffeurs.filter(chauffeur => 
    chauffeur.statut === 'actif' && 
    !affectations.some(aff => aff.chauffeur_id === chauffeur.id && aff.statut === 'active')
  );

  // Filtrer par recherche
  const chauffeursFiltres = chauffeursDisponibles.filter(chauffeur => {
    if (!searchTerm.trim()) return true;
    const search = searchTerm.toLowerCase();
    return (
      chauffeur.nom.toLowerCase().includes(search) ||
      chauffeur.prenom.toLowerCase().includes(search) ||
      (chauffeur.matricule && chauffeur.matricule.toLowerCase().includes(search)) ||
      (chauffeur.telephone && chauffeur.telephone.includes(search))
    );
  });

  const getInitials = (nom: string, prenom: string) => {
    return `${prenom.charAt(0)}${nom.charAt(0)}`.toUpperCase();
  };

  // Fonction pour formater l'affichage du véhicule avec son immatriculation
  const getVehiculeDisplayText = (vehicule: Vehicule) => {
    if (vehicule.type_vehicule === 'tracteur_remorque') {
      // Pour tracteur-remorque, privilégier l'immatriculation de la remorque (citerne)
      const immatriculation = vehicule.remorque_immatriculation || vehicule.tracteur_immatriculation || '';
      return `${vehicule.numero} - ${immatriculation}`;
    }
    // Pour porteur, afficher l'immatriculation du porteur
    const immatriculation = vehicule.immatriculation || '';
    return `${vehicule.numero} - ${immatriculation}`;
  };

  const handleAssignChauffeur = async () => {
    if (!selectedChauffeurId) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un chauffeur",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      await affectationsService.create({
        vehicule_id: vehicule.id,
        chauffeur_id: selectedChauffeurId,
        date_debut: new Date().toISOString().split('T')[0],
        statut: 'active' as const,
        motif_changement: motifChangement || 'Nouvelle assignation'
      });

      queryClient.invalidateQueries({ queryKey: ['affectations-vehicule', vehicule.id] });
      
      toast({
        title: "Succès",
        description: "Chauffeur assigné avec succès"
      });

      setShowAssignDialog(false);
      setSelectedChauffeurId('');
      setMotifChangement('');
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'assigner le chauffeur",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDesassignChauffeur = async (affectationId: string) => {
    try {
      await affectationsService.desactiver(affectationId, 'Désassignation manuelle');
      queryClient.invalidateQueries({ queryKey: ['affectations-vehicule', vehicule.id] });
      
      toast({
        title: "Succès",
        description: "Chauffeur désassigné avec succès"
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de désassigner le chauffeur",
        variant: "destructive"
      });
    }
  };

  if (loadingAffectations) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Chargement des affectations...</div>
        </CardContent>
      </Card>
    );
  }

  const affectationsActives = affectations.filter(aff => aff.statut === 'active');
  const affectationsInactives = affectations.filter(aff => aff.statut !== 'active');

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <UserCheck className="h-5 w-5" />
          Chauffeurs assignés au véhicule {getVehiculeDisplayText(vehicule)}
        </CardTitle>
        <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
          <DialogTrigger asChild>
            <Button size="sm" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Assigner chauffeur
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Assigner un chauffeur au véhicule {getVehiculeDisplayText(vehicule)}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="chauffeur-search">Rechercher un chauffeur</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="chauffeur-search"
                    placeholder="Nom, prénom, matricule..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="chauffeur-select">Sélectionner un chauffeur</Label>
                <Select value={selectedChauffeurId} onValueChange={setSelectedChauffeurId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir un chauffeur disponible" />
                  </SelectTrigger>
                  <SelectContent>
                    {chauffeursFiltres.length === 0 ? (
                      <div className="p-2 text-sm text-muted-foreground">
                        {searchTerm ? 'Aucun chauffeur trouvé' : 'Aucun chauffeur disponible'}
                      </div>
                    ) : (
                      chauffeursFiltres.map((chauffeur) => (
                        <SelectItem key={chauffeur.id} value={chauffeur.id}>
                          <div className="flex items-center gap-2">
                            <Avatar className="w-6 h-6">
                              <AvatarImage src={chauffeur.photo_url || undefined} />
                              <AvatarFallback className="text-xs">
                                {getInitials(chauffeur.nom, chauffeur.prenom)}
                              </AvatarFallback>
                            </Avatar>
                            {chauffeur.prenom} {chauffeur.nom}
                            {chauffeur.matricule && (
                              <span className="text-xs text-muted-foreground">({chauffeur.matricule})</span>
                            )}
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  {chauffeursFiltres.length} chauffeur(s) disponible(s)
                </p>
              </div>
              
              <div>
                <Label htmlFor="motif">Motif de l'assignation (optionnel)</Label>
                <Textarea
                  id="motif"
                  value={motifChangement}
                  onChange={(e) => setMotifChangement(e.target.value)}
                  placeholder="Raison de cette assignation..."
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowAssignDialog(false)}>
                  Annuler
                </Button>
                <Button onClick={handleAssignChauffeur} disabled={isLoading}>
                  {isLoading ? 'Attribution...' : 'Assigner'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {affectationsActives.length === 0 ? (
          <div className="text-center py-6 text-gray-500">
            <UserCheck className="h-12 w-12 mx-auto text-gray-300 mb-2" />
            <p>Aucun chauffeur assigné au véhicule {getVehiculeDisplayText(vehicule)}</p>
            <p className="text-sm">Cliquez sur "Assigner chauffeur" pour commencer</p>
          </div>
        ) : (
          <div className="space-y-3">
            {affectationsActives.map((affectation) => (
              <div key={affectation.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={affectation.chauffeur?.photo_url || undefined} />
                    <AvatarFallback className="bg-orange-100 text-orange-600">
                      {affectation.chauffeur ? 
                        getInitials(affectation.chauffeur.nom, affectation.chauffeur.prenom) : 
                        'NC'
                      }
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">
                      {affectation.chauffeur?.prenom} {affectation.chauffeur?.nom}
                    </div>
                    <div className="text-sm text-gray-500 flex items-center gap-2">
                      <Calendar className="h-3 w-3" />
                      Depuis le {new Date(affectation.date_debut).toLocaleDateString('fr-FR')}
                    </div>
                    {affectation.chauffeur?.telephone && (
                      <div className="text-sm text-gray-500">
                        📞 {affectation.chauffeur.telephone}
                      </div>
                    )}
                    {affectation.chauffeur?.matricule && (
                      <div className="text-sm text-gray-500">
                        Matricule: {affectation.chauffeur.matricule}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="default">Assigné</Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDesassignChauffeur(affectation.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {affectationsInactives.length > 0 && (
          <div className="mt-6">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Historique des assignations</h4>
            <div className="space-y-2">
              {affectationsInactives.slice(0, 3).map((affectation) => (
                <div key={affectation.id} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                  <div className="flex items-center gap-2">
                    <Avatar className="w-6 h-6">
                      <AvatarImage src={affectation.chauffeur?.photo_url || undefined} />
                      <AvatarFallback className="text-xs">
                        {affectation.chauffeur ? 
                          getInitials(affectation.chauffeur.nom, affectation.chauffeur.prenom) : 
                          'NC'
                        }
                      </AvatarFallback>
                    </Avatar>
                    <span>
                      {affectation.chauffeur?.prenom} {affectation.chauffeur?.nom}
                    </span>
                    <span className="text-xs text-gray-400">
                      {affectation.date_debut} → {affectation.date_fin}
                    </span>
                  </div>
                  <Badge variant="secondary">Ancien</Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
