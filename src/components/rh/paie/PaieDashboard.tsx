import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Users, Clock, CalendarOff, Wallet, AlertTriangle, TrendingUp } from 'lucide-react';

export const PaieDashboard = () => {
  const { data: stats } = useQuery({
    queryKey: ['paie-dashboard-stats'],
    queryFn: async () => {
      const [{ data: employes }, { data: bulletins }, { data: prets }, { data: periodes }] = await Promise.all([
        supabase.from('employes').select('id').eq('statut', 'actif'),
        supabase.from('bulletins_paie').select('salaire_brut, net_a_payer, total_retenues, statut'),
        supabase.from('prets').select('solde_restant').eq('statut', 'en_cours'),
        supabase.from('periodes_paie').select('*').eq('statut', 'ouverte').limit(1),
      ]);

      const masseSalariale = bulletins?.reduce((s, b) => s + Number(b.salaire_brut || 0), 0) || 0;
      const totalNet = bulletins?.reduce((s, b) => s + Number(b.net_a_payer || 0), 0) || 0;
      const totalRetenues = bulletins?.reduce((s, b) => s + Number(b.total_retenues || 0), 0) || 0;
      const soldePrets = prets?.reduce((s, p) => s + Number(p.solde_restant || 0), 0) || 0;

      return {
        effectif: employes?.length || 0,
        masseSalariale,
        totalNet,
        totalRetenues,
        soldePrets,
        bulletinsEnAttente: bulletins?.filter(b => b.statut === 'brouillon').length || 0,
        periodeOuverte: periodes?.[0] || null,
      };
    }
  });

  const fmt = (n: number) => Number(n).toLocaleString('fr-FR');

  const cards = [
    { label: 'Effectif actif', value: stats?.effectif || 0, icon: Users, color: 'text-primary' },
    { label: 'Masse salariale', value: `${fmt(stats?.masseSalariale || 0)} GNF`, icon: Wallet, color: 'text-green-600' },
    { label: 'Total Net', value: `${fmt(stats?.totalNet || 0)} GNF`, icon: TrendingUp, color: 'text-blue-600' },
    { label: 'Total Retenues', value: `${fmt(stats?.totalRetenues || 0)} GNF`, icon: AlertTriangle, color: 'text-orange-600' },
    { label: 'Solde Prêts', value: `${fmt(stats?.soldePrets || 0)} GNF`, icon: CalendarOff, color: 'text-red-600' },
    { label: 'Bulletins brouillon', value: stats?.bulletinsEnAttente || 0, icon: Clock, color: 'text-yellow-600' },
  ];

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Tableau de bord Paie</h2>
      <div className="grid grid-cols-3 gap-4">
        {cards.map((c, i) => (
          <Card key={i}>
            <CardContent className="p-4 flex items-center gap-3">
              <c.icon className={`w-8 h-8 ${c.color}`} />
              <div>
                <p className="text-sm text-muted-foreground">{c.label}</p>
                <p className="text-lg font-bold">{c.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
