
import React from 'react';

interface StepIndicatorProps {
  steps: Array<{ id: number; title: string; icon: React.ComponentType<any> }>;
  currentStep: number;
}

export const StepIndicator = ({ steps, currentStep }: StepIndicatorProps) => {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const Icon = step.icon;
          return (
            <div key={step.id} className="flex items-center">
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full ${
                  currentStep >= step.id
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-200 text-gray-400'
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <div className="ml-3">
                <div className={`text-sm font-medium ${
                  currentStep >= step.id ? 'text-orange-600' : 'text-gray-400'
                }`}>
                  Étape {step.id}
                </div>
                <div className="text-xs text-gray-500">{step.title}</div>
              </div>
              {index < steps.length - 1 && (
                <div className={`w-16 h-1 mx-4 ${
                  currentStep > step.id ? 'bg-orange-500' : 'bg-gray-200'
                }`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
