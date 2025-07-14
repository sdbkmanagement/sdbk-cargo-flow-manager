
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const ConnectionTest = () => {
  const [connectionStatus, setConnectionStatus] = useState<'testing' | 'success' | 'error'>('testing');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const testConnection = async () => {
    setConnectionStatus('testing');
    try {
      console.log('🔍 Test de connexion Supabase...');
      
      // Test simple de connexion
      const { data, error } = await supabase.from('vehicules').select('count', { count: 'exact', head: true });
      
      if (error) {
        console.error('❌ Erreur de connexion:', error);
        setErrorMessage(error.message);
        setConnectionStatus('error');
      } else {
        console.log('✅ Connexion réussie');
        setConnectionStatus('success');
      }
    } catch (error: any) {
      console.error('❌ Exception lors du test:', error);
      setErrorMessage(error.message || 'Erreur inconnue');
      setConnectionStatus('error');
    }
  };

  useEffect(() => {
    testConnection();
  }, []);

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Test de connexion</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${
            connectionStatus === 'testing' ? 'bg-yellow-500 animate-pulse' :
            connectionStatus === 'success' ? 'bg-green-500' : 'bg-red-500'
          }`} />
          <span>
            {connectionStatus === 'testing' && 'Test en cours...'}
            {connectionStatus === 'success' && 'Connexion réussie'}
            {connectionStatus === 'error' && 'Erreur de connexion'}
          </span>
        </div>
        
        {errorMessage && (
          <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
            {errorMessage}
          </div>
        )}
        
        <Button onClick={testConnection} variant="outline" className="w-full">
          Retester la connexion
        </Button>
      </CardContent>
    </Card>
  );
};
