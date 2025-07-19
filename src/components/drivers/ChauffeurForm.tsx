
import React, { useState, useEffect } from 'react';
import { Form } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { StepIndicator } from './form/StepIndicator';
import { PersonalInfoStep } from './form/PersonalInfoStep';
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
  const [profilePhoto, setProfilePhoto] = useState<UploadedFile | null>(null);
  const [signature, setSignature] = useState<UploadedFile | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm({
    defaultValues: {
      // Informations administratives
      matricule: chauffeur?.matricule || '',
      id_conducteur: chauffeur?.id_conducteur || '',
      immatricule_cnss: chauffeur?.immatricule_cnss || '',
      
      // Informations personnelles
      nom: chauffeur?.nom || '',
      prenom: chauffeur?.prenom || '',
      dateNaissance: chauffeur?.date_naissance || '',
      age: chauffeur?.age?.toString() || '',
      lieu_naissance: chauffeur?.lieu_naissance || '',
      groupe_sanguin: chauffeur?.groupe_sanguin || '',
      filiation: chauffeur?.filiation || '',
      statut_matrimonial: chauffeur?.statut_matrimonial || '',
      
      // Informations professionnelles
      fonction: chauffeur?.fonction || '',
      base_chauffeur: chauffeur?.base_chauffeur || '',
      date_embauche: chauffeur?.date_embauche || '',
      
      // Contact
      telephone: chauffeur?.telephone || '',
      email: chauffeur?.email || '',
      adresse: chauffeur?.adresse || '',
      ville: chauffeur?.ville || '',
      codePostal: chauffeur?.code_postal || '',
      
      // Permis
      numeroPermis: chauffeur?.numero_permis || '',
      typePermis: chauffeur?.type_permis || [],
      dateExpirationPermis: chauffeur?.date_expiration_permis || '',
      
      // Statut
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
      queryClient.invalidateQueries({ queryKey: ['chauffeurs'] });
      toast({
        title: "Chauffeur créé",
        description: "Le nouveau chauffeur a été ajouté avec succès",
      });
      onSuccess();
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
    console.log('Soumission du formulaire, données:', data);
    
    try {
      const chauffeurData = {
        // Informations administratives
        matricule: data.matricule || null,
        id_conducteur: data.id_conducteur || null,
        immatricule_cnss: data.immatricule_cnss || null,
        
        // Informations personnelles
        nom: data.nom,
        prenom: data.prenom,
        date_naissance: data.dateNaissance || null,
        age: data.age ? parseInt(data.age) : null,
        lieu_naissance: data.lieu_naissance || null,
        groupe_sanguin: data.groupe_sanguin || null,
        filiation: data.filiation || null,
        statut_matrimonial: data.statut_matrimonial || null,
        
        // Informations professionnelles
        fonction: data.fonction || null,
        base_chauffeur: data.base_chauffeur || null,
        date_embauche: data.date_embauche || null,
        
        // Contact
        telephone: data.telephone,
        email: data.email || null,
        adresse: data.adresse || null,
        ville: data.ville || null,
        code_postal: data.codePostal || null,
        
        // Permis
        numero_permis: data.numeroPermis,
        type_permis: data.typePermis || [],
        date_expiration_permis: data.dateExpirationPermis,
        
        // Statut et photos
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

  const handlePhotoChange = (files: UploadedFile[]) => {
    if (files.length > 0) {
      setProfilePhoto(files[0]);
    } else {
      setProfilePhoto(null);
    }
  };

  const handleSignatureChange = (files: UploadedFile[]) => {
    if (files.length > 0) {
      setSignature(files[0]);
    } else {
      setSignature(null);
    }
  };

  const handleNext = () => {
    const nextStep = Math.min(2, currentStep + 1);
    setCurrentStep(nextStep);
  };

  const handlePrevious = () => {
    const prevStep = Math.max(1, currentStep - 1);
    setCurrentStep(prevStep);
  };

  const handleFormSubmit = () => {
    form.handleSubmit(onSubmit)();
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
  };

  const formValues = form.watch();

  // Étapes réduites à 2 (infos personnelles + photo/signature)
  const steps = [
    { number: 1, title: 'Informations personnelles', description: 'Coordonnées et détails' },
    { number: 2, title: 'Photo et signature', description: 'Documents visuels' }
  ];

  return (
    <div className="max-w-4xl mx-auto">
      {chauffeur && (
        <div className="mb-6">
          <ProfileHeader chauffeur={chauffeur} size="md" />
        </div>
      )}

      <StepIndicator steps={steps} currentStep={currentStep} />

      <Form {...form}>
        <div className="space-y-6">
          {currentStep === 1 && <PersonalInfoStep form={form} />}
          
          {currentStep === 2 && (
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
            totalSteps={2}
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
