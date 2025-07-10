import React, { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { diagnosticMaintenanceService } from '@/services/diagnosticMaintenance';
import { Wrench, Clock, Euro, User, Calendar, FileText } from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';

type DiagnosticMaintenance = Database['public']['Tables']['diagnostics_maintenance']['Row'];
type Vehicule = Database['public']['Tables']['vehicules']['Row'];

interface DiagnosticMaintenanceFormProps {
  vehicule: Vehicule;
  diagnostic?: DiagnosticMaintenance | null;
  onClose: () => void;
  onSuccess: () => void;
  userRole: string;
  userName: string;
  userId: string;
}

export const DiagnosticMaintenanceForm = ({ 
  vehicule, 
  diagnostic, 
  onClose, 
  onSuccess, 
  userRole, 
  userName, 
  userId 
}: DiagnosticMaintenanceFormProps) => {
  const [formData, setFormData] = useState({
    type_panne: '',
    type_panne_autre: '',
    description: '',
    duree_estimee_heures: '',
    duree_reelle_heures: '',
    cout_reparation: '',
    responsable_maintenance: userName,
    statut: 'en_attente',
    date_debut_reparation: '',
    date_fin_reparation: '',
    pieces_utilisees: [] as string[],
    garage_externe: '',
    observations: ''
  });

  const [nouvellepiece, setNouvellepiece] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Récupérer les types de pannes
  const { data: typesPannes = [] } = useQuery({
    queryKey: ['types-pannes'],
    queryFn: diagnosticMaintenanceService.getTypesPannes,
  });

  // Initialiser le formulaire avec les données existantes
  useEffect(() => {
    if (diagnostic) {
      setFormData({
        type_panne: diagnostic.type_panne,
        type_panne_autre: diagnostic.type_panne_autre || '',
        description: diagnostic.description || '',
        duree_estimee_heures: diagnostic.duree_estimee_heures?.toString() || '',
        duree_reelle_heures: diagnostic.duree_reelle_heures?.toString() || '',
        cout_reparation: diagnostic.cout_reparation?.toString() || '',
        responsable_maintenance: diagnostic.responsable_maintenance,
        statut: diagnostic.statut,
        date_debut_reparation: diagnostic.date_debut_reparation ? 
          new Date(diagnostic.date_debut_reparation).toISOString().slice(0, 16) : '',
        date_fin_reparation: diagnostic.date_fin_reparation ? 
          new Date(diagnostic.date_fin_reparation).toISOString().slice(0, 16) : '',
        pieces_utilisees: diagnostic.pieces_utilisees || [],
        garage_externe: diagnostic.garage_externe || '',
        observations: diagnostic.observations || ''
      });
    }
  }, [diagnostic, userName]);

  // Mutation pour créer/modifier un diagnostic
  const mutation = useMutation({
    mutationFn: async (data: any) => {
      if (diagnostic) {
        return diagnosticMaintenanceService.update(diagnostic.id, data);
      } else {
        return diagnosticMaintenanceService.create({
          ...data,
          vehicule_id: vehicule.id,
          responsable_user_id: userId
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['diagnostics-maintenance'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      toast({
        title: diagnostic ? 'Diagnostic modifié' : 'Diagnostic créé',
        description: 'Les informations ont été enregistrées avec succès.',
      });
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: 'Erreur',
        description: error.message || 'Une erreur est survenue.',
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.type_panne) {
      toast({
        title: 'Erreur de validation',
        description: 'Le type de panne est requis.',
        variant: 'destructive',
      });
      return;
    }

    if (formData.type_panne === 'AUTRE' && !formData.type_panne_autre) {
      toast({
        title: 'Erreur de validation',
        description: 'Veuillez préciser le type de panne.',
        variant: 'destructive',
      });
      return;
    }

    // Préparer les données
    const dataToSubmit = {
      type_panne: formData.type_panne,
      type_panne_autre: formData.type_panne === 'AUTRE' ? formData.type_panne_autre : null,
      description: formData.description,
      duree_estimee_heures: formData.duree_estimee_heures ? parseInt(formData.duree_estimee_heures) : null,
      duree_reelle_heures: formData.duree_reelle_heures ? parseInt(formData.duree_reelle_heures) : null,
      cout_reparation: formData.cout_reparation ? parseFloat(formData.cout_reparation) : null,
      responsable_maintenance: formData.responsable_maintenance,
      statut: formData.statut,
      date_debut_reparation: formData.date_debut_reparation ? new Date(formData.date_debut_reparation).toISOString() : null,
      date_fin_reparation: formData.date_fin_reparation ? new Date(formData.date_fin_reparation).toISOString() : null,
      pieces_utilisees: formData.pieces_utilisees.length > 0 ? formData.pieces_utilisees : null,
      garage_externe: formData.garage_externe || null,
      observations: formData.observations || null
    };

    mutation.mutate(dataToSubmit);
  };

  const ajouterPiece = () => {
    if (nouvellepiece.trim()) {
      setFormData(prev => ({
        ...prev,
        pieces_utilisees: [...prev.pieces_utilisees, nouvellepiece.trim()]
      }));
      setNouvellepiece('');
    }
  };

  const supprimerPiece = (index: number) => {
    setFormData(prev => ({
      ...prev,
      pieces_utilisees: prev.pieces_utilisees.filter((_, i) => i !== index)
    }));
  };

  const getStatutColor = (statut: string) => {
    switch (statut) {
      case 'en_attente': return 'bg-yellow-100 text-yellow-800';
      case 'en_cours': return 'bg-blue-100 text-blue-800';
      case 'termine': return 'bg-green-100 text-green-800';
      case 'reporte': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Vérifier les permissions
  const peutModifier = userRole === 'maintenance' || userRole === 'admin';

  if (!peutModifier) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <Card className="w-full max-w-md mx-4">
          <CardHeader>
            <CardTitle className="text-red-600">Accès refusé</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Vous n'avez pas les permissions nécessaires pour accéder à cette fonctionnalité.</p>
            <p className="text-sm text-muted-foreground mt-2">
              Seuls les utilisateurs avec le rôle "Maintenance" peuvent gérer les diagnostics.
            </p>
            <Button onClick={onClose} className="mt-4 w-full">
              Fermer
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <Card className="border-0 shadow-none">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Wrench className="h-5 w-5" />
                  {diagnostic ? 'Modifier le diagnostic' : 'Nouveau diagnostic de maintenance'}
                </CardTitle>
                <CardDescription>
                  Véhicule: {vehicule.numero} - {vehicule.immatriculation || 'Immatriculation manquante'}
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={mutation.isPending}>
                  {mutation.isPending ? 'Enregistrement...' : 'Enregistrer'}
                </Button>
                <Button type="button" variant="outline" onClick={onClose}>
                  Fermer
                </Button>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Informations de base */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type_panne">Type de panne *</Label>
                  <Select value={formData.type_panne} onValueChange={(value) => 
                    setFormData(prev => ({ ...prev, type_panne: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un type de panne" />
                    </SelectTrigger>
                    <SelectContent>
                      {typesPannes.map((type) => (
                        <SelectItem key={type.id} value={type.code}>
                          {type.libelle}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {formData.type_panne === 'AUTRE' && (
                  <div className="space-y-2">
                    <Label htmlFor="type_panne_autre">Préciser le type de panne *</Label>
                    <Input
                      id="type_panne_autre"
                      value={formData.type_panne_autre}
                      onChange={(e) => setFormData(prev => ({ ...prev, type_panne_autre: e.target.value }))}
                      placeholder="Décrivez le type de panne"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="statut">Statut</Label>
                  <Select value={formData.statut} onValueChange={(value) => 
                    setFormData(prev => ({ ...prev, statut: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en_attente">En attente</SelectItem>
                      <SelectItem value="en_cours">En cours</SelectItem>
                      <SelectItem value="termine">Terminé</SelectItem>
                      <SelectItem value="reporte">Reporté</SelectItem>
                    </SelectContent>
                  </Select>
                  <Badge className={getStatutColor(formData.statut)}>
                    {formData.statut.replace('_', ' ').toUpperCase()}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="responsable_maintenance">Responsable maintenance</Label>
                  <Input
                    id="responsable_maintenance"
                    value={formData.responsable_maintenance}
                    onChange={(e) => setFormData(prev => ({ ...prev, responsable_maintenance: e.target.value }))}
                    disabled
                  />
                </div>
              </div>

              <Separator />

              {/* Description détaillée */}
              <div className="space-y-2">
                <Label htmlFor="description">Description / Observations</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Décrivez en détail la panne et les symptômes observés..."
                  rows={3}
                />
              </div>

              <Separator />

              {/* Durées et coûts */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="duree_estimee_heures" className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Durée estimée (heures)
                  </Label>
                  <Input
                    id="duree_estimee_heures"
                    type="number"
                    min="0"
                    step="0.5"
                    value={formData.duree_estimee_heures}
                    onChange={(e) => setFormData(prev => ({ ...prev, duree_estimee_heures: e.target.value }))}
                    placeholder="0"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="duree_reelle_heures" className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Durée réelle (heures)
                  </Label>
                  <Input
                    id="duree_reelle_heures"
                    type="number"
                    min="0"
                    step="0.5"
                    value={formData.duree_reelle_heures}
                    onChange={(e) => setFormData(prev => ({ ...prev, duree_reelle_heures: e.target.value }))}
                    placeholder="0"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cout_reparation" className="flex items-center gap-2">
                    <Euro className="h-4 w-4" />
                    Coût réparation (€)
                  </Label>
                  <Input
                    id="cout_reparation"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.cout_reparation}
                    onChange={(e) => setFormData(prev => ({ ...prev, cout_reparation: e.target.value }))}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <Separator />

              {/* Dates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date_debut_reparation" className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Date début réparation
                  </Label>
                  <Input
                    id="date_debut_reparation"
                    type="datetime-local"
                    value={formData.date_debut_reparation}
                    onChange={(e) => setFormData(prev => ({ ...prev, date_debut_reparation: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date_fin_reparation" className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Date fin réparation
                  </Label>
                  <Input
                    id="date_fin_reparation"
                    type="datetime-local"
                    value={formData.date_fin_reparation}
                    onChange={(e) => setFormData(prev => ({ ...prev, date_fin_reparation: e.target.value }))}
                  />
                </div>
              </div>

              <Separator />

              {/* Pièces utilisées */}
              <div className="space-y-4">
                <Label className="flex items-center gap-2">
                  <Wrench className="h-4 w-4" />
                  Pièces utilisées
                </Label>
                
                <div className="flex gap-2">
                  <Input
                    value={nouvellepiece}
                    onChange={(e) => setNouvellepiece(e.target.value)}
                    placeholder="Nom de la pièce"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), ajouterPiece())}
                  />
                  <Button type="button" onClick={ajouterPiece} variant="outline">
                    Ajouter
                  </Button>
                </div>
                
                {formData.pieces_utilisees.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.pieces_utilisees.map((piece, index) => (
                      <Badge key={index} variant="secondary" className="cursor-pointer" 
                             onClick={() => supprimerPiece(index)}>
                        {piece} ×
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <Separator />

              {/* Garage externe et observations finales */}
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="garage_externe">Garage externe (si applicable)</Label>
                  <Input
                    id="garage_externe"
                    value={formData.garage_externe}
                    onChange={(e) => setFormData(prev => ({ ...prev, garage_externe: e.target.value }))}
                    placeholder="Nom du garage externe"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="observations" className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Observations finales
                  </Label>
                  <Textarea
                    id="observations"
                    value={formData.observations}
                    onChange={(e) => setFormData(prev => ({ ...prev, observations: e.target.value }))}
                    placeholder="Observations, recommandations, suivi nécessaire..."
                    rows={2}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  );
};