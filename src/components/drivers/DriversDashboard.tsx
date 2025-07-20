import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DriversStats } from './DriversStats';
import { Edit, Calendar, RefreshCw, AlertTriangle, Clock, XCircle, Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { chauffeursService } from '@/services/chauffeurs';
import { Alert, AlertDescription } from '@/components/ui/alert';

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
  const [dateDebutError, setDateDebutError] = useState('');
  const [dateFinError, setDateFinError] = useState('');
  const [alertsCount, setAlertsCount] = useState(0);
  const [alertesChauffeurs, setAlertesChauffeurs] = useState<any[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: chauffeurs = [], isLoading } = useQuery({
    queryKey: ['chauffeurs'],
    queryFn: chauffeursService.getAll,
    refetchInterval: 30000,
  });

  const stats = {
    total: chauffeurs.length,
    disponibles: chauffeurs.filter(c => c.statut === 'actif').length,
    enConge: chauffeurs.filter(c => c.statut === 'conge').length,
    enArretMaladie: chauffeurs.filter(c => c.statut === 'maladie').length,
    indisponibles: chauffeurs.filter(c => c.statut === 'suspendu').length,
    alertes: alertsCount
  };

  const loadAlertes = async () => {
    try {
      console.log('Chargement des alertes chauffeurs pour le dashboard...');
      const { data, error } = await supabase
        .from('alertes_documents_chauffeurs')
        .select('*')
        .order('jours_restants', { ascending: true, nullsFirst: false });

      if (error) {
        console.error('Erreur lors du chargement des alertes chauffeurs:', error);
        return;
      }

      console.log('Alertes chauffeurs chargées:', data);
      
      // Filtrer pour ne garder que les alertes pertinentes (moins de 30 jours ou expirés)
      const alertesFiltered = data?.filter(alert => {
        if (alert.jours_restants === null) return false;
        return alert.jours_restants <= 30;
      }) || [];

      setAlertesChauffeurs(alertesFiltered.slice(0, 5)); // Limiter à 5 pour le dashboard
      setAlertsCount(alertesFiltered.length);
    } catch (error) {
      console.error('Erreur lors du chargement des alertes:', error);
    }
  };

  useEffect(() => {
    loadAlertes();
    // Actualiser les alertes toutes les 30 secondes
    const interval = setInterval(loadAlertes, 30000);
    return () => clearInterval(interval);
  }, []);

  const validateDates = () => {
    let isValid = true;
    setDateDebutError('');
    setDateFinError('');

    if (!statusChange.dateDebut || statusChange.dateDebut.trim() === '') {
      setDateDebutError('La date de début est obligatoire');
      isValid = false;
    }

    if (!statusChange.dateFin || statusChange.dateFin.trim() === '') {
      setDateFinError('La date de fin est obligatoire');
      isValid = false;
    }

    if (statusChange.dateDebut && statusChange.dateFin) {
      const debut = new Date(statusChange.dateDebut);
      const fin = new Date(statusChange.dateFin);
      
      if (isNaN(debut.getTime()) || isNaN(fin.getTime())) {
        if (isNaN(debut.getTime())) setDateDebutError('Date de début invalide');
        if (isNaN(fin.getTime())) setDateFinError('Date de fin invalide');
        isValid = false;
      } else if (fin <= debut) {
        setDateFinError('La date de fin doit être postérieure à la date de début');
        isValid = false;
      }
    }

    return isValid;
  };

  const handleStatusChange = async () => {
    console.log('Tentative de changement de statut avec:', statusChange);
    
    if (!validateDates()) {
      toast({
        title: "Erreur de validation",
        description: "Veuillez corriger les erreurs dans le formulaire",
        variant: "destructive",
      });
      return;
    }

    try {
      // Mettre à jour le statut du chauffeur avec les nouvelles dates
      const updateData = {
        statut: statusChange.nouveauStatut,
        statut_disponibilite: statusChange.nouveauStatut,
        date_debut_statut: statusChange.dateDebut,
        date_fin_statut: statusChange.dateFin
      };

      console.log('Mise à jour du chauffeur avec:', updateData);

      await supabase
        .from('chauffeurs')
        .update(updateData)
        .eq('id', statusChange.chauffeurId);

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
      setDateDebutError('');
      setDateFinError('');

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

  const handleDateDebutChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setStatusChange({...statusChange, dateDebut: value});
    if (dateDebutError && value.trim() !== '') {
      setDateDebutError('');
    }
  };

  const handleDateFinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setStatusChange({...statusChange, dateFin: value});
    if (dateFinError && value.trim() !== '') {
      setDateFinError('');
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
    setDateDebutError('');
    setDateFinError('');
    setStatusDialog(true);
  };

  const getAlertIcon = (joursRestants: number | null) => {
    if (joursRestants === null) return Clock;
    if (joursRestants < 0) return XCircle;
    if (joursRestants <= 7) return AlertTriangle;
    return Clock;
  };

  const getAlertColor = (joursRestants: number | null) => {
    if (joursRestants === null) return 'text-gray-500';
    if (joursRestants < 0) return 'text-red-600';
    if (joursRestants <= 7) return 'text-orange-600';
    return 'text-blue-600';
  };

  const getAlertBgColor = (joursRestants: number | null) => {
    if (joursRestants === null) return 'bg-gray-50 border-l-gray-500';
    if (joursRestants < 0) return 'bg-red-50 border-l-red-500';
    if (joursRestants <= 7) return 'bg-orange-50 border-l-orange-500';
    return 'bg-blue-50 border-l-blue-500';
  };

  const canSubmit = statusChange.dateDebut && statusChange.dateFin && statusChange.dateDebut.trim() !== '' && statusChange.dateFin.trim() !== '' && !dateDebutError && !dateFinError && statusChange.nouveauStatut;

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
          onClick={() => {
            queryClient.invalidateQueries({ queryKey: ['chauffeurs'] });
            loadAlertes();
          }}
          variant="outline"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Actualiser
        </Button>
      </div>

      <DriversStats {...stats} />

      {/* Section des alertes documents */}
      {alertesChauffeurs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Alertes Documents Récentes
              <Badge className="bg-orange-500 text-white">
                {alertsCount}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {alertesChauffeurs.map((alerte, index) => {
                const AlertIcon = getAlertIcon(alerte.jours_restants);
                const alertColor = getAlertColor(alerte.jours_restants);
                const alertBgColor = getAlertBgColor(alerte.jours_restants);
                
                return (
                  <Alert key={index} className={`border-l-4 ${alertBgColor}`}>
                    <AlertIcon className={`h-4 w-4 ${alertColor}`} />
                    <AlertDescription>
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="font-medium text-gray-900 mb-1">
                            {alerte.chauffeur_nom}
                          </div>
                          <div className="text-sm text-gray-600">
                            {alerte.document_nom} - {
                              alerte.jours_restants !== null && alerte.jours_restants < 0 
                                ? `Expiré depuis ${Math.abs(alerte.jours_restants)} jour(s)`
                                : alerte.jours_restants !== null && alerte.jours_restants <= 7
                                ? `Expire dans ${alerte.jours_restants} jour(s)`
                                : `${alerte.jours_restants} jours restants`
                            }
                          </div>
                          {alerte.date_expiration && (
                            <div className="text-xs text-gray-500 mt-1">
                              Expiration: {new Date(alerte.date_expiration).toLocaleDateString('fr-FR')}
                            </div>
                          )}
                        </div>
                        <Badge variant={
                          alerte.jours_restants !== null && alerte.jours_restants < 0 
                            ? 'destructive' 
                            : alerte.jours_restants !== null && alerte.jours_restants <= 7
                            ? 'destructive'
                            : 'secondary'
                        }>
                          {alerte.jours_restants !== null && alerte.jours_restants < 0 ? 'Expiré' : 'À renouveler'}
                        </Badge>
                      </div>
                    </AlertDescription>
                  </Alert>
                );
              })}
              {alertsCount > alertesChauffeurs.length && (
                <div className="text-center">
                  <Button
                    variant="outline"
                    onClick={() => window.location.href = '/drivers?tab=alertes'}
                    className="text-orange-600 border-orange-600 hover:bg-orange-50"
                  >
                    Voir toutes les alertes ({alertsCount})
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

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
              <Label htmlFor="status">Nouveau statut <span className="text-red-500">*</span></Label>
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
              <div className="space-y-2">
                <Label htmlFor="dateDebut">Date de début <span className="text-red-500">*</span></Label>
                <Input
                  id="dateDebut"
                  type="date"
                  value={statusChange.dateDebut}
                  onChange={handleDateDebutChange}
                  required
                  className={`${dateDebutError ? 'border-red-500 focus:border-red-500' : 'border-gray-200'}`}
                />
                {dateDebutError && (
                  <p className="text-xs text-red-500">{dateDebutError}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="dateFin">Date de fin <span className="text-red-500">*</span></Label>
                <Input
                  id="dateFin"
                  type="date"
                  value={statusChange.dateFin}
                  onChange={handleDateFinChange}
                  required
                  className={`${dateFinError ? 'border-red-500 focus:border-red-500' : 'border-gray-200'}`}
                />
                {dateFinError && (
                  <p className="text-xs text-red-500">{dateFinError}</p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="motif">Motif (optionnel)</Label>
              <Textarea
                id="motif"
                placeholder="Motif du changement de statut..."
                value={statusChange.motif}
                onChange={(e) => setStatusChange({...statusChange, motif: e.target.value})}
              />
            </div>

            {(!statusChange.dateDebut || !statusChange.dateFin || dateDebutError || dateFinError) && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">
                  ⚠️ Les dates de début et de fin sont obligatoires pour changer le statut
                </p>
              </div>
            )}

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setStatusDialog(false)}>
                Annuler
              </Button>
              <Button 
                onClick={handleStatusChange}
                className="bg-orange-500 hover:bg-orange-600"
                disabled={!canSubmit}
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
