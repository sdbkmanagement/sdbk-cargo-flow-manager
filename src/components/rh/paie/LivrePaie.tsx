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
        const sum = (field: string) => items.reduce((s: number, b: any) => s + Number(b[field] || 0), 0);
        const totalBase = sum('salaire_base');
        const totalTransport = sum('prime_transport');
        const totalLogement = sum('prime_logement');
        const totalCherte = sum('prime_cherete_vie');
        const totalAutresPrimes = sum('autres_primes');
        const totalCnssSalarie = items.reduce((s: number, b: any) => s + Number(b.cotisation_cnss_employe || 0), 0);
        const totalPatronal = items.reduce((s: number, b: any) => s + Number(b.cotisation_cnss_employeur || 0), 0);
        const totalBaseRts = sum('base_rts');
        const totalRts = items.reduce((s: number, b: any) => s + Number(b.rts ?? b.irg ?? 0), 0);
        const totalAvance = sum('avance_salaire');
        const totalManquant = sum('manquant');
        const totalComplement = sum('complement_mois_precedent');
        const totalOnfpp = items.reduce((s: number, b: any) => s + Number(b.onfpp || 0), 0);
        const totalVf = items.reduce((s: number, b: any) => s + Number(b.versement_forfaitaire || 0), 0);
        return (
          <Card key={periode}>
            <CardContent className="p-4 overflow-x-auto">
              <h3 className="font-semibold mb-2">{periode}</h3>
              <table className="w-max min-w-full text-sm whitespace-nowrap">
                <thead className="border-b bg-muted/50"><tr>
                  <th className="text-left p-2">Personnel</th><th className="text-right p-2">Salaire Base</th><th className="text-right p-2">P. transport</th><th className="text-right p-2">P. de Logement</th><th className="text-right p-2">Prime de cherté de vie</th><th className="text-right p-2">Autres primes et indemnité</th><th className="text-right p-2">Salaire Brut</th><th className="text-right p-2">CNSS1 (5%)</th><th className="text-right p-2">CNSS (18%)</th><th className="text-right p-2">Base d'imposition RTS</th><th className="text-right p-2">RTS net</th><th className="text-right p-2">Salaire net</th><th className="text-right p-2">Avance sur Salaire</th><th className="text-right p-2">Manquant</th><th className="text-right p-2">Complément Salaire Mois Précédent</th><th className="text-right p-2">ONFPP</th><th className="text-right p-2">VF</th>
                </tr></thead>
                <tbody>
                  {items.map((b: any) => (
                    <tr key={b.id} className="border-b">
                      <td className="p-2">{b.employe?.prenom} {b.employe?.nom}</td>
                      <td className="p-2 text-right">{fmt(b.salaire_base)}</td>
                      <td className="p-2 text-right">{fmt(b.prime_transport)}</td>
                      <td className="p-2 text-right">{fmt(b.prime_logement)}</td>
                      <td className="p-2 text-right">{fmt(b.prime_cherete_vie)}</td>
                      <td className="p-2 text-right">{fmt(b.autres_primes)}</td>
                      <td className="p-2 text-right">{fmt(b.salaire_brut)}</td>
                      <td className="p-2 text-right">{fmt(b.cotisation_cnss_employe)}</td>
                      <td className="p-2 text-right">{fmt(b.cotisation_cnss_employeur)}</td>
                      <td className="p-2 text-right">{fmt(b.base_rts)}</td>
                      <td className="p-2 text-right">{fmt(b.rts ?? b.irg)}</td>
                      <td className="p-2 text-right font-semibold">{fmt(b.net_a_payer)}</td>
                      <td className="p-2 text-right">{fmt(b.avance_salaire)}</td>
                      <td className="p-2 text-right">{fmt(b.manquant)}</td>
                      <td className="p-2 text-right">{fmt(b.complement_mois_precedent)}</td>
                      <td className="p-2 text-right">{fmt(b.onfpp)}</td>
                      <td className="p-2 text-right">{fmt(b.versement_forfaitaire)}</td>
                    </tr>
                  ))}
                  <tr className="bg-muted/30 font-bold">
                    <td className="p-2">TOTAL</td>
                    <td className="p-2 text-right">{fmt(totalBase)}</td>
                    <td className="p-2 text-right">{fmt(totalTransport)}</td>
                    <td className="p-2 text-right">{fmt(totalLogement)}</td>
                    <td className="p-2 text-right">{fmt(totalCherte)}</td>
                    <td className="p-2 text-right">{fmt(totalAutresPrimes)}</td>
                    <td className="p-2 text-right">{fmt(totalBrut)}</td>
                    <td className="p-2 text-right">{fmt(totalCnssSalarie)}</td>
                    <td className="p-2 text-right">{fmt(totalPatronal)}</td>
                    <td className="p-2 text-right">{fmt(totalBaseRts)}</td>
                    <td className="p-2 text-right">{fmt(totalRts)}</td>
                    <td className="p-2 text-right">{fmt(totalNet)}</td>
                    <td className="p-2 text-right">{fmt(totalAvance)}</td>
                    <td className="p-2 text-right">{fmt(totalManquant)}</td>
                    <td className="p-2 text-right">{fmt(totalComplement)}</td>
                    <td className="p-2 text-right">{fmt(totalOnfpp)}</td>
                    <td className="p-2 text-right">{fmt(totalVf)}</td>
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
