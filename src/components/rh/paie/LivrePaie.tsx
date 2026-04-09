import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const moisNoms = ['', 'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

export const LivrePaie = () => {
  const { data: bulletins, isLoading } = useQuery({
    queryKey: ['livre-paie'],
    queryFn: async () => {
      const { data, error } = await supabase.from('bulletins_paie')
        .select('*, employe:employes(nom, prenom), periode:periodes_paie(mois, annee)')
        .in('statut', ['valide', 'paye'])
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  const fmt = (n: any) => Number(n || 0).toLocaleString('fr-FR');

  // Grouper par période
  const grouped = (bulletins || []).reduce((acc: any, b: any) => {
    const key = b.periode ? `${moisNoms[b.periode.mois]} ${b.periode.annee}` : 'Sans période';
    if (!acc[key]) acc[key] = [];
    acc[key].push(b);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Livre de paie</h2>
      {isLoading ? <p className="text-muted-foreground">Chargement...</p>
      : Object.keys(grouped).length === 0 ? <p className="text-muted-foreground text-center py-8">Aucun bulletin validé</p>
      : Object.entries(grouped).map(([periode, items]: [string, any]) => {
        const totalBrut = items.reduce((s: number, b: any) => s + Number(b.salaire_brut), 0);
        const totalNet = items.reduce((s: number, b: any) => s + Number(b.net_a_payer), 0);
        const totalRetenues = items.reduce((s: number, b: any) => s + Number(b.total_retenues), 0);
        return (
          <Card key={periode}>
            <CardContent className="p-4">
              <h3 className="font-semibold mb-2">{periode}</h3>
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/50"><tr>
                  <th className="text-left p-2">Employé</th><th className="text-right p-2">Brut</th><th className="text-right p-2">Retenues</th><th className="text-right p-2">Net à payer</th>
                </tr></thead>
                <tbody>
                  {items.map((b: any) => (
                    <tr key={b.id} className="border-b">
                      <td className="p-2">{b.employe?.prenom} {b.employe?.nom}</td>
                      <td className="p-2 text-right">{fmt(b.salaire_brut)}</td>
                      <td className="p-2 text-right text-destructive">{fmt(b.total_retenues)}</td>
                      <td className="p-2 text-right font-semibold">{fmt(b.net_a_payer)}</td>
                    </tr>
                  ))}
                  <tr className="bg-muted/30 font-bold">
                    <td className="p-2">TOTAL</td>
                    <td className="p-2 text-right">{fmt(totalBrut)}</td>
                    <td className="p-2 text-right text-destructive">{fmt(totalRetenues)}</td>
                    <td className="p-2 text-right">{fmt(totalNet)}</td>
                  </tr>
                </tbody>
              </table>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
