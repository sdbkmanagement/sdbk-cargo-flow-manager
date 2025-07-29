
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, XCircle, AlertTriangle } from 'lucide-react';

interface ValidationStatusBadgeProps {
  statut: string;
  size?: 'sm' | 'md';
}

export const ValidationStatusBadge = ({ statut, size = 'md' }: ValidationStatusBadgeProps) => {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'valide':
        return {
          label: 'Validé',
          className: 'bg-green-500 text-white border-green-500 hover:bg-green-600',
          icon: CheckCircle
        };
      case 'en_validation':
        return {
          label: 'En validation',
          className: 'bg-orange-500 text-white border-orange-500 hover:bg-orange-600',
          icon: Clock
        };
      case 'rejete':
        return {
          label: 'Rejeté',
          className: 'bg-red-500 text-white border-red-500 hover:bg-red-600',
          icon: XCircle
        };
      case 'disponible':
        return {
          label: 'Disponible',
          className: 'bg-green-500 text-white border-green-500 hover:bg-green-600',
          icon: CheckCircle
        };
      case 'en_mission':
        return {
          label: 'En mission',
          className: 'bg-blue-500 text-white border-blue-500 hover:bg-blue-600',
          icon: Clock
        };
      case 'maintenance':
        return {
          label: 'Maintenance',
          className: 'bg-yellow-500 text-white border-yellow-500 hover:bg-yellow-600',
          icon: AlertTriangle
        };
      case 'validation_requise':
        return {
          label: 'Validation requise',
          className: 'bg-purple-500 text-white border-purple-500 hover:bg-purple-600',
          icon: AlertTriangle
        };
      default:
        return {
          label: status,
          className: 'bg-gray-500 text-white border-gray-500 hover:bg-gray-600',
          icon: AlertTriangle
        };
    }
  };

  const config = getStatusConfig(statut);
  const Icon = config.icon;
  const iconSize = size === 'sm' ? 'w-3 h-3' : 'w-4 h-4';

  return (
    <Badge 
      className={`${config.className} flex items-center gap-1 ${size === 'sm' ? 'text-xs px-2 py-1' : 'text-sm px-3 py-1'}`}
    >
      <Icon className={iconSize} />
      {config.label}
    </Badge>
  );
};
