
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { vehiculeSyncService } from '@/services/vehiculeSyncService';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { RefreshCw, Search, AlertCircle, CheckCircle } from 'lucide-react';

export const VehicleSyncDiagnostic = () => {
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const { toast } = useToast();

  const handleSync = async () => {
    if (!vehicleNumber.trim()) {
      toast({
        title: 'Erreur',
        description: 'Veuillez saisir un numéro de véhicule',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      // Récupérer le véhicule par numéro
      const { data: vehicle, error } = await supabase
        .from('vehicules')
        .select('id, numero, statut, validation_requise')
        .eq('numero', vehicleNumber.trim())
        .single();

      if (error || !vehicle) {
        toast({
          title: 'Véhicule non trouvé',
          description: `Aucun véhicule trouvé avec le numéro ${vehicleNumber}`,
          variant: 'destructive'
        });
        return;
      }

      // Synchroniser le statut
      const syncResult = await vehiculeSyncService.syncVehicleStatusFromValidation(vehicle.id);
      
      setResult({
        vehicle,
        syncResult
      });

      if (syncResult.success) {
        toast({
          title: 'Synchronisation réussie',
          description: syncResult.message,
          className: 'bg-green-50 border-green-200'
        });
      } else {
        toast({
          title: 'Erreur de synchronisation',
          description: syncResult.message,
          variant: 'destructive'
        });
      }

    } catch (error) {
      console.error('Erreur lors de la synchronisation:', error);
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue lors de la synchronisation',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCw className="w-5 h-5" />
          Diagnostic de synchronisation véhicule
        </CardTitle>
        <CardDescription>
          Vérifiez et corrigez les problèmes de synchronisation entre validation et flotte
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <div className="flex-1">
            <Label htmlFor="vehicle-number">Numéro du véhicule</Label>
            <Input
              id="vehicle-number"
              value={vehicleNumber}
              onChange={(e) => setVehicleNumber(e.target.value)}
              placeholder="Ex: V051"
              className="mt-1"
            />
          </div>
          <div className="flex items-end">
            <Button 
              onClick={handleSync} 
              disabled={loading}
              className="flex items-center gap-2"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
              {loading ? 'Synchronisation...' : 'Synchroniser'}
            </Button>
          </div>
        </div>

        {result && (
          <div className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Véhicule trouvé:</strong> {result.vehicle.numero}
                <br />
                <strong>Statut actuel:</strong> {result.vehicle.statut}
                <br />
                <strong>Validation requise:</strong> {result.vehicle.validation_requise ? 'Oui' : 'Non'}
              </AlertDescription>
            </Alert>

            {result.syncResult.success ? (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  <strong>Synchronisation réussie!</strong>
                  <br />
                  {result.syncResult.message}
                  {result.syncResult.newStatus && (
                    <>
                      <br />
                      <strong>Nouveau statut:</strong> {result.syncResult.newStatus}
                    </>
                  )}
                </AlertDescription>
              </Alert>
            ) : (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Erreur de synchronisation:</strong>
                  <br />
                  {result.syncResult.message}
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
          <strong>Comment ça marche:</strong>
          <ul className="mt-2 space-y-1">
            <li>• Saisissez le numéro du véhicule (ex: V051)</li>
            <li>• Le système vérifie le statut de validation</li>
            <li>• Si toutes les étapes sont validées, le véhicule passe en "disponible"</li>
            <li>• Si une étape est rejetée, le véhicule passe en "indisponible"</li>
            <li>• Sinon, il reste en "validation_requise"</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
