
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle, XCircle, Database, Users, RefreshCw } from 'lucide-react';

interface Chauffeur {
  id: string;
  nom: string;
  prenom: string;
  telephone: string;
  statut: string;
  type_permis: string[];
}

export const SupabaseTest = () => {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [chauffeurs, setChauffeurs] = useState<Chauffeur[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const testConnection = async () => {
    setIsLoading(true);
    try {
      // Test de connexion basique
      const { data, error } = await supabase
        .from('chauffeurs')
        .select('id, nom, prenom, telephone, statut, type_permis')
        .limit(5);

      if (error) {
        console.error('Erreur de connexion:', error);
        setIsConnected(false);
        toast({
          title: "Erreur de connexion",
          description: error.message,
          variant: "destructive",
        });
      } else {
        setIsConnected(true);
        setChauffeurs(data || []);
        toast({
          title: "Connexion réussie !",
          description: `${data?.length || 0} chauffeurs trouvés`,
        });
      }
    } catch (err) {
      console.error('Erreur:', err);
      setIsConnected(false);
      toast({
        title: "Erreur",
        description: "Impossible de se connecter à Supabase",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addTestChauffeur = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('chauffeurs')
        .insert([{
          nom: 'Test',
          prenom: 'Utilisateur',
          telephone: '0123456789',
          numero_permis: 'TEST123',
          type_permis: ['B'],
          date_expiration_permis: '2025-12-31',
          statut: 'actif'
        }])
        .select()
        .single();

      if (error) {
        toast({
          title: "Erreur",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Chauffeur créé !",
          description: "Le chauffeur de test a été ajouté",
        });
        testConnection(); // Recharger la liste
      }
    } catch (err) {
      console.error('Erreur lors de la création:', err);
      toast({
        title: "Erreur",
        description: "Impossible de créer le chauffeur",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    testConnection();
  }, []);

  const getStatutBadge = (statut: string) => {
    const variants = {
      'actif': 'default',
      'conge': 'secondary',
      'maladie': 'destructive',
      'suspendu': 'destructive'
    };
    
    return (
      <Badge variant={variants[statut] || 'secondary'}>
        {statut.charAt(0).toUpperCase() + statut.slice(1)}
      </Badge>
    );
  };

  return (
    <div className="space-y-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Test de connexion Supabase
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                {isConnected === null ? (
                  <RefreshCw className="w-5 h-5 animate-spin text-blue-500" />
                ) : isConnected ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-500" />
                )}
                <span className="font-medium">
                  État de la connexion: {
                    isConnected === null ? 'Test en cours...' :
                    isConnected ? 'Connecté' : 'Échec'
                  }
                </span>
              </div>
              
              <Button 
                onClick={testConnection}
                disabled={isLoading}
                variant="outline"
                size="sm"
              >
                {isLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <RefreshCw className="w-4 h-4 mr-2" />
                )}
                Tester à nouveau
              </Button>

              <Button 
                onClick={addTestChauffeur}
                disabled={isLoading || !isConnected}
                size="sm"
              >
                Ajouter un chauffeur test
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {isConnected && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Chauffeurs dans la base de données ({chauffeurs.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {chauffeurs.length === 0 ? (
              <p className="text-gray-500">Aucun chauffeur trouvé</p>
            ) : (
              <div className="space-y-3">
                {chauffeurs.map((chauffeur) => (
                  <div key={chauffeur.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">
                        {chauffeur.prenom} {chauffeur.nom}
                      </div>
                      <div className="text-sm text-gray-500">
                        {chauffeur.telephone}
                      </div>
                      <div className="flex gap-1 mt-1">
                        {chauffeur.type_permis.map(permis => (
                          <Badge key={permis} variant="outline" className="text-xs">
                            {permis}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      {getStatutBadge(chauffeur.statut)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
