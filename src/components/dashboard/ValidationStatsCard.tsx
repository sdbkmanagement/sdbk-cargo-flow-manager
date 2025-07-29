
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { validationService } from '@/services/validation';
import { Button } from '@/components/ui/button';

export const ValidationStatsCard = () => {
  const { data: stats, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['validation-stats-dashboard'],
    queryFn: validationService.getStatistiquesGlobales,
    refetchInterval: 15000,
    staleTime: 0,
  });

  const handleRefresh = async () => {
    console.log('🔄 Actualisation manuelle des statistiques de validation (dashboard)');
    validationService.clearCache('stats');
    await refetch();
  };

  if (isLoading) {
    return (
      <Card className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
            <span className="ml-2 text-white">Chargement...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const validationStats = stats || { total: 0, en_validation: 0, valides: 0, rejetes: 0 };

  console.log('📊 ValidationStatsCard - Statistiques:', validationStats);

  return (
    <Card className="bg-gradient-to-r from-blue-500 to-purple-600 text-white transition-all duration-200 hover:shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-6 h-6" />
            <Button 
              onClick={handleRefresh} 
              variant="ghost" 
              size="sm"
              disabled={isRefetching}
              className="h-8 w-8 p-0 text-white hover:bg-white/20"
            >
              <RefreshCw className={`w-4 h-4 ${isRefetching ? 'animate-spin' : ''}`} />
            </Button>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-full px-3 py-1 inline-block mt-2">
            <span className="text-lg font-bold">{validationStats.en_validation} en attente</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <h3 className="text-xl font-semibold text-white">Validations</h3>
          <p className="text-white/80 text-sm">Workflows validation véhicules</p>
          
          <div className="grid grid-cols-3 gap-2 mt-4 text-xs">
            <div className="text-center">
              <div className="text-lg font-bold">{validationStats.total}</div>
              <div className="text-white/70">Total</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold">{validationStats.valides}</div>
              <div className="text-white/70">Validés</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold">{validationStats.rejetes}</div>
              <div className="text-white/70">Rejetés</div>
            </div>
          </div>
        </div>

        {/* Debug info pour le développement */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-2 p-2 bg-black/20 rounded text-xs">
            <div>Dashboard - Dernière actualisation: {new Date().toLocaleTimeString()}</div>
            <div>En validation: {validationStats.en_validation} | Validés: {validationStats.valides}</div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
