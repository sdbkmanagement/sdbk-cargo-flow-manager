import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { LucideIcon } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  variation?: number;
  variationLabel?: string;
  subtitle?: string;
  color?: string;
}

export const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  icon: Icon,
  variation,
  variationLabel,
  subtitle,
  color = 'text-primary',
}) => {
  const getVariationColor = () => {
    if (variation === undefined || variation === null) return '';
    if (variation > 0) return 'text-emerald-600 bg-emerald-50';
    if (variation < 0) return 'text-red-600 bg-red-50';
    return 'text-muted-foreground bg-muted';
  };

  const VariationIcon = variation && variation > 0 ? TrendingUp : variation && variation < 0 ? TrendingDown : Minus;

  return (
    <Card className="relative overflow-hidden border border-border/50 hover:shadow-lg transition-all duration-300">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {title}
        </CardTitle>
        <div className={`p-2 rounded-lg bg-primary/10`}>
          <Icon className={`h-4 w-4 ${color}`} />
        </div>
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${color}`}>{value}</div>
        <div className="flex items-center justify-between mt-1">
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
          {variation !== undefined && variation !== null && (
            <Badge variant="secondary" className={`text-xs font-medium ${getVariationColor()} border-0`}>
              <VariationIcon className="h-3 w-3 mr-1" />
              {variation > 0 ? '+' : ''}{variation.toFixed(1)}%
              {variationLabel && <span className="ml-1">{variationLabel}</span>}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
