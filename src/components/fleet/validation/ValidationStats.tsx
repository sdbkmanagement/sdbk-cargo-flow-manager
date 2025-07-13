
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Clock, BarChart3, RefreshCw } from 'lucide-react';
import { validationService } from '@/services/validation';

export const ValidationStats = () => {
  const { data: stats, isLoading, refetch } = useQuery({
    queryKey: ['validation-stats'],
    queryFn: validationService.getStatistiquesGlobales,
    staleTime: 30000, // Cache 30 secondes
    gcTime: 60000, // Keep in cache for 1 minute
  });

  const handleRefresh = () => {
    validationService.clearCache('stats');
    refetch();
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
            <span className="ml-2">Chargement des statistiques...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const statsData = stats || { total: 0, en_validation: 0, valides: 0, rejetes: 0 };

  return (
    <Card className="transition-all duration-200 hover:shadow-md">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          Statut des Validations
        </CardTitle>
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
          <Button onClick={handleRefresh} variant="ghost" size="sm">
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-900">{statsData.total}</div>
            <div className="text-sm text-gray-600">Total</div>
          </div>
          
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="flex items-center justify-center gap-1 mb-1">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <div className="text-2xl font-bold text-green-800">{statsData.valides}</div>
            </div>
            <div className="text-sm text-green-600">Validés</div>
          </div>
          
          <div className="text-center p-3 bg-yellow-50 rounded-lg">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Clock className="w-4 h-4 text-yellow-500" />
              <div className="text-2xl font-bold text-yellow-800">{statsData.en_validation}</div>
            </div>
            <div className="text-sm text-yellow-600">En validation</div>
          </div>
          
          <div className="text-center p-3 bg-red-50 rounded-lg">
            <div className="flex items-center justify-center gap-1 mb-1">
              <XCircle className="w-4 h-4 text-red-500" />
              <div className="text-2xl font-bold text-red-800">{statsData.rejetes}</div>
            </div>
            <div className="text-sm text-red-600">Rejetés</div>
          </div>
        </div>
        
        {statsData.total > 0 && (
          <div className="mt-4 pt-3 border-t">
            <div className="flex justify-between text-xs text-gray-500 mb-2">
              <span>Progression</span>
              <span>{Math.round((statsData.valides / statsData.total) * 100)}% validés</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full transition-all duration-500" 
                style={{ width: `${(statsData.valides / statsData.total) * 100}%` }}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
