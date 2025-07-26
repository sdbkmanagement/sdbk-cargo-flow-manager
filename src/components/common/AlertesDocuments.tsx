
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, FileText, Calendar } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const AlertesDocuments = () => {
  // Optimisation : une seule requête pour toutes les alertes documents
  const { data: alertes, isLoading } = useQuery({
    queryKey: ['alertes-documents'],
    queryFn: async () => {
      console.log('Fetching document alerts...');
      
      // Requêtes directes aux tables avec RLS au lieu des vues supprimées
      const [vehiculesResponse, chauffeursResponse] = await Promise.all([
        // Documents de véhicules qui expirent bientôt
        supabase
          .from('documents_vehicules')
          .select('*, vehicules!inner(numero)')
          .not('date_expiration', 'is', null)
          .lte('date_expiration', new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
          .order('date_expiration', { ascending: true }),
        
        // Documents de chauffeurs qui expirent bientôt  
        supabase
          .from('documents')
          .select('*, chauffeurs!inner(nom, prenom)')
          .eq('entity_type', 'chauffeur')
          .not('date_expiration', 'is', null)
          .lte('date_expiration', new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
          .order('date_expiration', { ascending: true })
      ]);

      const alertesVehicules = (vehiculesResponse.data || []).map(doc => ({
        ...doc,
        jours_restants: Math.ceil((new Date(doc.date_expiration).getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
        vehicule_numero: doc.vehicules?.numero
      }));

      const alertesChauffeurs = (chauffeursResponse.data || []).map(doc => ({
        ...doc,
        jours_restants: Math.ceil((new Date(doc.date_expiration).getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
        chauffeur_nom: `${doc.chauffeurs?.prenom} ${doc.chauffeurs?.nom}`
      }));
      
      const totalAlertes = alertesVehicules.length + alertesChauffeurs.length;
      const alertesCritiques = [...alertesVehicules, ...alertesChauffeurs]
        .filter(a => a.jours_restants <= 7).length;

      console.log(`Document alerts loaded: ${totalAlertes} total, ${alertesCritiques} critical`);

      return {
        vehicules: alertesVehicules,
        chauffeurs: alertesChauffeurs,
        total: totalAlertes,
        critiques: alertesCritiques
      };
    },
    staleTime: 5 * 60 * 1000, // Cache 5 minutes
    enabled: true
  });

  if (isLoading) {
    return (
      <Card className="brand-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Alertes documentaires
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!alertes || alertes.total === 0) {
    return (
      <Card className="brand-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-brand-darkText">
            <div className="p-2 bg-green-50 rounded-lg">
              <FileText className="h-5 w-5 text-green-600" />
            </div>
            Alertes documentaires
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="text-green-600 mr-3">✓</div>
            <p className="text-sm text-green-800">Tous les documents sont à jour</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="brand-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-brand-darkText">
          <div className="p-2 bg-orange-50 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
          </div>
          Alertes documentaires
          {alertes.critiques > 0 && (
            <span className="brand-status-badge status-warning ml-2">
              {alertes.critiques} critique{alertes.critiques > 1 ? 's' : ''}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {alertes.critiques > 0 && (
          <div className="p-4 border-l-4 border-red-500 bg-red-50 rounded-r-lg">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
              <p className="text-sm font-medium text-red-800">
                {alertes.critiques} document{alertes.critiques > 1 ? 's' : ''} expire{alertes.critiques > 1 ? 'nt' : ''} dans moins de 7 jours
              </p>
            </div>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {alertes.vehicules.length > 0 && (
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center mb-2">
                <Calendar className="h-4 w-4 text-brand-blue mr-2" />
                <p className="text-sm font-medium text-blue-800">Documents véhicules</p>
              </div>
              <p className="text-sm text-blue-700">
                {alertes.vehicules.length} document{alertes.vehicules.length > 1 ? 's' : ''} à renouveler
              </p>
            </div>
          )}
          
          {alertes.chauffeurs.length > 0 && (
            <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
              <div className="flex items-center mb-2">
                <Calendar className="h-4 w-4 text-purple-600 mr-2" />
                <p className="text-sm font-medium text-purple-800">Documents chauffeurs</p>
              </div>
              <p className="text-sm text-purple-700">
                {alertes.chauffeurs.length} document{alertes.chauffeurs.length > 1 ? 's' : ''} à renouveler
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
