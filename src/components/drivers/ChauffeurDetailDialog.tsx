
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { User } from 'lucide-react';
import { ChauffeurDetailView } from './ChauffeurDetailView';

interface ChauffeurDetailDialogProps {
  chauffeur: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ChauffeurDetailDialog = ({ 
  chauffeur, 
  open, 
  onOpenChange 
}: ChauffeurDetailDialogProps) => {
  if (!chauffeur) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <User className="w-6 h-6" />
            Détails du chauffeur
          </DialogTitle>
        </DialogHeader>
        
        <ChauffeurDetailView chauffeur={chauffeur} />
      </DialogContent>
    </Dialog>
  );
};
