
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
          className: 'bg-green-100 text-green-800 border-green-200',
          icon: CheckCircle
        };
      case 'en_validation':
        return {
          label: 'En validation',
          className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
          icon: Clock
        };
      case 'rejete':
        return {
          label: 'Rejeté',
          className: 'bg-red-100 text-red-800 border-red-200',
          icon: XCircle
        };
      case 'disponible':
        return {
          label: 'Disponible',
          className: 'bg-blue-100 text-blue-800 border-blue-200',
          icon: CheckCircle
        };
      default:
        return {
          label: status,
          className: 'bg-gray-100 text-gray-800 border-gray-200',
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
