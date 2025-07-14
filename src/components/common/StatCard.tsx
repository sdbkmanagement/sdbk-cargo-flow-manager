
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    label: string;
    isPositive: boolean;
  };
  color?: 'green' | 'blue' | 'red' | 'yellow' | 'purple';
  className?: string;
}

export const StatCard = ({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  trend, 
  color = 'blue',
  className 
}: StatCardProps) => {
  const colorClasses = {
    green: 'text-sdbk-green bg-green-50 border-green-100',
    blue: 'text-sdbk-blue bg-blue-50 border-blue-100',
    red: 'text-sdbk-red bg-red-50 border-red-100',
    yellow: 'text-yellow-600 bg-yellow-50 border-yellow-100',
    purple: 'text-purple-600 bg-purple-50 border-purple-100'
  };

  const iconBgClasses = {
    green: 'bg-sdbk-green shadow-sdbk-green',
    blue: 'bg-sdbk-blue shadow-sdbk-blue',
    red: 'bg-sdbk-red shadow-sdbk-red',
    yellow: 'bg-yellow-500 shadow-yellow-500/25',
    purple: 'bg-purple-500 shadow-purple-500/25'
  };

  return (
    <Card className={cn(
      "sdbk-card hover:scale-105 transition-all duration-300 cursor-pointer border-l-4",
      color === 'green' && 'border-l-sdbk-green',
      color === 'blue' && 'border-l-sdbk-blue',
      color === 'red' && 'border-l-sdbk-red',
      color === 'yellow' && 'border-l-yellow-500',
      color === 'purple' && 'border-l-purple-500',
      className
    )}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
            <div className="flex items-baseline space-x-2">
              <p className="text-3xl font-bold text-gray-900">{value}</p>
              {trend && (
                <span className={cn(
                  "text-sm font-medium px-2 py-1 rounded-full",
                  trend.isPositive 
                    ? "text-sdbk-green bg-green-100" 
                    : "text-sdbk-red bg-red-100"
                )}>
                  {trend.isPositive ? '+' : ''}{trend.value}%
                </span>
              )}
            </div>
            {subtitle && (
              <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
            )}
            {trend && (
              <p className="text-xs text-gray-400 mt-2">{trend.label}</p>
            )}
          </div>
          <div className={cn(
            "p-3 rounded-xl text-white",
            iconBgClasses[color]
          )}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
