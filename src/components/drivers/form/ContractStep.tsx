
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Upload, Eye, User, Download } from 'lucide-react';
import { DocumentUpload } from '@/components/common/DocumentUpload';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { PhotoSignatureStep } from './PhotoSignatureStep';

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
}

interface ContractStepProps {
  profilePhoto: UploadedFile | null;
  contractFile: UploadedFile | null;
  onPhotoChange: (files: UploadedFile[]) => void;
  onContractChange: (files: UploadedFile[]) => void;
  chauffeurData: any;
}

export const ContractStep = ({
  profilePhoto,
  contractFile,
  onPhotoChange,
  onContractChange,
  chauffeurData
}: ContractStepProps) => {

  return (
    <div className="space-y-6">
      {/* Utilisation du composant PhotoSignatureStep existant */}
      <PhotoSignatureStep
        profilePhoto={profilePhoto}
        signature={contractFile}
        onPhotoChange={onPhotoChange}
        onSignatureChange={onContractChange}
        chauffeurData={chauffeurData}
      />


      {/* Résumé des informations */}
      <Card>
        <CardHeader>
          <CardTitle>Résumé des informations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p><strong>Nom complet:</strong> {chauffeurData.prenom} {chauffeurData.nom}</p>
              <p><strong>Téléphone:</strong> {chauffeurData.telephone}</p>
              <p><strong>Email:</strong> {chauffeurData.email || 'Non renseigné'}</p>
              <p><strong>Nationalité:</strong> {chauffeurData.nationalite || 'Non renseignée'}</p>
            </div>
            <div>
              <p><strong>Permis:</strong> {chauffeurData.numeroPermis}</p>
              <p><strong>Fonction:</strong> {chauffeurData.fonction || 'Non renseignée'}</p>
              <p><strong>Base:</strong> {chauffeurData.base_chauffeur || 'Non renseignée'}</p>
              <p><strong>Type de contrat:</strong> {chauffeurData.type_contrat || 'CDI'}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
