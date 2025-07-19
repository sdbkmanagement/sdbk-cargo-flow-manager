
import React, { useState, useEffect } from 'react';
import { Form } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { StepIndicator } from './form/StepIndicator';
import { PersonalInfoStep } from './form/PersonalInfoStep';
import { ContractStep } from './form/ContractStep';
import { FormNavigation } from './form/FormNavigation';
import { ProfileHeader } from './ProfileHeader';
import { chauffeursService } from '@/services/chauffeurs';
import { User, FileText, Camera } from 'lucide-react';

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
  const [contractFile, setContractFile] = useState<UploadedFile | null>(null);
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
      lieu_naissance: chauffeur?.lieu_naissance || '',
      nationalite: chauffeur?.nationalite || 'Guinéenne',
      groupe_sanguin: chauffeur?.groupe_sanguin || '',
      filiation: chauffeur?.filiation || '',
      statut_matrimonial: chauffeur?.statut_matrimonial || '',
      
      // Informations professionnelles
      fonction: chauffeur?.fonction || '',
      base_chauffeur: chauffeur?.base_chauffeur || '',
      date_embauche: chauffeur?.date_embauche || '',
      type_contrat: chauffeur?.type_contrat || 'CDI',
      
      // Contact
      telephone: chauffeur?.telephone || '',
      email: chauffeur?.email || '',
      adresse: chauffeur?.adresse || '',
      ville: chauffeur?.ville || '',
      codePostal: chauffeur?.code_postal || '',
      
      // Personne à contacter en cas d'urgence
      urgence_nom: chauffeur?.urgence_nom || '',
      urgence_prenom: chauffeur?.urgence_prenom || '',
      urgence_telephone: chauffeur?.urgence_telephone || '',
      
      // Permis
      numeroPermis: chauffeur?.numero_permis || '',
      typePermis: chauffeur?.type_permis || [],
      dateExpirationPermis: chauffeur?.date_expiration_permis || '',
      dateObtentionPermis: chauffeur?.date_obtention_permis || '',
      
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
    if (chauffeur?.contrat_url) {
      setContractFile({
        id: 'existing-contract',
        name: 'Contrat existant',
        size: 0,
        type: 'application/pdf',
        url: chauffeur.contrat_url
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

  // Calculer l'ancienneté automatiquement
  const calculateAnciennete = (dateEmbauche: string) => {
    if (!dateEmbauche) return '';
    const today = new Date();
    const embauche = new Date(dateEmbauche);
    const diffTime = Math.abs(today.getTime() - embauche.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const years = Math.floor(diffDays / 365);
    const months = Math.floor((diffDays % 365) / 30);
    
    if (years > 0) {
      return `${years} an${years > 1 ? 's' : ''} ${months > 0 ? `et ${months} mois` : ''}`;
    } else if (months > 0) {
      return `${months} mois`;
    } else {
      return `${diffDays} jour${diffDays > 1 ? 's' : ''}`;
    }
  };

  const onSubmit = async (data: any) => {
    console.log('Soumission du formulaire, données:', data);
    
    try {
      // Calculer l'âge automatiquement
      let age = null;
      if (data.dateNaissance) {
        const today = new Date();
        const birth = new Date(data.dateNaissance);
        age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
          age--;
        }
      }

      const chauffeurData = {
        // Informations administratives
        matricule: data.matricule || null,
        id_conducteur: data.id_conducteur || null,
        immatricule_cnss: data.immatricule_cnss || null,
        
        // Informations personnelles
        nom: data.nom,
        prenom: data.prenom,
        date_naissance: data.dateNaissance || null,
        age: age,
        lieu_naissance: data.lieu_naissance || null,
        nationalite: data.nationalite || null,
        groupe_sanguin: data.groupe_sanguin || null,
        filiation: data.filiation || null,
        statut_matrimonial: data.statut_matrimonial || null,
        
        // Informations professionnelles
        fonction: data.fonction || null,
        base_chauffeur: data.base_chauffeur || null,
        date_embauche: data.date_embauche || null,
        type_contrat: data.type_contrat || 'CDI',
        
        // Contact
        telephone: data.telephone,
        email: data.email || null,
        adresse: data.adresse || null,
        ville: data.ville || null,
        code_postal: data.codePostal || null,
        
        // Personne à contacter en cas d'urgence
        urgence_nom: data.urgence_nom || null,
        urgence_prenom: data.urgence_prenom || null,
        urgence_telephone: data.urgence_telephone || null,
        
        // Permis
        numero_permis: data.numeroPermis,
        type_permis: data.typePermis || [],
        date_expiration_permis: data.dateExpirationPermis,
        date_obtention_permis: data.dateObtentionPermis || null,
        
        // Statut et documents
        statut: data.statut || 'actif',
        photo_url: profilePhoto?.url || null,
        contrat_url: contractFile?.url || null,
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

  const handleContractChange = (files: UploadedFile[]) => {
    if (files.length > 0) {
      setContractFile(files[0]);
    } else {
      setContractFile(null);
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

  // Steps mis à jour
  const steps = [
    { 
      id: 1, 
      title: 'Informations personnelles', 
      description: 'Coordonnées et détails',
      icon: User
    },
    { 
      id: 2, 
      title: 'Contrat et photo', 
      description: 'Documents et signature',
      icon: FileText
    }
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
          {currentStep === 1 && (
            <PersonalInfoStep 
              form={form} 
              calculateAnciennete={calculateAnciennete}
            />
          )}
          
          {currentStep === 2 && (
            <ContractStep
              profilePhoto={profilePhoto}
              contractFile={contractFile}
              onPhotoChange={handlePhotoChange}
              onContractChange={handleContractChange}
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
