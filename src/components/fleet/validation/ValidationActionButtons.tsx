
import React from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Clock } from 'lucide-react';
import type { StatutEtape } from '@/services/validation';

interface ValidationActionButtonsProps {
  currentStatus: StatutEtape;
  onStatusChange: (status: StatutEtape) => void;
  isLoading: boolean;
}

export const ValidationActionButtons = ({ 
  currentStatus, 
  onStatusChange, 
  isLoading 
}: ValidationActionButtonsProps) => {
  return (
    <div className="flex gap-1">
      <Button
        size="sm"
        variant={currentStatus === 'valide' ? 'default' : 'outline'}
        className={`px-2 py-1 h-auto min-w-0 ${
          currentStatus === 'valide' 
            ? 'bg-green-500 hover:bg-green-600 text-white border-green-500' 
            : 'border-green-500 text-green-600 hover:bg-green-50'
        }`}
        onClick={() => onStatusChange('valide')}
        disabled={isLoading}
        title="Valider"
      >
        <CheckCircle className="w-3 h-3" />
      </Button>
      
      <Button
        size="sm"
        variant={currentStatus === 'rejete' ? 'default' : 'outline'}
        className={`px-2 py-1 h-auto min-w-0 ${
          currentStatus === 'rejete' 
            ? 'bg-red-500 hover:bg-red-600 text-white border-red-500' 
            : 'border-red-500 text-red-600 hover:bg-red-50'
        }`}
        onClick={() => onStatusChange('rejete')}
        disabled={isLoading}
        title="Rejeter"
      >
        <XCircle className="w-3 h-3" />
      </Button>
      
      <Button
        size="sm"
        variant={currentStatus === 'en_attente' ? 'default' : 'outline'}
        className={`px-2 py-1 h-auto min-w-0 ${
          currentStatus === 'en_attente' 
            ? 'bg-yellow-500 hover:bg-yellow-600 text-white border-yellow-500' 
            : 'border-yellow-500 text-yellow-600 hover:bg-yellow-50'
        }`}
        onClick={() => onStatusChange('en_attente')}
        disabled={isLoading}
        title="Mettre en attente"
      >
        <Clock className="w-3 h-3" />
      </Button>
    </div>
  );
};
