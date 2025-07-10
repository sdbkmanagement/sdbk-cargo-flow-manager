import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { processusSDBKService } from '@/services/processus-sdbk';
import { supabase } from '@/integrations/supabase/client';
import { Settings, UserCheck, Truck, User, BarChart3 } from 'lucide-react';

interface Vehicule {
  id: string;
  numero: string;
  type_transport: string;
  chauffeur_assigne?: string;
  chauffeur?: {
    nom: string;
    prenom: string;
  };
}

interface Chauffeur {
  id: string;
  nom: string;
  prenom: string;
  statut: string;
  vehicule_assigne?: string;
}

interface Affectation {
  id: string;
  vehicule_id: string;
  chauffeur_id: string;
  date_debut: string;
  date_fin?: string;
  statut: string;
  motif_changement?: string;
  vehicule?: {
    numero: string;
  };
  chauffeur?: {
    nom: string;
    prenom: string;
  };
}

export const DirecteurInterface = () => {
  const [vehicules, setVehicules] = useState<Vehicule[]>([]);
  const [chauffeurs, setChauffeurs] = useState<Chauffeur[]>([]);
  const [affectations, setAffectations] = useState<Affectation[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [selectedVehicule, setSelectedVehicule] = useState<string>('');
  const [selectedChauffeur, setSelectedChauffeur] = useState<string>('');
  const [motifChangement, setMotifChangement] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Charger les véhicules
      const { data: vehiculesData, error: vehiculesError } = await supabase
        .from('vehicules')
        .select(`
          id,
          numero,
          type_transport,
          chauffeur_assigne,
          chauffeurs:chauffeur_assigne (
            nom,
            prenom
          )
        `)
        .order('numero');

      if (vehiculesError) throw vehiculesError;
      setVehicules(vehiculesData || []);

      // Charger les chauffeurs
      const { data: chauffeursData, error: chauffeursError } = await supabase
        .from('chauffeurs')
        .select('id, nom, prenom, statut, vehicule_assigne')
        .eq('statut', 'actif')
        .order('nom');

      if (chauffeursError) throw chauffeursError;
      setChauffeurs(chauffeursData || []);

      // Charger les affectations récentes
      const { data: affectationsData, error: affectationsError } = await supabase
        .from('affectations_chauffeurs')
        .select(`
          id,
          vehicule_id,
          chauffeur_id,
          date_debut,
          date_fin,
          statut,
          motif_changement,
          vehicules!inner (numero),
          chauffeurs!inner (nom, prenom)
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      if (affectationsError) throw affectationsError;
      setAffectations(affectationsData || []);

    } catch (error) {
      console.error('Erreur:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les données',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAffectation = async () => {
    if (!selectedVehicule || !selectedChauffeur || !motifChangement.trim()) {
      toast({
        title: 'Erreur',
        description: 'Veuillez remplir tous les champs',
        variant: 'destructive'
      });
      return;
    }

    try {
      setLoading(true);
      
      await processusSDBKService.affecter_chauffeur_vehicule(
        selectedVehicule,
        selectedChauffeur,
        motifChangement,
        'current-user-id' // TODO: Récupérer l'ID utilisateur actuel
      );

      toast({
        title: 'Succès',
        description: 'Affectation réalisée avec succès',
      });

      setShowDialog(false);
      setSelectedVehicule('');
      setSelectedChauffeur('');
      setMotifChangement('');
      loadData();

    } catch (error) {
      console.error('Erreur:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de réaliser l\'affectation',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const ouvrirDialogAffectation = (vehiculeId?: string) => {
    setSelectedVehicule(vehiculeId || '');
    setSelectedChauffeur('');
    setMotifChangement('');
    setShowDialog(true);
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Settings className="w-6 h-6" />
          <h2 className="text-2xl font-bold">Interface Directeur d'Exploitation</h2>
        </div>
        <Button onClick={() => ouvrirDialogAffectation()} className="flex items-center gap-2">
          <UserCheck className="w-4 h-4" />
          Nouvelle Affectation
        </Button>
      </div>

      {/* Tableau des véhicules et affectations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="w-5 h-5" />
            Véhicules et Chauffeurs Assignés
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-medium">Véhicule</th>
                  <th className="text-left p-3 font-medium">Type</th>
                  <th className="text-left p-3 font-medium">Chauffeur Assigné</th>
                  <th className="text-center p-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {vehicules.map((vehicule) => (
                  <tr key={vehicule.id} className="border-b hover:bg-gray-50">
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <Truck className="w-4 h-4 text-gray-500" />
                        <span className="font-medium">{vehicule.numero}</span>
                      </div>
                    </td>
                    <td className="p-3">{vehicule.type_transport}</td>
                    <td className="p-3">
                      {vehicule.chauffeur ? (
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-green-500" />
                          <span>{vehicule.chauffeur.prenom} {vehicule.chauffeur.nom}</span>
                        </div>
                      ) : (
                        <Badge variant="secondary">Non assigné</Badge>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => ouvrirDialogAffectation(vehicule.id)}
                      >
                        <UserCheck className="w-3 h-3 mr-1" />
                        {vehicule.chauffeur ? 'Réaffecter' : 'Affecter'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Historique des affectations */}
      <Card>
        <CardHeader>
          <CardTitle>Historique des Affectations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {affectations.map((affectation) => (
              <div key={affectation.id} className="border rounded p-3 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Truck className="w-4 h-4 text-blue-500" />
                      <span className="font-medium">{affectation.vehicule?.numero}</span>
                    </div>
                    <div className="text-gray-400">→</div>
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-green-500" />
                      <span>{affectation.chauffeur?.prenom} {affectation.chauffeur?.nom}</span>
                    </div>
                  </div>
                  <Badge variant={affectation.statut === 'active' ? 'default' : 'secondary'}>
                    {affectation.statut}
                  </Badge>
                </div>
                <div className="mt-2 text-sm text-gray-600">
                  <p><span className="font-medium">Date:</span> {new Date(affectation.date_debut).toLocaleDateString()}</p>
                  {affectation.motif_changement && (
                    <p><span className="font-medium">Motif:</span> {affectation.motif_changement}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Truck className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{vehicules.length}</p>
                <p className="text-sm text-gray-600">Total véhicules</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{chauffeurs.length}</p>
                <p className="text-sm text-gray-600">Chauffeurs actifs</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <UserCheck className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {vehicules.filter(v => v.chauffeur_assigne).length}
                </p>
                <p className="text-sm text-gray-600">Véhicules affectés</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dialog d'affectation */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Affecter un Chauffeur à un Véhicule</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="vehicule">Véhicule</Label>
              <Select value={selectedVehicule} onValueChange={setSelectedVehicule}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un véhicule" />
                </SelectTrigger>
                <SelectContent>
                  {vehicules.map((vehicule) => (
                    <SelectItem key={vehicule.id} value={vehicule.id}>
                      {vehicule.numero} - {vehicule.type_transport}
                      {vehicule.chauffeur && ` (actuellement: ${vehicule.chauffeur.prenom} ${vehicule.chauffeur.nom})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="chauffeur">Chauffeur</Label>
              <Select value={selectedChauffeur} onValueChange={setSelectedChauffeur}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un chauffeur" />
                </SelectTrigger>
                <SelectContent>
                  {chauffeurs.map((chauffeur) => (
                    <SelectItem key={chauffeur.id} value={chauffeur.id}>
                      {chauffeur.prenom} {chauffeur.nom}
                      {chauffeur.vehicule_assigne && ' (déjà affecté)'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="motif">Motif de l'affectation</Label>
              <Textarea
                id="motif"
                value={motifChangement}
                onChange={(e) => setMotifChangement(e.target.value)}
                placeholder="Décrivez le motif de cette affectation..."
                rows={3}
                required
              />
            </div>

            <div className="bg-yellow-50 p-3 rounded border border-yellow-200">
              <p className="text-xs text-yellow-700">
                <strong>Note:</strong> Cette action terminera automatiquement l'affectation précédente s'il y en a une
                et créera une nouvelle affectation avec traçabilité complète.
              </p>
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                Annuler
              </Button>
              <Button onClick={handleAffectation} disabled={loading}>
                {loading ? 'Affectation...' : 'Confirmer l\'Affectation'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};