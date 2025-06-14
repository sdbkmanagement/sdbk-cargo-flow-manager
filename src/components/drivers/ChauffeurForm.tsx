
import React, { useState } from 'react';
import { Form } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { useToast } from '@/hooks/use-toast';
import { StepIndicator } from './form/StepIndicator';
import { PersonalInfoStep } from './form/PersonalInfoStep';
import { DocumentsStep } from './form/DocumentsStep';
import { PhotoSignatureStep } from './form/PhotoSignatureStep';
import { FormNavigation } from './form/FormNavigation';
import { formSteps } from './form/steps';

interface ChauffeurFormProps {
  chauffeur?: any;
  onSuccess: () => void;
}

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
}

export const ChauffeurForm = ({ chauffeur, onSuccess }: ChauffeurFormProps) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [uploadedDocuments, setUploadedDocuments] = useState<UploadedFile[]>([]);
  const [profilePhoto, setProfilePhoto] = useState<UploadedFile | null>(null);
  const [signature, setSignature] = useState<UploadedFile | null>(null);
  const { toast } = useToast();

  const form = useForm({
    defaultValues: {
      nom: chauffeur?.nom || '',
      prenom: chauffeur?.prenom || '',
      dateNaissance: chauffeur?.dateNaissance || '',
      telephone: chauffeur?.telephone || '',
      email: chauffeur?.email || '',
      adresse: chauffeur?.adresse || '',
      ville: chauffeur?.ville || '',
      codePostal: chauffeur?.codePostal || '',
      numeroPermis: chauffeur?.numeroPermis || '',
      typePermis: chauffeur?.typePermis || [],
      dateExpirationPermis: chauffeur?.dateExpirationPermis || '',
      statut: chauffeur?.statut || 'actif'
    }
  });

  const onSubmit = (data: any) => {
    console.log('Données du chauffeur:', data);
    console.log('Documents uploadés:', uploadedDocuments);
    console.log('Photo de profil:', profilePhoto);
    console.log('Signature:', signature);
    
    toast({
      title: "Chauffeur enregistré",
      description: "Les informations ont été sauvegardées avec succès",
    });
    
    onSuccess();
  };

  const handleDocumentsChange = (files: UploadedFile[]) => {
    setUploadedDocuments(files);
  };

  const handlePhotoChange = (files: UploadedFile[]) => {
    if (files.length > 0) {
      setProfilePhoto(files[0]);
    }
  };

  const handleSignatureChange = (files: UploadedFile[]) => {
    if (files.length > 0) {
      setSignature(files[0]);
    }
  };

  const handleNext = () => {
    setCurrentStep(Math.min(formSteps.length, currentStep + 1));
  };

  const handlePrevious = () => {
    setCurrentStep(Math.max(1, currentStep - 1));
  };

  return (
    <div className="max-w-4xl mx-auto">
      <StepIndicator steps={formSteps} currentStep={currentStep} />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {currentStep === 1 && <PersonalInfoStep form={form} />}
          
          {currentStep === 2 && (
            <DocumentsStep 
              form={form}
              uploadedDocuments={uploadedDocuments}
              onDocumentsChange={handleDocumentsChange}
            />
          )}
          
          {currentStep === 3 && (
            <PhotoSignatureStep
              profilePhoto={profilePhoto}
              signature={signature}
              onPhotoChange={handlePhotoChange}
              onSignatureChange={handleSignatureChange}
            />
          )}

          <FormNavigation
            currentStep={currentStep}
            totalSteps={formSteps.length}
            onPrevious={handlePrevious}
            onNext={handleNext}
            onSubmit={() => form.handleSubmit(onSubmit)()}
          />
        </form>
      </Form>
    </div>
  );
};
