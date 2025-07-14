
import React from 'react';
import { ModernCard } from '@/components/ui/modern-card';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: 'primary' | 'success' | 'warning' | 'danger' | 'info';
  onClick?: () => void;
}

const colorVariants = {
  primary: {
    bg: 'bg-primary/10',
    text: 'text-primary',
    border: 'border-primary/20'
  },
  success: {
    bg: 'bg-success/10',
    text: 'text-success',
    border: 'border-success/20'
  },
  warning: {
    bg: 'bg-warning/10',
    text: 'text-warning',
    border: 'border-warning/20'
  },
  danger: {
    bg: 'bg-destructive/10',
    text: 'text-destructive',
    border: 'border-destructive/20'
  },
  info: {
    bg: 'bg-info/10',
    text: 'text-info',
    border: 'border-info/20'
  }
};

export const ModernStatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  color = 'primary',
  onClick
}) => {
  const colorScheme = colorVariants[color];

  return (
    <ModernCard 
      variant={onClick ? "interactive" : "default"}
      className={cn("relative overflow-hidden", onClick && "cursor-pointer")}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-foreground">{value}</span>
            {trend && (
              <span className={cn(
                "text-xs font-medium px-1.5 py-0.5 rounded-full",
                trend.isPositive ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
              )}>
                {trend.isPositive ? '+' : ''}{trend.value}%
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          )}
        </div>

        {Icon && (
          <div className={cn(
            "p-3 rounded-xl border",
            colorScheme.bg,
            colorScheme.border
          )}>
            <Icon className={cn("w-6 h-6", colorScheme.text)} />
          </div>
        )}
      </div>

      {/* Effet de gradient subtil */}
      <div className={cn(
        "absolute top-0 right-0 w-24 h-24 opacity-5 -translate-y-6 translate-x-6",
        colorScheme.bg
      )} style={{borderRadius: '50%'}} />
    </ModernCard>
  );
};

// Grid de stats responsive
export const StatsGrid: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
    {children}
  </div>
);
