import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Save } from 'lucide-react';
import { useState, useEffect } from 'react';

export const ConfigPaie = () => {
  const queryClient = useQueryClient();
  const [values, setValues] = useState<Record<string, string>>({});

  const { data: config, isLoading } = useQuery({
    queryKey: ['config-paie'],
    queryFn: async () => {
      const { data, error } = await supabase.from('config_paie').select('*').order('categorie');
      if (error) throw error;
      return data;
    }
  });

  useEffect(() => {
    if (config) {
      const v: Record<string, string> = {};
      config.forEach(c => { v[c.cle] = c.valeur; });
      setValues(v);
    }
  }, [config]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      for (const [cle, valeur] of Object.entries(values)) {
        const { error } = await supabase.from('config_paie').update({ valeur }).eq('cle', cle);
        if (error) throw error;
      }
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['config-paie'] }); toast({ title: 'Configuration sauvegardée' }); },
    onError: (e: any) => toast({ title: 'Erreur', description: e.message, variant: 'destructive' })
  });

  const categories = [...new Set(config?.map(c => c.categorie) || [])];
  const catLabels: Record<string, string> = { cnss: 'CNSS', general: 'Général', heures_sup: 'Heures supplémentaires' };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Configuration Paie</h2>
        <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}><Save className="w-4 h-4 mr-2" />Sauvegarder</Button>
      </div>

      {isLoading ? <p className="text-muted-foreground">Chargement...</p> : categories.map(cat => (
        <Card key={cat}>
          <CardContent className="p-4">
            <h3 className="font-semibold mb-3">{catLabels[cat || ''] || cat}</h3>
            <div className="grid grid-cols-2 gap-3">
              {config?.filter(c => c.categorie === cat).map(c => (
                <div key={c.cle}>
                  <Label className="text-xs text-muted-foreground">{c.description || c.cle}</Label>
                  <Input value={values[c.cle] || ''} onChange={e => setValues({...values, [c.cle]: e.target.value})} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
