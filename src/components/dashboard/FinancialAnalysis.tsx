import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart3, Fuel, Pickaxe, TrendingUp, TrendingDown } from 'lucide-react';

interface FinancialAnalysisProps {
  chiffreAffaires: number;
  caEnAttente: number;
  totalMaintenance: number;
  caMoisActuel: number;
  caMoisPrecedent: number;
  caHydrocarbures: number;
  caBauxite: number;
}

const formatGNF = (value: number) => {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(2)} Md`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)} M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)} K`;
  return value.toLocaleString('fr-FR');
};

export const FinancialAnalysis: React.FC<FinancialAnalysisProps> = ({
  chiffreAffaires,
  caEnAttente,
  totalMaintenance,
  caMoisActuel,
  caMoisPrecedent,
  caHydrocarbures,
  caBauxite,
}) => {
  const profitNet = chiffreAffaires - totalMaintenance;
  const variationMois = caMoisPrecedent > 0 ? ((caMoisActuel - caMoisPrecedent) / caMoisPrecedent) * 100 : 0;
  const totalCA = caHydrocarbures + caBauxite;
  const pctHydro = totalCA > 0 ? (caHydrocarbures / totalCA) * 100 : 0;
  const pctBauxite = totalCA > 0 ? (caBauxite / totalCA) * 100 : 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          Analyse Financière
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Profit Net */}
        <div className="p-4 rounded-lg bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border border-emerald-200 dark:border-emerald-800">
          <p className="text-xs font-medium text-muted-foreground uppercase">Profit Net</p>
          <p className={`text-2xl font-bold ${profitNet >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            {formatGNF(profitNet)} GNF
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            CA: {formatGNF(chiffreAffaires)} − Maintenance: {formatGNF(totalMaintenance)}
          </p>
        </div>

        {/* Variation mensuelle */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
          <div>
            <p className="text-xs text-muted-foreground">Variation mensuelle</p>
            <p className="text-sm font-medium">
              {formatGNF(caMoisActuel)} GNF <span className="text-xs text-muted-foreground">ce mois</span>
            </p>
          </div>
          <Badge
            variant="secondary"
            className={`${variationMois >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'} border-0`}
          >
            {variationMois >= 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
            {variationMois >= 0 ? '+' : ''}{variationMois.toFixed(1)}%
          </Badge>
        </div>

        {/* Répartition par activité */}
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2 uppercase">Rentabilité par activité</p>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Fuel className="h-4 w-4 text-amber-500" />
              <span className="text-sm flex-1">Hydrocarbures</span>
              <span className="text-sm font-semibold">{formatGNF(caHydrocarbures)} GNF</span>
              <Badge variant="outline" className="text-xs">{pctHydro.toFixed(0)}%</Badge>
            </div>
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-amber-500 rounded-full" style={{ width: `${pctHydro}%` }} />
            </div>
            
            <div className="flex items-center gap-2 mt-2">
              <Pickaxe className="h-4 w-4 text-stone-500" />
              <span className="text-sm flex-1">Bauxite</span>
              <span className="text-sm font-semibold">{formatGNF(caBauxite)} GNF</span>
              <Badge variant="outline" className="text-xs">{pctBauxite.toFixed(0)}%</Badge>
            </div>
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-stone-500 rounded-full" style={{ width: `${pctBauxite}%` }} />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
