
import React, { useState, useEffect } from 'react';
import { Form } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { StepIndicator } from './form/StepIndicator';
import { PersonalInfoStep } from './form/PersonalInfoStep';
import { DocumentsStep } from './form/DocumentsStep';
import { PhotoSignatureStep } from './form/PhotoSignatureStep';
import { FormNavigation } from './form/FormNavigation';
import { ProfileHeader } from './ProfileHeader';
import { formSteps } from './form/steps';
import { chauffeursService } from '@/services/chauffeurs';

interface ChauffeurFormProps {
  chauffeur?: any;
  onSuccess: () => void;
  onCancel?: () => void;
}

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
}

export const ChauffeurForm = ({ chauffeur, onSuccess, onCancel }: ChauffeurFormProps) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [uploadedDocuments, setUploadedDocuments] = useState<UploadedFile[]>([]);
  const [profilePhoto, setProfilePhoto] = useState<UploadedFile | null>(null);
  const [signature, setSignature] = useState<UploadedFile | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm({
    defaultValues: {
      nom: chauffeur?.nom || '',
      prenom: chauffeur?.prenom || '',
      dateNaissance: chauffeur?.date_naissance || '',
      telephone: chauffeur?.telephone || '',
      email: chauffeur?.email || '',
      adresse: chauffeur?.adresse || '',
      ville: chauffeur?.ville || '',
      codePostal: chauffeur?.code_postal || '',
      numeroPermis: chauffeur?.numero_permis || '',
      typePermis: chauffeur?.type_permis || [],
      dateExpirationPermis: chauffeur?.date_expiration_permis || '',
      statut: chauffeur?.statut || 'actif'
    }
  });

  useEffect(() => {
    if (chauffeur?.photo_url) {
      setProfilePhoto({
        id: 'existing-photo',
        name: 'Photo existante',
        size: 0,
        type: 'image/jpeg',
        url: chauffeur.photo_url
      });
    }
    if (chauffeur?.signature_url) {
      setSignature({
        id: 'existing-signature',
        name: 'Signature existante',
        size: 0,
        type: 'image/jpeg',
        url: chauffeur.signature_url
      });
    }
  }, [chauffeur]);

  const createChauffeurMutation = useMutation({
    mutationFn: chauffeursService.create,
    onSuccess: async (createdChauffeur) => {
      // Sauvegarder les documents après création du chauffeur
      try {
        if (uploadedDocuments.length > 0) {
          await chauffeursService.saveDocuments(createdChauffeur.id, uploadedDocuments);
        }
        
        queryClient.invalidateQueries({ queryKey: ['chauffeurs'] });
        toast({
          title: "Chauffeur créé",
          description: "Le nouveau chauffeur a été ajouté avec succès",
        });
        onSuccess();
      } catch (error) {
        console.error('Erreur lors de la sauvegarde des documents:', error);
        toast({
          title: "Chauffeur créé",
          description: "Chauffeur créé mais erreur lors de la sauvegarde des documents",
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      console.error('Erreur lors de la création:', error);
      toast({
        title: "Erreur",
        description: "Impossible de créer le chauffeur",
        variant: "destructive",
      });
    }
  });

  const updateChauffeurMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => 
      chauffeursService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chauffeurs'] });
      toast({
        title: "Chauffeur modifié",
        description: "Les informations ont été mises à jour",
      });
      onSuccess();
    },
    onError: (error) => {
      console.error('Erreur lors de la modification:', error);
      toast({
        title: "Erreur",
        description: "Impossible de modifier le chauffeur",
        variant: "destructive",
      });
    }
  });

  const onSubmit = async (data: any) => {
    console.log('Soumission du formulaire, étape actuelle:', currentStep);
    
    try {
      const chauffeurData = {
        nom: data.nom,
        prenom: data.prenom,
        date_naissance: data.dateNaissance || null,
        telephone: data.telephone,
        email: data.email || null,
        adresse: data.adresse || null,
        ville: data.ville || null,
        code_postal: data.codePostal || null,
        numero_permis: data.numeroPermis,
        type_permis: data.typePermis || [],
        date_expiration_permis: data.dateExpirationPermis,
        statut: data.statut || 'actif',
        photo_url: profilePhoto?.url || null,
        signature_url: signature?.url || null,
      };

      if (chauffeur?.id) {
        updateChauffeurMutation.mutate({ id: chauffeur.id, data: chauffeurData });
      } else {
        createChauffeurMutation.mutate(chauffeurData);
      }
    } catch (error) {
      console.error('Erreur lors de la soumission:', error);
    }
  };

  const handleDocumentsChange = (files: UploadedFile[]) => {
    console.log('Documents uploadés:', files);
    setUploadedDocuments(files);
  };

  const handlePhotoChange = (files: UploadedFile[]) => {
    console.log('Photo changée:', files);
    if (files.length > 0) {
      setProfilePhoto(files[0]);
    } else {
      setProfilePhoto(null);
    }
  };

  const handleSignatureChange = (files: UploadedFile[]) => {
    console.log('Signature changée:', files);
    if (files.length > 0) {
      setSignature(files[0]);
    } else {
      setSignature(null);
    }
  };

  const handleNext = () => {
    const nextStep = Math.min(formSteps.length, currentStep + 1);
    console.log('Navigation vers étape:', nextStep);
    setCurrentStep(nextStep);
  };

  const handlePrevious = () => {
    const prevStep = Math.max(1, currentStep - 1);
    console.log('Navigation vers étape:', prevStep);
    setCurrentStep(prevStep);
  };

  const handleFormSubmit = () => {
    console.log('Déclenchement de la soumission du formulaire');
    form.handleSubmit(onSubmit)();
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
  };

  const formValues = form.watch();

  return (
    <div className="max-w-4xl mx-auto">
      {/* Affichage du profil pour les modifications */}
      {chauffeur && (
        <div className="mb-6">
          <ProfileHeader chauffeur={chauffeur} size="md" />
        </div>
      )}

      <StepIndicator steps={formSteps} currentStep={currentStep} />

      <Form {...form}>
        <div className="space-y-6">
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
              chauffeurData={formValues}
            />
          )}

          <FormNavigation
            currentStep={currentStep}
            totalSteps={formSteps.length}
            onPrevious={handlePrevious}
            onNext={handleNext}
            onSubmit={handleFormSubmit}
            onCancel={handleCancel}
            isSubmitting={createChauffeurMutation.isPending || updateChauffeurMutation.isPending}
          />
        </div>
      </Form>
    </div>
  );
};
