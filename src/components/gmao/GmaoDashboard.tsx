import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { gmaoService } from '@/services/gmao';
import {
  Wrench, AlertTriangle, ClipboardList, Package, Gauge, TrendingUp
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts';

export const GmaoDashboard: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let actif = true;
    const load = async () => {
      try {
        const d = await gmaoService.getDashboard();
        if (actif) setData(d);
      } catch (e) {
        console.error('Erreur dashboard GMAO', e);
      } finally {
        if (actif) setLoading(false);
      }
    };
    load();
    const i = setInterval(load, 60000);
    return () => { actif = false; clearInterval(i); };
  }, []);

  if (loading) return <p className="text-muted-foreground">Chargement des indicateurs…</p>;
  if (!data) return <p className="text-muted-foreground">Aucune donnée disponible.</p>;

  const kpis = [
    { label: 'Équipements', value: data.equipements, icon: Gauge },
    { label: 'En maintenance', value: data.equipementsEnMaintenance, icon: Wrench },
    { label: 'Demandes en attente', value: data.demandesEnAttente, icon: AlertTriangle },
    { label: 'OT ouverts', value: data.otOuverts, icon: ClipboardList },
    { label: 'OT en retard', value: data.otEnRetard, icon: AlertTriangle },
    { label: 'Pièces sous seuil', value: data.piecesSousSeuil, icon: Package },
    { label: 'Taux préventif', value: `${data.tauxPreventif} %`, icon: TrendingUp },
    { label: 'Coût total', value: `${Math.round(data.coutTotal).toLocaleString('fr-FR')} GNF`, icon: TrendingUp },
  ];

  const parMois: Record<string, number> = {};
  (data.ots || []).forEach((o: any) => {
    if (!o.date_planifiee && !o.date_debut) return;
    const d = new Date(o.date_debut || o.date_planifiee);
    const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    parMois[k] = (parMois[k] || 0) + Number(o.cout_total || 0);
  });
  const chart = Object.entries(parMois).sort().map(([mois, cout]) => ({ mois, cout }));

  return (
    <div className="space-y-6">
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => (
          <Card key={k.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <k.icon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{k.label}</p>
                <p className="text-xl font-bold">{k.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle>Coûts de maintenance par mois</CardTitle></CardHeader>
        <CardContent className="h-72">
          {chart.length === 0 ? (
            <p className="text-muted-foreground">Aucun coût enregistré pour le moment.</p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chart}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="mois" />
                <YAxis />
                <Tooltip formatter={(v: number) => `${Number(v).toLocaleString('fr-FR')} GNF`} />
                <Bar dataKey="cout" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
