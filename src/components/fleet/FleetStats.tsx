
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Truck, CheckCircle, Clock, Wrench, Fuel, Package, AlertTriangle } from 'lucide-react';

interface FleetStatsProps {
  total: number;
  disponibles: number;
  en_mission: number;
  maintenance: number;
  hydrocarbures: number;
  bauxite: number;
  maintenance_urgente: number;
}

export const FleetStats = ({ 
  total, 
  disponibles, 
  en_mission, 
  maintenance, 
  hydrocarbures, 
  bauxite, 
  maintenance_urgente 
}: FleetStatsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-7 gap-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total véhicules</p>
              <p className="text-2xl font-bold text-gray-900">{total}</p>
            </div>
            <Truck className="w-8 h-8 text-blue-600" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Disponibles</p>
              <p className="text-2xl font-bold text-green-600">{disponibles}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">En mission</p>
              <p className="text-2xl font-bold text-blue-600">{en_mission}</p>
            </div>
            <Clock className="w-8 h-8 text-blue-600" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Maintenance</p>
              <p className="text-2xl font-bold text-orange-600">{maintenance}</p>
            </div>
            <Wrench className="w-8 h-8 text-orange-600" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Hydrocarbures</p>
              <p className="text-2xl font-bold text-red-600">{hydrocarbures}</p>
            </div>
            <Fuel className="w-8 h-8 text-red-600" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Bauxite</p>
              <p className="text-2xl font-bold text-amber-600">{bauxite}</p>
            </div>
            <Package className="w-8 h-8 text-amber-600" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Alertes</p>
              <p className="text-2xl font-bold text-red-600">{maintenance_urgente}</p>
              <p className="text-xs text-gray-500 mt-1">Maintenance &lt; 30j</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
