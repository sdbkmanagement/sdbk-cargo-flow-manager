
import React from 'react';
import { LucideIcon } from 'lucide-react';
import { ModernCard } from '@/components/ui/modern-card';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
  className?: string;
}

const colorClasses = {
  blue: 'text-blue-600 bg-blue-100',
  green: 'text-green-600 bg-green-100',
  yellow: 'text-yellow-600 bg-yellow-100',
  red: 'text-red-600 bg-red-100',
  purple: 'text-purple-600 bg-purple-100'
};

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon: Icon,
  trend,
  color = 'blue',
  className
}) => {
  return (
    <ModernCard className={cn("p-4 sm:p-6", className)}>
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm sm:text-base font-medium text-muted-foreground truncate">
            {title}
          </p>
          <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground mt-1">
            {value}
          </p>
          {trend && (
            <p className={cn(
              "text-xs sm:text-sm mt-2 flex items-center gap-1",
              trend.isPositive ? "text-green-600" : "text-red-600"
            )}>
              <span>{trend.isPositive ? '+' : ''}{trend.value}%</span>
              <span className="text-muted-foreground">vs mois dernier</span>
            </p>
          )}
        </div>
        <div className={cn(
          "p-2 sm:p-3 rounded-lg flex-shrink-0 ml-3",
          colorClasses[color]
        )}>
          <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
        </div>
      </div>
    </ModernCard>
  );
};
