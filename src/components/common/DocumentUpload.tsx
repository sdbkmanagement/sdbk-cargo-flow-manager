
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
  requiredExpirationDate?: boolean;
  defaultExpirationDate?: string;
  isLoading?: boolean;
}

export const DocumentUpload = ({
  onUpload,
  onCancel,
  acceptedTypes = ".pdf,.jpg,.jpeg,.png,.doc,.docx",
  maxSize = 10 * 1024 * 1024, // 10MB par défaut
  showExpirationDate = true,
  requiredExpirationDate = false,
  defaultExpirationDate,
  isLoading = false
}: DocumentUploadProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [expirationDate, setExpirationDate] = useState(defaultExpirationDate || '');
  const [dragOver, setDragOver] = useState(false);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > maxSize) {
        alert(`Le fichier est trop volumineux. Taille maximum : ${Math.round(maxSize / (1024 * 1024))}MB`);
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(false);
    
    const file = event.dataTransfer.files[0];
    if (file) {
      if (file.size > maxSize) {
        alert(`Le fichier est trop volumineux. Taille maximum : ${Math.round(maxSize / (1024 * 1024))}MB`);
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(false);
  };

  const handleUpload = () => {
    if (!selectedFile) {
      alert('Veuillez sélectionner un fichier');
      return;
    }

    if (showExpirationDate && requiredExpirationDate && !expirationDate) {
      alert('Veuillez saisir une date d\'expiration');
      return;
    }

    onUpload(selectedFile, expirationDate);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4">
      {/* Zone de drop/sélection de fichier */}
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragOver 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        {selectedFile ? (
          <div className="space-y-2">
            <FileText className="w-12 h-12 mx-auto text-green-600" />
            <div>
              <p className="font-medium">{selectedFile.name}</p>
              <p className="text-sm text-gray-500">{formatFileSize(selectedFile.size)}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedFile(null)}
              disabled={isLoading}
            >
              <X className="w-4 h-4 mr-1" />
              Changer
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            <Upload className="w-12 h-12 mx-auto text-gray-400" />
            <div>
              <p>Glissez-déposez un fichier ici ou</p>
              <Label htmlFor="file-upload" className="cursor-pointer text-blue-600 hover:text-blue-700">
                cliquez pour sélectionner
              </Label>
              <Input
                id="file-upload"
                type="file"
                accept={acceptedTypes}
                onChange={handleFileSelect}
                className="hidden"
                disabled={isLoading}
              />
            </div>
            <p className="text-xs text-gray-500">
              Types acceptés: {acceptedTypes.replace(/\./g, '').toUpperCase()}
              <br />
              Taille max: {Math.round(maxSize / (1024 * 1024))}MB
            </p>
          </div>
        )}
      </div>

      {/* Date d'expiration */}
      {showExpirationDate && (
        <div className="space-y-2">
          <Label htmlFor="expiration-date">
            Date d'expiration {requiredExpirationDate && <span className="text-red-500">*</span>}
          </Label>
          <Input
            id="expiration-date"
            type="date"
            value={expirationDate}
            onChange={(e) => setExpirationDate(e.target.value)}
            disabled={isLoading}
          />
        </div>
      )}

      {/* Boutons d'action */}
      <div className="flex justify-end space-x-2">
        <Button variant="outline" onClick={onCancel} disabled={isLoading}>
          Annuler
        </Button>
        <Button onClick={handleUpload} disabled={!selectedFile || isLoading}>
          <Upload className="w-4 h-4 mr-2" />
          {isLoading ? 'Téléchargement...' : 'Télécharger'}
        </Button>
      </div>
    </div>
  );
};
