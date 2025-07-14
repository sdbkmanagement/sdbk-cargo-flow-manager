
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Clock } from 'lucide-react';
import type { StatutEtape } from '@/services/validation';

interface ValidationStatusBadgeProps {
  statut: StatutEtape;
  size?: 'sm' | 'md';
}

export const ValidationStatusBadge = ({ statut, size = 'md' }: ValidationStatusBadgeProps) => {
  const iconSize = size === 'sm' ? 'w-3 h-3' : 'w-4 h-4';
  
  switch (statut) {
    case 'valide':
      return (
        <Badge variant="success" className="px-2 py-1">
          <CheckCircle className={`${iconSize} mr-1`} />
          V
        </Badge>
      );
    case 'rejete':
      return (
        <Badge variant="error" className="px-2 py-1">
          <XCircle className={`${iconSize} mr-1`} />
          R
        </Badge>
      );
    case 'en_attente':
    default:
      return (
        <Badge variant="warning" className="px-2 py-1">
          <Clock className={`${iconSize} mr-1`} />
          E
        </Badge>
      );
  }
};
