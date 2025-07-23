
import React from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

interface RefreshButtonProps {
  onRefresh?: () => void;
  isLoading?: boolean;
}

export const RefreshButton: React.FC<RefreshButtonProps> = ({ 
  onRefresh, 
  isLoading = false 
}) => {
  const handleRefresh = () => {
    // Recharger complètement la page
    window.location.reload();
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleRefresh}
      disabled={isLoading}
      className="flex items-center gap-2"
    >
      <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
      Actualiser
    </Button>
  );
};
