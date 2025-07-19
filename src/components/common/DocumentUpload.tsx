
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, X, FileText } from 'lucide-react';

interface DocumentUploadProps {
  onUpload: (file: File, expirationDate?: string) => void;
  onCancel: () => void;
  acceptedTypes?: string;
  maxSize?: number;
  showExpirationDate?: boolean;
  defaultExpirationDate?: string | null;
}

export const DocumentUpload = ({
  onUpload,
  onCancel,
  acceptedTypes = '.pdf,.jpg,.jpeg,.png',
  maxSize = 10 * 1024 * 1024,
  showExpirationDate = true,
  defaultExpirationDate = null
}: DocumentUploadProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [expirationDate, setExpirationDate] = useState(defaultExpirationDate || '');
  const [dragOver, setDragOver] = useState(false);

  const handleFileSelect = (file: File) => {
    if (file.size > maxSize) {
      alert(`Le fichier est trop volumineux. Taille maximale: ${(maxSize / 1024 / 1024).toFixed(1)}MB`);
      return;
    }
    setSelectedFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleSubmit = () => {
    if (selectedFile) {
      onUpload(selectedFile, showExpirationDate ? expirationDate : undefined);
    }
  };

  return (
    <div className="space-y-4">
      {!selectedFile ? (
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
          }`}
          onDrop={handleDrop}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
        >
          <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p className="text-lg font-medium mb-2">Glissez-déposez votre fichier ici</p>
          <p className="text-gray-500 mb-4">ou</p>
          <Input
            type="file"
            accept={acceptedTypes}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileSelect(file);
            }}
            className="hidden"
            id="file-upload"
          />
          <Button asChild variant="outline">
            <label htmlFor="file-upload" className="cursor-pointer">
              Parcourir les fichiers
            </label>
          </Button>
          <p className="text-xs text-gray-500 mt-2">
            Formats acceptés: {acceptedTypes} | Taille max: {(maxSize / 1024 / 1024).toFixed(1)}MB
          </p>
        </div>
      ) : (
        <div className="border rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <FileText className="w-8 h-8 text-blue-500" />
              <div>
                <p className="font-medium">{selectedFile.name}</p>
                <p className="text-sm text-gray-500">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setSelectedFile(null)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {showExpirationDate && (
            <div className="space-y-2 mb-4">
              <Label htmlFor="expiration">Date d'expiration</Label>
              <Input
                id="expiration"
                type="date"
                value={expirationDate}
                onChange={(e) => setExpirationDate(e.target.value)}
              />
            </div>
          )}

          <div className="flex gap-2">
            <Button onClick={handleSubmit}>
              <Upload className="w-4 h-4 mr-2" />
              Télécharger
            </Button>
            <Button variant="outline" onClick={onCancel}>
              Annuler
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
