
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, X, FileText, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DocumentUploadProps {
  onUpload: (file: File, expirationDate?: string) => void;
  onCancel: () => void;
  acceptedTypes?: string;
  maxSize?: number;
  showExpirationDate?: boolean;
  defaultExpirationDate?: string;
  requiredExpirationDate?: boolean;
}

export const DocumentUpload = ({
  onUpload,
  onCancel,
  acceptedTypes = ".pdf,.jpg,.jpeg,.png",
  maxSize = 10 * 1024 * 1024, // 10MB
  showExpirationDate = true,
  defaultExpirationDate,
  requiredExpirationDate = false
}: DocumentUploadProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [expirationDate, setExpirationDate] = useState(defaultExpirationDate || '');
  const [dragOver, setDragOver] = useState(false);
  const { toast } = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      validateAndSetFile(file);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragOver(false);
    
    const file = event.dataTransfer.files?.[0];
    if (file) {
      validateAndSetFile(file);
    }
  };

  const validateAndSetFile = (file: File) => {
    // Vérifier le type de fichier
    const allowedTypes = acceptedTypes.split(',').map(type => type.trim());
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    
    if (!allowedTypes.includes(fileExtension)) {
      toast({
        title: "Type de fichier non supporté",
        description: `Types acceptés: ${acceptedTypes}`,
        variant: "destructive",
      });
      return;
    }

    // Vérifier la taille du fichier
    if (file.size > maxSize) {
      toast({
        title: "Fichier trop volumineux",
        description: `Taille maximum: ${Math.round(maxSize / (1024 * 1024))}MB`,
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFile) {
      toast({
        title: "Aucun fichier sélectionné",
        description: "Veuillez sélectionner un fichier",
        variant: "destructive",
      });
      return;
    }

    if (requiredExpirationDate && showExpirationDate && !expirationDate) {
      toast({
        title: "Date d'expiration requise",
        description: "Veuillez renseigner la date d'expiration",
        variant: "destructive",
      });
      return;
    }

    onUpload(selectedFile, expirationDate || undefined);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Zone de drop */}
      <Card 
        className={`border-2 border-dashed transition-colors ${
          dragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        <CardContent className="p-6">
          {!selectedFile ? (
            <div className="text-center">
              <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <div className="space-y-2">
                <p className="text-sm font-medium">
                  Glissez votre fichier ici ou cliquez pour sélectionner
                </p>
                <p className="text-xs text-gray-500">
                  Types acceptés: {acceptedTypes} | Max: {Math.round(maxSize / (1024 * 1024))}MB
                </p>
              </div>
              <Input
                type="file"
                accept={acceptedTypes}
                onChange={handleFileSelect}
                className="mt-4"
              />
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="font-medium">{selectedFile.name}</p>
                  <p className="text-sm text-gray-500">{formatFileSize(selectedFile.size)}</p>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setSelectedFile(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Date d'expiration */}
      {showExpirationDate && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="expiration">Date d'expiration</Label>
            {requiredExpirationDate && (
              <AlertTriangle className="h-4 w-4 text-orange-500" />
            )}
          </div>
          <Input
            id="expiration"
            type="date"
            value={expirationDate}
            onChange={(e) => setExpirationDate(e.target.value)}
            required={requiredExpirationDate}
          />
          {requiredExpirationDate && (
            <p className="text-sm text-orange-600">
              La date d'expiration est obligatoire pour ce type de document
            </p>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit">
          Télécharger
        </Button>
      </div>
    </form>
  );
};
