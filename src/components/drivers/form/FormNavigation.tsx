
import React from 'react';
import { Button } from '@/components/ui/button';
import { Save } from 'lucide-react';

interface FormNavigationProps {
  currentStep: number;
  totalSteps: number;
  onPrevious: () => void;
  onNext: () => void;
  onSubmit: () => void;
  isSubmitting?: boolean;
}

export const FormNavigation = ({ 
  currentStep, 
  totalSteps, 
  onPrevious, 
  onNext, 
  onSubmit,
  isSubmitting = false
}: FormNavigationProps) => {
  return (
    <div className="flex justify-between">
      <Button
        type="button"
        variant="outline"
        onClick={onPrevious}
        disabled={currentStep === 1}
      >
        Précédent
      </Button>

      <div className="flex space-x-2">
        {currentStep < totalSteps ? (
          <Button
            type="button"
            onClick={onNext}
            className="bg-orange-500 hover:bg-orange-600"
          >
            Suivant
          </Button>
        ) : (
          <Button
            type="submit"
            onClick={onSubmit}
            disabled={isSubmitting}
            className="bg-green-500 hover:bg-green-600"
          >
            <Save className="w-4 h-4 mr-2" />
            Enregistrer
          </Button>
        )}
      </div>
    </div>
  );
};
