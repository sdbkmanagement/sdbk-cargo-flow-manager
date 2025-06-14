
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Camera, User } from 'lucide-react';
import { DocumentUpload } from '../DocumentUpload';

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
}

interface PhotoSignatureStepProps {
  profilePhoto: UploadedFile | null;
  signature: UploadedFile | null;
  onPhotoChange: (files: UploadedFile[]) => void;
  onSignatureChange: (files: UploadedFile[]) => void;
  chauffeurData?: {
    nom: string;
    prenom: string;
  };
}

export const PhotoSignatureStep = ({ 
  profilePhoto, 
  signature, 
  onPhotoChange, 
  onSignatureChange,
  chauffeurData 
}: PhotoSignatureStepProps) => {
  const getInitials = () => {
    if (!chauffeurData?.nom || !chauffeurData?.prenom) return 'CH';
    return `${chauffeurData.prenom.charAt(0)}${chauffeurData.nom.charAt(0)}`.toUpperCase();
  };

  return (
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
            
            {/* Aperçu de la photo */}
            <div className="mt-2 mb-4 flex justify-center">
              <Avatar className="w-24 h-24">
                <AvatarImage 
                  src={profilePhoto?.url} 
                  alt="Photo de profil"
                  className="object-cover"
                />
                <AvatarFallback className="bg-orange-100 text-orange-700 text-xl">
                  {profilePhoto ? <Camera className="w-8 h-8" /> : getInitials()}
                </AvatarFallback>
              </Avatar>
            </div>
            
            <div className="mt-2">
              <DocumentUpload
                onFilesChange={onPhotoChange}
                maxFiles={1}
                maxSizePerFile={5}
                acceptedTypes={['image/jpeg', 'image/png']}
              />
            </div>
          </div>

          <div>
            <Label>Signature numérique</Label>
            
            {/* Aperçu de la signature */}
            {signature && (
              <div className="mt-2 mb-4 p-4 border rounded-lg bg-gray-50">
                <img 
                  src={signature.url} 
                  alt="Signature"
                  className="max-h-20 mx-auto"
                />
              </div>
            )}
            
            <div className="mt-2">
              <DocumentUpload
                onFilesChange={onSignatureChange}
                maxFiles={1}
                maxSizePerFile={2}
                acceptedTypes={['image/jpeg', 'image/png', 'application/pdf']}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
