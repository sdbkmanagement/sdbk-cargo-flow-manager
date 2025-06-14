
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Upload, File, X, FileText, Image } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
}

interface DocumentUploadProps {
  onFilesChange: (files: UploadedFile[]) => void;
  maxFiles?: number;
  maxSizePerFile?: number; // en MB
  acceptedTypes?: string[];
}

export const DocumentUpload = ({ 
  onFilesChange, 
  maxFiles = 5,
  maxSizePerFile = 10,
  acceptedTypes = ['application/pdf', 'image/jpeg', 'image/png']
}: DocumentUploadProps) => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (type: string) => {
    if (type.includes('pdf')) return <FileText className="w-4 h-4" />;
    if (type.includes('image')) return <Image className="w-4 h-4" />;
    return <File className="w-4 h-4" />;
  };

  const validateFile = (file: File): string | null => {
    // Vérifier le type de fichier
    if (!acceptedTypes.includes(file.type)) {
      return `Type de fichier non autorisé. Formats acceptés: ${acceptedTypes.map(type => 
        type.split('/')[1].toUpperCase()).join(', ')}`;
    }

    // Vérifier la taille
    const fileSizeInMB = file.size / (1024 * 1024);
    if (fileSizeInMB > maxSizePerFile) {
      return `Fichier trop volumineux. Taille maximum: ${maxSizePerFile}MB`;
    }

    // Vérifier le nombre de fichiers
    if (files.length >= maxFiles) {
      return `Nombre maximum de fichiers atteint (${maxFiles})`;
    }

    return null;
  };

  const handleFileSelect = (selectedFiles: FileList) => {
    const fileArray = Array.from(selectedFiles);
    
    fileArray.forEach(file => {
      const error = validateFile(file);
      
      if (error) {
        toast({
          title: "Erreur d'upload",
          description: error,
          variant: "destructive"
        });
        return;
      }

      // Créer l'URL pour prévisualisation
      const fileUrl = URL.createObjectURL(file);
      
      const newFile: UploadedFile = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        name: file.name,
        size: file.size,
        type: file.type,
        url: fileUrl
      };

      const updatedFiles = [...files, newFile];
      setFiles(updatedFiles);
      onFilesChange(updatedFiles);

      toast({
        title: "Fichier ajouté",
        description: `${file.name} a été téléchargé avec succès`,
      });
    });
  };

  const removeFile = (fileId: string) => {
    const updatedFiles = files.filter(f => f.id !== fileId);
    setFiles(updatedFiles);
    onFilesChange(updatedFiles);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles.length > 0) {
      handleFileSelect(droppedFiles);
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      {/* Zone de téléchargement */}
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          isDragging 
            ? 'border-orange-500 bg-orange-50' 
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <div className="space-y-2">
          <Button 
            type="button" 
            variant="outline" 
            onClick={openFileDialog}
          >
            Télécharger les documents
          </Button>
          <p className="text-sm text-gray-500">
            ou glissez-déposez vos fichiers ici
          </p>
          <p className="text-xs text-gray-400">
            PDF, JPG, PNG jusqu'à {maxSizePerFile}MB chacun (max {maxFiles} fichiers)
          </p>
        </div>
      </div>

      {/* Input caché */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={acceptedTypes.join(',')}
        onChange={(e) => e.target.files && handleFileSelect(e.target.files)}
        className="hidden"
      />

      {/* Liste des fichiers téléchargés */}
      {files.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Documents téléchargés:</h4>
          {files.map((file) => (
            <div
              key={file.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
            >
              <div className="flex items-center space-x-3">
                {getFileIcon(file.type)}
                <div>
                  <p className="text-sm font-medium">{file.name}</p>
                  <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="secondary" className="text-xs">
                  {file.type.split('/')[1].toUpperCase()}
                </Badge>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(file.id)}
                  className="text-red-600 hover:text-red-800"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
