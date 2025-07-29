
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Clock, BarChart3, RefreshCw, AlertCircle } from 'lucide-react';
import { validationService } from '@/services/validation';
import { toast } from '@/hooks/use-toast';

export const ValidationStats = () => {
  const { 
    data: stats, 
    isLoading, 
    error, 
    refetch,
    isRefetching 
  } = useQuery({
    queryKey: ['validation-stats'],
    queryFn: validationService.getStatistiquesGlobales,
    staleTime: 10000, // Les données sont considérées comme fraîches pendant 10 secondes
    gcTime: 30000, // Garder en cache pendant 30 secondes
    refetchOnWindowFocus: true, // Rafraîchir quand la fenêtre reprend le focus
    refetchInterval: 30000, // Rafraîchir automatiquement toutes les 30 secondes
  });

  const handleRefresh = async () => {
    console.log('🔄 Actualisation manuelle des statistiques demandée');
    validationService.clearCache('stats');
    
    try {
      await refetch();
      toast({
        title: "Statistiques actualisées",
        description: "Les données ont été synchronisées avec la base de données",
      });
    } catch (error) {
      console.error('❌ Erreur lors de l\'actualisation:', error);
      toast({
        title: "Erreur d'actualisation",
        description: "Impossible de récupérer les dernières données",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
            <span className="ml-2">Synchronisation des statistiques...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-center text-red-600">
            <AlertCircle className="h-5 w-5 mr-2" />
            <span>Erreur lors du chargement des statistiques</span>
            <Button onClick={handleRefresh} variant="outline" size="sm" className="ml-4">
              <RefreshCw className="w-4 h-4 mr-2" />
              Réessayer
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const statsData = stats || { total: 0, en_validation: 0, valides: 0, rejetes: 0 };

  // Vérification de cohérence des données
  const somme = statsData.en_validation + statsData.valides + statsData.rejetes;
  const isInconsistent = somme !== statsData.total;

  console.log('📊 Affichage des statistiques:', statsData);

  return (
    <Card className="transition-all duration-200 hover:shadow-md">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center space-x-2">
          <CardTitle className="text-sm font-medium">
            Statut des Validations
          </CardTitle>
          {isInconsistent && (
            <AlertCircle className="h-4 w-4 text-amber-500" title="Incohérence détectée dans les données" />
          )}
        </div>
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
          <Button 
            onClick={handleRefresh} 
            variant="ghost" 
            size="sm"
            disabled={isRefetching}
          >
            <RefreshCw className={`w-4 h-4 ${isRefetching ? 'animate-spin' : ''}`} />
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

        {/* Indicateur de dernière mise à jour */}
        <div className="mt-3 pt-2 border-t text-xs text-gray-400 text-center">
          Données synchronisées en temps réel
          {isInconsistent && (
            <div className="text-amber-600 mt-1">
              ⚠️ Incohérence détectée (somme: {somme}, total: {statsData.total})
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
