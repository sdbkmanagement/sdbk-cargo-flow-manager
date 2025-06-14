
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Camera } from 'lucide-react';
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
}

export const PhotoSignatureStep = ({ 
  profilePhoto, 
  signature, 
  onPhotoChange, 
  onSignatureChange 
}: PhotoSignatureStepProps) => {
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
