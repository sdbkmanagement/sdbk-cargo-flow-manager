
import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Save } from 'lucide-react';

interface FormNavigationProps {
  currentStep: number;
  totalSteps: number;
  onPrevious: () => void;
  onNext: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}

export const FormNavigation = ({
  currentStep,
  totalSteps,
  onPrevious,
  onNext,
  onSubmit,
  isSubmitting
}: FormNavigationProps) => {
  const handleNext = () => {
    console.log('Navigation: étape actuelle', currentStep, 'vers étape', currentStep + 1);
    onNext();
  };

  const handleSubmit = () => {
    console.log('Soumission du formulaire depuis l\'étape', currentStep);
    onSubmit();
  };

  return (
    <div className="flex justify-between items-center pt-6 border-t">
      <Button
        type="button"
        variant="outline"
        onClick={onPrevious}
        disabled={currentStep === 1}
        className="flex items-center"
      >
        <ChevronLeft className="w-4 h-4 mr-2" />
        Précédent
      </Button>

      <div className="text-sm text-gray-500">
        Étape {currentStep} sur {totalSteps}
      </div>

      {currentStep < totalSteps ? (
        <Button
          type="button"
          onClick={handleNext}
          className="flex items-center bg-orange-500 hover:bg-orange-600"
        >
          Suivant
          <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      ) : (
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="flex items-center bg-green-600 hover:bg-green-700"
        >
          <Save className="w-4 h-4 mr-2" />
          {isSubmitting ? 'Sauvegarde...' : 'Sauvegarder'}
        </Button>
      )}
    </div>
  );
};
