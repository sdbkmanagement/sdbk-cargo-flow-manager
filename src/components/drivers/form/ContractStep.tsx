
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Upload, Eye, User, Download } from 'lucide-react';
import { DocumentUpload } from '@/components/common/DocumentUpload';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

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
  const [showPhotoUpload, setShowPhotoUpload] = React.useState(false);
  const [showContractUpload, setShowContractUpload] = React.useState(false);

  const handlePhotoUpload = (file: File) => {
    // Simuler l'upload - en production, il faudrait uploader vers Supabase Storage
    const uploadedFile: UploadedFile = {
      id: Date.now().toString(),
      name: file.name,
      size: file.size,
      type: file.type,
      url: URL.createObjectURL(file)
    };
    onPhotoChange([uploadedFile]);
    setShowPhotoUpload(false);
  };

  const handleContractUpload = (file: File) => {
    // Simuler l'upload - en production, il faudrait uploader vers Supabase Storage
    const uploadedFile: UploadedFile = {
      id: Date.now().toString(),
      name: file.name,
      size: file.size,
      type: file.type,
      url: URL.createObjectURL(file)
    };
    onContractChange([uploadedFile]);
    setShowContractUpload(false);
  };

  return (
    <div className="space-y-6">
      {/* Photo de profil */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Photo de profil
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-6">
            <Avatar className="w-24 h-24">
              <AvatarImage src={profilePhoto?.url} />
              <AvatarFallback className="text-2xl">
                {chauffeurData.nom?.[0]}{chauffeurData.prenom?.[0]}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              {profilePhoto ? (
                <div className="space-y-2">
                  <p className="text-sm font-medium">{profilePhoto.name}</p>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(profilePhoto.url, '_blank')}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Voir
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setShowPhotoUpload(true)}
                    >
                      <Upload className="w-4 h-4 mr-1" />
                      Remplacer
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  type="button"
                  onClick={() => setShowPhotoUpload(true)}
                  className="w-full"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Ajouter une photo
                </Button>
              )}
            </div>
          </div>

          {showPhotoUpload && (
            <DocumentUpload
              onUpload={handlePhotoUpload}
              onCancel={() => setShowPhotoUpload(false)}
              acceptedTypes=".jpg,.jpeg,.png"
              maxSize={5 * 1024 * 1024} // 5MB
              title="Télécharger une photo de profil"
            />
          )}
        </CardContent>
      </Card>

      {/* Contrat avec signature */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Contrat avec signature
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {contractFile ? (
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="w-8 h-8 text-blue-500" />
                  <div>
                    <p className="font-medium">{contractFile.name}</p>
                    <p className="text-sm text-gray-500">
                      {(contractFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(contractFile.url, '_blank')}
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    Voir
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setShowContractUpload(true)}
                  >
                    <Upload className="w-4 h-4 mr-1" />
                    Remplacer
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">
                Aucun contrat téléchargé
              </p>
              <Button
                type="button"
                onClick={() => setShowContractUpload(true)}
              >
                <Upload className="w-4 h-4 mr-2" />
                Télécharger le contrat
              </Button>
            </div>
          )}

          {showContractUpload && (
            <DocumentUpload
              onUpload={handleContractUpload}
              onCancel={() => setShowContractUpload(false)}
              acceptedTypes=".pdf,.doc,.docx"
              maxSize={10 * 1024 * 1024} // 10MB
              title="Télécharger le contrat signé"
            />
          )}
        </CardContent>
      </Card>

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
