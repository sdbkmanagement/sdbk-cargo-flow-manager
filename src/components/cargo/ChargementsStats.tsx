
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Package, Truck, MapPin, Fuel, Mountain } from 'lucide-react';

interface ChargementsStatsProps {
  totalChargements: number;
  chargementsLivres: number;
  chargementsEnCours: number;
  chargementsAnnules: number;
  hydrocarbures: number;
  bauxite: number;
  volumeTotal: number;
}

export const ChargementsStats = ({ 
  totalChargements, 
  chargementsLivres, 
  chargementsEnCours, 
  chargementsAnnules, 
  hydrocarbures, 
  bauxite, 
  volumeTotal 
}: ChargementsStatsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total chargements</CardTitle>
          <Package className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalChargements || 0}</div>
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
          <div className="text-2xl font-bold text-blue-600">{chargementsEnCours || 0}</div>
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
          <div className="text-2xl font-bold text-green-600">{chargementsLivres || 0}</div>
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
          <div className="text-2xl font-bold text-red-600">{hydrocarbures || 0}</div>
          <p className="text-xs text-muted-foreground">
            Transports spécialisés
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Bauxite</CardTitle>
          <Mountain className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-600">{bauxite || 0}</div>
          <p className="text-xs text-muted-foreground">
            Minerai transporté
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
