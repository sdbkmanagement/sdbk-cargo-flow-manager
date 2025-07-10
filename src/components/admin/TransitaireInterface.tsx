import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { processusSDBKService, type ClientTotal } from '@/services/processus-sdbk';
import { supabase } from '@/integrations/supabase/client';
import { Truck, FileText, MapPin, Clock } from 'lucide-react';

interface VehiculeDisponible {
  id: string;
  numero: string;
  type_transport: string;
  capacite_max: number;
  chauffeur_assigne?: string;
  chauffeur?: {
    nom: string;
    prenom: string;
  };
}

export const TransitaireInterface = () => {
  const [vehiculesDisponibles, setVehiculesDisponibles] = useState<VehiculeDisponible[]>([]);
  const [clientsTotal, setClientsTotal] = useState<ClientTotal[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedVehicule, setSelectedVehicule] = useState<VehiculeDisponible | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Charger les véhicules disponibles
      const { data: vehicules, error: vehiculesError } = await supabase
        .from('vehicules')
        .select(`
          id,
          numero,
          type_transport,
          capacite_max,
          chauffeur_assigne,
          chauffeurs:chauffeur_assigne (
            nom,
            prenom
          )
        `)
        .eq('statut', 'disponible')
        .order('numero');

      if (vehiculesError) throw vehiculesError;
      setVehiculesDisponibles(vehicules || []);

      // Charger les clients TOTAL
      const clients = await processusSDBKService.getClientsTotal();
      setClientsTotal(clients);

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

  const creerBonLivraison = (vehicule: VehiculeDisponible) => {
    setSelectedVehicule(vehicule);
    // TODO: Ouvrir le dialogue BL avec le véhicule pré-sélectionné
    toast({
      title: 'Information',
      description: `BL pour ${vehicule.numero} - Interface à implémenter`,
    });
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center gap-2">
        <FileText className="w-6 h-6" />
        <h2 className="text-2xl font-bold">Interface Transitaire</h2>
        <Badge variant="outline">Émission des Bons de Livraison</Badge>
      </div>

      {/* Instructions */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
            <div>
              <p className="text-blue-800 font-medium mb-1">Instructions pour les transitaires</p>
              <p className="text-blue-700 text-sm">
                Sélectionnez un véhicule disponible pour créer un Bon de Livraison. Assurez-vous que toutes les informations
                client, destination et produit sont correctes avant émission.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Véhicules disponibles */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="w-5 h-5" />
            Véhicules Disponibles pour Mission
          </CardTitle>
        </CardHeader>
        <CardContent>
          {vehiculesDisponibles.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Truck className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Aucun véhicule disponible pour le moment</p>
              <p className="text-sm">Les véhicules doivent avoir terminé le processus SDBK</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {vehiculesDisponibles.map((vehicule) => (
                <Card key={vehicule.id} className="hover:shadow-md transition-shadow border-green-200">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Truck className="w-4 h-4" />
                        {vehicule.numero}
                      </CardTitle>
                      <Badge variant="default" className="bg-green-600">
                        Disponible
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2 text-sm">
                      <p>
                        <span className="font-medium">Type:</span> {vehicule.type_transport}
                      </p>
                      <p>
                        <span className="font-medium">Capacité:</span> {vehicule.capacite_max?.toLocaleString()} L
                      </p>
                      {vehicule.chauffeur && (
                        <p>
                          <span className="font-medium">Chauffeur:</span> {vehicule.chauffeur.prenom} {vehicule.chauffeur.nom}
                        </p>
                      )}
                    </div>
                    <Button 
                      onClick={() => creerBonLivraison(vehicule)}
                      className="w-full bg-blue-600 hover:bg-blue-700"
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Émettre un BL
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Clients TOTAL */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Clients TOTAL Enregistrés
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {clientsTotal.map((client) => (
              <div key={client.id} className="border rounded p-3 hover:bg-gray-50">
                <div className="font-medium">{client.nom_client}</div>
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Code:</span> {client.code_client}
                </div>
                <div className="text-sm text-gray-600 flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {client.destination}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <Truck className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{vehiculesDisponibles.length}</p>
                <p className="text-sm text-gray-600">Véhicules disponibles</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <MapPin className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{clientsTotal.length}</p>
                <p className="text-sm text-gray-600">Clients TOTAL</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <Clock className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">-</p>
                <p className="text-sm text-gray-600">BL en attente</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};