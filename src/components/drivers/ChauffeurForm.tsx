
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { useToast } from '@/hooks/use-toast';
import { DocumentUpload } from './DocumentUpload';
import { 
  User, 
  Phone, 
  Mail, 
  Calendar,
  FileText,
  Camera,
  Save,
  X
} from 'lucide-react';

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

  const steps = [
    { id: 1, title: 'Informations personnelles', icon: User },
    { id: 2, title: 'Documents officiels', icon: FileText },
    { id: 3, title: 'Photo et signature', icon: Camera }
  ];

  const typePermisOptions = [
    { value: 'B', label: 'Permis B (Voiture)' },
    { value: 'C', label: 'Permis C (Camion)' },
    { value: 'CE', label: 'Permis CE (Camion + remorque)' },
    { value: 'D', label: 'Permis D (Transport de personnes)' }
  ];

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

  return (
    <div className="max-w-4xl mx-auto">
      {/* Navigation des étapes */}
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

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Étape 1: Informations personnelles */}
          {currentStep === 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="w-5 h-5 mr-2" />
                  Informations personnelles
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="nom"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nom *</FormLabel>
                        <FormControl>
                          <Input placeholder="Nom de famille" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="prenom"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Prénom *</FormLabel>
                        <FormControl>
                          <Input placeholder="Prénom" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="dateNaissance"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date de naissance *</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="telephone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Téléphone *</FormLabel>
                        <FormControl>
                          <Input placeholder="+225 XX XX XX XX XX" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="email@exemple.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="adresse"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Adresse</FormLabel>
                        <FormControl>
                          <Input placeholder="Adresse complète" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="ville"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ville</FormLabel>
                        <FormControl>
                          <Input placeholder="Ville" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="codePostal"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Code postal</FormLabel>
                        <FormControl>
                          <Input placeholder="Code postal" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Étape 2: Documents officiels */}
          {currentStep === 2 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="w-5 h-5 mr-2" />
                  Documents officiels
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="numeroPermis"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Numéro de permis *</FormLabel>
                        <FormControl>
                          <Input placeholder="Numéro du permis de conduire" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="dateExpirationPermis"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date d'expiration du permis *</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div>
                  <Label>Types de permis autorisés *</Label>
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    {typePermisOptions.map((option) => (
                      <div key={option.value} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={option.value}
                          className="rounded border-gray-300"
                        />
                        <Label htmlFor={option.value} className="text-sm">
                          {option.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>Documents à télécharger</Label>
                  <div className="mt-2">
                    <DocumentUpload
                      onFilesChange={handleDocumentsChange}
                      maxFiles={5}
                      maxSizePerFile={10}
                      acceptedTypes={['application/pdf', 'image/jpeg', 'image/png']}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Étape 3: Photo et signature */}
          {currentStep === 3 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Camera className="w-5 h-5 mr-2" />
                  Photo et signature
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label>Photo de profil</Label>
                    <div className="mt-2">
                      <DocumentUpload
                        onFilesChange={handlePhotoChange}
                        maxFiles={1}
                        maxSizePerFile={5}
                        acceptedTypes={['image/jpeg', 'image/png']}
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Signature numérique</Label>
                    <div className="mt-2">
                      <DocumentUpload
                        onFilesChange={handleSignatureChange}
                        maxFiles={1}
                        maxSizePerFile={2}
                        acceptedTypes={['image/jpeg', 'image/png', 'application/pdf']}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Boutons de navigation */}
          <div className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
              disabled={currentStep === 1}
            >
              Précédent
            </Button>

            <div className="flex space-x-2">
              {currentStep < 3 ? (
                <Button
                  type="button"
                  onClick={() => setCurrentStep(currentStep + 1)}
                  className="bg-orange-500 hover:bg-orange-600"
                >
                  Suivant
                </Button>
              ) : (
                <Button
                  type="submit"
                  className="bg-green-500 hover:bg-green-600"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Enregistrer
                </Button>
              )}
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
};
