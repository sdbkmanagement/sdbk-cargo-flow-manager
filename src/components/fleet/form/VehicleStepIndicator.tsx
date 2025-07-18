import React from 'react';
import { Settings, Truck, Container, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Step {
  id: number;
  title: string;
  icon: React.ComponentType<any>;
  description: string;
}

interface VehicleStepIndicatorProps {
  currentStep: number;
  totalSteps: number;
  vehicleType: string;
}

export const VehicleStepIndicator = ({ currentStep, totalSteps, vehicleType }: VehicleStepIndicatorProps) => {
  const getSteps = (): Step[] => {
    const baseSteps = [
      {
        id: 1,
        title: 'Informations générales',
        description: 'Type, statut, base d\'intégration',
        icon: Settings
      }
    ];

    if (vehicleType === 'tracteur_remorque') {
      return [
        ...baseSteps,
        {
          id: 2,
          title: 'Tracteur',
          description: 'Marque, modèle, châssis, dates',
          icon: Truck
        },
        {
          id: 3,
          title: 'Remorque',
          description: 'Volume, marque, modèle, châssis',
          icon: Container
        }
      ];
    } else {
      return [
        ...baseSteps,
        {
          id: 2,
          title: 'Informations véhicule',
          description: 'Marque, modèle, immatriculation',
          icon: Truck
        }
      ];
    }
  };

  const steps = getSteps();

  return (
    <div className="w-full py-6">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center">
            {/* Step circle */}
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors",
                  currentStep === step.id
                    ? "border-primary bg-primary text-primary-foreground"
                    : currentStep > step.id
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-muted-foreground/30 bg-background"
                )}
              >
                {currentStep > step.id ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  <step.icon className="w-5 h-5" />
                )}
              </div>
              
              {/* Step info */}
              <div className="mt-2 text-center">
                <div className={cn(
                  "text-sm font-medium",
                  currentStep >= step.id ? "text-foreground" : "text-muted-foreground"
                )}>
                  {step.title}
                </div>
                <div className="text-xs text-muted-foreground mt-1 max-w-[120px]">
                  {step.description}
                </div>
              </div>
            </div>

            {/* Connector line */}
            {index < steps.length - 1 && (
              <div
                className={cn(
                  "flex-1 h-0.5 mx-4 transition-colors",
                  currentStep > step.id ? "bg-primary" : "bg-muted-foreground/30"
                )}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};