
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Package, Truck, MapPin, Fuel } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const ChargementsStats = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['chargements-stats'],
    queryFn: async () => {
      const { data: chargements } = await supabase
        .from('chargements')
        .select('*');

      const totalChargements = chargements?.length || 0;
      const chargementsLivres = chargements?.filter(c => c.statut === 'livre').length || 0;
      const chargementsEnCours = chargements?.filter(c => c.statut === 'charge').length || 0;
      const hydrocarbures = chargements?.filter(c => c.type_chargement === 'hydrocarbures').length || 0;

      return {
        totalChargements,
        chargementsLivres,
        chargementsEnCours,
        hydrocarbures
      };
    }
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-12 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total chargements</CardTitle>
          <Package className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats?.totalChargements}</div>
          <p className="text-xs text-muted-foreground">
            Tous les chargements enregistrés
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">En cours</CardTitle>
          <Truck className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">{stats?.chargementsEnCours}</div>
          <p className="text-xs text-muted-foreground">
            Chargements en transit
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Livrés</CardTitle>
          <MapPin className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{stats?.chargementsLivres}</div>
          <p className="text-xs text-muted-foreground">
            Livraisons terminées
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Hydrocarbures</CardTitle>
          <Fuel className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-600">{stats?.hydrocarbures}</div>
          <p className="text-xs text-muted-foreground">
            Transports spécialisés
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
