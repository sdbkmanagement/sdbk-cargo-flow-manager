
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DriversStats } from './DriversStats';
import { Edit, Calendar, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { chauffeursService } from '@/services/chauffeurs';

interface Chauffeur {
  id: string;
  nom: string;
  prenom: string;
  telephone: string;
  email: string;
  statut: string;
}

interface StatutChange {
  chauffeurId: string;
  nouveauStatut: string;
  dateDebut: string;
  dateFin: string;
  motif: string;
}

export const DriversDashboard = () => {
  const [statusDialog, setStatusDialog] = useState(false);
  const [statusChange, setStatusChange] = useState<StatutChange>({
    chauffeurId: '',
    nouveauStatut: '',
    dateDebut: new Date().toISOString().split('T')[0],
    dateFin: '',
    motif: ''
  });
  const [alertsCount, setAlertsCount] = useState(0);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: chauffeurs = [], isLoading } = useQuery({
    queryKey: ['chauffeurs'],
    queryFn: chauffeursService.getAll,
    refetchInterval: 30000,
  });

  // Calculer les statistiques
  const stats = {
    total: chauffeurs.length,
    disponibles: chauffeurs.filter(c => c.statut === 'actif').length,
    enConge: chauffeurs.filter(c => c.statut === 'conge').length,
    enArretMaladie: chauffeurs.filter(c => c.statut === 'maladie').length,
    indisponibles: chauffeurs.filter(c => c.statut === 'suspendu').length,
    alertes: alertsCount
  };

  // Charger les alertes
  useEffect(() => {
    const loadAlerts = async () => {
      try {
        const { data, error } = await supabase
          .from('alertes_documents_chauffeurs_v2')
          .select('id', { count: 'exact' });

        if (!error && data) {
          setAlertsCount(data.length);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des alertes:', error);
      }
    };

    loadAlerts();
  }, []);

  const handleStatusChange = async () => {
    try {
      // Mettre à jour le statut du chauffeur
      await supabase
        .from('chauffeurs')
        .update({ statut: statusChange.nouveauStatut })
        .eq('id', statusChange.chauffeurId);

      // Ajouter un enregistrement d'historique
      await supabase
        .from('statuts_chauffeurs')
        .insert({
          chauffeur_id: statusChange.chauffeurId,
          statut: statusChange.nouveauStatut,
          date_debut: statusChange.dateDebut,
          date_fin: statusChange.dateFin || null,
          motif: statusChange.motif
        });

      toast({
        title: 'Statut modifié',
        description: 'Le statut du chauffeur a été mis à jour avec succès'
      });

      setStatusDialog(false);
      setStatusChange({
        chauffeurId: '',
        nouveauStatut: '',
        dateDebut: new Date().toISOString().split('T')[0],
        dateFin: '',
        motif: ''
      });

      // Actualiser les données
      queryClient.invalidateQueries({ queryKey: ['chauffeurs'] });
    } catch (error) {
      console.error('Erreur lors de la modification du statut:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de modifier le statut',
        variant: 'destructive'
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'actif':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'conge':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'maladie':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'suspendu':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const openStatusDialog = (chauffeur: Chauffeur) => {
    setStatusChange({
      chauffeurId: chauffeur.id,
      nouveauStatut: chauffeur.statut,
      dateDebut: new Date().toISOString().split('T')[0],
      dateFin: '',
      motif: ''
    });
    setStatusDialog(true);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <RefreshCw className="w-6 h-6 animate-spin mr-2" />
        <span>Chargement du dashboard...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Dashboard Chauffeurs</h2>
          <p className="text-gray-600">Vue d'ensemble et gestion rapide des statuts</p>
        </div>
        <Button 
          onClick={() => queryClient.invalidateQueries({ queryKey: ['chauffeurs'] })}
          variant="outline"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Actualiser
        </Button>
      </div>

      <DriversStats {...stats} />

      <Card>
        <CardHeader>
          <CardTitle>Gestion rapide des statuts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {chauffeurs.map((chauffeur) => (
              <div
                key={chauffeur.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex-1">
                  <div className="font-semibold text-gray-900">
                    {chauffeur.prenom} {chauffeur.nom}
                  </div>
                  <div className="text-sm text-gray-600">{chauffeur.telephone}</div>
                  <Badge className={`text-xs mt-1 ${getStatusColor(chauffeur.statut)}`}>
                    {chauffeur.statut.charAt(0).toUpperCase() + chauffeur.statut.slice(1)}
                  </Badge>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openStatusDialog(chauffeur)}
                >
                  <Edit className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={statusDialog} onOpenChange={setStatusDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier le statut du chauffeur</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="status">Nouveau statut</Label>
              <Select
                value={statusChange.nouveauStatut}
                onValueChange={(value) => setStatusChange({...statusChange, nouveauStatut: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="actif">Disponible</SelectItem>
                  <SelectItem value="conge">En congé</SelectItem>
                  <SelectItem value="maladie">Arrêt maladie</SelectItem>
                  <SelectItem value="suspendu">Indisponible</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="dateDebut">Date de début</Label>
                <Input
                  id="dateDebut"
                  type="date"
                  value={statusChange.dateDebut}
                  onChange={(e) => setStatusChange({...statusChange, dateDebut: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="dateFin">Date de fin (optionnel)</Label>
                <Input
                  id="dateFin"
                  type="date"
                  value={statusChange.dateFin}
                  onChange={(e) => setStatusChange({...statusChange, dateFin: e.target.value})}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="motif">Motif</Label>
              <Textarea
                id="motif"
                placeholder="Motif du changement de statut..."
                value={statusChange.motif}
                onChange={(e) => setStatusChange({...statusChange, motif: e.target.value})}
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setStatusDialog(false)}>
                Annuler
              </Button>
              <Button 
                onClick={handleStatusChange}
                className="bg-orange-500 hover:bg-orange-600"
                disabled={!statusChange.nouveauStatut}
              >
                Confirmer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
