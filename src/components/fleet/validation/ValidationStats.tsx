
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Clock, BarChart3 } from 'lucide-react';
import { validationService } from '@/services/validation';

export const ValidationStats = () => {
  const [stats, setStats] = useState({
    total: 0,
    en_validation: 0,
    valides: 0,
    rejetes: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const data = await validationService.getStatistiquesGlobales();
      setStats(data);
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
            <span className="ml-2">Chargement...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          Statut des Validations
        </CardTitle>
        <BarChart3 className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Total</span>
            <Badge variant="outline">{stats.total}</Badge>
          </div>
          
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-sm text-gray-600">Validés</span>
            </div>
            <Badge className="bg-green-100 text-green-800">{stats.valides}</Badge>
          </div>
          
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-yellow-500" />
              <span className="text-sm text-gray-600">En validation</span>
            </div>
            <Badge className="bg-yellow-100 text-yellow-800">{stats.en_validation}</Badge>
          </div>
          
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <XCircle className="w-4 h-4 text-red-500" />
              <span className="text-sm text-gray-600">Rejetés</span>
            </div>
            <Badge className="bg-red-100 text-red-800">{stats.rejetes}</Badge>
          </div>
        </div>
        
        {stats.total > 0 && (
          <div className="mt-4 pt-3 border-t">
            <div className="text-xs text-gray-500 mb-2">Progression</div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full transition-all duration-300" 
                style={{ width: `${(stats.valides / stats.total) * 100}%` }}
              />
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {Math.round((stats.valides / stats.total) * 100)}% validés
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
